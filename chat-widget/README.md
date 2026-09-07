# HTMLHub350 Chat Widget

A floating chat button + panel that connects to your Cloudflare Worker
(which proxies to OpenAI). Works on any browser, no build-step needed.

## Add to a page

Paste this just before `</body>` on each page where you want the chat.
`chat.css` and `chat.js` live in this folder — keep them in your GitHub
repo next to your pages so GitHub Pages serves them.

```html
<!-- chat widget styles -->
<link rel="stylesheet" href="chat-widget/chat.css" />

<!-- chat configuration (replace with your worker URL) -->
<script>
    window.HTMLHUB_CHAT_URL = "https://htmlhub-chat.YOURNAME.workers.dev";
</script>

<!-- chat widget -->
<script src="chat-widget/chat.js"></script>
```

## How it works

1. User opens the chat and sends a message.
2. `chat.js` does `POST <worker>/api/chat` with `{ messages: [...] }`.
3. The Worker adds your secret OpenAI key, calls the OpenAI API, and
   returns `{ reply: "..." }`.

Your OpenAI key never leaves the Worker, so it stays secret.