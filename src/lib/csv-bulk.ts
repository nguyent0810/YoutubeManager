export type CsvRow = Record<string, string>

/** Minimal CSV parser (comma-separated, quoted fields). */
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ""
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]!
      if (c === '"') {
        inQ = !inQ
        continue
      }
      if (!inQ && c === ",") {
        out.push(cur.trim())
        cur = ""
        continue
      }
      cur += c
    }
    out.push(cur.trim())
    return out
  }

  const headers = parseLine(lines[0]!).map((h) => h.trim().toLowerCase())
  const rows: CsvRow[] = []
  for (let li = 1; li < lines.length; li++) {
    const cells = parseLine(lines[li]!)
    const row: CsvRow = {}
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? ""
    })
    rows.push(row)
  }
  return { headers, rows }
}

export function fileBasename(pathOrName: string): string {
  const s = pathOrName.replace(/\\/g, "/")
  const i = s.lastIndexOf("/")
  return i >= 0 ? s.slice(i + 1) : s
}

export type VisibilityMode = "public" | "private" | "unlisted" | "schedule"

function parseVisibility(raw: string): VisibilityMode | null {
  const v = raw.trim().toLowerCase()
  if (v === "public" || v === "private" || v === "unlisted") return v
  if (v === "schedule" || v === "scheduled") return "schedule"
  return null
}

/** Map CSV rows onto queue rows by filename / file / path column. */
export function matchCsvToQueueRows<
  T extends {
    sortPath: string
    file: File
    title: string
    description: string
    visibility: VisibilityMode
    scheduleLocal: string
  },
>(queue: T[], csvRows: CsvRow[]): T[] {
  const fileKey = (row: CsvRow): string | null => {
    const raw =
      row.filename ||
      row.file ||
      row.path ||
      row["file name"] ||
      ""
    const t = String(raw).trim()
    return t ? fileBasename(t).toLowerCase() : null
  }

  const byBasename = new Map<string, CsvRow>()
  for (const r of csvRows) {
    const k = fileKey(r)
    if (k) byBasename.set(k, r)
  }

  return queue.map((row) => {
    const key = fileBasename(row.sortPath).toLowerCase()
    const c = byBasename.get(key)
    if (!c) return row

    const title = (c.title || c.name || "").trim()
    const description = (c.description || c.desc || "").trim()
    const scheduleRaw = (c.schedule || c.publish_at || c["schedule local"] || "").trim()
    const visRaw = (c.visibility || c.privacy || "").trim()

    let visibility = row.visibility
    const pv = parseVisibility(visRaw)
    if (pv) visibility = pv

    let scheduleLocal = row.scheduleLocal
    if (scheduleRaw) {
      const d = new Date(scheduleRaw)
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0")
        scheduleLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
    }

    return {
      ...row,
      ...(title ? { title: title.slice(0, 100) } : {}),
      ...(description ? { description: description.slice(0, 5000) } : {}),
      visibility,
      ...(scheduleLocal !== row.scheduleLocal ? { scheduleLocal } : {}),
    }
  })
}
