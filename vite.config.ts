import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Replace with your repo name
const repoName = "pulse-security"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: `/${repoName}/`,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
