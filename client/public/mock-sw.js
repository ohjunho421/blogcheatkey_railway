self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/api/auth/user') {
    event.respondWith(new Response(JSON.stringify({
      id: 1,
      email: 'demo@blogcheatkey.dev',
      name: '데모사용자',
      subscriptionTier: 'free',
      freeGenerationCount: 1,
      canGenerateContent: true,
      canGenerateImages: false,
      canUseChatbot: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
});
