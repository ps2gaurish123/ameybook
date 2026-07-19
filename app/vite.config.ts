import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const bookPdfPath = fileURLToPath(new URL('./public/book.pdf', import.meta.url))
const bookPdfVersion = createHash('sha256')
  .update(readFileSync(bookPdfPath))
  .digest('hex')
  .slice(0, 16)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BOOK_PDF_VERSION': JSON.stringify(bookPdfVersion)
  },
  server: {
    allowedHosts: true
  }
})
