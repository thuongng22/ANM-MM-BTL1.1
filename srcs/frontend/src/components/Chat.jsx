import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import KeyDetailsModal from './KeyDetailsModal';
import { socket } from '../socket';
import {
  getOrGenerateRSAKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  generateAESKey,
  getStoredRoomKey,
  saveStoredRoomKey,
  getAllStoredRoomKeys,
  clearStoredRoomKey,
  HANDSHAKE_WATERMARK_MESSAGE
} from '../crypto/rsa';
import { generateHMAC, deriveKeys } from '../crypto/hmac';
import { encryptText } from '../services/aes_service';

export default function Chat({ user, onLogout }) {
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const [rsaKeyPair] = useState(() => getOrGenerateRSAKeyPair(user.username));
  const rsaKeyPairRef = useRef(rsaKeyPair);
  rsaKeyPairRef.current = rsaKeyPair;

  const [roomKeys, setRoomKeys] = useState(() => getAllStoredRoomKeys());
  const roomKeysRef = useRef(roomKeys);
  roomKeysRef.current = roomKeys;

  const roomRef = useRef(room);
  roomRef.current = room;

  const handshakeTimeoutRef = useRef(null);

  const [handshakeState, setHandshakeState] = useState({
    status: 'idle',
    message: '',
    isInitiator: false,
    distributor: null
  });

  const [roomUsers, setRoomUsers] = useState([]);
  const [handshakeLogs, setHandshakeLogs] = useState([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const addHandshakeLog = (type, text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    console.log(`[RSA Handshake] [${type.toUpperCase()}] ${text}`);
    setHandshakeLogs((prev) => [{ time, type, text }, ...prev.slice(0, 49)]);
  };

  const activeRoomKey = roomKeys[room] || '';
  const isKeyReady = handshakeState.status === 'ready' && Boolean(activeRoomKey);

  // Theo doi trang thai online/away theo visibility tab
  useEffect(() => {
    const checkAndRestoreKeyStatus = () => {
      const curRoom = roomRef.current;
      const existingKey = roomKeysRef.current[curRoom] || getStoredRoomKey(curRoom);
      if (existingKey) {
        setHandshakeState((prev) =>
          prev.status !== 'ready'
            ? {
              status: 'ready',
              message: 'Khóa đối xứng của phòng đã sẵn sàng.',
              isInitiator: prev.isInitiator,
              distributor: prev.distributor
            }
            : prev
        );
      }
    };

    const handleVisibility = () => {
      const isVisible = document.visibilityState === 'visible';
      const status = isVisible ? 'online' : 'away';
      socket.emit('update_status', { status });
      if (isVisible) {
        checkAndRestoreKeyStatus();
      }
    };

    const handleFocus = () => {
      socket.emit('update_status', { status: 'online' });
      checkAndRestoreKeyStatus();
    };

    const handleBlur = () => socket.emit('update_status', { status: 'away' });

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      addHandshakeLog('info', 'Socket đã kết nối thành công tới Server.');
      // Tự động gia nhập lại phòng khi socket kết nối lại (sau khi tab ngủ hoặc rớt mạng)
      socket.emit('join_room', {
        username: user.username,
        room: roomRef.current,
        publicKey: rsaKeyPairRef.current.publicKey
      });
      socket.emit('update_status', { status: 'online' });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      addHandshakeLog('info', 'Mất kết nối tới Server.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Xóa tin nhắn phòng cũ khi chuyển phòng
    setMessages([]);

    // Kiểm tra nếu phòng này đã có khóa từ trước trong localStorage hoặc state
    const existingKey = roomKeysRef.current[room] || getStoredRoomKey(room);
    if (existingKey) {
      if (!roomKeysRef.current[room]) {
        setRoomKeys((prev) => ({ ...prev, [room]: existingKey }));
      }
      setHandshakeState({
        status: 'ready',
        message: 'Khóa đối xứng của phòng đã sẵn sàng từ localStorage.',
        isInitiator: false,
        distributor: null
      });
      addHandshakeLog('info', `Tải lại khóa phòng "${room}" từ localStorage: ${existingKey.substring(0, 16)}...`);
    } else {
      setHandshakeState({
        status: 'pending',
        message: `Đang kết nối phòng "${room}" và bắt tay RSA ngầm...`,
        isInitiator: false,
        distributor: null
      });
    }

    addHandshakeLog('init', `Gửi Public Key lên Server để tham gia phòng "${room}".`);

    // Gửi sự kiện join_room kèm RSA Public Key
    socket.emit('join_room', {
      username: user.username,
      room,
      publicKey: rsaKeyPairRef.current.publicKey
    });

    // Lắng nghe lịch sử tin nhắn
    const handleRoomHistory = (payload) => {
      const history = Array.isArray(payload) ? payload : (payload?.messages || []);
      const serverResetId = Array.isArray(payload) ? null : payload?.resetId;
      if (serverResetId) {
        const localResetId = localStorage.getItem(`roomResetId_${room}`);
        if (localResetId && localResetId !== serverResetId) {
          // Phòng đã bị reset khi người dùng này vắng mặt => Cập nhật resetId mới
          localStorage.setItem(`roomResetId_${room}`, serverResetId);
          // Nếu chưa có khóa thì yêu cầu phân phối hoặc khởi tạo
          if (!roomKeysRef.current[room]) {
            socket.emit('request_room_key_refresh', { room });
          }
        } else {
          localStorage.setItem(`roomResetId_${room}`, serverResetId);
        }
      }
      setMessages(history || []);
    };

    // Lắng nghe tin nhắn mới
    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    // Lắng nghe danh sách thành viên trong phòng
    const handleRoomUsers = (users) => {
      setRoomUsers(users || []);
    };

    // Luong bat tay trao doi khoa RSA
    const handleInitRoomKeyHolder = ({ room: targetRoom }) => {
      if (targetRoom !== room) return;

      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
        handshakeTimeoutRef.current = null;
      }

      let key = roomKeysRef.current[targetRoom] || getStoredRoomKey(targetRoom);
      if (!key) {
        key = generateAESKey(targetRoom);
        addHandshakeLog(
          'init',
          `Khoi tao khoa phong tu MSSV: ${key.substring(0, 18)}...`
        );
      } else {
        addHandshakeLog(
          'init',
          `Su dung khoa phong tu localStorage: ${key.substring(0, 18)}...`
        );
      }

      saveStoredRoomKey(targetRoom, key);
      setRoomKeys((prev) => ({ ...prev, [targetRoom]: key }));

      setHandshakeState({
        status: 'ready',
        message: 'Khoa phong da san sang.',
        isInitiator: true,
        distributor: null
      });
    };

    // Khi co peer moi yeu cau khoa phong
    const handleReqRoomKeyDistribution = ({
      requesterSocketId,
      requesterUsername,
      requesterPublicKey,
      room: targetRoom
    }) => {
      if (targetRoom !== room) return;

      addHandshakeLog(
        'req',
        `Nhan yeu cau khoa tu "${requesterUsername}". Dang ma hoa bang public key...`
      );

      let key = roomKeysRef.current[targetRoom] || getStoredRoomKey(targetRoom);
      if (!key) {
        key = generateAESKey(targetRoom);
      }
      saveStoredRoomKey(targetRoom, key);
      setRoomKeys((prev) => ({ ...prev, [targetRoom]: key }));

      try {
        const handshakePayload = JSON.stringify({
          key: key,
          message: HANDSHAKE_WATERMARK_MESSAGE
        });

        console.log('[Handshake Outgoing Plaintext]:', HANDSHAKE_WATERMARK_MESSAGE);

        const encryptedKey = rsaEncrypt(requesterPublicKey, handshakePayload);

        socket.emit('send_encrypted_room_key', {
          targetSocketId: requesterSocketId,
          encryptedKey,
          room: targetRoom,
          sender: user.username
        });

        addHandshakeLog(
          'send',
          `Da gui khoa ma hoa toi "${requesterUsername}".`
        );
      } catch (err) {
        console.error('[RSA Handshake] Loi ma hoa khoa phong:', err);
        addHandshakeLog('error', `Loi ma hoa khoa cho "${requesterUsername}": ${err.message}`);
      }
    };

    // Cho peer khac gui khoa phong
    const handleHandshakePending = ({ room: targetRoom, distributorUsername }) => {
      if (targetRoom !== room) return;

      const existingKey = roomKeysRef.current[targetRoom] || getStoredRoomKey(targetRoom);
      if (existingKey) {
        setHandshakeState({
          status: 'ready',
          message: 'Khoa phong da san sang.',
          isInitiator: false,
          distributor: distributorUsername
        });
        return;
      }

      setHandshakeState({
        status: 'pending',
        message: `Dang cho "${distributorUsername}" gui khoa phong...`,
        isInitiator: false,
        distributor: distributorUsername
      });

      addHandshakeLog(
        'wait',
        `Dang cho "${distributorUsername}" gui khoa phong...`
      );

      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
      }
      handshakeTimeoutRef.current = setTimeout(() => {
        const keyCheck = roomKeysRef.current[targetRoom] || getStoredRoomKey(targetRoom);
        if (!keyCheck) {
          addHandshakeLog('warn', `Timeout cho khoa tu "${distributorUsername}". Tu tao khoa.`);
          const fallbackKey = generateAESKey(targetRoom);
          saveStoredRoomKey(targetRoom, fallbackKey);
          setRoomKeys((prev) => ({ ...prev, [targetRoom]: fallbackKey }));
          setHandshakeState({
            status: 'ready',
            message: 'Khoa phong da duoc khoi tao (timeout fallback).',
            isInitiator: true,
            distributor: null
          });
        }
      }, 4000);
    };

    // Nhan khoa phong da ma hoa RSA tu peer khac
    const handleReceiveEncryptedRoomKey = ({ encryptedKey, room: targetRoom, sender }) => {
      if (targetRoom !== room) return;

      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
        handshakeTimeoutRef.current = null;
      }

      addHandshakeLog('receive', `Nhan khoa ma hoa tu "${sender}". Dang giai ma...`);

      try {
        const decryptedStr = rsaDecrypt(rsaKeyPairRef.current.privateKey, encryptedKey);

        let decryptedAESKey = decryptedStr;
        let watermarkMsg = '';

        try {
          const parsedPayload = JSON.parse(decryptedStr);
          if (parsedPayload && parsedPayload.key) {
            decryptedAESKey = parsedPayload.key;
            watermarkMsg = parsedPayload.message || '';
          }
        } catch {
          decryptedAESKey = decryptedStr;
        }

        console.log('[Handshake Plaintext]:', watermarkMsg || HANDSHAKE_WATERMARK_MESSAGE);

        saveStoredRoomKey(targetRoom, decryptedAESKey);
        setRoomKeys((prev) => ({ ...prev, [targetRoom]: decryptedAESKey }));

        setHandshakeState({
          status: 'ready',
          message: `Da nhan khoa phong tu "${sender}".`,
          isInitiator: false,
          distributor: sender
        });

        addHandshakeLog(
          'receive',
          `Bat tay thanh cong voi "${sender}". Khoa phong: ${decryptedAESKey.substring(0, 18)}...`
        );
      } catch (err) {
        console.error('[RSA Handshake] Loi giai ma khoa phong:', err);
        setHandshakeState({
          status: 'error',
          message: `Giai ma khoa phong that bai: ${err.message}`,
          isInitiator: false,
          distributor: sender
        });
        addHandshakeLog('error', `Giai ma khoa phong tu "${sender}" that bai.`);
      }
    };

    // Xu ly khi phong duoc reset
    const handleRoomTestReset = ({ room: targetRoom, resetBy }) => {
      if (!targetRoom || targetRoom === room) {
        const target = targetRoom || room;
        clearStoredRoomKey(target);
        localStorage.removeItem(`roomResetId_${target}`);
        setRoomKeys((prev) => {
          const next = { ...prev };
          delete next[target];
          return next;
        });

        setMessages([]);

        setHandshakeState({
          status: 'idle',
          message: 'Phong da reset.',
          isInitiator: false,
          distributor: null
        });

        addHandshakeLog(
          'info',
          `Phong "${target}" da reset boi "${resetBy || 'thanh vien'}".`
        );

        onLogout(`Phòng #${target} đã được reset tiến trình test bởi "${resetBy || 'thành viên'}".`);
      }
    };

    // Đăng ký các listeners
    socket.on('room_history', handleRoomHistory);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('room_users', handleRoomUsers);
    socket.on('init_room_key_holder', handleInitRoomKeyHolder);
    socket.on('req_room_key_distribution', handleReqRoomKeyDistribution);
    socket.on('handshake_pending', handleHandshakePending);
    socket.on('receive_encrypted_room_key', handleReceiveEncryptedRoomKey);
    socket.on('room_test_reset', handleRoomTestReset);
    socket.on('room_messages_cleared', handleRoomTestReset);

    return () => {
      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
        handshakeTimeoutRef.current = null;
      }
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room_history', handleRoomHistory);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('room_users', handleRoomUsers);
      socket.off('init_room_key_holder', handleInitRoomKeyHolder);
      socket.off('req_room_key_distribution', handleReqRoomKeyDistribution);
      socket.off('handshake_pending', handleHandshakePending);
      socket.off('receive_encrypted_room_key', handleReceiveEncryptedRoomKey);
      socket.off('room_test_reset', handleRoomTestReset);
      socket.off('room_messages_cleared', handleRoomTestReset);
    };
  }, [user.username, room]);

  // Ma hoa va gui tin nhan
  const handleSendMessage = async ({ text, attachment }) => {
    let key = activeRoomKey || getStoredRoomKey(room);
    if (!key) {
      key = generateAESKey(room);
      saveStoredRoomKey(room, key);
      setRoomKeys((prev) => ({ ...prev, [room]: key }));
      setHandshakeState({
        status: 'ready',
        message: 'Khoa phong da san sang.',
        isInitiator: true,
        distributor: null
      });
    }

    const hasText = Boolean(text && text.trim().length > 0);
    const hasAttachment = Boolean(attachment && attachment.data);
    if (!hasText && !hasAttachment) return;

    let ciphertext = '';
    let messageIV = null;

    if (hasText) {
      try {
        const encResult = await encryptText(text.trim(), key);
        ciphertext = encResult.ciphertext;
        messageIV = encResult.iv;
      } catch (err) {
        console.error('[E2EE] Loi ma hoa van ban:', err);
        alert('Lỗi mã hóa tin nhắn trước khi gửi.');
        return;
      }
    }

    let encryptedAttachment = null;
    if (hasAttachment) {
      try {
        const encFileResult = await encryptText(attachment.data, key);
        encryptedAttachment = {
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          data: encFileResult.ciphertext,
          iv: encFileResult.iv,
          isEncrypted: true
        };
      } catch (err) {
        console.error('[E2EE] Loi ma hoa tep:', err);
        alert('Lỗi mã hóa tệp trước khi gửi.');
        return;
      }
    }

    // Tinh chu ky HMAC gom ca sender de chong spoofing
    const { hmacKey } = deriveKeys(key);
    const dataToSign = {
      text: ciphertext || '',
      iv: messageIV || null,
      sender: user.username,
      ...(encryptedAttachment?.data ? { attachment: encryptedAttachment.data } : {})
    };
    const hmac = hmacKey ? generateHMAC(dataToSign, hmacKey) : null;

    const messagePayload = {
      room,
      sender: user.username,
      text: ciphertext,
      iv: messageIV,
      attachment: encryptedAttachment,
      isEncrypted: true,
      hmac,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('send_message', messagePayload);
  };

  const handleRoomChange = (newRoom) => {
    if (newRoom !== room) {
      setRoom(newRoom);
    }
  };

  const handleResetTestProcess = () => {
    const isConfirmed = window.confirm(
      `⚠️ BẠN CÓ CHẮC CHẮN MUỐN RESET TOÀN BỘ TIẾN TRÌNH TEST PHÒNG #${room} KHÔNG?\n\n` +
      `Thao tác này sẽ thực hiện:\n` +
      `1. Xóa sạch dữ liệu tin nhắn phòng #${room} trên Server.\n` +
      `2. Hủy toàn bộ khóa đối xứng đã lưu (localStorage) của phòng này.\n` +
      `3. Đăng xuất cả 2 người dùng khỏi phòng ngay lập tức.\n` +
      `4. Tiến trình bắt tay phân phối khóa E2EE sẽ bắt đầu lại từ đầu khi người đầu tiên đăng nhập lại.`
    );
    if (isConfirmed) {
      socket.emit('reset_room_test', { room });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-night select-none">
      <Header
        username={user.username}
        room={room}
        onRoomChange={handleRoomChange}
        onLogout={onLogout}
        isConnected={isConnected}
        keyStatus={handshakeState}
        roomKey={activeRoomKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onResetTest={handleResetTestProcess}
        roomUsers={roomUsers}
        roomUsersCount={roomUsers.filter((u) => u.status !== 'offline').length}
      />

      <MessageList
        messages={messages}
        currentUser={user.username}
        roomKey={activeRoomKey}
        isKeyReady={isKeyReady}
        roomUsers={roomUsers}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        roomKey={activeRoomKey}
        keyReady={isKeyReady}
      />

      {/* Modal chi tiết khóa RSA, Khóa AES & Handshake Timeline */}
      <KeyDetailsModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        username={user.username}
        room={room}
        roomKey={activeRoomKey}
        keyStatus={handshakeState}
        keyPair={rsaKeyPair}
        roomUsers={roomUsers}
        handshakeLogs={handshakeLogs}
      />
    </div>
  );
}
