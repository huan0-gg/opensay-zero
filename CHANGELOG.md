# Changelog

All notable changes to OpenSay Zero are recorded here. This project follows
[Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-10-20

First public delivery of the zero-beginner edition.

### Product

- 4-week, 20-session path across 5 scenes: coffee shop, introductions,
  supermarket, directions, restaurant.
- 4 “must-say” + 8 “understand” chunks per scene, enforced by content
  validation.
- Authored dialogue state machine: NPC variants, intent matching, required
  nodes, off-topic redirect, sensitive-topic refusal, 3-second hints,
  12-minute cap.
- Three-day loop with a D3 variation: the coffee price changes so a
  memorised line cannot carry the learner.
- Review scheduler (1/3/7/15/30 days) with support after repeated failure;
  due chunks are reviewed before the scene.
- Recap with at most 3 corrections (“你说的 / 更自然 / 为什么”), the sentences
  actually produced, a real-world mission, and tomorrow’s preview.
- Progress: streak, weekly independent turns, 能说清单, scene badges.
  No scores, rankings, or red crosses.
- Local-only storage (localStorage + IndexedDB), JSON export/import,
  recording cleanup, and a 30-day retention window.
- Browser speech with a complete text/choice fallback when ASR or the
  microphone is unavailable.

### Review fixes

- D3/variation/final sessions swap the coffee price; the home promise now
  matches the dialogue.
- Review is global over due chunks and matches the home due count.
- “Today done” only counts the scheduled session; extra practice no longer
  hides the main task.
- Terminal state at 20 sessions; no phantom “session 21”.
- Dialogue progress is protected from TTS races; TTS has an 8-second
  timeout; the hint timer cannot hang.
- Recap corrections deduplicate by suggested sentence, so three distinct
  corrections can appear.
- Hinted or read-along turns no longer count as “said it” or enter the
  review queue.
- Corrupt local progress shows a recovery notice instead of resetting
  silently.
- Playback recording stops and releases the microphone when leaving the
  chunk page; object URLs are revoked.
- A scheduled session can advance the plan only once per day, and only
  with at least one independent turn.
- Contrast raised above 4.5:1 across secondary text, accent buttons,
  pills, and the sage banner.
- Added 404 handling, `aria-modal` + Escape for the repair sheet, and a
  clearer microphone label.

### Verification

- `tsc --noEmit`: pass.
- Vitest: 14 files, 58 tests, pass.
- Playwright (Microsoft Edge): 6 tests, pass.
- `vite build`: pass.

### Known limits

- D1/D2/D3 share one node graph; only D3 changes the price.
- “Understand” chunks are listen-and-read, without a listen-and-choose task.
- No best-recording replay in the recap and no baseline recording in the
  assessment.
- No schema migration yet; corrupt data falls back with a notice.
- No standalone 8-week report page.
