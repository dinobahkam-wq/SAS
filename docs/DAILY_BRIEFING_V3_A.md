# Daily Briefing V3-A — editorial visual upgrade

**Branch:** `feature/daily-briefing-v1`

## Implemented
- Illustrative photo blocks on three lead cards, with an explicit on-image disclosure that they are illustrative, not photographs of the described events.
- Photos in the details drawer for lead cards, with illustrative attribution notice.
- Horizontal animated developments strip, clickable to open existing detail drawer, pause button, hover/focus pause, reduced-motion setting.
- Compact accordion for the geographic ledger: clicking reveals an inline summary; an explicit button opens the complete detail drawer.
- Existing region/category/search filters remain operational.
- No changes to Supabase or `main`; fictional test cases remain explicitly labeled.

## Before public publishing
- Photos in this demo are remote third-party illustrative URLs. Review image licensing, correct attribution, provenance, and caching; replace with owned/licensed images or trusted Supabase Storage objects. Do **not** present illustrative images as evidence of actual events.
- Add actual optional image fields and rights/caption/source records in a separately reviewed DB migration after the editorial model is approved.
- Test `npm run lint`, screen reader / keyboard navigation, ticker continuity in RTL, image loading, mobile layout, and PDF print.
- Avoid heavy media loading on limited bandwidth: compress and lazy load nonlead media.
- Confirm motion defaults with end users. Continuous marquee needs accessible pause and reduced-motion support.

## Local preview
```powershell
cd D:\SAS-WEB
git pull --ff-only origin feature/daily-briefing-v1
npm run lint
npm run dev
```
Visit `http://127.0.0.1:3000/briefings/preview`.
