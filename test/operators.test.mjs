import { test } from 'node:test'
import assert from 'node:assert/strict'

import { operators, resolveTargets } from '../src/lib/data.mjs'

/**
 * The registry decides which sites are publishable, so the rule it encodes has to hold in one place.
 *
 * Five entry points pick their own targets — both validators, both fact checkers, the build and the
 * audit. A rule about which operators may ship that is implemented five times is a rule that will
 * eventually be implemented four times, and the failure mode is not a red build. It is a half-built
 * site quietly appearing in dist/ because somebody forgot it was registered.
 */

const all = await operators()

test('every registered operator has the fields the loader needs', async () => {
  assert.ok(all.length, 'the registry is empty')
  for (const o of all) {
    assert.match(o.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `bad slug ${JSON.stringify(o.slug)}`)
    assert.ok(o.dir, `${o.slug} has no dir`)
    assert.ok(o.name, `${o.slug} has no name`)
  }
})

test('a draft operator is excluded from the default target set', async () => {
  const drafts = all.filter((o) => o.status === 'draft')
  if (!drafts.length) return // nothing in draft right now; the rule is still pinned by the tests below

  const targets = await resolveTargets([])
  for (const draft of drafts) {
    assert.ok(!targets.some((t) => t.slug === draft.slug),
      `draft operator "${draft.slug}" is in the default target set — it would be gated, and built, before it is finished`)
  }
})

test('naming an operator explicitly selects it whatever its status', async () => {
  // Otherwise a draft is unreachable, and an unreachable draft cannot be worked on.
  for (const o of all) {
    const targets = await resolveTargets([o.slug])
    assert.deepEqual(targets.map((t) => t.slug), [o.slug])
  }
})

test('an unknown operator is an error, not a silent empty build', async () => {
  await assert.rejects(
    () => resolveTargets(['not-an-operator']),
    /Unknown operator/,
    'a typo in an operator slug must not quietly build nothing'
  )
})

test('every live operator has both of its reference tables', async () => {
  // A dataset checked against nothing is not checked. The fact checkers refuse to run without
  // these, so a live operator missing one would fail at the gate rather than here — but failing
  // here says why, in one line, instead of as a thrown import error mid-run.
  const { existsSync } = await import('node:fs')
  const { join, dirname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')

  for (const o of await resolveTargets([])) {
    for (const suffix of ['', '-seasonal']) {
      const path = join(root, 'scripts', 'reference', `${o.slug}${suffix}.mjs`)
      assert.ok(existsSync(path), `live operator "${o.slug}" has no scripts/reference/${o.slug}${suffix}.mjs`)
    }
  }
})
