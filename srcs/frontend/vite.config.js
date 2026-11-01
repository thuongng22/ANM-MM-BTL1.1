import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Lắng nghe trên tất cả địa chỉ mạng (0.0.0.0), cho phép truy cập qua LAN IP
    port: 5173,
  },
})
