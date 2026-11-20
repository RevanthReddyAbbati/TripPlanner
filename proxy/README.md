# Itinera AI proxy

GitHub Pages only serves static files, so it can't keep a secret. This Cloudflare Worker holds the Gemini API key on the server and forwards the app's requests to Gemini, so visitors to the public site get AI features without your key ever reaching their browser.

Cloudflare Workers' free plan is enough for personal and small-group use.

## Deploy

1. Get a Gemini API key at https://aistudio.google.com/apikey.
2. In `proxy/wrangler.toml`, set `ALLOWED_ORIGINS` to your site's origin (for example `https://your-name.github.io`; scheme and host only, no path). Optionally adjust `ALLOWED_MODELS`.
3. From the `proxy` folder:

   ```bash
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler deploy
   ```

   Wrangler prints the worker URL, for example `https://itinera-ai.your-name.workers.dev`.
4. Point the app at it, either:
   - **For everyone:** add a repository variable `VITE_AI_PROXY_URL` with the worker URL (GitHub → Settings → Secrets and variables → Actions → Variables). The deploy workflow bakes it into the build, and AI is on by default for every visitor.
   - **Just for you:** in the app, open Settings → AI assistant → Proxy server and paste the URL.

## Protect your quota

- Only origins in `ALLOWED_ORIGINS` are accepted. Browsers enforce this, but scripts can fake an Origin header, so also:
- Add a **rate limiting rule** for the worker route in the Cloudflare dashboard (for example 30 requests per minute per IP).
- Set a **budget alert** or spending cap for the key in Google Cloud.
- Keep `ALLOWED_MODELS` to cheaper models if the site is public.
