import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Header keamanan standar untuk mengatasi alert OWASP ZAP
const securityHeaders = {
  // CSP: Membatasi sumber resource yang bisa dimuat
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co;",
  // Anti-clickjacking
  'X-Frame-Options': 'DENY',
  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders
  },
  preview: {
    headers: securityHeaders
  }
})
