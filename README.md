# FileMate
Run: `npm install && npm run dev`. Build: `npm run build`. Deploy: Cloudflare Pages or Vercel, output dir `dist`.
Deploy free: Cloudflare Pages or Vercel, connect the repo, build command `npm run build`, output dir `dist`. No env vars needed.
Add a tool: add an entry to `TOOLS` in `src/tools.js` (`accept`, `opts`, `run(files, opts, onProgress) -> [{name, blob}]`).
Colors: edit PRESETS in src/palette.js, or use the palette button in the navbar.
