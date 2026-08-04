# ElevenLabs — verbatim inputs

Two separate jobs. The audio half is ElevenLabs' core product and the instructions below are exact.
The image half I am less sure about — see the note — so those prompts are written to be portable and
will work in Midjourney, Firefly, Flux or anything else if the ElevenLabs image tool is not what you
remember it being.

---

## Part 1 — Audio: the twelve monthly briefs

### The scripts already exist

```bash
node scripts/audio-script.mjs disney --pron
```

Writes to `build/audio-scripts/disney/`:

```
01-january.txt … 12-december.txt      478–557 words each, ~3 minutes
pronunciation.txt                     the words every engine gets wrong
```

**Do not hand-edit these files.** Every sentence is derived from a field in
`data/disney/seasonal/months/NN.json`, which is validated, fact-checked and freshness-stamped. Editing
the text directly creates an unverified claim that no gate covers — which is the one thing this site
is built not to do. If a script says something wrong, the month data is wrong: fix that and
regenerate. CI now fails if the committed scripts and the data disagree.

Paste each `.txt` straight into ElevenLabs. They are already speech-shaped: degrees spelled out,
grades expanded ("C plus" not "C+"), em dashes resolved, markdown stripped.

### Voice selection

The site is dry, specific, and willing to say a month is a poor choice. A bright travel-vlogger read
would undercut every honest thing the copy does. What you want sounds like a broadsheet travel
correspondent or a well-made documentary voiceover: measured, warm at the edges, unhurried, credible
reading a number.

Audition against this line, which is the hardest one in the set — it has to land as candour rather
than as a complaint:

> Who it does not. Anyone hoping to find a quiet week.

If the voice makes that sound cheerful, it is the wrong voice.

Prefer a mid-range voice over a very deep one; deep voices lose intelligibility through a car speaker
at motorway noise, which is one of the two places this will actually be heard.

### Settings

Model: **Eleven Multilingual v2** for quality, or **Turbo v2.5** if you are generating all twelve
repeatedly and want it cheaper. Regenerate on v2 for anything you publish.

| Setting | Value | Why |
| --- | --- | --- |
| Stability | **50–55** | Low stability wanders in tone across a three-minute read and these have to sound like one continuous brief. Too high and every sentence lands identically flat. |
| Similarity | **75** | High enough to hold character across twelve separate files, which need to sound like the same presenter. |
| Style exaggeration | **0–15** | Near zero. Style is what turns a measured read into a performance, and a performance is what makes the honesty sound like a sales pitch. |
| Speaker boost | **On** | |
| Speed | **1.0** | Do not speed up to hit a runtime. These are already three minutes. |

### Pronunciation dictionary

Load `pronunciation.txt` before generating anything. Every entry is a word that appears in park
content and comes out wrong by default:

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

`EPCOT` is the one that matters most — it appears constantly and engines spell it out as five
letters, which sounds instantly wrong to anyone who has been.

### Output

MP3, 128 kbps mono. Stereo buys nothing for a single speaking voice and doubles the file. At three
minutes that is roughly 2.8 MB per month, 34 MB for the set.

**These must not go in the repository.** `.git` is already 46 MB, and the tools claim to work on park
WiFi — audio in the service worker precache would make that claim false. Host on R2 or similar and
reference by URL. I will wire up the player and the slot when the files exist, same pattern as the
photos: declared in data, verified to exist, absent rather than broken.

---

## Part 2 — Images

### The note first

I am not confident ElevenLabs ships a first-party image generator — that may have arrived after my
training cutoff, or it may be a different product you are thinking of. Rather than guess, these
prompts are written to work anywhere. If ElevenLabs does have one, paste them as-is. If not,
**Adobe Firefly is the one I would pick for this site specifically**, because it is trained on
licensed content and Adobe indemnifies commercial use — and given how much of this brief is about
intellectual property, that indemnification is a real asset rather than a footnote. Midjourney gives
the better cinematic result if you are confident handling the IP question yourself.

### Hard rules — apply to every image, no exceptions

Two failure modes are near-certain rather than theoretical, and both need active checking:

**The three-circle silhouette.** Ask any model for theme-park food and it will produce a
Mickey-shaped pretzel, ice cream bar or balloon. Check every food, balloon and topiary image for
three-circle arrangements and regenerate if one appears.

**The castle.** "Pink castle lit at night" is a literal description of a specific, aggressively
protected building. The castle prompt below specifies a deliberately different architecture; if the
output still resembles the real one, regenerate rather than ship it.

Also never: Disney or Universal characters, logos, wordmarks, ride vehicles, monorails, costumed
characters, cast-member uniform or name-tag design; Harry Potter, Star Wars, Marvel or Nintendo
anything; recognisable real people or celebrity likenesses. Park staff wear plain unbranded uniforms
in solid colours.

### House style — append to every prompt

```
Shot on a full-frame camera, 35mm prime, wide aperture, natural light. Rich but believable colour,
deep shadows that retain detail, slight film grain. Warm highlights, cool shadows. Editorial
documentary photography — a magazine photo essay, not stock and not a brochure. No text, no logos,
no watermarks, no readable signage. Photorealistic. 16:9.
```

### 1 — HERO (do this one first; everything else can wait)

```
Enormous golden and magenta firework bursts filling a deep indigo night sky, seen above the
silhouetted rooflines of a generic fairground — a Ferris wheel, striped canvas awnings, strings of
warm bulbs. Photographed from within a crowd, so anonymous backlit heads and shoulders form the
lower foreground in near-silhouette. The fireworks occupy the upper right third. The lower third is
deep blue and near-black with no bright detail. No castle in frame. No identifiable faces. No
three-circle shapes anywhere.
```

The dark lower third is not aesthetic — the headline sits there and needs the contrast.

### 2 — THE CASTLE

```
A fantasy castle at blue hour, lit from below in warm rose and amber against a deep teal sky.
Architecture: a Moorish-Gothic hybrid — horseshoe arches, a single dominant square keep placed
off-centre rather than a central spire, exactly two slim flanking towers topped with copper onion
domes, and a wide arcaded terrace at the base. Deliberately asymmetric. No cluster of blue conical
fairytale spires. Low three-quarter angle across still water with a reflection. Painterly and
stylised rather than documentary — an illustration of an idea, not a photograph of a place.
```

### 3 — THE DROP

```
A packed roller-coaster train cresting a drop, shot from the front, every rider's arms up, faces
caught mid-scream and mid-laugh. Bright overcast daylight, background motion-blurred, the train
sharp. Genuine unposed delight — open mouths, closed eyes, hair flying. Mixed ages and ethnicities.
Plain clothing, no branded merchandise, no character ears of any kind.
```

### 4 — THE CAROUSEL

```
Interior of a traditional carousel at night, long exposure so the lights streak into ribbons of gold
while one painted horse and the small child riding it stay sharp. Warm bulbs, mirrored panels,
ornate gilt. Wonder rather than excitement. Camera at child height.
```

### 5 — THE WELCOME

```
A smiling attendant in a plain solid-colour uniform — no logo, no name tag, no character costuming —
leaning slightly forward to give directions to a family, one arm extended pointing off-frame. Warm
late-afternoon light, shallow depth of field. The interaction is the subject. Genuine warmth, not a
customer-service smile.
```

### 6 — FAIR FOOD

```
Overhead flat-lay on weathered wood: a fresh-cut churro dusted in cinnamon sugar, a paper tray of
loaded fries, a tall swirl of soft-serve in a waffle cone, a turkey leg, a paper cup of lemonade
beaded with condensation. Hard directional afternoon light, strong shadows. Nothing shaped like
three circles. No branded packaging, no readable text on any wrapper.
```

### 7 — WAITING

```
A long switchback queue line seen from above at golden hour, low sun raking across it, people in
small clusters talking and laughing. Honest rather than flattering. Long shadows, dust in the air.
```

### 8 — THE SPLASH

```
A log flume boat hitting the bottom of its drop, an enormous wall of white water frozen mid-air, the
riders soaked and delighted behind it. High shutter speed, backlit so the spray glows.
```

### 9 — THE STALL

```
A food stall at night, warm bulbs strung above the counter, steam rising, a vendor mid-motion
handing something across. Everything else falls to darkness. Saturated warm pools of light, bokeh
from string lights behind.
```

### 10 — THE END OF THE DAY

```
A parent carrying a sleeping child on their shoulder, walking away from camera down a lamplit path,
both in silhouette against the warm blur of a fairground behind. Tender, unposed, slightly
melancholy.
```

The emotional counterweight to the fireworks. If only two images ever get made, make this one and
the hero.

### Delivery

Name and size them like this, into `assets/img/photos/`:

```
hero-fireworks-640.avif   hero-fireworks-1280.avif   hero-fireworks-1920.avif
hero-fireworks-640.webp   hero-fireworks-1280.webp   hero-fireworks-1920.webp
hero-fireworks-640.jpg    hero-fireworks-1280.jpg    hero-fireworks-1920.jpg
```

Or just send me the full-resolution originals and I will do the conversion and the sizing — that is
mechanical and I would rather measure the result than trust it. **120 KB ceiling on the 1920 AVIF.**
The home page claims the tools work on park WiFi, and that claim does not lose to a nicer photograph.

The hero slot is already live in both operators' `site.json`. The moment the files land, the hero
switches from its gradient to photographic on its own.

---

## What I still owe you

- The audio player component and the month-page slot, once files exist to point at.
- A podcast RSS feed, if you want the briefs discoverable outside the site — that is the part with
  genuine traffic upside, since nobody else in this space publishes a dated, sourced monthly brief.
- Provenance recorded in `assets/img/photos/CREDITS.md` before anything ships: generator and prompt,
  or licence and source, per file.
