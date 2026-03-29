import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) return 'vendor-tiptap';
          if (id.includes('node_modules/emoji-picker-react')) return 'vendor-emoji';
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) return 'vendor-mui';
          if (id.includes('node_modules/@tanstack')) return 'vendor-query';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react';
        },
      },
    },
  },
})
