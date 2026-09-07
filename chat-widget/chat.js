/*
 * HTMLHub350 - Chat Widget
 * ========================
 *
 * A floating chat button + panel that talks to the Cloudflare Worker.
 *
 * It posts to window.HTMLHUB_CHAT_URL/api/chat when that URL is set
 * (e.g. when hosted on GitHub Pages), otherwise to the same-origin
 * /api/chat (e.g. when hosted directly by the Worker).
 */

(function () {
    const API_BASE =
        (window.HTMLHUB_CHAT_URL || "").replace(/\/$/, "");

    const API_ENDPOINT = API_BASE
        ? API_BASE + "/api/chat"
        : "/api/chat";

    /* -------------------------------------------------
     * Open / close state
     * ------------------------------------------------- */
    let open = false;

    /* -------------------------------------------------
     * Build the DOM
     * ------------------------------------------------- */
    const root = document.createElement("div");
    root.id = "htmlhub-chat-root";
    root.innerHTML =
        '<button id="htmlhub-chat-fab" aria-label="Open chat" title="Chat with HTMLHub AI">' +
        "    <svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"none\" " +
        "         stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\">" +
        "        <path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>" +
        "    </svg>" +
        "</button>" +
        '<div id="htmlhub-chat-panel" hidden>' +
        '    <div id="htmlhub-chat-header">' +
        "        <span>HTMLHub AI Assistant</span>" +
        '        <button id="htmlhub-chat-close" aria-label="Close chat">&times;</button>' +
        "    </div>" +
        '    <div id="htmlhub-chat-messages"></div>' +
        '    <form id="htmlhub-chat-form">' +
        '        <input id="htmlhub-chat-input" type="text" autocomplete="off" ' +
        '               placeholder="Ask me about programming...">' +
        '        <button id="htmlhub-chat-send" type="submit">Send</button>' +
        "    </form>" +
        "</div>";

    document.body.appendChild(root);

    const fab = root.querySelector("#htmlhub-chat-fab");
    const panel = root.querySelector("#htmlhub-chat-panel");
    const closeBtn = root.querySelector("#htmlhub-chat-close");
    const messages = root.querySelector("#htmlhub-chat-messages");
    const form = root.querySelector("#htmlhub-chat-form");
    const input = root.querySelector("#htmlhub-chat-input");
    const sendBtn = root.querySelector("#htmlhub-chat-send");

    const conversation = [];

    /* -------------------------------------------------
     * Helpers
     * ------------------------------------------------- */
    function addMessage(text, type) {
        const el = document.createElement("div");
        el.className =
            "htmlhub-chat-msg " +
            (type === "user" ? "htmlhub-chat-user" : "htmlhub-chat-bot");
        el.textContent = text;
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
        return el;
    }

    /* -------------------------------------------------
     * Toggle
     * ------------------------------------------------- */
    function openPanel() {
        open = true;
        panel.hidden = false;
        input.focus();
        if (messages.children.length === 0) {
            addMessage(
                "Hi! I'm the HTMLHub AI assistant. Ask me anything about " +
                    "Python, JavaScript, HTML/CSS, or programming in general.",
                "bot"
            );
        }
    }

    function closePanel() {
        open = false;
        panel.hidden = true;
    }

    fab.addEventListener("click", function () {
        if (open) {
            closePanel();
        } else {
            openPanel();
        }
    });

    closeBtn.addEventListener("click", closePanel);

    /* -------------------------------------------------
     * Send a message
     * ------------------------------------------------- */
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) {
            return;
        }

        input.value = "";
        addMessage(text, "user");
        conversation.push({ role: "user", content: text });

        sendBtn.disabled = true;
        sendBtn.textContent = "...";

        const thinking = addMessage("Thinking...", "bot");

        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: conversation })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || ("HTTP " + response.status));
            }

            const reply = data.reply || "Sorry, I couldn't generate a response.";
            thinking.textContent = reply;
            conversation.push({ role: "assistant", content: reply });
        } catch (error) {
            console.error(error);
            thinking.textContent =
                "Sorry, something went wrong. Please try again.";
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = "Send";
            input.focus();
        }
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        sendMessage();
    });
})();
