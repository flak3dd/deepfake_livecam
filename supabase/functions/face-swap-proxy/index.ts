import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const BACKEND_URL = Deno.env.get("FACE_PROCESSING_BACKEND_URL") || "http://localhost:8000";

    const url = new URL(req.url);
    const path = url.pathname.replace("/face-swap-proxy", "");

    const targetUrl = `${BACKEND_URL}${path}${url.search}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith("host")) {
        headers.set(key, value);
      }
    });

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : null,
    });

    const responseHeaders = new Headers(corsHeaders);
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith("access-control")) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Proxy error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to connect to face processing backend",
        message: error.message,
        hint: "Make sure the Python backend is running and accessible"
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
