// THE LINK PREVIEW, WHICH NOBODY PLAYING THE GAME CAN SEE.
//
// Texting the link produced a one-line row with the 192px app icon in it,
// because index.html had no og:image at all — and with none, Apple's link
// previewer falls back to the apple-touch-icon, whose square shape is exactly
// what makes it choose the compact layout. Nothing inside the game changes
// when these tags break, which is why they need a probe of their own.
import { boot, done } from './lib.mjs';
const { browser, page, errs } = await boot();
const bad = (m) => console.log('FAIL ' + m);
const meta = await page.evaluate(() => {
  const out = {};
  for (const n of document.querySelectorAll('meta[property], meta[name]')) {
    const k = n.getAttribute('property') || n.getAttribute('name');
    if (/^(og:|twitter:|description$)/.test(k)) out[k] = n.getAttribute('content') || '';
  }
  return out;
});
const need = ['og:type', 'og:site_name', 'og:url', 'og:title', 'og:description',
  'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
  'twitter:card', 'twitter:image', 'description'];
for (const k of need) if (!meta[k]) bad('missing ' + k);
console.log('title       ' + meta['og:title']);
console.log('description ' + (meta['og:description'] || '').slice(0, 78));
console.log('image       ' + meta['og:image'] + '  ' + meta['og:image:width'] + 'x' + meta['og:image:height']);
console.log('card        ' + meta['twitter:card']);

// THE BIG CARD IS CHOSEN BY THE IMAGE, not by the card type. A relative URL
// is fetched by nobody — the previewer is not on our origin — and a square or
// small image gets the compact row however many tags are present.
if (meta['og:image'] && !/^https:\/\//.test(meta['og:image'])) {
  bad('og:image is not an absolute https URL: ' + meta['og:image']);
}
const W = +meta['og:image:width'], H = +meta['og:image:height'];
if (!(W >= 1200 && H >= 600)) bad('og:image is too small for the large card: ' + W + 'x' + H);
if (Math.abs(W / H - 1.91) > 0.12) bad('og:image is not the 1.91:1 the card is built around');
if (meta['twitter:card'] !== 'summary_large_image') {
  bad('twitter:card is ' + meta['twitter:card'] + ', not summary_large_image');
}

// ...AND THE FILE HAS TO BE THERE, at the path the tag names, as an image.
const path = (meta['og:image'] || '').replace(/^https:\/\/[^/]+/, '');
const got = await page.evaluate(async (p) => {
  try {
    const r = await fetch(p, { method: 'GET' });
    const b = await r.blob();
    const bmp = await createImageBitmap(b);
    return { ok: r.ok, type: r.headers.get('content-type'), bytes: b.size,
      w: bmp.width, h: bmp.height };
  } catch (e) { return { ok: false, err: String(e) }; }
}, path);
console.log('served      ' + JSON.stringify(got));
if (!got.ok) bad('og:image 404s at ' + path);
if (got.w !== W || got.h !== H) {
  bad('the file is ' + got.w + 'x' + got.h + ' but the tags claim ' + W + 'x' + H);
}
// Apple stops fetching somewhere around 10MB and a slow card is a card
// nobody waits for; this one is about 64KB.
if (got.bytes > 3e6) bad('the card is ' + Math.round(got.bytes / 1e3) + 'KB — too heavy for a preview');

done('social', errs);
await browser.close();
