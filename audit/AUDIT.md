# FileMate audit and repairs

## Source of truth and deployment

The repository root `index.html` loads `/src/main.jsx`; root `vite.config.js` uses Vite's current-directory root and default `dist` output. Root `src/Hero3D.jsx` is the advanced extruded document stack. `filemate-colors/src/Hero3D.jsx` is a separate older implementation (including an orb); the nested copy is preserved unchanged.

The live HTML references `index-DQKFFDZ_.js`, which loads `Hero3D-DAZKhEne.js`. The deployed hero contains PDF/DOCX but no JPG badge, matching the root implementation rather than the nested three-badge implementation. This supports using root `src/` as the active application. Cloudflare account settings cannot be read from this repository or public page: the saved build root has NOT been independently confirmed in the dashboard. Required settings: repository root `/` (leave Root directory empty), build `npm run build`, output `dist`. Do not select nested `filemate-colors`.

The supplied ZIP was inspected as an archive; changes are applied to the existing Git checkout, not blindly extracted over it.

## Confirmed causes and changes

- Hero: a `>=768` gate disabled mobile WebGL, reduced motion disabled the 3D entirely, and lazy loading rendered nothing. Removed those gates, retained the five-document geometry/lighting/strokes/sparkles/shadow, added the missing JPG badge, responsive scene fitting, mobile DPR/particle limits, a static reduced-motion pose, and matching document-stack loading/error/context-loss fallbacks. Offscreen animation pauses. Textures and geometries dispose on replacement/unmount.
- Themes: changing palettes/dark mode changed a React key, recreating the entire hero and canvas. Removed that key; update scene colors using a cleaned-up palette event subscription. Palette application is immediate. Deep Teal is now the default; valid saved colors remain authoritative. Invalid stored color values are ignored. Deep Teal surfaces/borders match the requested values.
- Palette: added ref-based outside pointer/focus dismissal, Escape, an accessible Close control, focus restoration on explicit dismissal, pressed preset state, mobile bounds, and scrollable height. Selecting colors keeps the panel open.
- Workspace: removed backdrop closing, added busy-close protection, discard confirmation for selected files/results/text, refresh protection, focus trapping/restoration, background inertness, scroll locking, mobile viewport sizing, and a synchronous running guard. Uploads/removal/options are locked while processing. Files can be removed individually. Result URLs revoke on change/close.
- Validation: shared extension/MIME checks, missing-MIME support, 50 MiB individual / 150 MiB batch / 30-file limits, empty/duplicate rejection, magic headers and image decoding, a 32-megapixel image limit, numeric/select validation, corrupted PDF errors, and bounded page-range expansion. Invalid drops produce visible errors; drops outside upload areas no longer navigate away from the app.
- Tools: split defaults to page 1 so one-page PDFs work; image exports verify the actual MIME to prevent mislabeled browser fallback files; canvases/bitmaps are released. Compression remains image compression. Clipboard failures are visible. Sentence counts include a final unpunctuated sentence; camel/snake/kebab conversion preserves Unicode letters.
- Layout: smaller minimum hero heading, bounded palette, mobile workspace scrolling, touch behavior and readable native select options.

No backend, file upload, authentication, fake sharing, globe, or future feature was introduced. Existing tools and the duplicate project remain intact.

## Verification and limits

Validation completed: clean `npm ci`, `npm run build`, JavaScript syntax checks, `git diff --check`, and **97 passing browser/tool checks** (see `test-results.json`). Generated PDFs were reopened with pdf-lib and page counts verified; all supported image formats decoded at expected dimensions. The suite exercised themes, canvas identity, downloads, busy-close and discard behavior, focus restoration, result URL revocation, portrait widths 320/375/390/430, landscape 844×390, tablet, desktop, reduced motion, and WebGL loss/unavailability. Production-only npm audit returned zero known advisories; the full audit findings below remain. Browser checks use desktop Chrome with software WebGL; they do not establish real iOS/Safari/Android GPU performance. Physical low-memory phones, native OS color-picker windows, assistive technology, and Cloudflare dashboard/deployment need manual checks. Bundle-size warnings remain for the lazy Three.js and main/PDF chunks.

`dependency-audit.json` records the registry audit: one moderate esbuild advisory and one high Vite advisory in development dependencies. A toolchain major-version upgrade is intentionally deferred from this application repair. Keep development servers bound to localhost and do not expose them publicly. Static production assets do not run the Vite development server; this is not a claim that all future dependency advisories are absent.

## Windows PowerShell: local test

```powershell
Set-Location 'C:\Users\Dell\Downloads\filemate-colors'
npm.cmd ci
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
```

Open the printed localhost URL. Stop the server with Ctrl+C before reinstalling dependencies (Windows locks esbuild.exe while Vite runs).

Optional repeatable browser/tool checks (Chrome installed):

```powershell
npm.cmd install --no-save --package-lock=false playwright@1.62.1
node tests/audit.cjs
```

The test starts and closes its own local server. If using a nonstandard Chrome path, set `$env:CHROME_PATH` to the chrome.exe path. It generates sample files locally in `audit/samples` and report/screenshots under `audit`.

## Windows PowerShell: GitHub / Cloudflare

Review the diff and push to a new branch:

```powershell
Set-Location 'C:\Users\Dell\Downloads\filemate-colors'
git diff --check
git switch -c fix/filemate-production-update
git add src/App.jsx src/Hero3D.jsx src/PalettePanel.jsx src/palette.js src/tools.js src/index.css tests/audit.cjs audit/AUDIT.md
# Include report/screenshots only if desired.
git commit -m "Fix FileMate mobile hero, themes, workspaces and file validation"
git push -u origin fix/filemate-production-update
```

Open a pull request to `main`, review the Cloudflare preview, then merge. In Cloudflare Pages verify Root directory empty (repository root), Build command `npm run build`, Build output directory `dist`, and production branch `main`. Git-integrated Pages deploys after the merge. No production deployment was performed during this audit.
