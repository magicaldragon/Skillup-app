// Service Worker for SkillUp Center - Optimized for instant loading
// Implements aggressive caching strategy for maximum performance

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `skillup-static-${CACHE_VERSION}`;
const API_CACHE = `skillup-api-${CACHE_VERSION}`;
const RUNTIME_CACHE = `skillup-runtime-${CACHE_VERSION}`;

// Critical files to cache immediately for instant loading
const CRITICAL_FILES = [
  '/',
  '/index.html',
  '/vite.svg',
  '/logo-skillup.png',
];

// Assets to cache for offline functionality
const CACHE_PATTERNS = {
  // Static assets
  static: /\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|eot)$/,
  // API endpoints that can be cached
  api: /\/api\/(auth\/profile|users|classes|assignments)$/,
  // Images and media
  images: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
};

// Cache duration settings (in milliseconds)
const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000, // 5 minutes
  runtime: 24 * 60 * 60 * 1000, // 24 hours
};

// Install event - aggressively cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with aggressive caching...');
  event.waitUntil(
    Promise.all([
      // Cache critical files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching critical files for instant loading');
        return cache.addAll(CRITICAL_FILES);
      }),
      // Pre-cache runtime cache
      caches.open(RUNTIME_CACHE),
      caches.open(API_CACHE),
    ]).then(() => {
      console.log('All caches initialized');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating with cache cleanup...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            const currentCaches = [STATIC_CACHE, API_CACHE, RUNTIME_CACHE];
            if (!currentCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim(),
    ])
  );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different request types with optimized strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (CACHE_PATTERNS.static.test(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (request.method === 'GET') {
    event.respondWith(handleGeneralRequest(request));
  }
});

// Enhanced API request handling with intelligent caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);

  // For GET requests, try cache first for faster response
  if (request.method === 'GET' && CACHE_PATTERNS.api.test(url.pathname)) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
      const isExpired = Date.now() - cacheDate.getTime() > CACHE_DURATION.api;
      
      if (!isExpired) {
        console.log('Serving from API cache:', url.pathname);
        return cachedResponse;
      }
    }
  }

  try {
    // Network request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(request, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    // Cache successful GET requests
    if (request.method === 'GET' && response.ok && response.status < 300) {
      const responseClone = response.clone();
      responseClone.headers.set('sw-cache-date', new Date().toISOString());
      await cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.log('API request failed, checking cache:', error);
    
    // Fallback to cached response even if expired
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Network error - please check your connection',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Optimized static asset handling with aggressive caching
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Always try cache first for static assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('Serving static asset from cache:', request.url);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('Static asset fetch failed:', error);
    
    // Return a placeholder or cached version if available
    return new Response('Asset not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Handle general requests with runtime caching
async function handleGeneralRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(RUNTIME_CACHE);
  
  // For HTML documents, try network first
  if (request.destination === 'document') {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const responseClone = response.clone();
        await cache.put(request, responseClone);
      }
      return response;
    } catch (error) {
      // Fallback to cached index.html
      const cachedResponse = await cache.match('/index.html') || await cache.match('/');
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // For other resources, cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    return response;
  } catch (error) {
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Basic background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Basic sync functionality from UI/UX standardization stage
  }
});

// Basic message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    console.log('Cache update message received');
  }
});
