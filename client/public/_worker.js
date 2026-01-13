// Cloudflare Pages Worker to handle SPA routing
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Don't handle API requests or static files
  if (url.pathname.startsWith('/api') || 
      url.pathname.includes('.') || 
      url.pathname.startsWith('/assets')) {
    return context.next();
  }
  
  // For all other routes, serve index.html
  const response = await context.env.ASSETS.fetch(new URL('/index.html', url.origin));
  return response;
}
