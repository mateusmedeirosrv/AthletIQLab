import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../../.env.local') })
config({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? '',
  },
  verbose: true,
  strict: true,
})
