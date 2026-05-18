import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import path from 'path'

const connectionString = process.env['DATABASE_URL']

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

void (async () => {
  await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') })
  process.stdout.write('Migrations applied successfully\n')
  await client.end()
})()
