# Phase 2 — optional Google Drive saving

Implementation is in the active root `src/`, not the preserved nested legacy project.
Existing downloads and tools remain local. Save to Drive appears alongside each
processed PDF/image result. Guests can use it without a FileMate account.

## Configuration and release gates

1. Enable Google Drive API in Google Cloud project `lexical-helix-411406`.
2. Create a separate OAuth Web client for this feature, with exact JavaScript
   origins for localhost and the feature preview. Do not reuse or change the
   Supabase sign-in client. No redirect URI or client secret is used here.
3. Configure `VITE_GOOGLE_DRIVE_CLIENT_ID` with that public ID, restart Vite or
   rebuild the preview. Never put a Google client secret in a Vite variable.
4. Review the shared consent project's `drive.file` permission and Google consent
   requirements before changing public authorization. Do not activate billing.
5. Test real consent, identity, direct upload and browser CORS before release.
6. Obtain owner approval for the privacy/marketing wording below before public
   deployment. Do not merge this feature while existing blanket local-only claims
   remain unchanged.

The initial button loads Google's library; the next user click opens consent,
avoiding popups opened after asynchronous script loading. A final explicit Save
click uploads to the selected account displayed in the result area.

## Security and upload behavior

- Google Identity Services popup token model; only `drive.file`, with incremental
  grants disabled. Separate from Supabase identity authentication.
- Access token held only in module memory with expiry buffer; never database,
  localStorage, URL or logs. FileMate sign-out clears it. Refresh clears it.
- Disconnect clears this page's token; it does not revoke the entire shared Google
  project's permission grant. Users can revoke in Google Account settings.
- Direct browser-to-Google resumable upload, up to 50 MiB per result. No FileMate
  server upload, folder creation, public sharing or modification of unrelated files.
- Upload sends the result Blob, filename and validated MIME, not the original input.
- A generated Drive ID is retained in memory across retries, preventing duplicate
  creates after an ambiguous response. Conflict reconciles via `files.get`.
- Upload addresses are restricted to Google's HTTPS upload endpoint.
- Progress measures bytes sent; saved status requires a success response. Cancel
  may race completion, and the message explicitly explains that possibility.
- One upload at a time; no automatic background retries or uploads.

## Current limitations — not a completed production release

Completed configuration: Drive API enabled, separate FileMate Drive Web client
created, and only non-sensitive `drive.file` added to the consent configuration.
Origins: `http://localhost`, `http://localhost:5173`, and
`https://feat-phase-2-google-drive.filemate-52q.pages.dev`.
Existing Supabase OAuth client and production hosting were not changed. Billing
was not activated. The public client ID was appended to ignored local configuration
without replacing existing settings. Preview hosting still needs the public
`VITE_GOOGLE_DRIVE_CLIENT_ID` setting before a usable hosted Drive test.

The local real-PDF processing test displayed the new action and loaded GIS.
The in-app browser did not surface Google's popup; cancellation returned the UI
to its usable state. Real consent and uploads are therefore still unverified.

No authenticated real Drive upload has been verified yet. An unauthenticated
OPTIONS probe succeeded, but that does not verify browser-readable Location or
authenticated PUT behavior. Confirm those on localhost and preview before release.
Network retry starts a new resumable session with the same file ID; it does not
resume partial bytes. A refresh loses the token, Blob and retry identity. Browser
closure warns during pending work; closing the workspace cancels its upload.
Google consent popups have to be completed or closed by the user.
The implementation does not create a backend fallback if CORS fails.
No Drive importer, file sharing, inbox, text export or folder picker is included.

## Proposed owner-reviewed wording (not applied to live pages)

- Homepage/meta: “Process files locally. Optionally save processed files directly
  to your Google Drive after connecting your Google account.”
- Privacy: “Local tools process files in your browser. If you choose Save to
  Google Drive, FileMate requests permission to create and access files used with
  this app (drive.file), and sends your chosen processed output directly to Google.
  Access tokens remain in page memory. Files use your Google Drive storage and
  remain subject to Google's terms and privacy policy. FileMate does not make them
  public or store Drive tokens or file contents in its database. Disconnect clears
  the page connection; revoke access in your Google Account to remove the grant.”

## Validation commands (PowerShell)

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test
node --test tests/drive.test.mjs
node tests/auth/browser.cjs
node tests/auth/unconfigured.cjs
node tests/audit.cjs
```

Live checklist: popup cancellation/blocking; account choice; different Drive vs
FileMate identity; PDF/JPEG/PNG/WebP opens correctly; duplicate-name distinct files;
retry after lost response creates no duplicate ID; expired/revoked token; full
storage; offline; cancel; multiple outputs; refresh; mobile layout and unchanged
Download. Never describe mocked checks as successful real OAuth or uploads.

## Official references

- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/identity/oauth2/web/reference/js-reference
- https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/manage-uploads
- https://developers.google.com/workspace/drive/api/guides/create-file
- https://developers.google.com/workspace/drive/api/guides/limits

Google quotas changed in 2026. Inspect this project's actual quota page rather than
assuming historical requests-per-minute limits. Do not activate paid services or
promise unlimited/forever-free API usage. User Drive storage limits also apply.
