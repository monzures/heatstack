type FeedbackTone = 'tap' | 'submit' | 'error' | 'finish' | 'warning' | 'start'

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

interface ChipNote {
  freq: number
  durationMs: number
  wave?: OscillatorType
  gain?: number
  slideTo?: number
  pan?: number
}

function isIOSWeb(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent ?? ''
  const platform = navigator.platform ?? ''
  const maxTouchPoints = navigator.maxTouchPoints ?? 0
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

export function isHapticsSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  if (isIOSWeb()) return false
  return typeof navigator.vibrate === 'function'
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => undefined)
  }
  return audioCtx
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (masterGain && masterGain.context === ctx) return masterGain
  const gain = ctx.createGain()
  gain.gain.value = 0.92
  gain.connect(ctx.destination)
  masterGain = gain
  return gain
}

function playNote(ctx: AudioContext, note: ChipNote, startAt: number) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  const durationSec = note.durationMs / 1000
  const endAt = startAt + durationSec
  const peak = Math.max(0.001, note.gain ?? 0.05)

  osc.type = note.wave ?? 'square'
  osc.frequency.setValueAtTime(note.freq, startAt)
  if (note.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, note.slideTo), endAt)
  }

  amp.gain.setValueAtTime(0.0001, startAt)
  amp.gain.exponentialRampToValueAtTime(peak, startAt + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0001, endAt)

  if ('createStereoPanner' in ctx) {
    const panNode = ctx.createStereoPanner()
    panNode.pan.setValueAtTime(note.pan ?? 0, startAt)
    osc.connect(amp)
    amp.connect(panNode)
    panNode.connect(getMasterGain(ctx))
  } else {
    osc.connect(amp)
    amp.connect(getMasterGain(ctx))
  }

  osc.start(startAt)
  osc.stop(endAt + 0.02)
}

function playSequence(ctx: AudioContext, notes: ChipNote[], opts?: { startOffsetMs?: number; stepGapMs?: number }) {
  const startOffsetMs = opts?.startOffsetMs ?? 0
  const stepGapMs = opts?.stepGapMs ?? 0
  let cursor = ctx.currentTime + startOffsetMs / 1000
  for (const note of notes) {
    playNote(ctx, note, cursor)
    cursor += (note.durationMs + stepGapMs) / 1000
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer

  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length
    const envelope = 1 - t
    data[i] = ((Math.random() * 2) - 1) * envelope
  }
  noiseBuffer = buffer
  return buffer
}

function playNoiseBurst(ctx: AudioContext, startAt: number, durationMs: number, gainAmount: number) {
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer(ctx)

  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(1300, startAt)

  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, startAt)
  amp.gain.exponentialRampToValueAtTime(gainAmount, startAt + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000)

  src.connect(filter)
  filter.connect(amp)
  amp.connect(getMasterGain(ctx))
  src.start(startAt)
  src.stop(startAt + durationMs / 1000 + 0.02)
}

export function playTone(kind: FeedbackTone, enabled: boolean) {
  if (!enabled) return
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (!ctx) return

  switch (kind) {
    case 'tap':
      playSequence(ctx, [
        { freq: 880, slideTo: 740, durationMs: 48, wave: 'square', gain: 0.045, pan: -0.08 },
      ])
      return
    case 'submit':
      playSequence(
        ctx,
        [
          { freq: 523.25, durationMs: 55, wave: 'square', gain: 0.048, pan: -0.15 },
          { freq: 659.25, durationMs: 55, wave: 'square', gain: 0.05, pan: 0.12 },
          { freq: 783.99, durationMs: 70, wave: 'square', gain: 0.052, pan: -0.08 },
          { freq: 1046.5, durationMs: 90, wave: 'triangle', gain: 0.04, pan: 0.08 },
        ],
        { stepGapMs: 8 },
      )
      return
    case 'error':
      playSequence(
        ctx,
        [
          { freq: 247, slideTo: 196, durationMs: 84, wave: 'square', gain: 0.04, pan: 0.08 },
          { freq: 185, slideTo: 146, durationMs: 98, wave: 'square', gain: 0.042, pan: -0.08 },
        ],
        { stepGapMs: 6 },
      )
      playNoiseBurst(ctx, ctx.currentTime + 0.012, 108, 0.016)
      return
    case 'finish':
      playSequence(
        ctx,
        [
          { freq: 523.25, durationMs: 68, wave: 'square', gain: 0.05, pan: -0.12 },
          { freq: 659.25, durationMs: 68, wave: 'square', gain: 0.052, pan: 0.1 },
          { freq: 783.99, durationMs: 68, wave: 'square', gain: 0.055, pan: -0.1 },
          { freq: 1046.5, durationMs: 130, wave: 'square', gain: 0.058, pan: 0.12 },
          { freq: 987.77, durationMs: 92, wave: 'triangle', gain: 0.04, pan: -0.06 },
          { freq: 783.99, durationMs: 150, wave: 'triangle', gain: 0.045, pan: 0.06 },
        ],
        { stepGapMs: 12 },
      )
      playSequence(
        ctx,
        [
          { freq: 261.63, durationMs: 68, wave: 'triangle', gain: 0.02, pan: -0.2 },
          { freq: 329.63, durationMs: 68, wave: 'triangle', gain: 0.022, pan: 0.18 },
          { freq: 392, durationMs: 68, wave: 'triangle', gain: 0.024, pan: -0.16 },
          { freq: 523.25, durationMs: 130, wave: 'triangle', gain: 0.026, pan: 0.14 },
          { freq: 493.88, durationMs: 92, wave: 'triangle', gain: 0.022, pan: -0.1 },
          { freq: 392, durationMs: 150, wave: 'triangle', gain: 0.024, pan: 0.1 },
        ],
        { startOffsetMs: 3, stepGapMs: 12 },
      )
      return
    case 'warning':
      playSequence(
        ctx,
        [
          { freq: 659.25, durationMs: 44, wave: 'triangle', gain: 0.024, pan: -0.04 },
          { freq: 783.99, durationMs: 58, wave: 'triangle', gain: 0.028, pan: 0.04 },
        ],
        { stepGapMs: 6 },
      )
      return
    case 'start':
      playSequence(
        ctx,
        [
          { freq: 523.25, durationMs: 48, wave: 'square', gain: 0.028, pan: -0.1 },
          { freq: 659.25, durationMs: 52, wave: 'square', gain: 0.03, pan: 0.08 },
          { freq: 783.99, durationMs: 56, wave: 'square', gain: 0.032, pan: -0.06 },
          { freq: 1046.5, durationMs: 88, wave: 'triangle', gain: 0.03, pan: 0.04 },
        ],
        { stepGapMs: 10 },
      )
      return
  }
}

export function triggerHaptic(pattern: number | number[], enabled: boolean) {
  if (!enabled) return
  if (!isHapticsSupported()) return
  navigator.vibrate(pattern)
}
