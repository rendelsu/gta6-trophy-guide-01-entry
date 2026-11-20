# Vice Atlas — GTA VI Platinum Guide & Tracker

[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/rendelsu/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/rendelsu/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## What it does

- **Tracker for the full official list** — every trophy with its official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze), verified against Exophase and PSNProfiles.
- **Checklist that saves** — tick trophies off as you earn them; progress is kept in the browser (localStorage) and can be exported to a file and imported back.
- **Filters and search** — filter by grade or by kind (story, side missions, collectibles, activities, crime, money), search by name or mission, and flag missable trophies.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Platinum roadmap** — five stages in play order, from the story through strangers, collectibles and activities to the crime-and-money cleanup and 100% completion.
- **Cited guides** — every trophy has numbered steps, and every step names its source and the date that source was published. 228 cited steps across 9 dated sources; 226 steps are backed by two or more sources. Where a method is not yet confirmed in the game, the guide says so instead of guessing.
- **Evidence panel** — the "Bukti & Sumber" view totals the cited steps and lists each source with its publication date and how many steps it backs, so a reader can check any claim in one glance.

## How the roadmap was built

The roadmap and the missable flag come from the official descriptions, not from a playthrough: story trophies fall in chapter order, side strands sit in stage 2, and the counted grinds (stunts, shooting range, cards, WAiNK spots) sit in stages 3–4 so they can be chased in free roam after the story. Only one trophy is flagged possibly missable — Positive Mental Attitude (meditate at every spot) — because GTABase and EGamers.io both flag its Chapter 1 meditation spot as the one that may not come back; everything else is doable after the story ends.

## Run it

Serve `app/` with any static server and open `index.html`:

```sh
cd app && python3 -m http.server 8080
```

Then open http://localhost:8080. No build step, no network use: everything the app loads is a file under `app/`.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself
- `app/data/trophies.json` — the 55 trophies, their guides, steps and sources
- `screenshots/` — renders of the running app
- `main.ts` — hands the guide in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged

## License

MIT — see `LICENSE`.

---

Built for make.fun — [try make.fun yourself](https://make.fun/r/rkkz4bh8) (referral link).
