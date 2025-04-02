import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { VitePWA } from "vite-plugin-pwa"

// GitHub repo name
const repoName = "pulse-security"

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon-192.png", "favicon-512.png"], // Add actual filenames here
      manifest: {
        name: "Pulse Security",
        short_name: "Pulse",
        start_url: `/${repoName}/`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#fff", // Tailwind green-500
        icons: [
          {
            src: `/${repoName}/favicon-192.png`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: `/${repoName}/favicon-512.png`,
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: `/${repoName}/favicon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
