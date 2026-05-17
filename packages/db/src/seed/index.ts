import postgres from 'postgres'

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('DATABASE_URL required')

const client = postgres(connectionString)

async function seed() {
  console.log('Seeding exercise library...')

  // TODO: populate ~200 curated exercises (Sprint 0 — structure only)
  // Each entry will have: name, muscleGroup, modality, equipment, level, description, techniqueTips, contraindications
  // Video URLs will be populated from a separate content pipeline

  process.stdout.write('Seed complete.\n')
  await client.end()
}

seed().catch((err: unknown) => {
  process.stderr.write(`Seed failed: ${String(err)}\n`)
  process.exit(1)
})
