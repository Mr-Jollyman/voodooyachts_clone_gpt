# Validation — 23 October 2026

- `npm ci --no-audit --no-fund --cache /tmp/voodoo-npm-cache`: passed; frozen lockfile installation reproduced successfully.
- `npm run build`: passed TypeScript and Vite production compilation. Vite reports an advisory for the main bundle size (about 216 KB gzipped); page content is currently bundled together. Range-map code is loaded separately. This is an optimization opportunity before production, not a build failure.
- `npm test`: 9 tests passed, 0 failed, 0 skipped. Representative navigation/layout checks ran at 390, 768 and 1440 pixels. The full crawl visited all 29 implemented pages and verified displayed local image decodes, internal route destinations and absence of raw shortcodes. Interaction tests covered the model-prefilled demo form and its required/email validation with no POST requests, gallery navigation and Escape, original range-map selection/zoom, XF60 layout variants, and local video playback with a reduced-motion poster fallback.
- A subsequent two-test enquiry/video smoke check ran after reinstalling dependencies from the lockfile.
- All 29 original public page URLs were accessible via TLS-verified HTTP requests. Selected source/prototype desktop and mobile views were visually inspected; this does not certify pixel-perfect matching across every page or physical device.
- Final visual checks confirmed repaired XF60 gallery images, working deck-layout artwork, DSF86 mobile hero/specifications and complete world-map geometry. Earlier corrupted backup artifacts were replaced rather than accepted on a file-format check alone.

No public deployment, real enquiry delivery, live SEO/indexing change, production WordPress execution or fresh-task snapshot restoration is claimed.
