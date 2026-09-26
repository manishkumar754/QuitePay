import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasmPlugin from "vite-plugin-wasm"
import path from "path"

const wasm = (wasmPlugin as any).default || wasmPlugin;

export default defineConfig({
  plugins: [react(), tailwindcss(), wasm()],
  resolve: {
    alias: {
      "isomorphic-ws": path.resolve(import.meta.dirname, "browser-ws-polyfill.js"),
      "@midnight-ntwrk/bboard-contract": path.resolve(import.meta.dirname, "preprod-deployment/contracts/src/index.ts"),
      "events": "events",
      "assert": "assert",
      "buffer": "buffer"
    }
  },
  build: {
    target: "esnext"
  }
})
