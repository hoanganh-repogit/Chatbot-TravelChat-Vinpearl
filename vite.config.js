import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const datasetImagesDir = path.resolve(process.cwd(), 'VinPearl_dataset/dataset_clean/images')

const imageMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  return 'application/octet-stream'
}

const serveDatasetImages = () => ({
  name: 'serve-dataset-images',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/dataset/images/')) {
        next()
        return
      }

      try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
        const relativePath = pathname.replace('/dataset/images/', '')
        const filePath = path.resolve(datasetImagesDir, relativePath)

        if (!filePath.startsWith(datasetImagesDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next()
          return
        }

        res.setHeader('Content-Type', imageMimeType(filePath))
        res.setHeader('Cache-Control', 'public, max-age=3600')
        fs.createReadStream(filePath).pipe(res)
      } catch (error) {
        next(error)
      }
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [serveDatasetImages(), react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
