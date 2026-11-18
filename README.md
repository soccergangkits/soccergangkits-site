# SoccerGang Kits site — with cartoon preview

This folder is the next version of soccergangkits.com. It is the same landing
page and native order form, plus a "See my cartoon preview" button under the
photo upload.

## How it works

- The customer fills in player name, number, team colors and shirt color,
  uploads a photo, and taps the preview button.
- The page shrinks the photo in the browser, then sends it to a Netlify
  Function. The OpenAI key never goes in the page — the key lives only as
  an environment variable in Netlify.
- The function calls OpenAI (gpt-image-1.5) with the same prompt used for
  the Vini / Garcia tests: Tallon style, last name in capitals, number and
  team colors from the order, brush strokes in team colors only.
- A cartoon takes about 30 seconds, longer than a normal function's 10
  second limit, so it runs as a background function and the page checks
  for the result every 5 seconds until it appears.
- The preview is labelled "Preview only". The order itself still goes
  through the Netlify Form exactly as before, and the final design is
  still sent for approval before printing.

## Files

- `index.html` — the landing page + order form + preview button.
- `netlify/functions/generate-cartoon-background.mjs` — background
  function that calls OpenAI and stores the result.
- `netlify/functions/get-preview.mjs` — serves the stored preview back
  to the browser while it polls.
- `netlify.toml` — tells Netlify where the functions live.
- `package.json` — lists `@netlify/blobs`, used to store previews.

## Deploy (read this — drag-and-drop alone will not work)

This version needs Netlify to install `@netlify/blobs`, which a plain
drag-and-drop deploy does not do. Use one of these two ways:

1. Git (recommended): put this folder in a GitHub repo, then in Netlify
   go to Site settings > Build & deploy > Link repository, and link it.
   Netlify installs the dependency and deploys automatically.
2. Netlify CLI: install it once with `npm install -g netlify-cli`, then
   from this folder run `netlify link` and `netlify deploy --prod --dir .`

## Before the first preview works

1. In Netlify, go to Site settings > Environment variables.
2. Add a variable named `OPENAI_API_KEY` with the OpenAI secret key
   (the same `sk-...` key already connected to Muse). Never put the key
   in any file in this folder.
3. Deploy, then test on the live site: fill in name, number, team colors
   and shirt color, upload a photo, tap the preview button, wait about
   30 seconds.

## Costs and limits

- Each preview is one OpenAI image call, a few cents, charged to the
  OpenAI account.
- Previews come back at 1024x1536 on a white background. Upscaling and
  background removal for print are still done separately.
- If the preview fails, the button says so and the customer can still
  send the order — the cartoon is then made manually.
