import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',  // 将 @ 映射到 /src 目录
    },
  },
  server: {
    host: "0.0.0.0", // 监听所有网卡
    port: 5173, // 默认端口
    strictPort: true, // 端口被占用时，不尝试其他端口
  },
});

