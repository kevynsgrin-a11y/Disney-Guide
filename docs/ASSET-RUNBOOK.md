# Asset runbook — every prompt, batched by program

Everything the site is waiting on, in the order worth doing it, grouped by which tool you are in.
Copy the fenced blocks verbatim.

This supersedes `docs/LOVABLE-VISUAL-OVERHAUL.md`, which described a workflow I then talked us out
of — Lovable, v0, Bolt and Builder.io all emit React apps in their own sandboxes and cannot touch a
zero-dependency template-literal generator. The front end is built directly in the repo; only the
assets come from outside.

## Order of work, and why

| | Batch | Program | Blocks |
|---|---|---|---|
| 1 | Hero image | image generator | The whole visual overhaul |
| 2 | Social card | image generator | **Every share of every page right now** |
| 3 | Podcast artwork | image generator | Directory submission |
| 4 | Section images ×8 | image generator | Nothing — pure upside |
| 5 | Twelve audio briefs | ElevenLabs | The podcast |
| 6 | Config | text editor | Publishing |

**Batch 2 before batch 4.** The site declares `twitter:card = summary_large_image` and, until a card
image exists, ships no image with it — so every share on X, Facebook, LinkedIn, iMessage, Slack and
WhatsApp is a bare text link. I have made the card degrade honestly to `summary` in the meantime, but
one 1200×630 image turns every existing share into a picture. For a stated goal of drawing traffic
that is the highest ratio of effort to return on this list, and it is one image.

---

# BATCHES 1–4 · Image generator

**Recommended: Adobe Firefly.** Trained on licensed content, and Adobe indemnifies commercial use.
Given how much of this brief is intellectual property, that indemnification is a real asset rather
than a footnote. Midjourney gives the better cinematic result if you would rather carry the IP
question yourself. Both work with these prompts.

## Paste once — the standing rules

Put this in the tool's system/style field if it has one, or prepend it to each prompt.

```
NEVER depict or evoke: Mickey Mouse or any Disney character; the three-circle "Mickey head"
silhouette in ANY form, including balloons, pretzels, ice cream, waffles, straws or topiary;
Sleeping Beauty Castle, Cinderella Castle or any close variant; Disney or Universal logos,
wordmarks, ride vehicles, monorails or costumed characters; Disney cast-member costume or name-tag
design; Harry Potter, Star Wars, Marvel or Nintendo properties. No recognisable real people or
celebrity likenesses. Park staff wear plain unbranded uniforms in solid colours, no logos, no name
tags. No text, no readable signage, no watermarks anywhere in frame.

STYLE: shot on a full-frame camera, 35mm prime, wide aperture, natural light. Rich but believable
colour, deep shadows that retain detail, slight film grain. Warm highlights, cool shadows. Editorial
documentary photography — a magazine photo essay, not stock and not a brochure. Photorealistic.
```

**Two failure modes are near-certain rather than theoretical.** Ask any model for theme-park food and
it will produce a Mickey-shaped pretzel or ice cream bar — check every food, balloon and topiary
image and regenerate if a three-circle arrangement appears. And "pink castle lit at night" is a
literal description of a specific, aggressively protected building; the castle prompt below specifies
different architecture, and if the output still resembles the real one, regenerate rather than ship.

## Batch 1 — Hero · 16:9, do this first

```
Enormous golden and magenta firework bursts filling a deep indigo night sky, seen above the
silhouetted rooflines of a generic fairground: a Ferris wheel, striped canvas awnings, strings of
warm bulbs. Photographed from within a crowd, so anonymous backlit heads and shoulders form the
lower foreground in near-silhouette. The fireworks occupy the upper right third. The lower third is
deep blue and near-black with no bright detail. No castle in frame. No identifiable faces.
```

The dark lower third is not an aesthetic preference — the headline sits there and needs the contrast.
The scrim is tuned for it and measures about 12.4:1 against a firework-bright frame.

## Batch 2 — Social card · 1200×630 exactly

This one has a hard constraint most image prompts do not: **it will be cropped by every platform**,
and it is viewed at thumbnail size in a feed. Busy compositions turn to mush.

```
A single enormous golden firework burst against a deep indigo night sky, centred, with generous
empty sky around it. Minimal foreground: a thin silhouetted skyline of fairground rooflines and a
Ferris wheel occupying only the bottom fifth of the frame. Simple, graphic, high contrast, readable
at thumbnail size. No crowd, no faces, no castle. Composition centred and symmetrical so that
cropping to square or to 2:1 loses nothing important.
```

## Batch 3 — Podcast artwork · square, 3000×3000

Apple requires square, 1400–3000px, JPEG or PNG. It is displayed at roughly 55px in a phone list, so
it must survive extreme reduction.

```
Album artwork for a travel podcast. A single stylised firework burst in warm gold and rose against a
deep indigo field, rendered flat and graphic rather than photographic — bold shapes, few colours,
strong silhouette. Centred, symmetrical, with generous margin around the motif. Must remain legible
and distinctive when reduced to 55 pixels square. No text, no lettering, no characters, no castle.
Square 1:1.
```

Leave space — I will set the title typographically rather than baking words into the art, since text
in generated images is unreliable and unreadable at thumbnail size.

## Batch 4 — Section images · 16:9, eight of them

Pure upside; nothing is blocked on these. If you only ever make two, make **the drop** and **the end
of the day** — energy and tenderness, which is the emotional range the site needs.

**4a · The castle**
```
A fantasy castle at blue hour, lit from below in warm rose and amber against a deep teal sky.
Architecture: a Moorish-Gothic hybrid — horseshoe arches, a single dominant square keep placed
off-centre rather than a central spire, exactly two slim flanking towers topped with copper onion
domes, and a wide arcaded terrace at the base. Deliberately asymmetric. No cluster of blue conical
fairytale spires. Low three-quarter angle across still water with a reflection. Painterly and
stylised rather than documentary — an illustration of an idea, not a photograph of a place.
```

**4b · The drop**
```
A packed roller-coaster train cresting a drop, shot from the front, every rider's arms up, faces
caught mid-scream and mid-laugh. Bright overcast daylight, background motion-blurred, the train
sharp. Genuine unposed delight: open mouths, closed eyes, hair flying. Mixed ages and ethnicities.
Plain clothing, no branded merchandise, no character ears of any kind.
```

**4c · The carousel**
```
Interior of a traditional carousel at night, long exposure so the lights streak into ribbons of gold
while one painted horse and the small child riding it stay sharp. Warm bulbs, mirrored panels,
ornate gilt. Wonder rather than excitement. Camera at child height.
```

**4d · The welcome**
```
A smiling attendant in a plain solid-colour uniform, no logo and no name tag, leaning slightly
forward to give directions to a family, one arm extended pointing off-frame. Warm late-afternoon
light, shallow depth of field. The interaction is the subject. Genuine warmth, not a
customer-service smile.
```

**4e · Fair food**
```
Overhead flat-lay on weathered wood: a fresh-cut churro dusted in cinnamon sugar, a paper tray of
loaded fries, a tall swirl of soft-serve in a waffle cone, a turkey leg, a paper cup of lemonade
beaded with condensation. Hard directional afternoon light, strong shadows. Nothing shaped like
three circles. No branded packaging.
```

**4f · Waiting**
```
A long switchback queue line seen from above at golden hour, low sun raking across it, people in
small clusters talking and laughing. Honest rather than flattering. Long shadows, dust in the air.
```

**4g · The splash**
```
A log flume boat hitting the bottom of its drop, an enormous wall of white water frozen mid-air, the
riders soaked and delighted behind it. High shutter speed, backlit so the spray glows.
```

**4h · The end of the day**
```
A parent carrying a sleeping child on their shoulder, walking away from camera down a lamplit path,
both in silhouette against the warm blur of a fairground behind. Tender, unposed, slightly
melancholy.
```

## Delivering images

Send me the full-resolution originals and I will do the conversion, sizing and measurement — that
part is mechanical and I would rather measure the result than trust it. Or produce them yourself as:

```
assets/img/photos/hero-fireworks-{640,1280,1920}.{avif,webp,jpg}
assets/img/photos/social-card-{640,1280}.jpg
```

**120 KB ceiling on the 1920 AVIF.** The home page claims the tools work on park WiFi, and that claim
does not lose to a nicer photograph. The hero slot is already live in both operators — the moment the
files land, the hero switches from its gradient on its own.

---

# BATCH 5 · ElevenLabs

## The scripts already exist

```bash
node scripts/audio-script.mjs disney --pron
```

Twelve files in `build/audio-scripts/disney/`, 478–557 words each, ~3 minutes. Paste each straight
in — they are already speech-shaped: degrees spelled out, "C plus" not "C+", em dashes resolved,
markdown stripped.

**Do not hand-edit them.** Every sentence derives from a validated, fact-checked, freshness-stamped
field in the month data. Editing the text creates an unverified claim no gate covers, which is the
one thing this site is built not to do. If a script says something wrong, the *data* is wrong — fix
that and regenerate. CI fails if the committed scripts and the data disagree.

## Voice

The site is dry, specific, and willing to say a month is a poor choice. A bright travel-vlogger read
would undercut every honest thing the copy does. You want a broadsheet travel correspondent or a
documentary voiceover: measured, warm at the edges, unhurried, credible reading a number.

Audition against the hardest line in the set:

> Who it does not. Anyone hoping to find a quiet week.

**If a voice makes that sound cheerful, it is the wrong voice.**

Prefer mid-range over very deep — deep voices lose intelligibility through a car speaker at motorway
noise, which is one of the two places this will actually be heard.

## Settings

Model: **Eleven Multilingual v2**. Turbo v2.5 is fine while auditioning; regenerate on v2 to publish.

| Setting | Value | Why |
| --- | --- | --- |
| Stability | **50–55** | Lower wanders in tone across three minutes; higher lands every sentence identically flat. |
| Similarity | **75** | Holds character across twelve files that must sound like one presenter. |
| Style exaggeration | **0–15** | Near zero. Style turns a measured read into a performance, and a performance makes the honesty sound like a pitch. |
| Speaker boost | **On** | |
| Speed | **1.0** | Do not compress to hit a runtime. |

## Pronunciation dictionary — load before generating anything

```
EPCOT           EP-cot — one word, never spelled out
Hagrid's        HAG-rids
Ratatouille     rat-a-TOO-ee
Na'vi           NAH-vee
Velocicoaster   vel-OSS-i-coaster
Gringotts       GRING-otts
Hogsmeade       HOGS-meed
Soarin'         SOAR-in
Anaheim         ANA-hyme
Incredicoaster  in-CRED-i-coaster
Tiana           tee-AH-na
Kilimanjaro     kil-i-man-JAR-o
```

`EPCOT` matters most — it appears constantly and engines spell it out as five letters, which sounds
instantly wrong to anyone who has been.

## Export

MP3, **128 kbps mono**. Stereo buys nothing for one speaking voice and doubles the file. About 2.8 MB
per episode, 34 MB for the set.

**Not into the repository.** `.git` is 46 MB already, and audio in the service-worker precache would
falsify the "works on park WiFi" claim. Host on R2 or similar.

---

# BATCH 6 · Config

Once audio is hosted, fill these in `data/disney/site.json` and the feed appears by itself.

```jsonc
"podcast": {
  "email":     "hello@ridereadyguide.com",
  "audioBase": "https://audio.ridereadyguide.com/",
  "artwork":   "https://audio.ridereadyguide.com/artwork-3000.jpg",
  "episodes": [
    { "month": 3,
      "file": "2026-07/03-march.mp3",
      "bytes": 2914560,
      "durationSeconds": 188,
      "published": "2026-07-15" }
  ]
}
```

Both numbers come from the real file:

```bash
ls -l 03-march.mp3
ffprobe -v error -show_entries format=duration -of csv=p=0 03-march.mp3
```

**`bytes` is the honesty check.** RSS requires a true byte length, and you only know one if the file
exists and you have looked at it. An episode missing it is dropped rather than published, because a
broken enclosure is worse than a missing episode — several clients cache the download failure and
stop retrying.

### Still blocking

**An owner email on the domain.** Apple rejects a feed without one, and an address on a feed that
bounces is worse than no address. `corrections@` and `hello@` are both still unprovisioned.

---

## What I do when assets arrive

Convert and size the images, measure against the budget, and report the real numbers rather than the
intended ones. Wire the audio player and the month-page slot. Build the `/audio/` landing page Apple
wants as the podcast's home. And record provenance for every file — generator and prompt, or licence
and source — in `assets/img/photos/CREDITS.md` before anything ships.

If the hero misses 120 KB and cannot be squeezed, I will say so and we cut it or drop the park-WiFi
claim. The claim does not quietly lose to a photograph.
