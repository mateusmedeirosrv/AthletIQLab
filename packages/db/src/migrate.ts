import { config } from 'dotenv'
import path from 'path'
import { lookup } from 'dns/promises'

config({ path: path.resolve(__dirname, '../../../.env.local') })
config({ path: path.resolve(__dirname, '../../../.env') })

import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const rawUrl = process.env['DATABASE_URL']
if (!rawUrl) throw new Error('DATABASE_URL environment variable is required')

void (async () => {
  const u = new URL(rawUrl)

  // Force IPv4: resolve hostname before handing it to postgres.js
  let host = u.hostname
  try {
    const result = await lookup(u.hostname, { family: 4 })
    host = result.address
    process.stdout.write(`DNS: ${u.hostname} → ${host}\n`)
  } catch (e) {
    process.stdout.write(`DNS lookup failed (using hostname): ${String(e)}\n`)
  }

  const client = postgres({
    host,
    port: u.port ? Number(u.port) : 5432,
    database: u.pathname.slice(1),
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: 'require' as const,
    max: 1,
  })

  const db = drizzle(client)
  await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') })
  process.stdout.write('Migrations applied successfully\n')
  await client.end()
})()
