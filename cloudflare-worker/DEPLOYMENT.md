# HTMLHub350 Chat Proxy (Cloudflare Worker)

This folder contains the serverless backend that lets your static
GitHub Pages site talk to the OpenAI API without exposing your API key.

## What it does

- `POST /api/chat` — receives `{ messages: [...] }`, calls OpenAI, and
  returns `{ reply: "..." }`.

## Deploy it (Cloudflare Workers)

### 1. Install the CLI (one time)
```bash
npm install -g wrangler
```

### 2. Add your OpenAI API key as a secret
Inside this folder (`cloudflare-worker`):
```bash
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
```
It will prompt you to paste your key. It is stored encrypted by
Cloudflare and is never served to browsers.

### 3. Deploy
```bash
npx wrangler deploy
```

You'll get a URL like `https://htmlhub-chat.<your-name>.workers.dev`.

### 4. (Optional) Set the model
Defaults to `gpt-4o-mini`. To change it, set another secret:
```bash
npx wrangler secret put OPENAI_MODEL
```

## Wire it up in your site

Your worker URL is now the "chat API base". On each page that has the
chat widget, add this before the main script:

```html
<script>
    window.HTMLHUB_CHAT_URL = "https://htmlhub-chat.<your-name>.workers.dev";
</script>
```

See `chat-widget/README.md` for the full snippet.
