/**
 * SmartTute — ink-style figure helpers
 * Makes near-white pixels transparent so diagrams sit cleanly on any background.
 * Dark mode uses CSS filter: invert(1) on .ink-figure images.
 */
(function (global) {
  const cache = new Map();
  const WHITE_HARD = 248; // fully transparent at/above this (near-neutral)
  const WHITE_SOFT = 210; // start fading toward transparent
  const NEUTRAL_SPAN = 28; // max R/G/B spread to count as gray/white paper

  function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load figure image'));
      img.src = src;
    });
  }

  /**
   * Convert near-white / paper background pixels to transparent.
   * Returns a PNG data URL (cached per source).
   */
  async function makeWhiteTransparent(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
    if (cache.has(dataUrl)) return cache.get(dataUrl);

    const promise = (async () => {
      const img = await loadImage(dataUrl);
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return dataUrl;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, w, h);
      } catch (err) {
        // Cross-origin / tainted canvas — return original
        console.warn('inkFigure: cannot process pixels', err);
        return dataUrl;
      }

      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a === 0) continue;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const neutral = maxC - minC <= NEUTRAL_SPAN;

        if (!neutral) continue; // keep colored ink / fills

        if (minC >= WHITE_HARD) {
          data[i + 3] = 0;
        } else if (minC >= WHITE_SOFT) {
          // Soft edge: fade light gray paper anti-aliasing
          const t = (minC - WHITE_SOFT) / (WHITE_HARD - WHITE_SOFT);
          data[i + 3] = Math.round(a * (1 - t));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    })();

    cache.set(dataUrl, promise);
    try {
      const result = await promise;
      cache.set(dataUrl, result);
      return result;
    } catch (err) {
      cache.delete(dataUrl);
      throw err;
    }
  }

  /**
   * Find .tute-figure-img under root, process white→transparent, mark as .ink-figure.
   */
  async function enhanceTuteFigures(root) {
    if (!isBrowser() || !root) return;
    const imgs = root.querySelectorAll('img.tute-figure-img');
    const jobs = Array.from(imgs).map(async (img) => {
      const original = img.getAttribute('data-ink-src') || img.getAttribute('src');
      if (!original) return;
      img.setAttribute('data-ink-src', original);
      img.classList.add('ink-figure');
      try {
        const processed = await makeWhiteTransparent(original);
        if (img.getAttribute('data-ink-src') === original) {
          img.src = processed;
        }
      } catch (err) {
        console.warn('inkFigure enhance failed', err);
      }
    });
    await Promise.all(jobs);
  }

  global.SmartTuteInkFigure = {
    makeWhiteTransparent,
    enhanceTuteFigures
  };
})(typeof window !== 'undefined' ? window : globalThis);
