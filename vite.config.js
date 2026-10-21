import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages production stays at /NanxiChurchChoir/.
// The read-only design preview is published in a nested subdirectory.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/NanxiChurchChoir/'
})
