# Voodoo Yachts — client review prototype

A runnable React + TypeScript recreation built from the supplied WordPress XML, database gallery records, original theme styling and media backup. Public live assets were used to repair damaged backup images. No WordPress runtime, database, credentials or backend is required.

## Run

Use Node.js 24 (validated with 24.19.0) and npm 11.

```sh
npm ci
npm run dev -- --port 5173
```

The development server listens on port 5173. For a static production build:

```sh
npm run build
npm run preview -- --port 4173
```

Deploy `dist/` with an SPA fallback to `index.html` for the preserved page paths. A Netlify-compatible `_redirects` file is included. This is a **noindex review prototype**, not a production deployment.

## Validation

```sh
npm test
```

Browser tests use `/usr/bin/chromium` in this cloud environment. On another machine, adjust `playwright.config.ts` to your Chromium installation or install Playwright's browser and remove the `executablePath` override. Tests cover 390px, 768px and 1440px layouts, the main menu, all public page routes and local image decoding, deck layout variants, video fallback, the demo enquiry journey, galleries and range selection.

## Content and components

- `src/data/site.json`: public page records, original URL paths, editable content blocks, asset dimensions and responsive variants. A new page is a data record; the shared renderer handles its section, row, text, image, specification, layout and gallery blocks without copying React layouts.
- `src/main.tsx`: shared page renderer, original fullscreen-menu pattern, image/layout viewers, films and enquiry form.
- `src/RangeMap.tsx`: accessible port selection using the original theme's recovered port coordinates and range outlines.
- `public/assets/`: selected public images converted to WebP variants, locally served fonts via npm, three compressed original site films, posters and recovered static range-map SVG.
- `docs/asset-manifest.json`: original URLs mapped to local media.
- `docs/coverage.md`: page coverage and fidelity limits.
- `docs/url-inventory.csv`: old-to-prototype URL mapping.
- `docs/live-source-audit.json`: public HTTP and heading comparison against all 29 source URLs.

Content is rendered from declarative data. Arbitrary Divi code modules, PHP, analytics, Instagram feeds, production form handlers and WordPress plugins are not executed. The local form validates name, email and message, carries the yacht model into the enquiry and confirms a **demo capture only**. It makes no submission request and does not store the enquiry.

## Optional source re-import

The project already includes the generated public content and optimized assets. The large original ZIP, XML, SQL and source cache remain outside Git in `/workspace/site-source`; they are unnecessary for normal development and deployment.

For a future content refresh, `scripts/import_wordpress.py /workspace/site-source` requires Python and Pillow. It reads only public XML records and the database's NextGEN gallery tables. Review its import report before accepting content changes. `scripts/recover_media.py` fetches public originals over TLS; `scripts/prepare_videos.py` requires ffmpeg and ffprobe. Source-inspection scripts are developer helpers, not runtime dependencies. Do not copy raw database or WordPress configuration files into the project.

See [the handover](docs/coverage.md) before treating this as a complete production migration.
