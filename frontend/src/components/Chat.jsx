import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import KeyDetailsModal from './KeyDetailsModal';
import E2EEDiagramModal from './E2EEDiagramModal';
import { socket } from '../socket';
import {
  getOrGenerateRSAKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  generateMockAESKey
} from '../crypto/rsa';
import { generateHMAC, deriveKeys } from '../crypto/hmac';

export default function Chat({ user, onLogout }) {
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // --- CÁC STATE PHỤC VỤ TRAO ĐỔI KHÓA RSA (HANDSHAKE) & MOCK AES KEY ---
  // 1. Cặp khóa RSA cá nhân (1024-bit) lưu tạm theo phiên sessionStorage
  const [rsaKeyPair] = useState(() => getOrGenerateRSAKeyPair(user.username));
  const rsaKeyPairRef = useRef(rsaKeyPair);
  rsaKeyPairRef.current = rsaKeyPair;

  // 2. Khóa đối xứng bí mật của các phòng chat: { [roomName]: 'aes_key_...' }
  const [roomKeys, setRoomKeys] = useState({});
  const roomKeysRef = useRef(roomKeys);
  roomKeysRef.current = roomKeys;

  // 3. Trạng thái bắt tay RSA hiện tại của phòng đang mở
  const [handshakeState, setHandshakeState] = useState({
    status: 'idle', // 'idle' | 'pending' | 'ready' | 'error'
    message: '',
    isInitiator: false,
    distributor: null
  });

  // 4. Danh sách các thành viên đang có mặt trong phòng
  const [roomUsers, setRoomUsers] = useState([]);

  // 5. Nhật ký các sự kiện bắt tay (Handshake Timeline) để audit/chấm điểm
  const [handshakeLogs, setHandshakeLogs] = useState([]);

  // 6. Điều khiển mở/đóng Modal chi tiết khóa
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // 7. Điều khiển mở/đóng Modal sơ đồ kiến trúc E2EE (Báo cáo Giảng viên)
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);

  // Helper ghi nhận nhật ký bắt tay
  const addHandshakeLog = (type, text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    console.log(`[RSA Handshake] [${type.toUpperCase()}] ${text}`);
    setHandshakeLogs((prev) => [{ time, type, text }, ...prev.slice(0, 49)]);
  };

  // Khóa đối xứng hiện tại của phòng đang được chọn
  const activeRoomKey = roomKeys[room] || '';
  const isKeyReady = handshakeState.status === 'ready' && Boolean(activeRoomKey);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      addHandshakeLog('info', 'Socket đã kết nối thành công tới Server.');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      addHandshakeLog('info', 'Mất kết nối tới Server.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Xóa tin nhắn phòng cũ khi chuyển phòng
    setMessages([]);

    // Kiểm tra nếu phòng này đã có khóa từ trước trong bộ nhớ
    const existingKey = roomKeysRef.current[room];
    if (existingKey) {
      setHandshakeState({
        status: 'ready',
        message: 'Khóa đối xứng của phòng đã sẵn sàng trong bộ nhớ phiên.',
        isInitiator: false,
        distributor: null
      });
      addHandshakeLog('info', `Sử dụng khóa phòng "${room}" đã lưu: ${existingKey.substring(0, 16)}...`);
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
    const handleRoomHistory = (history) => {
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

    // =========================================================================
    // 🔑 CÁC SỰ KIỆN BẮT TAY TRAO ĐỔI KHÓA RSA (RSA HANDSHAKE PROTOCOL)
    // =========================================================================

    // Sự kiện 1: Server xác nhận user là NGƯỜI ĐẦU TIÊN vào phòng (Key Initiator)
    const handleInitRoomKeyHolder = ({ room: targetRoom }) => {
      if (targetRoom !== room) return;

      let key = roomKeysRef.current[targetRoom];
      if (!key) {
        key = generateMockAESKey();
        setRoomKeys((prev) => ({ ...prev, [targetRoom]: key }));
      }

      setHandshakeState({
        status: 'ready',
        message: 'Bạn là thành viên đầu tiên trong phòng. Đã khởi tạo khóa Mock AES.',
        isInitiator: true,
        distributor: null
      });

      addHandshakeLog(
        'init',
        `Là người đầu tiên trong phòng "${targetRoom}". Đã khởi tạo Mock AES Key: ${key.substring(0, 18)}...`
      );
    };

    // Sự kiện 2: Server yêu cầu NGƯỜI CŨ mã hóa khóa phòng gửi cho NGƯỜI MỚI (A gửi B)
    const handleReqRoomKeyDistribution = ({
      requesterSocketId,
      requesterUsername,
      requesterPublicKey,
      room: targetRoom
    }) => {
      if (targetRoom !== room) return;

      addHandshakeLog(
        'req',
        `Nhận yêu cầu phân phối khóa từ "${requesterUsername}". Đang mã hóa khóa phòng bằng Public Key của họ...`
      );

      let key = roomKeysRef.current[targetRoom];
      if (!key) {
        key = generateMockAESKey();
        setRoomKeys((prev) => ({ ...prev, [targetRoom]: key }));
      }

      try {
        // Mã hóa khóa AES bằng RSA Public Key của người mới
        const encryptedKey = rsaEncrypt(requesterPublicKey, key);

        // Gửi ciphertext lên server để chuyển tiếp tới người mới
        socket.emit('send_encrypted_room_key', {
          targetSocketId: requesterSocketId,
          encryptedKey,
          room: targetRoom,
          sender: user.username
        });

        addHandshakeLog(
          'send',
          `Đã mã hóa và gửi khóa phòng tới "${requesterUsername}" qua RSA E2EE.`
        );
      } catch (err) {
        console.error('[RSA Handshake] Lỗi khi mã hóa khóa phòng cho peer:', err);
        addHandshakeLog('error', `Lỗi mã hóa khóa cho "${requesterUsername}": ${err.message}`);
      }
    };

    // Sự kiện 3: Người mới nhận thông báo đang chờ người cũ phân phối khóa
    const handleHandshakePending = ({ room: targetRoom, distributorUsername }) => {
      if (targetRoom !== room) return;

      setHandshakeState({
        status: 'pending',
        message: `Đang chờ người cũ (${distributorUsername}) gửi khóa phòng qua RSA...`,
        isInitiator: false,
        distributor: distributorUsername
      });

      addHandshakeLog(
        'wait',
        `Đang chờ người cũ "${distributorUsername}" mã hóa và gửi khóa phòng...`
      );
    };

    // Sự kiện 4: NGƯỜI MỚI nhận được khóa phòng đã mã hóa RSA từ NGƯỜI CŨ
    const handleReceiveEncryptedRoomKey = ({ encryptedKey, room: targetRoom, sender }) => {
      if (targetRoom !== room) return;

      addHandshakeLog('receive', `Đã nhận gói khóa mã hóa từ "${sender}". Đang giải mã bằng RSA Private Key...`);

      try {
        // Giải mã bằng chính Private Key của mình
        const decryptedAESKey = rsaDecrypt(rsaKeyPairRef.current.privateKey, encryptedKey);

        // Lưu vào bộ nhớ khóa phòng
        setRoomKeys((prev) => ({ ...prev, [targetRoom]: decryptedAESKey }));

        setHandshakeState({
          status: 'ready',
          message: `Đã nhận và giải mã khóa phòng từ "${sender}" thành công!`,
          isInitiator: false,
          distributor: sender
        });

        addHandshakeLog(
          'receive',
          `Bắt tay thành công! Khóa phòng nhận được: ${decryptedAESKey.substring(0, 18)}...`
        );
      } catch (err) {
        console.error('[RSA Handshake] Lỗi giải mã khóa phòng:', err);
        setHandshakeState({
          status: 'error',
          message: `Giải mã khóa phòng thất bại: ${err.message}`,
          isInitiator: false,
          distributor: sender
        });
        addHandshakeLog('error', `Giải mã khóa phòng từ "${sender}" thất bại.`);
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

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room_history', handleRoomHistory);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('room_users', handleRoomUsers);
      socket.off('init_room_key_holder', handleInitRoomKeyHolder);
      socket.off('req_room_key_distribution', handleReqRoomKeyDistribution);
      socket.off('handshake_pending', handleHandshakePending);
      socket.off('receive_encrypted_room_key', handleReceiveEncryptedRoomKey);
    };
  }, [user.username, room]);

  // =========================================================================
  // 🔗 KHỚP NỐI VỚI MODULE AES (DÀNH CHO LẬP TRÌNH VIÊN PHỤ TRÁCH MÃ HÓA ĐỐI XỨNG)
  // =========================================================================
  // Biến `activeRoomKey` chứa Mock Key (hoặc AES Session Key) được đồng bộ giữa các user.
  // Khi module AES sẵn sàng:
  // 1. Mã hóa văn bản và attachment với `activeRoomKey` trước khi emit `send_message`.
  // 2. Khi nhận tin nhắn `receive_message`, giải mã bằng `activeRoomKey`.
  // =========================================================================

  const handleSendMessage = ({ text, attachment }) => {
    // [VỊ TRÍ RÁP NỐI AES]:
    // const encryptedText = encryptAES(text, activeRoomKey);
    // const encryptedAttachment = encryptAttachmentAES(attachment, activeRoomKey);

    // Dẫn xuất HMAC Key từ khóa phòng và sinh chữ ký toàn vẹn HMAC-SHA256
    const { hmacKey } = deriveKeys(activeRoomKey);
    const contentToSign = (text || '') + (attachment?.data || '');
    const hmac = hmacKey && contentToSign ? generateHMAC(contentToSign, hmacKey) : null;

    const messagePayload = {
      room,
      sender: user.username,
      text: text || '',
      attachment: attachment || null,
      hmac, // Chữ ký HMAC-SHA256 đảm bảo tính toàn vẹn thông điệp
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('send_message', messagePayload);
  };

  const handleRoomChange = (newRoom) => {
    if (newRoom !== room) {
      setRoom(newRoom);
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
        onOpenDiagramModal={() => setIsDiagramModalOpen(true)}
        roomUsersCount={roomUsers.length}
      />

      <MessageList
        messages={messages}
        currentUser={user.username}
        roomKey={activeRoomKey}
        isKeyReady={isKeyReady}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        roomKey={activeRoomKey}
        keyReady={isKeyReady}
      />

      {/* Modal chi tiết khóa RSA, Mock Key & Handshake Timeline */}
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

      {/* Modal sơ đồ luồng kiến trúc E2EE trực quan (Báo cáo Giảng viên) */}
      <E2EEDiagramModal
        isOpen={isDiagramModalOpen}
        onClose={() => setIsDiagramModalOpen(false)}
      />
    </div>
  );
}
