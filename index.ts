function handlePreFlightRequest(): Response {
  return new Response("Preflight OK!", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}

async function handler(_req: Request): Promise<Response> {
  if (_req.method == "OPTIONS") {
    return handlePreFlightRequest();
  }

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  // Determine the user-provided word from the request URL or body.
  // Support patterns like: /similarity/<word> or /api/similarity/<word>
  // or query param ?word=...
  let userWord: string | null = null;
  try {
    const url = new URL(_req.url);
    const segments = url.pathname.split("/").filter(Boolean);

    // find if there's a segment after 'similarity'
    const simIndex = segments.findIndex((s) => s.toLowerCase() === "similarity");
    if (simIndex >= 0 && segments.length > simIndex + 1) {
      userWord = decodeURIComponent(segments[simIndex + 1]);
    }

    // fallback to query param
    if (!userWord) {
      const q = url.searchParams.get("word") || url.searchParams.get("w");
      if (q) userWord = q;
    }
  } catch (e) {
    // ignore URL parsing errors and try body below
  }

  // If not found in URL or query, try JSON body
  if (!userWord) {
    try {
      const body = await _req.json();
      if (body && typeof body === "object") {
        if (body.word1) userWord = String(body.word1);
        else if (body.word) userWord = String(body.word);
      }
    } catch (e) {
      // parsing body failed - will error out below
    }
  }

  if (!userWord) {
    return new Response(JSON.stringify({ error: "No word provided in URL, query or body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  const similarityRequestBody = JSON.stringify({
    word1: userWord,
    word2: "centrale",
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: headers,
    body: similarityRequestBody,
    redirect: "follow",
  };

  try {
    const response = await fetch("https://word2vec.nicolasfley.fr/similarity", requestOptions);

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      return new Response(`Error: ${response.statusText}`, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type",
        },
      });
    }

    const result = await response.json();

    console.log(result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(`Error: ${msg}`, { status: 500 });
  }
}

Deno.serve(handler);