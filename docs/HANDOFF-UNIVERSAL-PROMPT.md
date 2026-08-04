# Verbatim handoff prompt — Universal operator visual polish

Copy everything in the fenced block below as-is into whichever platform you choose (a coding agent
with repository access, a design tool, another LLM session — the prompt is written to work across
that range, with branches for each case). Attach `HANDOFF-UNIVERSAL-BRIEF.md` alongside it as
reference material — the prompt refers to it by name throughout and will not make sense without it.

Do not edit the prompt to remove the constraint sections even if they feel repetitive with the brief.
The brief is reference; the prompt is what the model is actually held to, and models follow
instructions in the active prompt more reliably than instructions in an attached document they may
skim.

---

```
You are doing a visual front-end polish pass on one operator of an existing, working website. Before
you write or generate anything, read the attached HANDOFF-UNIVERSAL-BRIEF.md in full. It contains the
architecture, the design system, the legal constraints, and the current content inventory. Do not
skip it and do not summarize it back to me instead of reading it — act on it.

THE ONE-SENTENCE VERSION OF WHAT THIS IS
An independent, unofficial planning site for the four US Universal theme parks, called "Hollywood
Ride Guide" (hollywoodrideguide.com). It is one of several operator sites built from a shared,
zero-dependency static-site generator — plain HTML/CSS/vanilla JS, no framework, no build step for
styling. That architecture is a deliberate constraint, not a legacy accident, and your job is to work
within it, not to replace it.

YOUR TASK
Finish and polish the visual front end for this operator. Concretely, in priority order:

1. Style the Food Tracker and Trip Timing tool pages, which were deliberately left unstyled pending
   this pass. They must use the existing token system and component patterns described in the brief
   (§3) — do not invent new visual language for them.
2. Do a full pass over every existing page type (park hub, attraction, dining, guide, comparison,
   seasonal/month, tools index) checking for: contrast (WCAG AA minimum, both light and dark theme),
   focus-visible states on every interactive element, and `prefers-reduced-motion` coverage on
   anything animated. Fix what you find using the existing token system.
3. If real photography or other assets are supplied to you separately, wire them into the existing
   photo pipeline (`data.photo.*`, the `photo()` component) rather than adding img tags by hand — the
   brief explains why in §5.
4. Propose (but do not silently apply) a solution for the per-operator accent-color gap described in
   brief §3 — Universal's declared theme color isn't currently reflected in the shared stylesheet.
   This touches shared code the live Disney site also depends on, so show your proposed change and
   its blast radius before/alongside applying it, don't just apply it quietly.
5. Anything else you judge would measurably improve the visual polish of the existing pages, provided
   it satisfies every constraint below. Prefer refining what exists over adding new sections/pages —
   this is a polish pass, not a redesign.

HARD CONSTRAINTS — VIOLATING ANY OF THESE MAKES THE WORK UNUSABLE REGARDLESS OF QUALITY

Architecture:
- No React, Vue, Svelte, or any other framework. No Tailwind or other CSS framework. No bundler, no
  build step for CSS or templates beyond what already exists. Plain HTML/CSS/vanilla JS only, in the
  existing file structure (see brief §2).
- If you have repository write access: edit the real files directly — src/templates/*.mjs,
  src/pages/*.mjs, assets/css/main.css, assets/js/*.js. Follow existing code conventions (function
  signatures, comment style, file organization) exactly.
- If you do NOT have repository write access (you're a sandboxed generator that can only emit
  self-contained files): produce HTML/CSS output that reuses the EXACT class names and CSS custom
  properties documented in brief §3, verbatim. Do not rename them, do not prefix them, do not convert
  them to utility classes. The goal is output a human can port into the real codebase as a mechanical
  copy, not a rewrite. State clearly in your response which mode you operated in.

Legal / IP — this is not optional, see brief §4 in full before generating any image or icon:
- No Disney or Universal characters, logos, wordmarks, ride vehicles, or costumed characters, in any
  form, in any generated visual asset.
- No official park maps, traced or derived from one.
- No three-circle ("Mickey head") silhouette in any object, including incidentally in icons,
  illustrations, or decorative shapes.
- No real people, no celebrity likenesses.
- The unaffiliated disclaimer and FTC affiliate disclosure must remain visible exactly as positioned
  (footer disclaimer; affiliate disclosure above the first affiliate link on any page that has one).
- Never introduce "Universal," "Islands of Adventure," or similar into the BRAND identity (logo,
  domain, site name) — using park names in page content/copy is fine and expected.

Accessibility:
- WCAG AA contrast minimum, verified in both light and dark theme — this site supports both via
  prefers-color-scheme and a manual [data-theme] override, and both must work.
- Every interactive element needs a visible focus state. Do not remove outline/focus-visible styling
  without replacing it with something equally visible.
- All motion/animation must be wrapped in @media (prefers-reduced-motion: no-preference) or
  equivalent — the codebase already does this consistently, match the pattern.
- The freshness-ribbon component (brief §3) encodes state by color AND shape together, specifically
  because color-only encoding fails colorblind users and greyscale printing. Do not simplify it back
  to color-only if you touch it.

Performance:
- This site's home page explicitly claims the tools work on park WiFi. Any image you add or wire in
  needs explicit width/height (no layout shift), lazy loading except above-the-fold hero content, and
  should target well under 150KB for a hero-sized image. If you cannot meet this, say so explicitly
  rather than shipping something heavier and silent about it.
- No web fonts. The existing system font stack is deliberate.

Content honesty (see brief §5 for the full reasoning):
- Do not resolve, edit, or paper over the two CONFLICTS entries in
  scripts/reference/universal.mjs. They are unresolved on purpose and require real-world
  verification outside the scope of this task.
- Do not flip data/operators.json's Universal status from "draft" to "live" — that's a content
  decision for the site owner, unrelated to visual quality.
- Do not invent or approximate content facts (heights, prices, hours) to fill a visual gap. If a
  design needs a number that doesn't exist yet, use a realistic placeholder clearly marked as such in
  your delivery notes, don't write it into the actual data files as if it were real.

WHAT TO VERIFY BEFORE CALLING ANYTHING DONE
If you have shell/repository access, run these and confirm they pass — paste the actual output in
your response, don't just claim success:

    node scripts/validate.mjs universal
    node scripts/factcheck.mjs universal
    node src/build.mjs universal
    node scripts/audit.mjs universal
    node --test test/*.test.mjs

If you touched anything shared (src/lib, src/templates, assets/css or assets/js — check brief §2 for
what counts as shared), also run the same four commands with "disney" in place of "universal", since
that operator is live in production and any regression there is a hard blocker.

If you do NOT have shell access, say so explicitly and hand back a precise list of exactly what a
human needs to run before merging your changes. Do not claim verification you were not able to
perform.

WHAT TO DELIVER
- If you have repo access: the actual edited files, plus a short changelog of what you touched and
  why, plus the verification command output.
- If you don't: self-contained HTML/CSS files per page/component you touched, using the site's real
  class names and tokens, plus clear notes on how each maps back into the real template files
  (src/templates/components.mjs, src/pages/*.mjs) for someone to port.
- Either way: a short section flagging anything you found that seems wrong, risky, or out of scope
  but worth knowing about — do not silently fix things outside your task or silently ignore things
  that concerned you.
```
