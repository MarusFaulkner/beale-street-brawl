# Beale Street Brawl

A 2D fighting game set on Beale Street in Memphis, Tennessee. It runs in any modern browser, on desktop and on a phone, with no install and no build step.

**Play it:** https://marusfaulkner.github.io/beale-street-brawl/

## Status

Four of the planned six fighters are playable: **Nicole** (rushdown, dash punches), **Keelah** (kickboxer, spin kicks), **Marcoss** (powerhouse, heavy hands) and **KOM** (all-rounder). Two bosses are planned. There are three stages: Beale Street, the Crystal Palace roller rink and the Midsouth Coliseum. The current mode is one player against a random CPU opponent, best of three rounds, with Easy, Normal and Hard difficulty.

### Boss fight

Press **B** on the title screen (or tap the red **BOSS** pill) to fight **Midsouth Brawler**, the first boss, in the Midsouth Coliseum. He is a heavyweight wrestler who is bigger and tougher than the fighters, hits harder and plays more aggressively. His moves are Body Slam (Special), Rope Whip (Down + Special), Sky Lift (Back + Special), Elbow Drop (Special in the air) and the King's Drop super at a full meter.

## Controls

| Action | Keyboard | Phone |
|---|---|---|
| Move | `A` `D` or arrow keys | D-pad left / right |
| Jump | `W` or up arrow | D-pad up |
| Crouch | `S` or down arrow | D-pad down |
| Punch | `J` | P |
| Kick | `K` | K |
| Special | `L` | SPECIAL |
| Block | Hold back | Hold back |
| Start / confirm | `Enter` | Tap |
| Change stage (select screen) | `K` | Tap a stage |

## Moves

All fighters share the same inputs. Normal attacks have identical damage, speed and reach, so the matchup is even.

| Input | Nicole | Keelah | Marcoss | KOM |
|---|---|---|---|---|
| Punch | Jab | Jab | Jab | Jab |
| Kick | Kick | Kick | Kick | Kick |
| Forward + Punch | Heavy punch | Heavy punch | Heavy punch | Heavy punch |
| Forward + Kick | Heavy kick (knocks down) | Heavy kick (knocks down) | Flying spin kick (knocks down) | Heavy kick (knocks down) |
| Down + Punch | | | Crouching punch | |
| Down + Kick | | | Sweep (knocks down) | |
| Punch, Punch, Kick | 3-hit combo | 3-hit combo | 3-hit combo | 3-hit combo |
| Special | Crimson Rush | Roundhouse Flurry | Bluff City Rush | King's Rush |
| Down + Special | Crimson Wave (projectile) | Pink Comet (projectile) | Blue Flame (projectile) | Beale Burst (projectile) |
| Back + Special | Rising Rose (anti-air) | Rising Heel (anti-air) | Rising Uppercut (anti-air) | Crown Uppercut (anti-air) |
| Special in the air | Heel Quake (dive) | Ground Breaker (dive) | Flying Kick (dive) | Crown Drop (dive) |
| Special with a full meter | Crimson Cyclone (super) | After Hours Tornado (super) | Memphis Mauler (super) | King of Beale (super) |

A jab that connects can be cancelled into a kick, a heavy punch or a special. The meter fills as you deal and take damage.

## Run it locally

The game loads its art with normal image requests, so serve the folder instead of opening `index.html` from disk:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## How it is built

- `index.html` holds the page markup: the canvas, the touch pad and the help line.
- `src/style.css` holds the page styling.
- `src/game.js` holds the whole game in one commented file, in this order: assets and frame tables, the roster (animations and move data), input, the fighter state machine, the CPU, match flow, and rendering.
- `assets/` holds the sprite atlases, the stage, the select portraits and the victory animations.

The simulation runs at a fixed 60 ticks per second, and every timing in the move data is in ticks. A move is one entry in `ROSTER`: its frame sequence, the ticks when its hitbox is live, the hitbox, and its damage, stun and pushback. Adding or tuning a move means editing that entry.

Each sprite atlas has a frame table in `game.js` (`FR`). Every frame is listed as `[x, y, width, height, anchorX, anchorY]`, where the anchor is the middle of the body at foot level. Anchoring every frame at the feet is what keeps a fighter planted while she animates.

The music and sound effects are synthesized in the browser with the Web Audio API. There are no audio files. Each stage has its own original track: a dark Memphis-style beat on Beale Street, roller-rink funk at the Crystal Palace and an arena anthem at the Midsouth Coliseum. The menu uses the Beale Street track.

## Known gaps

- Keelah now has her own block and hit art. Nicole and Marcoss still use code effects for getting hit.
- Marcoss's standing punch and kick art was drawn from the waist up, so the atlas joins those frames onto legs from his stance frames.
- KOM's punch and blast art was drawn from the thighs up, so the atlas joins those frames onto legs from his stance frame. His run, knockdown and crouch frames were drawn small and look softer than the rest.
- The Midsouth Brawler has no block, hit-reaction or kick art yet: blocking uses his crouch guard and getting hit uses a code effect. He shows a still portrait instead of a victory animation.
- Two more fighters and one more boss are planned.
- There is no two-player mode yet.

## Credits and rights

Game design and art direction by Marcus Faulkner. The character art was generated with AI image tools and is based on real people, used with their permission, except KOM, who is an invented character. The character art and likeness are not licensed for reuse.

The soundtrack is an original composition written for this game.
