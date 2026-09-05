# The link preview

`assets/social/og-card-v2.jpg` is what Messages, Slack, WhatsApp and the rest
show when somebody sends the link. It is generated from the running game, not
drawn:

```sh
python3 -m http.server 8321        # in another shell, from the repo root
node tools/social/make-card.mjs    # -> assets/social/og-card-v2.jpg
```

Two steps in one script. It plays the game — warps to a corridor door, finds
the longest straight run of that leg's spine, stands the player at one end
facing down it, places three men close enough to read at thumbnail size,
shatters the nearest and screenshots 260 ms into the burst with the HUD
stripped — then composites that frame under the wordmark using
`og-card.html`, and encodes the result.

## Two things that are easy to get wrong

**Change the filename, not the file.** Every previewer caches these hard;
Apple in particular will keep serving a card for days. The name is versioned
for exactly that reason — bump `OUT` at the foot of `make-card.mjs` and the
four `og:image` / `twitter:image` tags in `index.html` together. Overwriting
`og-card-v2.jpg` in place ships a picture nobody will see for a week.

**The image chooses the layout, not the tags.** A square or small image gets
the one-line compact row however many tags are present — which is what the
game shipped with, because there was no `og:image` at all and the previewer
fell back to the 192px `apple-touch-icon`. 1200×630 at an absolute `https`
URL is what gets the big card. `test/social.mjs` asserts all of that,
including that the file at the end of the URL really is that size.
