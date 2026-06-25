import PDFDocument from 'pdfkit'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnamneseData {
  weightKg?: string | null
  heightCm?: string | null
  bodyFatPct?: string | null
  goal: string
  experienceLevel: string
  weeklyFrequency: number
  restrictions: string
  medications: string
  medicalNotes?: string | null
}

interface WorkoutExerciseData {
  order: number
  sets: number
  reps: string
  load?: string | null
  restSeconds?: number | null
  exerciseName: string
  muscleGroup: string
}

interface WorkoutData {
  title: string
  modality: string
  estimatedDurationMin?: number | null
  publishedAt?: Date | null
  exercises: WorkoutExerciseData[]
}

interface SessionData {
  startedAt: Date
  endedAt?: Date | null
  totalVolumeKg?: string | null
  avgHrBpm?: number | null
  rpe?: number | null
  workoutTitle: string
}

export interface ReportInput {
  professional: { name: string; cref: string }
  student: { name: string; birthDate?: string | null; gender?: string | null }
  anamnese?: AnamneseData | null
  workouts: WorkoutData[]
  sessions: SessionData[]
  totals: { totalSessions: number; totalVolumeKg: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GOAL_LABEL: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  weight_loss: 'Emagrecimento',
  conditioning: 'Condicionamento',
  rehab: 'Reabilitação',
  general_health: 'Saúde Geral',
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  prefer_not_to_say: 'Não informado',
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatDuration(start: Date, end?: Date | null): string {
  if (!end) return '—'
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}min`
}

function parseTags(json: string): string {
  try {
    const arr = JSON.parse(json) as string[]
    return arr.length ? arr.join(', ') : '—'
  } catch {
    return json || '—'
  }
}

function parseAge(birthDate?: string | null): string {
  if (!birthDate) return '—'
  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  )
  return `${age} anos`
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

const COLORS = {
  dark: '#111827',
  mid: '#374151',
  light: '#6B7280',
  border: '#E5E7EB',
  accent: '#1D4ED8',
  bg: '#F9FAFB',
}

const MARGIN = 50
const PAGE_W = 595 - MARGIN * 2 // A4 inner width

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > 700) doc.addPage()
  doc
    .moveDown(0.8)
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(COLORS.accent)
    .text(title.toUpperCase(), MARGIN, doc.y)
  doc
    .moveTo(MARGIN, doc.y + 2)
    .lineTo(MARGIN + PAGE_W, doc.y + 2)
    .strokeColor(COLORS.accent)
    .lineWidth(0.5)
    .stroke()
  doc.moveDown(0.4)
}

function row(doc: PDFKit.PDFDocument, label: string, value: string) {
  const yStart = doc.y
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.mid).text(label, MARGIN, yStart, {
    width: 140,
    continued: false,
  })
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(COLORS.dark)
    .text(value, MARGIN + 145, yStart, {
      width: PAGE_W - 145,
    })
  doc.moveDown(0.15)
}

function tableHeader(doc: PDFKit.PDFDocument, cols: { label: string; width: number }[]) {
  const y = doc.y
  doc.rect(MARGIN, y, PAGE_W, 16).fill(COLORS.bg)
  let x = MARGIN + 4
  cols.forEach((col) => {
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(COLORS.mid)
      .text(col.label, x, y + 4, { width: col.width - 4 })
    x += col.width
  })
  doc.moveDown(0).y = y + 18
}

function tableRow(doc: PDFKit.PDFDocument, cells: string[], widths: number[], even: boolean) {
  if (doc.y > 750) {
    doc.addPage()
    return
  }
  const y = doc.y
  if (even) doc.rect(MARGIN, y, PAGE_W, 14).fill('#F3F4F6')
  let x = MARGIN + 4
  cells.forEach((cell, i) => {
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(COLORS.dark)
      .text(cell, x, y + 3, { width: (widths[i] ?? 80) - 8, ellipsis: true })
    x += widths[i] ?? 80
  })
  doc.moveDown(0).y = y + 16
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateStudentReport(data: ReportInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const today = new Date().toLocaleDateString('pt-BR')

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 60).fill(COLORS.dark)
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#FFFFFF').text('AthletiQLab', MARGIN, 16)
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#9CA3AF')
      .text('Relatório de Acompanhamento', MARGIN, 38)

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9CA3AF')
      .text(`Gerado em ${today}`, 0, 38, { align: 'right', width: 595 - MARGIN })

    doc.y = 75

    // ── Professional + Patient ID ─────────────────────────────────────────
    sectionTitle(doc, 'Identificação')
    row(doc, 'Profissional', data.professional.name)
    row(doc, 'Registro', data.professional.cref)
    row(doc, 'Paciente / Aluno', data.student.name)
    if (data.student.birthDate) row(doc, 'Idade', parseAge(data.student.birthDate))
    if (data.student.gender) row(doc, 'Gênero', GENDER_LABEL[data.student.gender] ?? '—')

    // ── Anamnese ──────────────────────────────────────────────────────────
    if (data.anamnese) {
      const a = data.anamnese
      sectionTitle(doc, 'Anamnese')

      if (a.weightKg || a.heightCm) {
        const weight = a.weightKg ? `${parseFloat(a.weightKg).toFixed(1)} kg` : '—'
        const height = a.heightCm ? `${parseFloat(a.heightCm).toFixed(0)} cm` : '—'
        let bmiStr = '—'
        if (a.weightKg && a.heightCm) {
          const bmi = parseFloat(a.weightKg) / Math.pow(parseFloat(a.heightCm) / 100, 2)
          bmiStr = bmi.toFixed(1)
        }
        row(doc, 'Peso / Altura', `${weight} / ${height}`)
        row(doc, 'IMC', bmiStr)
      }
      if (a.bodyFatPct) row(doc, '% Gordura', `${parseFloat(a.bodyFatPct).toFixed(1)}%`)
      row(doc, 'Objetivo', GOAL_LABEL[a.goal] ?? a.goal)
      row(doc, 'Nível', LEVEL_LABEL[a.experienceLevel] ?? a.experienceLevel)
      row(doc, 'Frequência semanal', `${a.weeklyFrequency}×/semana`)

      const restrictions = parseTags(a.restrictions)
      if (restrictions !== '—') row(doc, 'Restrições', restrictions)

      const meds = parseTags(a.medications)
      if (meds !== '—') row(doc, 'Medicamentos', meds)

      if (a.medicalNotes) row(doc, 'Obs. médicas', a.medicalNotes)
    }

    // ── Workouts ──────────────────────────────────────────────────────────
    if (data.workouts.length > 0) {
      sectionTitle(doc, 'Treinos Prescritos')

      for (const w of data.workouts) {
        if (doc.y > 680) doc.addPage()

        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(w.title, MARGIN, doc.y)

        const meta: string[] = [w.modality]
        if (w.estimatedDurationMin) meta.push(`~${w.estimatedDurationMin} min`)
        if (w.publishedAt) meta.push(`publicado em ${formatDate(w.publishedAt)}`)

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(COLORS.light)
          .text(meta.join(' · '), MARGIN, doc.y + 1)
        doc.moveDown(0.4)

        if (w.exercises.length > 0) {
          const colWidths = [24, 160, 60, 60, 60, PAGE_W - 24 - 160 - 60 - 60 - 60]
          tableHeader(doc, [
            { label: '#', width: colWidths[0]! },
            { label: 'Exercício', width: colWidths[1]! },
            { label: 'Séries', width: colWidths[2]! },
            { label: 'Reps', width: colWidths[3]! },
            { label: 'Carga', width: colWidths[4]! },
            { label: 'Descanso', width: colWidths[5]! },
          ])

          w.exercises.forEach((ex, idx) => {
            tableRow(
              doc,
              [
                String(ex.order),
                ex.exerciseName,
                String(ex.sets),
                ex.reps,
                ex.load ?? '—',
                ex.restSeconds ? `${ex.restSeconds}s` : '—',
              ],
              colWidths as number[],
              idx % 2 === 1,
            )
          })
        }

        doc.moveDown(0.6)
      }
    }

    // ── Session history ───────────────────────────────────────────────────
    if (data.sessions.length > 0) {
      sectionTitle(doc, `Histórico de Sessões (últimas ${data.sessions.length})`)

      const colWidths = [70, 165, 65, 70, 50, PAGE_W - 70 - 165 - 65 - 70 - 50]
      tableHeader(doc, [
        { label: 'Data', width: colWidths[0]! },
        { label: 'Treino', width: colWidths[1]! },
        { label: 'Duração', width: colWidths[2]! },
        { label: 'Volume (kg)', width: colWidths[3]! },
        { label: 'FC média', width: colWidths[4]! },
        { label: 'RPE', width: colWidths[5]! },
      ])

      data.sessions.forEach((s, idx) => {
        const vol = s.totalVolumeKg ? `${parseFloat(s.totalVolumeKg).toFixed(1)}` : '—'
        tableRow(
          doc,
          [
            formatDate(s.startedAt),
            s.workoutTitle,
            formatDuration(s.startedAt, s.endedAt),
            vol,
            s.avgHrBpm ? `${s.avgHrBpm} bpm` : '—',
            s.rpe ? String(s.rpe) : '—',
          ],
          colWidths as number[],
          idx % 2 === 1,
        )
      })
    }

    // ── Totals ────────────────────────────────────────────────────────────
    sectionTitle(doc, 'Resumo Geral')
    row(doc, 'Total de sessões realizadas', String(data.totals.totalSessions))
    row(
      doc,
      'Volume total acumulado',
      data.totals.totalVolumeKg > 0
        ? `${data.totals.totalVolumeKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
        : '—',
    )

    // ── Footer on all pages ───────────────────────────────────────────────
    const range = doc.bufferedPageRange()
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i)
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(COLORS.light)
        .text(
          `Este documento é gerado pelo sistema AthletiQLab e destina-se ao uso interno do profissional habilitado. Não substitui laudo médico.`,
          MARGIN,
          820,
          { width: PAGE_W - 60, align: 'left' },
        )
        .text(`Pág. ${i + 1} / ${range.count}`, 0, 820, {
          align: 'right',
          width: 595 - MARGIN,
        })
    }

    doc.end()
  })
}
