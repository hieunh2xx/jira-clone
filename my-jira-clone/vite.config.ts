import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
function versionPlugin(): Plugin {
  return {
    name: 'generate-version',
    apply: 'build',
    writeBundle() {
      // Write version.json after bundle is written to ensure it exists
      const version = {
        version: Date.now().toString(),
        buildTime: new Date().toISOString(),
        mode: process.env.NODE_ENV ?? 'production',
      }
      const versionPath = path.resolve(__dirname, 'dist/version.json')
      try {
        writeFileSync(versionPath, JSON.stringify(version, null, 2), 'utf-8')
        console.log(`✓ Generated version.json (${version.version})`)
      } catch (error) {
        console.warn('Failed to write version.json:', error)
      }
    },
    closeBundle() {
      // Also write in closeBundle as a fallback to ensure file exists
      const version = {
        version: Date.now().toString(),
        buildTime: new Date().toISOString(),
        mode: process.env.NODE_ENV ?? 'production',
      }
      const versionPath = path.resolve(__dirname, 'dist/version.json')
      try {
        // Check if file exists, if not create it
        if (!existsSync(versionPath)) {
          writeFileSync(versionPath, JSON.stringify(version, null, 2), 'utf-8')
          console.log(`✓ Generated version.json in closeBundle (${version.version})`)
        }
      } catch (error) {
        // Silently fail in closeBundle
      }
    },
  }
}
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    base: '/',
    plugins: [
      react(),
      versionPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/pages': path.resolve(__dirname, 'src/pages'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/stores': path.resolve(__dirname, 'src/stores'),
        '@/router': path.resolve(__dirname, 'src/router'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: process.env.BUILD_DEBUG === 'true',
      minify: 'esbuild',
      target: 'esnext',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      chunkSizeWarningLimit: 1500,
    },
    esbuild: {
      drop:
        isProd && process.env.BUILD_REMOVE_CONSOLE === 'true'
          ? ['console', 'debugger']
          : ['debugger'],
    },
    server: {
      port: 5173,
      strictPort: true,
      open: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  }
})