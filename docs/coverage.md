# Coverage and handover

Prepared 23 October 2026 from the supplied 22 October WordPress export and full backup, with public live-site inspection. This is a client review prototype; it is not a production migration or a pixel-perfect certification.

## Implemented public routes

| Group | Coverage |
| --- | --- |
| Homepage | Original welcome film, Performance Redefined, speed/range film, Unlock The Oceans, scenic photography, brand statement, Superyacht Luxury, fleet specifications, Evolution of Voodoo, Love the Ocean, shared contact footer |
| Main navigation | Secret Of Speed, Unlock The Oceans, Welcome Aboard, Travel Stories, Our Story, Sustainability, Careers |
| Yacht pages | XF50, XF60, XF66, XF75, XF75-OB, XF80, XF85, DSF86, XF95, XF450 |
| Representative yachts | XF60 and DSF86 include their own hero, specification artwork and text, profile drawing, general arrangements, original galleries and model-prefilled demo enquiry; original Vimeo films have outbound links |
| Stories | Special Delivery, Tight Lines, Screaming Reels, Into the Mystic, Wrecks and Reefs, Rapid Passage, Déjà Vu, Mercury Whale Rescue, Island Paradise, Trans-Tasman Speed Record |
| Supporting | Exported Privacy Policy, original URL paths, homepage/Our Story/XF95 aliases, per-page browser title and description, noindex |

All 29 implemented source URLs responded successfully to read-only public HTTP inspection. Their results and heading comparisons are in `live-source-audit.json`. Source navigation was confirmed from the live homepage. XF75-OB is retained at its exported route and in relevant exported comparisons, but is not added to the live site's nine-model primary dropdown.

## Fidelity and source reconciliation

The original navy, deep teal and cyan palette, Open Sans typography, white logos, slanted split panels, photography, main section order and fullscreen navigation pattern are retained. Layouts are rebuilt with responsive CSS, rather than executing Divi or WordPress. Desktop/mobile source variants are consolidated to avoid duplicated visible copy.

The ZIP's container CRCs passed, but many internal images and two videos were truncated or visually damaged. Source images were reconciled against public originals at the same URLs, then converted to responsive WebP variants. Films were recovered from their original public URLs and compressed to 1280px-wide H.264 with their real source detail; they are not represented as original-resolution masters. Motion respects the reduced-motion preference and has play/pause controls. Below-fold films begin when visible.

**One unavailable asset:** `wp-content/gallery/trans-tasman-speed-record/ALR05462-Enhanced-NR.jpg`. It is omitted from that gallery; no stock image is substituted. Other source Voodoo photographs remain available in the story. Full missing-URL details are in `import-report.json`.

**Material content differences:** Some exported model comparison strips include XF75-OB and XF85 where the live versions now feature XF80 and XF450. The exported page copy remains the primary source; these comparison strips have not been silently replaced with different live-page copy. Source range figures also vary by page/configuration (for example XF60's slow-speed range in comparisons). They are reproduced as supplied and need owner confirmation before publication. Many heading-audit differences are punctuation (hyphen versus en dash), heading levels or formatting, rather than different copy.

**Partial fidelity:** Gallery navigation uses a responsive thumbnail grid and keyboard-accessible lightbox instead of the commercial NextGEN filmstrip. Deck-layout controls are implemented in React. The original range map's 16 ports and short/long range outlines were recovered as data; its world geometry was reconstructed from the original static SVG hierarchy, with rebuilt accessible selection/zoom controls. The map is indicative and is not a navigation tool. Original Lottie/Divi animation timing is not reproduced. Instagram feeds and production analytics are omitted. Vimeo links are preserved; embedded external playback is not validated. Legacy Landing, Holding Page, Range Map Testing and original alternate homepage content are excluded from main coverage; they are not current navigation destinations.

Live browser comparison used TLS-verified HTTP interception to render the public source because Chromium did not trust the environment's intercepting certificate. TLS verification was retained in curl. The source film was blocked during source screenshots; source video motion was not visually compared frame by frame. The prototype's local films were checked separately. Source captures and development screenshots remain outside Git under `/workspace/site-source/screenshots`.

## Checks and production work

The automated suite checks representative pages and menus at 390, 768 and 1440px; every implemented page route, displayed image decode and internal link target; demo enquiry validation and absence of POST requests; gallery navigation; layout variants; reduced-motion film fallback; and range-map port selection/zoom. TypeScript and the Vite production build are also required. See the current test output for the latest result.

Before production: resolve the noted content/specification differences with the owner, obtain the missing original photo, complete final visual approval on real devices, confirm media rights and contact details, replace the demo form only with an explicitly authorized real service, review privacy/legal copy, and configure hosting route fallbacks, redirects, crawl/indexing policy and production metadata. No live website, hosting, domain, email or DNS changes have been made.
