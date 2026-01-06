import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'api.infiniteframe.online',
      'admin.infiniteframe.online' // သင့်မှာ admin domain ရှိရင် ဒါပါ ထပ်ထည့်ပေးထားပါ
    ]
  }
})
