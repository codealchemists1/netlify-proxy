import { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  // 1. Define your Worker URL here
  const workerBase = "https://mute-rice-e80a.eddanielbrewer.workers.dev";
  
  const url = new URL(request.url);
  const target = workerBase + url.pathname + url.search;

  // 2. Build clean headers for the upstream request (Stops Cloudflare from gzipping)
  const proxyHeaders = new Headers();
  proxyHeaders.set("User-Agent", request.headers.get("user-agent") || "Mozilla/5.0");
  proxyHeaders.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
  
  const cookie = request.headers.get("cookie");
  if (cookie) proxyHeaders.set("cookie", cookie);

  const cfIp = request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for");
  if (cfIp) proxyHeaders.set("x-forwarded-for", cfIp);

  // 3. Fetch from Worker
  const upstream = await fetch(target, {
    method: request.method,
    headers: proxyHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual", // Handle redirects manually
  });

  // 4. Build clean headers for the browser
  const headers = new Headers(upstream.headers);
  
  // Remove Cloudflare traces
  headers.delete("cf-ray");
  headers.delete("cf-cache-status");
  headers.delete("server");
  
  // Remove compression headers to prevent blank pages
  headers.delete("content-encoding");
  headers.delete("content-length");
  
  // Set Netlify headers
  headers.set("server", "Netlify");
  headers.set("x-frame-options", "SAMEORIGIN");

  // 5. Return the response
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};

export const config = { path: "/*" };
