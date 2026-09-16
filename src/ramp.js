// ---------------------------------------------------------------------------
// THE WALKED PROGRAMME — one description of one rule, for both corridors.
//
// NO RETREAT ramps on three dials: BODIES (how many, as groups that ascend
// within the room), FIRE (how many shoot together, and how long the room
// waits afterwards) and CAST (which types are in the mix). One dial moves per
// room, bodies and fire taking it in turns, and a new type arrives ALONE in a
// room made quieter to receive it.
//
// It is walked forward rather than solved, because the rule IS a walk. There
// is no closed form for "one dial per room, alternating, and a debut steps the
// other two back", and inventing one would be a second description of the same
// thing, free to drift from it.
//
// IT LIVES HERE, RATHER THAN IN main.js, BECAUSE THE TUNNEL WANTS IT TOO.
// The mode that invented it has one room per door; the tunnel has several
// corridors behind each door and walks down them. The rule is the same either
// way — what differs is the step it is walked in, and the tables it is walked
// over. Both are arguments now. See src/tunnelramp.js for the tunnel's.
// ---------------------------------------------------------------------------

// `d` is the step: a room in NO RETREAT, a corridor in the tunnel. `D` is the
// table set — `SIMPLE.duel` for the mode that invented it.
export function walkPlan(d, D) {
  const room = Math.max(1, d | 0);
  // How many rooms an entry owns: a combination is a short interlude of
  // exactly `hold` rooms, anything else is the room it arrives in plus its
  // ramp — unless it names its own `rooms`, which the OPENING does, because
  // the rooms before the first debut are not a debut's ramp. They are the
  // mode being taught by playing it, and they have to outlast the time
  // button (SIMPLE.duel.buttonRoom) arriving inside them.
  const span = (e) => (e.rooms || (e.hold ? e.hold : 1 + D.rampRooms));
  const OP = D.open;
  let b = OP[0].bodies, f = OP[0].fire, turn = 0;
  let idx = 0, at = 1, fresh = null, combo = false;
  for (let r = 2; r <= room; r++) {
    fresh = null;
    if (r - at >= span(D.cast[idx]) && idx + 1 < D.cast.length) {
      idx++; at = r;
      const e = D.cast[idx];
      // A DEBUT IS MET IN A QUIETER ROOM than the one just cleared, so the
      // new thing is the only new thing. A COMBINATION is not a debut — both
      // types are known — so it takes the dials exactly as it finds them:
      // what is new there is the pairing, and nothing else may move under it.
      if (!e.hold) {
        // THE DEBUT ROOM IS QUIETER ON THE FIRE DIAL, and only that one.
        //
        // It used to step BOTH back, which was affordable on a six-room cycle
        // and is not on a four-room one: three moves a cycle, two of them
        // spent climbing back to where the last cycle ended, and the peaks
        // came out 10, 10, 11, 11 — a ramp that is a flat line with debuts
        // drawn on it. Measured by test/duelramp.mjs, which is exactly what
        // that check is for.
        //
        // FIRE is the one worth spending it on. Bodies decide how crowded the
        // room looks; the shared clock decides how much is coming AT you, and
        // a player being shown a new silhouette needs the beats between
        // rounds more than they need one fewer man at the back.
        f = Math.max(0, f - D.typeDrop);
        fresh = e.with[e.with.length - 1] || null;
      }
      continue;
    }
    // AN INTERLUDE HOLDS EVERY DIAL STEADY — for its own rooms, and not one
    // more. The programme's LAST entry can never be advanced past, so an
    // unqualified `continue` here froze the whole game solid from the last
    // interlude onward: past room 44 the old list stopped ramping for ever.
    // A run that deep is rare and a difficulty curve that quietly flatlines
    // is not something a player would report, which is exactly why it has to
    // be right here rather than watched for.
    if (D.cast[idx].hold && r - at < span(D.cast[idx])) continue;
    // ...AND THE OPENING NAMES ITS OWN DIALS RATHER THAN WALKING THEM. Taking
    // turns moves fire every other room, and the first five rooms have one job
    // — be hard by door 5, so the button arriving at door 6 is the answer to
    // something. See SIMPLE.duel.open. The walk picks up from wherever this
    // leaves the two indices, so nothing downstream has to know about it.
    if (idx === 0 && r <= OP.length) {
      b = OP[r - 1].bodies; f = OP[r - 1].fire;
      continue;
    }
    // one dial per room, taking it in turns; a dial that has topped out hands
    // its turn to the other rather than wasting the room
    if (turn === 0 && b + 1 < D.groups.length) b++;
    else if (f + 1 < D.fire.length) f++;
    else if (b + 1 < D.groups.length) b++;
    turn ^= 1;
  }
  const [volley, gap] = D.fire[f];
  const entry = D.cast[idx];
  // ...and it is only a combination while it is still ON, which for the last
  // entry in the programme is not for ever. See the interlude guard above.
  combo = !!entry.hold && room - at < span(entry);
  return {
    groups: D.groups[b].map((v) => Math.min(D.encCap, v)),
    volley, gap, fresh, combo,
    // GUNNERS FILL EVERY OTHER SLOT. `with` is what joins them, never a
    // running total of everything met so far.
    cast: ['gunner'].concat(entry.with.filter((t) => t !== 'gunner')),
    step: { bodies: b, fire: f, cast: idx },
  };
}
