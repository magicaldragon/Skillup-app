// Service Worker for SkillUp Center
// Caches static assets and API responses for better performance

const _CACHE_NAME = 'skillup-v1.0.0';
const STATIC_CACHE = 'skillup-static-v1.0.0';
const API_CACHE = 'skillup-api-v1.0.0';

// Files to cache immediately
const STATIC_FILES = ['/', '/index.html', '/logo-skillup.png', '/vite.svg'];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip handling for unsupported schemes
  if (!url.protocol.startsWith('http')) {
    return; // Let the browser handle it naturally
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with caching
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
    }

    return response;
  } catch (_error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Network error - please check your connection',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle static requests with caching
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  // Skip caching for unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    console.log('Skipping cache for unsupported scheme:', url.protocol);
    return fetch(request);
  }
  
  const cache = await caches.open(STATIC_CACHE);

  // Check cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Try network
    const response = await fetch(request);

    // Cache successful responses (only for http/https)
    if (response.ok && url.protocol.startsWith('http')) {
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
    }

    return response;
  } catch (_error) {
    // Return offline page or error
    if (request.destination === 'document') {
      return cache.match('/index.html');
    }

    return new Response('Not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle background sync tasks
  console.log('Background sync triggered');
}
