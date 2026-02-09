export type RNG = () => number

const PACIFIC_TIME_ZONE = 'America/Los_Angeles'

export function mulberry32(seed: number): RNG {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface DateParts {
  year: number
  month: number
  day: number
}

interface DateTimeParts extends DateParts {
  hour: number
  minute: number
  second: number
}

function readNumericPart(parts: Intl.DateTimeFormatPart[], type: string): number {
  const value = parts.find((part) => part.type === type)?.value
  if (!value) {
    throw new Error(`Missing ${type} from Intl parts`)
  }
  return Number.parseInt(value, 10)
}

function getDateTimePartsInZone(timeMs: number, timeZone: string): DateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(new Date(timeMs))
  return {
    year: readNumericPart(parts, 'year'),
    month: readNumericPart(parts, 'month'),
    day: readNumericPart(parts, 'day'),
    hour: readNumericPart(parts, 'hour'),
    minute: readNumericPart(parts, 'minute'),
    second: readNumericPart(parts, 'second'),
  }
}

function getDatePartsInZone(timeMs: number, timeZone: string): DateParts {
  const parts = getDateTimePartsInZone(timeMs, timeZone)
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  }
}

function getTimeZoneOffsetMs(timeMs: number, timeZone: string): number {
  const zoned = getDateTimePartsInZone(timeMs, timeZone)
  const zonedUtcMs = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
  )
  const roundedMs = Math.floor(timeMs / 1000) * 1000
  return zonedUtcMs - roundedMs
}

function zonedDateTimeToUtcMs(
  date: DateParts & { hour?: number; minute?: number; second?: number; millisecond?: number },
  timeZone: string,
): number {
  const utcGuess = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    date.hour ?? 0,
    date.minute ?? 0,
    date.second ?? 0,
    date.millisecond ?? 0,
  )

  let utc = utcGuess
  for (let i = 0; i < 3; i += 1) {
    const offset = getTimeZoneOffsetMs(utc, timeZone)
    const nextUtc = utcGuess - offset
    if (nextUtc === utc) break
    utc = nextUtc
  }
  return utc
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

export function getPacificDateString(nowMs = Date.now()): string {
  const date = getDatePartsInZone(nowMs, PACIFIC_TIME_ZONE)
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`
}

export function getDailySeed(nowMs = Date.now()): number {
  const date = getDatePartsInZone(nowMs, PACIFIC_TIME_ZONE)
  return date.year * 10000 + date.month * 100 + date.day
}

const EPOCH = new Date('2026-02-09T00:00:00Z').getTime()

export function getDayNumber(): number {
  const now = Date.now()
  return Math.floor((now - EPOCH) / 86400000) + 1
}

export function getDayNumberForSeed(seed: number): number {
  const y = Math.floor(seed / 10000)
  const m = Math.floor((seed % 10000) / 100)
  const d = seed % 100
  const date = new Date(Date.UTC(y, m - 1, d))
  return Math.floor((date.getTime() - EPOCH) / 86400000) + 1
}

export function getMsUntilNextPacificDay(nowMs = Date.now()): number {
  const date = getDatePartsInZone(nowMs, PACIFIC_TIME_ZONE)
  const nextDayUtc = new Date(Date.UTC(date.year, date.month - 1, date.day + 1))
  const nextPacificMidnightUtcMs = zonedDateTimeToUtcMs({
    year: nextDayUtc.getUTCFullYear(),
    month: nextDayUtc.getUTCMonth() + 1,
    day: nextDayUtc.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  }, PACIFIC_TIME_ZONE)
  return Math.max(0, nextPacificMidnightUtcMs - nowMs)
}
