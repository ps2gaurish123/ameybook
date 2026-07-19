const PDF_CACHE_NAME = 'ameys-book-pdf-v1';

const inFlightPdfLoads = new Map<string, Promise<ArrayBuffer>>();

const removeOldPdfVersions = async (cache: Cache, currentUrl: string) => {
  const current = new URL(currentUrl);
  const cachedRequests = await cache.keys();

  await Promise.all(
    cachedRequests
      .filter((request) => {
        const cached = new URL(request.url);
        return cached.origin === current.origin
          && cached.pathname === current.pathname
          && cached.href !== current.href;
      })
      .map((request) => cache.delete(request))
  );
};

const fetchAndCachePdf = async (pdfUrl: string): Promise<ArrayBuffer> => {
  if (!('caches' in window)) {
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.arrayBuffer();
  }

  const cache = await caches.open(PDF_CACHE_NAME);
  const cachedResponse = await cache.match(pdfUrl);

  if (cachedResponse) {
    return cachedResponse.arrayBuffer();
  }

  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const cacheWrite = cache.put(pdfUrl, response.clone())
    .then(() => removeOldPdfVersions(cache, pdfUrl))
    .catch(() => undefined);
  const pdfData = await response.arrayBuffer();

  await cacheWrite;
  return pdfData;
};

export const loadCachedPdf = (pdfUrl: string): Promise<ArrayBuffer> => {
  const absoluteUrl = new URL(pdfUrl, window.location.href).href;
  const existingLoad = inFlightPdfLoads.get(absoluteUrl);
  if (existingLoad) return existingLoad;

  const load = fetchAndCachePdf(absoluteUrl)
    .finally(() => inFlightPdfLoads.delete(absoluteUrl));
  inFlightPdfLoads.set(absoluteUrl, load);
  return load;
};
