#!/usr/bin/env bash
# Every probe in this directory, fastest first. Fails on a non-zero exit, an
# `errors:` line above zero, or any line containing FAIL or WRONG.
#
#   bash test/runall.sh          # all of them
#   bash test/runall.sh menu     # only probes whose name contains "menu"
#
# Serves the repo root itself if nothing is listening on TS_PORT (8321).
set -uo pipefail
cd "$(dirname "$0")/.."
PORT="${TS_PORT:-8321}"
FILTER="${1:-}"

if ! curl -s -o /dev/null "http://127.0.0.1:$PORT/index.html"; then
  echo "starting a server on $PORT"
  python3 -m http.server "$PORT" >/dev/null 2>&1 &
  SERVER=$!
  trap 'kill $SERVER 2>/dev/null' EXIT
  for _ in $(seq 1 20); do
    curl -s -o /dev/null "http://127.0.0.1:$PORT/index.html" && break
    sleep 0.25
  done
fi

fails=0
for f in test/*.mjs; do
  name="$(basename "$f" .mjs)"
  [ "$name" = "lib" ] && continue
  # `walk` is a capture, not a check: it takes minutes, asserts nothing, and
  # exists to redraw the floor-plan page. Run it by name when the maps need
  # remaking — `bash test/runall.sh walk` still finds it.
  [ "$name" = "walk" ] && [ -z "$FILTER" ] && continue
  # ...and so is `facing`: it is where EARLY.wayBackDeg comes from. It walks
  # doors 3, 6 and 10 facing the direction of travel and reports how far off
  # the way out that puts you, which is the number that says a 90-degree rule
  # would fire on a clean walk and a 135-degree one would not. Re-run it by
  # name if the corridors change shape — `bash test/runall.sh facing`.
  [ "$name" = "facing" ] && [ -z "$FILTER" ] && continue
  [ -n "$FILTER" ] && [[ "$name" != *"$FILTER"* ]] && continue
  echo "── $name"
  out="$(TS_PORT="$PORT" node "$f" 2>&1)"
  code=$?
  echo "$out" | sed 's/^/   /'
  bad=0
  [ $code -ne 0 ] && bad=1
  echo "$out" | grep -qE '^errors: [1-9]' && bad=1
  echo "$out" | grep -qE 'FAIL|WRONG' && bad=1
  if [ $bad -ne 0 ]; then echo "   ^^ $name FAILED"; fails=$((fails + 1)); fi
done

echo
if [ $fails -eq 0 ]; then echo "all probes passed"; else echo "$fails probe(s) failed"; fi
exit $fails
