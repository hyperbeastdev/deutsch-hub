const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = `https://api.groq.com${url.pathname}${url.search}`;

    try {
      const groqRequest = new Request(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GROQ_API_KEY}`
        },
        body: await request.text()
      });

      const response = await fetch(groqRequest);
      
      const newResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        newResponse.headers.set(key, value);
      }

      return newResponse;

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
      });
    }
  },
};
