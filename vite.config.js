import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Ótimo para o Senhor testar o PWA enquanto desenvolve
      },
      // Garanta que todos os nomes de arquivos de ícone estejam aqui
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'], 
      manifest: {
        id: 'vitalle-app',
        name: 'Vitalle Management System',
        short_name: 'Vitalle',
        description: 'Sistema de Gestão Vitalle',
        theme_color: '#d946ef',
        background_color: '#ffffff', // Cor de fundo ao abrir o app
        display: 'standalone', // Faz abrir sem a barra do navegador
        orientation: 'portrait', // Trava em pé para facilitar o uso no estoque
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Isso garante que o app funcione bem offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})