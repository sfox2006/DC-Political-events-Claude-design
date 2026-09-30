/* DC Political Events — shell cache, network-first events.
   Bump SHELL_CACHE when HTML, CSS, JS, fonts, or icons change. */
const SHELL_CACHE = "dc-events-claude-v2";
const DATA_CACHE = "dc-events-claude-data-v1";

const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./fonts/Inter.ttf",
  "./fonts/CrimsonPro.ttf",
  "./fonts/CrimsonPro-Italic.ttf",
  "./assets/logo.png",
  "./assets/logo@2x.png",
  "./assets/mark.svg",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-192.png",
  "./assets/icon-maskable-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon-32.png",
  "./assets/favicon.ico",
  "./assets/og-image.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          SHELL.map(async (url) => {
            try {
              const response = await fetch(url, { cache: "reload" });
              if (response.ok) await cache.put(url, response);
            } catch (err) {
              /* A missing shell file should not block install. */
            }
          })
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const hadPreviousShell = keys.some(
        (key) => key.startsWith("dc-events-") && key !== SHELL_CACHE && key !== DATA_CACHE
      );
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      if (!hadPreviousShell) return;
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      await Promise.all(
        windows.map(async (client) => {
          const acked = await new Promise((resolve) => {
            const timer = setTimeout(() => resolve(false), 400);
            const channel = new MessageChannel();
            channel.port1.onmessage = () => {
              clearTimeout(timer);
              resolve(true);
            };
            try {
              client.postMessage({ type: "shell-updated" }, [channel.port2]);
            } catch (err) {
              clearTimeout(timer);
              resolve(false);
            }
          });
          if (!acked && client.navigate) {
            try {
              await client.navigate(client.url);
            } catch (err) {
              /* This window may already be reloading. */
            }
          }
        })
      );
    })()
  );
});

function isEventsRequest(url) {
  return url.pathname.endsWith("/data/events.json");
}

function abortAfter(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function tagged(response, source) {
  const headers = new Headers(response.headers);
  headers.set("X-DC-Events-Source", source);
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function networkFirstEvents(request) {
  const cache = await caches.open(DATA_CACHE);
  const url = new URL(request.url);
  if (!url.searchParams.has("ts") && !url.searchParams.has("t")) {
    url.searchParams.set("ts", String(Date.now()));
  }
  const stableKey = url.origin + url.pathname;
  const crossOrigin = url.origin !== self.location.origin;
  try {
    const fresh = await fetch(url.href, {
      cache: "no-store",
      mode: "cors",
      credentials: crossOrigin ? "omit" : "same-origin",
      signal: abortAfter(8000),
    });
    if (fresh.ok) {
      try {
        await cache.put(stableKey, fresh.clone());
      } catch (err) {
        /* Offline fallback is optional; the network response still wins. */
      }
    }
    return tagged(fresh, "network");
  } catch (err) {
    const cached = await cache.match(stableKey);
    if (cached) return tagged(cached, "cache");
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached =
    (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }));
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok && (fresh.type === "basic" || fresh.type === "cors")) {
    try {
      await cache.put(request, fresh.clone());
    } catch (err) {
      /* Ignore cache write failures (for example redirected responses). */
    }
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  /* Network-first for events.json, including the cross-origin published feed. */
  if (isEventsRequest(url)) {
    event.respondWith(networkFirstEvents(request));
    return;
  }

  if (url.origin !== self.location.origin) return;
  event.respondWith(cacheFirst(request));
});
