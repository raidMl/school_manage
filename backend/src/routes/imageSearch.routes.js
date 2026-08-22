const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();

function get(url, extraHeaders) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: Object.assign({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.bing.com/',
      }, extraHeaders || {})
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

function parseBingImages(html) {
  const results = [];
  const seenImages = new Set();

  // Each Bing image href has the pattern:
  // mediaurl=ENCODED_ORIGINAL&amp;cdnurl=ENCODED_BINGTHUMB&amp;exph=...
  // Both URLs use percent-encoding. Split on &amp; to get mediaurl value.
  const mediaRe = /mediaurl=([^&"<\s]+?)&amp;cdnurl=([^&"<\s]+?)&amp;exph/g;
  let m;

  while ((m = mediaRe.exec(html)) !== null) {
    if (results.length >= 9) break;
    try {
      const image     = decodeURIComponent(m[1]);
      const thumbnail = decodeURIComponent(m[2]);
      if (!image.startsWith('http')) continue;
      if (seenImages.has(image)) continue;
      seenImages.add(image);
      results.push({ image, thumbnail });
    } catch (e) { /* skip malformed */ }
  }

  return results;
}

// GET /api/image-search?q=query
router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query) +
      '&form=HDRSC2&first=1&mkt=en-US&setlang=en-US';

    const html = await get(url);
    const results = parseBingImages(html);
    console.log('[image-search] query="' + query + '" found=' + results.length);
    res.json({ results });
  } catch (err) {
    console.error('Image search error:', err.message);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

module.exports = router;
