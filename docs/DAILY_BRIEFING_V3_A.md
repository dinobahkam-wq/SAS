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

## Editorial layout revision — no ticker (2026-10-13)
Following mobile review, the moving ticker and its configuration UI were removed from the preview. The page now emphasizes a single large illustrative-photo lead, a compact contextual briefing summary, and two subordinate photo stories, inspired by the editorial hierarchy seen on the BBC News homepage (not a reproduction). Accordion and detail drawer stay in place. Existing illustrative third-party image links remain preview-only; production licensing/provenance review is pending. Local TypeScript, mobile and image-loading checks remain required.
