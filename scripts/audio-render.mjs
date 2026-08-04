/**
 * Renders the generated month scripts to MP3 through the ElevenLabs API.
 *
 *   ELEVENLABS_API_KEY=sk_... node scripts/audio-render.mjs disney --voice <voice_id>
 *   ELEVENLABS_API_KEY=sk_... node scripts/audio-render.mjs disney --voice <id> --month 03
 *   … --force        re-render episodes that already exist
 *   … --dry-run      show what would be rendered, call nothing, spend nothing
 *
 * WHY THIS EXISTS RATHER THAN TWELVE PASTES INTO THE WEB UI
 *
 * This is not a one-time job. The scripts are generated from month data, and CI fails when the two
 * disagree — so every correction to a crowd pattern, a price band or a weather note produces a new
 * script, and the audio has to be re-cut to match. A hand-driven workflow survives exactly as long
 * as somebody remembers, and stale audio is the specific failure the whole freshness design exists
 * to prevent. Re-rendering has to be one command or it will not happen.
 *
 * It also closes the loop on the podcast feed. An episode needs a real byte length and duration, and
 * this prints them in the exact shape site.json wants, so nobody is typing numbers by hand into the
 * one place a wrong number breaks a download for every subscriber.
 *
 * NOTE ON THE API SHAPE
 *
 * Written against the v1 text-to-speech endpoint. Vendor APIs move; if a call starts failing, check
 * the current docs before assuming the key is wrong — the error body is printed in full for exactly
 * that reason.
 */

import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/*
 * Settings, and why each is what it is.
 *
 * These match docs/ASSET-RUNBOOK.md. Style is the one worth defending: it turns a measured read into
 * a performance, and a performance makes the site's honesty sound like a sales pitch. A brief that
 * grades a month C+ and explains why has to sound like it means it.
 */
const VOICE_SETTINGS = {
  stability: 0.52,          // lower wanders across three minutes; higher lands every line flat
  similarity_boost: 0.75,   // holds one presenter across twelve separate files
  style: 0.05,              // near zero, deliberately
  use_speaker_boost: true,
}

const MODEL = 'eleven_multilingual_v2'
const OUTPUT_FORMAT = 'mp3_44100_128'   // 128 kbps; mono is plenty for one speaking voice
const BITRATE = 128000

/**
 * Duration from byte length, for constant-bitrate MP3.
 *
 * Accurate to well under a second at CBR, which is all an <itunes:duration> needs. If ffprobe is on
 * the machine, prefer it — the exact command is printed at the end.
 */
function estimateSeconds (bytes) {
  return Math.round((bytes * 8) / BITRATE)
}

function fail (message) {
  console.error(`\n  ${message}\n`)
  process.exit(1)
}

async function render (text, voiceId, apiKey) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${OUTPUT_FORMAT}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: VOICE_SETTINGS }),
  })

  if (!res.ok) {
    // The body carries the actual reason — quota, bad voice id, malformed settings. Printing the
    // status alone sends people to regenerate an API key that was never the problem.
    const body = await res.text().catch(() => '(no body)')
    throw new Error(`${res.status} ${res.statusText}\n${body}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

async function main () {
  const argv = process.argv.slice(2)
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`)
    return i === -1 ? null : argv[i + 1]
  }
  const has = (name) => argv.includes(`--${name}`)

  const operator = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--voice' && argv[argv.indexOf(a) - 1] !== '--month') || 'disney'
  const voiceId = flag('voice')
  const only = flag('month')
  const force = has('force')
  const dryRun = has('dry-run')

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!dryRun && !apiKey) fail('Set ELEVENLABS_API_KEY. It is read from the environment and never written to disk.')
  if (!voiceId) fail('Pass --voice <voice_id>. Audition first — see docs/ASSET-RUNBOOK.md batch 5.')

  const scriptDir = join(ROOT, 'build', 'audio-scripts', operator)
  if (!existsSync(scriptDir)) {
    fail(`No scripts at ${scriptDir}. Run: node scripts/audio-script.mjs ${operator}`)
  }

  const outDir = join(ROOT, 'build', 'audio', operator)
  await mkdir(outDir, { recursive: true })

  const files = (await readdir(scriptDir))
    .filter((f) => /^\d{2}-.+\.txt$/.test(f))
    .sort()
    .filter((f) => !only || f.startsWith(String(only).padStart(2, '0')))

  if (!files.length) fail('No matching scripts.')

  console.log(`\n  ${dryRun ? 'Would render' : 'Rendering'} ${files.length} episode${files.length === 1 ? '' : 's'} · voice ${voiceId} · ${MODEL}`)
  console.log(`  stability ${VOICE_SETTINGS.stability} · similarity ${VOICE_SETTINGS.similarity_boost} · style ${VOICE_SETTINGS.style}\n`)

  const episodes = []
  for (const file of files) {
    const num = file.slice(0, 2)
    const slug = file.slice(3).replace(/\.txt$/, '')
    const out = join(outDir, `${num}-${slug}.mp3`)
    const text = (await readFile(join(scriptDir, file), 'utf8')).trim()
    const words = text.split(/\s+/).length

    if (existsSync(out) && !force) {
      const { size } = await stat(out)
      console.log(`  ${num} ${slug.padEnd(10)} exists, skipped  (--force to re-render)`)
      episodes.push({ month: Number(num), file: `${num}-${slug}.mp3`, bytes: size, durationSeconds: estimateSeconds(size) })
      continue
    }

    if (dryRun) {
      console.log(`  ${num} ${slug.padEnd(10)} ${String(words).padStart(4)} words`)
      continue
    }

    process.stdout.write(`  ${num} ${slug.padEnd(10)} ${String(words).padStart(4)} words … `)
    try {
      const audio = await render(text, voiceId, apiKey)
      await writeFile(out, audio)
      const seconds = estimateSeconds(audio.length)
      console.log(`${(audio.length / 1048576).toFixed(2)} MB  ~${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`)
      episodes.push({ month: Number(num), file: `${num}-${slug}.mp3`, bytes: audio.length, durationSeconds: seconds })
    } catch (e) {
      console.log('FAILED')
      console.error(`\n  ${file}: ${e.message}\n`)
      // Stop rather than continue. A partial run that keeps going burns quota on a misconfiguration
      // and leaves a half-rendered set that looks complete.
      process.exit(1)
    }
  }

  if (dryRun || !episodes.length) return

  console.log(`\n  Written to build/audio/${operator}/ — these are gitignored and must stay out of the repo.`)
  console.log('  Upload them, then paste this into the operator\'s site.json under "podcast":\n')
  console.log('  "episodes": ' + JSON.stringify(
    episodes.map((e) => ({ ...e, file: `SUBFOLDER/${e.file}`, published: 'YYYY-MM-DD' })), null, 2
  ).split('\n').join('\n  '))
  console.log('\n  Set `published` per episode, and prefix `file` with whatever path they sit at')
  console.log('  under podcast.audioBase.\n')
  console.log('  Durations are computed from byte length at constant bitrate, which is accurate to')
  console.log('  well under a second. For exact figures if ffprobe is available:\n')
  console.log(`    for f in build/audio/${operator}/*.mp3; do`)
  console.log('      echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"')
  console.log('    done\n')
}

main().catch((e) => { console.error(e); process.exitCode = 1 })
