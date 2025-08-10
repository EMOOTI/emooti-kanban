import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Separar React en su propio chunk
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'react-vendor';
              }
              // Separar Firebase en su propio chunk
              if (id.includes('node_modules/firebase')) {
                return 'firebase-vendor';
              }
              // Separar Google GenAI en su propio chunk
              if (id.includes('node_modules/@google/genai')) {
                return 'genai-vendor';
              }
              // Separar SendGrid en su propio chunk
              if (id.includes('node_modules/@sendgrid')) {
                return 'sendgrid-vendor';
              }
              // Otros vendor chunks
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            },
          },
        },
        // Aumentar el límite de advertencia de tamaño de chunk
        chunkSizeWarningLimit: 1000,
        // Optimizaciones adicionales
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          },
          mangle: {
            toplevel: isProduction,
          },
        },
        // Optimizaciones de CSS
        cssCodeSplit: true,
        // Optimizaciones de assets
        assetsInlineLimit: 4096,
        // Source maps solo en desarrollo
        sourcemap: !isProduction,
      },
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:8888', // Netlify dev server
            changeOrigin: true,
            secure: false,
          }
        }
      },
      // Optimizaciones de desarrollo
      optimizeDeps: {
        include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/auth'],
      },
      // Configuración de preview
      preview: {
        port: 4173,
        host: true,
      }
    };
});
