# SeaWorld San Diego height-checker correction — 26 September 2026

The live CoasterReady height checker counted every attraction with `heightIn: null` as rideable. At 40 inches it incorrectly included Manta, Journey to Atlantis, Arctic Rescue, and Tidal Twister. A missing figure now means **unverified**, with a separate count and neutral styling, across all operators. It does not imply a zero-inch minimum.

The following verified numerical minimums were added from the operator's current attraction pages:

| Attraction | Minimum | Official source |
| --- | ---: | --- |
| Manta | 48 in | https://seaworld.com/san-diego/rides/manta-roller-coaster/ |
| Journey to Atlantis | 42 in | https://seaworld.com/san-diego/rides/journey-to-atlantis/ |
| Arctic Rescue | 48 in | https://seaworld.com/san-diego/rides/arctic-rescue/ |

SeaWorld's accessibility guide also states that a Journey to Atlantis rider from 42 to under 48 inches needs a supervising companion: https://seaworld.com/san-diego/faq/ . Height alone does not override companion, restraint, health, or other rider rules. Tidal Twister's current status and minimum were not verified on an active operator ride page, so its data remains unverified here; it must not appear in the eligible list.

## Universal Orlando corrections

Universal's current [ride height page](https://www.universalorlando.com/web/en/us/plan-your-visit/hours-information/ride-height-requirements) and [rider guide](https://www.universalorlando.com/webdata/k2/en/us/files/Documents/universal-orlando-riders-guide.pdf) were checked on September 26, 2026. The source records and directly dependent guide/compare prose now use Fast & Furious – Supercharged **40 in**, Battle at the Ministry **40 in**, Flight of the Hippogriff (Orlando) **36 in**, and High in the Sky Seuss Trolley Train **36 in**. Fyre Drill has no published numerical minimum; children under 48 in require a supervising companion, and hand-held infants are not permitted. The Universal height guide now has 42 operating attractions with numerical minimums across four parks, matching its source data.

`heightIn: null` still mixes a verified absence of a numerical minimum with unverified rules. The checker treats both conservatively as “height unverified.” A future explicit `no-minimum` status should be added only with a current primary operator source and verification date, then surfaced separately from unknown in the checker.
