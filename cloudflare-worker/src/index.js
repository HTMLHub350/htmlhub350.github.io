/*
 * HTMLHub350 - Chat Proxy (Cloudflare Worker)
 * ===========================================
 *
 * This worker is a thin proxy between your GitHub Pages site and the
 * OpenAI API.  Your secret API key lives HERE (as a Worker secret),
 * never in your static site's JavaScript.
 *
 * Deployment: see DEPLOYMENT.md in this folder.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

const SYSTEM_PROMPT =
    "You are the friendly AI assistant for HTMLHub350, a beginner " +
    "programming hub built by a hobbyist developer. You answer questions " +
    "about programming: Python, JavaScript, HTML/CSS, and related topics. " +
    "Keep answers helpful, clear, and encouraging for a learner. Be concise.";

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin") || "*";

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: { ...CORS_HEADERS, "Access-Control-Allow-Origin": origin }
            });
        }

        const url = new URL(request.url);

        if (request.method === "POST" && url.pathname === "/api/chat") {
            return this.handleChat(request, env, origin);
        }

        // Serve the static site (public/ and public/chat-widget/).
        if (url.pathname === "/api/chat") {
            return new Response("Method not allowed", { status: 405 });
        }

        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response("Not found", { status: 404 });
    },

    /* ---------------------------------------------------------
     * POST /api/chat
     * --------------------------------------------------------- */
    async handleChat(request, env, origin) {
        let messages;

        try {
            const body = await request.json();
            messages = body.messages;
            if (!Array.isArray(messages) || messages.length === 0) {
                throw new Error("Invalid messages payload");
            }
        } catch (error) {
            return new Response(
                JSON.stringify({ error: "Invalid request body" }),
                {
                    status: 400,
                    headers: {
                        ...CORS_HEADERS,
                        "Access-Control-Allow-Origin": origin,
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (!env.OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "Server not configured (missing API key)" }),
                {
                    status: 500,
                    headers: {
                        ...CORS_HEADERS,
                        "Access-Control-Allow-Origin": origin,
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const openAIResponse = await fetch(OPENAI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + env.OPENAI_API_KEY
            },
            body: JSON.stringify({
                model: env.OPENAI_MODEL || "gpt-4o-mini",
                messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
                temperature: 0.7
            })
        });

        const data = await openAIResponse.json();

        if (!openAIResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: data.error?.message || "OpenAI request failed"
                }),
                {
                    status: openAIResponse.status,
                    headers: {
                        ...CORS_HEADERS,
                        "Access-Control-Allow-Origin": origin,
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const reply = data.choices?.[0]?.message?.content || "";

        return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                "Access-Control-Allow-Origin": origin,
                "Content-Type": "application/json"
            }
        });
    }
};
