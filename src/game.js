/* =====================================================================
   BEALE STREET BRAWL — single-file canvas fighter
   ---------------------------------------------------------------------
   Structure
     1. Assets   – sprite atlases (data URIs) + per-frame rects/anchors
     2. Roster   – each outfit's animation + move data (edit names here)
     3. Input    – keyboard + touch → one shared "held/pressed" map
     4. Fighter  – state machine: idle/walk/crouch/jump/attack/block/hit/ko
     5. CPU      – simple distance-based AI with difficulty levels
     6. Match    – rounds, timer, KO, screens
     7. Render   – stage, fighters, effects, HUD
   Game runs at a fixed 60 ticks/sec; all timings below are in ticks.
   ===================================================================== */

/* ---------- 1. Assets ---------- */
const IMG = {};
function load(name, src){ return new Promise(r=>{ const i=new Image(); i.onload=()=>{IMG[name]=i;r()}; i.src=src; }); }
// Frame tables: [atlasX, atlasY, w, h, anchorX(torso centre), anchorY(feet)]
// Throw frames have the blast painted in; clip them at the hand so the live projectile is the only blast on screen.
const CLIP = { crimson:{28:165}, afterhours:{5:160}, marcoss:{12:108} };
const FR = { crimson: [[0,0,101,264,48,263],[103,0,102,263,52,262],[207,0,102,258,51,257],[311,0,99,259,49,258],[412,0,101,259,51,258],[515,0,96,258,52,257],[613,0,91,258,56,257],[706,0,88,254,46,253],[796,0,128,211,61,210],[926,0,127,179,57,178],[1055,0,115,193,52,192],[1172,0,110,167,46,166],[1284,0,109,163,54,162],[1395,0,117,173,49,172],[1514,0,146,199,69,198],[1662,0,142,196,69,195],[1806,0,148,195,68,194],[0,266,115,216,54,215],[117,266,102,214,47,213],[221,266,93,216,44,215],[316,266,140,204,62,203],[458,266,228,210,115,209],[688,266,105,140,51,139],[795,266,104,196,52,195],[901,266,140,237,41,236],[1043,266,519,168,415,167],[1564,266,172,169,96,168],[1738,266,184,194,65,193],[0,505,409,199,127,198],[411,505,204,184,147,183],[617,505,86,194,40,193],[705,505,195,198,86,197],[902,505,619,195,491,194],[1523,505,151,164,78,163],[1676,505,154,175,79,174],[1832,505,200,193,109,192],[0,706,128,167,75,166],[130,706,117,154,67,153],[249,706,120,169,54,168],[371,706,93,177,30,176],[466,706,274,231,136,230],[742,706,161,203,89,202],[905,706,137,196,79,195],[1044,706,119,209,63,208],[1165,706,123,177,61,176],[1290,706,162,198,73,197],[1454,706,177,122,99,121],[1633,706,156,162,78,161],[1791,706,140,161,65,160],[0,939,336,93,262,92],[338,939,103,261,48,260],[443,939,94,259,44,258],[539,939,93,258,43,257],[634,939,88,258,40,257],[724,939,95,237,53,236],[821,939,83,234,42,233],[906,939,115,228,66,227],[1023,939,79,228,42,227],[1104,939,67,228,39,227],[1173,939,82,232,45,231],[1257,939,110,180,51,179],[1369,939,113,162,52,161],[1484,939,105,161,46,160],[1591,939,108,157,48,156],[1701,939,127,186,60,185],[1830,939,122,160,58,159],[0,1202,115,164,55,163],[117,1202,108,218,57,217],[227,1202,114,215,54,214],[343,1202,148,210,75,209],[493,1202,104,219,55,218],[599,1202,108,220,46,219],[709,1202,97,218,49,217],[808,1202,151,223,57,222],[961,1202,97,216,51,215],[1060,1202,118,220,62,219],[1180,1202,111,219,58,218],[1293,1202,110,218,59,217],[1405,1202,102,218,49,217],[1509,1202,107,199,60,198],[1618,1202,106,182,55,181],[1726,1202,107,157,52,156],[1835,1202,88,218,40,217],[1925,1202,123,145,71,144],[0,1427,117,102,66,101],[119,1427,180,55,98,54]], afterhours: [[0,0,235,237,162,236],[237,0,225,236,136,235],[464,0,243,235,149,234],[709,0,173,255,74,254],[884,0,179,255,79,254],[1065,0,581,277,91,276],[1648,0,188,263,93,262],[1838,0,196,267,90,266],[0,279,295,270,130,269],[297,279,299,273,169,272],[598,279,291,265,162,264],[891,279,221,258,150,257],[1114,279,232,224,136,223],[1348,279,201,231,127,230],[1551,279,243,244,160,243],[0,554,509,241,420,240],[511,554,293,191,206,190],[806,554,276,276,151,275],[1084,554,237,276,120,275],[1323,554,252,274,127,273],[1577,554,318,289,158,288],[0,845,184,266,97,265],[186,845,187,261,105,260],[375,845,181,265,104,264],[558,845,332,295,166,294],[892,845,801,244,644,243],[1695,845,261,244,119,243],[0,1142,243,211,102,210],[245,1142,368,258,214,257],[615,1142,162,254,94,253],[779,1142,146,267,74,265],[927,1142,144,265,75,264],[1073,1142,146,263,74,261],[1221,1142,191,259,105,258],[1414,1142,175,261,99,259],[1591,1142,168,257,105,256],[1761,1142,186,260,110,258],[0,1411,203,261,95,259],[205,1411,177,198,87,196],[384,1411,167,167,86,166],[553,1411,173,159,90,157],[728,1411,141,173,74,172],[871,1411,135,177,69,176],[1008,1411,134,173,71,172],[1144,1411,138,156,73,154],[1284,1411,148,160,72,159],[1434,1411,207,248,101,247],[1643,1411,203,247,105,246],[0,1674,234,246,115,243],[236,1674,257,243,118,241],[495,1674,283,255,136,253],[780,1674,398,256,141,254],[1180,1674,219,245,104,243],[1401,1674,151,243,79,241],[1554,1674,179,240,98,238],[1735,1674,181,236,95,234],[0,1932,250,238,105,235],[252,1932,325,253,130,250],[579,1932,234,231,102,230],[815,1932,264,225,120,223],[1081,1932,286,225,125,223],[1369,1932,340,227,154,226],[0,2187,363,225,169,222],[365,2187,302,242,129,240],[0,2431,332,95,150,94]], marcoss: [[0,0,147,283,71,282],[149,0,173,281,89,280],[324,0,202,270,108,269],[528,0,177,272,96,271],[707,0,139,272,79,271],[848,0,150,263,80,262],[1000,0,218,265,105,264],[1220,0,238,269,105,268],[1460,0,237,262,105,261],[1699,0,239,263,105,262],[0,285,182,262,71,261],[184,285,202,268,105,267],[388,285,374,258,105,257],[764,285,212,279,55,278],[978,285,239,271,79,270],[1219,285,156,175,89,174],[1377,285,276,162,86,161],[1655,285,277,171,110,170],[0,566,217,141,108,140],[219,566,206,104,103,103],[427,566,280,63,140,62],[709,566,152,184,78,183],[863,566,134,189,62,188],[999,566,170,192,65,191],[1171,566,180,172,73,171],[1353,566,169,174,61,173],[1524,566,171,148,74,147],[1697,566,186,138,73,137],[1885,566,145,181,56,180],[0,760,207,147,59,146],[209,760,134,147,65,146]], kom: [[0,0,141,281,69,280],[143,0,217,273,118,272],[362,0,204,234,119,233],[568,0,278,284,109,283],[848,0,298,274,109,273],[1148,0,323,281,109,280],[1473,0,305,290,109,289],[1780,0,253,280,109,279],[0,292,343,277,109,276],[345,292,456,294,109,293],[803,292,181,274,86,273],[986,292,225,274,106,273],[1213,292,433,274,109,273],[0,588,471,277,140,276],[473,588,256,276,121,275],[731,588,312,260,164,259],[1045,588,383,272,223,271],[1430,588,292,164,146,163],[1724,588,255,70,128,69],[0,867,145,158,76,157],[147,867,181,170,90,169],[330,867,168,170,84,169],[0,1039,300,74,140,73]] };

/* ---------- 2. Roster ----------
   frames: animation name → list of [frameIndex, ticks]
   moves:  attack timelines. active = [startTick, endTick) when the hitbox is live.
   hit box is relative to the feet anchor, facing right: [x1, y1, x2, y2]          */
const ROSTER = {
  // Atlas index guide (Nicole): 0-49 = new move sheet, 50+ = original red-jacket sheet (block/hit).
  crimson: {
    name: "NICOLE", atlas: "crimson", size: 1, style: "RUSHDOWN  ·  DASH PUNCHES",
    anim: {
      idle:[[0,12],[1,12]], walk:[[2,6],[3,6],[4,6],[5,6],[6,6],[7,6]],
      crouch:[[9,99]], jump:[[10,99]], air:[[11,99]], land:[[13,6]],
      block:[[76,99]], hit:[[78,4],[79,6],[80,99]], ko:[[81,10],[83,14],[84,14],[85,999]], // original sheet: new KO frames drop the jacket
      win:[[0,99]], airkick:[[20,99]],
    },
    walkScale: 1, stanceScale: 1,
    moves: {
      // Normals share frame data with Keelah's (same damage, timing and reach) so the matchup is even.
      p:  { seq:[[19,3],[14,3],[15,7],[14,5],[19,3]], active:[6,13], box:[25,-160,120,-115], dmg:7,  stun:14, push:5 },
      hp: { seq:[[19,3],[14,4],[16,10],[15,6],[19,5]], active:[7,17], box:[25,-165,130,-110], dmg:12, stun:20, push:9, fx:"burst" },
      k:  { seq:[[17,4],[18,4],[21,8],[18,6]], active:[8,16], box:[20,-195,125,-110], dmg:10, stun:18, push:7 },
      hk: { seq:[[17,3],[26,6],[27,10],[39,8],[19,6]], active:[7,21], box:[20,-190,135,-80], dmg:13, stun:22, push:10, knock:true },
      // Third chain hit: Jab → Jab → this (P, P, K)
      k3: { seq:[[18,3],[20,6],[21,8],[19,6]], active:[5,15], box:[20,-200,135,-100], dmg:11, stun:22, push:11, knock:true },
      s:  { seq:[[25,8],[32,14],[16,10]], active:[8,22], box:[20,-165,130,-100], dmg:15, stun:30, push:12,
            dash:[4,22,10], knock:true, name:"CRIMSON RUSH" },
      s2: { seq:[[36,6],[37,6],[28,18],[19,6]], active:[0,0], box:[0,0,0,0], dmg:12, stun:20, push:8,
            projectile:{at:14,speed:8,y:-150,dx:150,color:"#ff2b6a"}, name:"CRIMSON WAVE" },
      su: { seq:[[22,4],[23,4],[24,16],[23,8]], active:[6,24], box:[0,-230,100,-80], dmg:13, stun:24, push:5,
            knock:true, launch:[6,-13,2], name:"RISING ROSE" },
      airs:{ seq:[[29,6],[30,99]], active:[0,999], box:[-10,-150,110,0], dmg:12, stun:22, push:8, knock:true,
            dive:[0,13,7], landFrame:31, name:"HEEL QUAKE" },
      super:{ seq:[[40,16],[33,8],[34,8],[35,8],[33,8],[34,8],[35,8],[39,12]], active:[22,76], box:[-50,-210,140,-10],
            dmg:5, stun:16, push:3, multi:7, name:"CRIMSON CYCLONE", superMove:true },
    },
  },
  // Atlas index guide (Keelah): 0-29 = new specials sheet, 30+ = original club-outfit sheet.
  afterhours: {
    name: "KEELAH", atlas: "afterhours", style: "KICKBOXER  ·  SPIN KICKS", size: 0.9,   // drawn 10% shorter than Nicole
    anim: {
      idle:[[30,14],[31,14]], walk:[[32,6],[33,6],[34,6],[35,6],[36,6],[37,6]],
      crouch:[[39,99]], jump:[[43,99]], air:[[44,99]], land:[[45,6]],
      block:[[46,99]], hit:[[46,99]], ko:[[12,10],[16,12],[64,999]], // new lying KO pose (atlas 64)
      win:[[29,99]], airkick:[[56,99]],
    },
    fallback:{ block:"shield", hit:"lean" }, // no block/hit art yet → code effects
    walkScale: 1, stanceScale: 1,
    moves: {
      p:  { seq:[[46,3],[48,3],[50,7],[48,5],[46,4]], active:[6,13], box:[25,-160,120,-115], dmg:7,  stun:14, push:5 },
      hp: { seq:[[46,3],[48,4],[51,10],[50,6],[46,5]], active:[7,17], box:[25,-165,130,-110], dmg:12, stun:20, push:9 },
      k3: { seq:[[7,3],[9,6],[8,8],[7,6]], active:[5,15], box:[20,-200,135,-100], dmg:11, stun:22, push:11, knock:true },
      k:  { seq:[[6,4],[7,4],[9,8],[7,6]], active:[8,16], box:[20,-195,125,-110], dmg:10, stun:18, push:7 },
      hk: { seq:[[6,3],[7,4],[8,10],[10,8],[11,6]], active:[7,21], box:[20,-190,135,-80], dmg:13, stun:22, push:10, knock:true },
      s:  { seq:[[58,6],[59,6],[60,6],[61,8],[62,8],[63,10],[58,4]], active:[12,38], box:[-20,-150,135,-40], dmg:4, stun:16,
            push:4, multi:8, name:"ROUNDHOUSE FLURRY" },
      s2: { seq:[[3,6],[4,10],[5,18],[3,6]], active:[0,0], box:[0,0,0,0], dmg:12, stun:20, push:8,
            projectile:{at:16,speed:8,y:-150,dx:160,color:"#ff4fd8"}, name:"PINK COMET" },
      su: { seq:[[6,4],[27,14],[26,10],[7,8]], active:[4,26], box:[10,-220,115,-60], dmg:14, stun:24, push:6,
            knock:true, launch:[4,-15,3], name:"RISING HEEL" },
      airs:{ seq:[[13,6],[14,99]], active:[0,999], box:[0,-140,130,0], dmg:12, stun:22, push:8, knock:true,
            dive:[0,13,7], landFrame:15, name:"GROUND BREAKER" },
      super:{ seq:[[24,16],[17,8],[18,8],[19,8],[20,10],[17,8],[18,8],[25,14]], active:[22,80], box:[-50,-210,140,-10],
            dmg:5, stun:16, push:3, multi:7, name:"AFTER HOURS TORNADO", superMove:true },
    },
  },
  // Atlas index guide (Marcoss): 0 front, 1-2 stance, 3-5 walk, 6 run, 7-8 jab, 9 heavy punch, 10 uppercut, 11 charge, 12 throw,
  // 13-14 kick, 15 tuck, 16 flying kick, 17 spin kick, 18 hit, 19 knockdown, 20 lying, 21-30 crouch sheet.
  // His standing punch/kick frames were drawn waist-up, so the atlas joins them onto legs from his stance frames.
  marcoss: {
    name: "MARCOSS", atlas: "marcoss", size: 1.04, style: "POWERHOUSE  ·  HEAVY HANDS",
    anim: {
      idle:[[1,14],[2,14]], walk:[[3,7],[4,7],[5,7],[4,7]],
      crouch:[[21,99]], jump:[[15,99]], air:[[15,99]], land:[[22,6]],
      block:[[23,99]], hit:[[2,99]], ko:[[18,12],[19,14],[20,999]],
      win:[[0,99]], airkick:[[16,99]],
    },
    fallback:{ hit:"lean" },
    walkScale: 1, stanceScale: 1,
    moves: {
      p:  { seq:[[7,4],[8,7],[7,4]], active:[3,11], box:[25,-165,125,-115], dmg:7,  stun:14, push:5 },
      hp: { seq:[[7,3],[9,11],[8,5]], active:[5,15], box:[25,-165,135,-110], dmg:12, stun:20, push:9 },
      k:  { seq:[[13,5],[14,9],[13,5]], active:[5,14], box:[20,-195,130,-110], dmg:10, stun:18, push:7 },
      hk: { seq:[[15,5],[17,13],[15,4]], active:[5,18], box:[15,-190,140,-70], dmg:13, stun:22, push:10, knock:true, launch:[3,-8,3] },
      k3: { seq:[[13,3],[14,9],[13,5]], active:[4,12], box:[20,-200,135,-100], dmg:11, stun:22, push:11, knock:true },
      cp: { seq:[[24,4],[25,8],[24,4]], active:[4,12], box:[25,-115,135,-55], dmg:7,  stun:14, push:5 },      // crouching punch
      ck: { seq:[[26,5],[27,10],[26,5]], active:[5,15], box:[20,-50,150,0],   dmg:9,  stun:20, push:8, knock:true }, // sweep
      s:  { seq:[[6,18],[9,12],[8,6]], active:[16,30], box:[20,-165,135,-100], dmg:15, stun:30, push:12,
            dash:[2,20,10], knock:true, name:"BLUFF CITY RUSH" },
      s2: { seq:[[11,12],[12,16],[8,5]], active:[0,0], box:[0,0,0,0], dmg:12, stun:20, push:8,
            projectile:{at:14,speed:8,y:-150,dx:70,color:"#3aa8ff"}, name:"BLUE FLAME" },
      su: { seq:[[22,4],[10,16],[1,6]], active:[4,20], box:[0,-240,105,-90], dmg:13, stun:24, push:5,
            knock:true, launch:[4,-13,2], name:"RISING UPPERCUT" },
      airs:{ seq:[[15,5],[16,99]], active:[0,999], box:[0,-130,140,0], dmg:12, stun:22, push:8, knock:true,
            dive:[0,13,7], landFrame:21, name:"FLYING KICK" },
      super:{ seq:[[11,16],[9,8],[14,8],[10,8],[9,8],[14,8],[10,14]], active:[18,70], box:[-40,-215,145,-10],
            dmg:5, stun:16, push:3, multi:7, name:"MEMPHIS MAULER", superMove:true },
    },
  },
  // Atlas index guide (KOM): 0 front, 1 stance, 2 low guard, 3 jab, 4 cross, 5 hook, 6 uppercut, 7-9 Beale Burst,
  // 10-11 knee/kick (cut off at the shin on his sheet, unused), 12 high kick, 13 flying kick, 14-16 run, 17 knocked back, 18 lying, 19 crouch.
  // His punch and blast frames were drawn from the thighs up, so the atlas joins them onto the legs of his stance frame.
  // His sheet has no walk or jump frames: walking uses the run frames and jumping uses a mid-stride run frame.
  kom: {
    name: "KOM", atlas: "kom", size: 1, style: "ALL-ROUNDER  ·  KING'S RUSH", breathe: true,
    anim: {
      idle:[[1,99]], walk:[[14,8],[15,8]],
      crouch:[[21,99]], jump:[[15,99]], air:[[15,99]], land:[[21,6]],
      block:[[2,99]], hit:[[1,99]], ko:[[17,18],[22,999]],
      win:[[0,99]], airkick:[[13,99]],
    },
    fallback:{ hit:"lean" },
    walkScale: 1, stanceScale: 1,
    moves: {
      p:  { seq:[[1,2],[3,8],[1,3]], active:[2,10], box:[25,-165,125,-115], dmg:7,  stun:14, push:5 },
      hp: { seq:[[3,3],[5,11],[4,5]], active:[5,15], box:[25,-170,135,-110], dmg:12, stun:20, push:9 },
      k:  { seq:[[1,4],[12,10],[1,4]], active:[5,14], box:[20,-200,135,-100], dmg:10, stun:18, push:7 },
      hk: { seq:[[2,4],[13,13],[2,4]], active:[5,17], box:[15,-180,145,-60], dmg:13, stun:22, push:10, knock:true, launch:[3,-8,3] },
      k3: { seq:[[1,3],[12,9],[1,5]], active:[4,12], box:[20,-200,135,-100], dmg:11, stun:22, push:11, knock:true },
      // King's Rush: sprint in with afterimages, hook, then an uppercut that launches (two hits)
      s:  { seq:[[15,6],[16,6],[14,6],[5,11],[6,15],[1,5]], active:[18,44], box:[10,-245,135,-90], dmg:5, stun:22, push:6, multi:12,
            dash:[2,20,11], knock:true, knockAt:28, fx:"rush", name:"KING'S RUSH" },
      s2: { seq:[[7,7],[8,7],[9,16],[1,5]], active:[0,0], box:[0,0,0,0], dmg:12, stun:20, push:8,
            projectile:{at:14,speed:8,y:-150,dx:120,color:"#3a7bff"}, name:"BEALE BURST" },
      su: { seq:[[2,4],[6,16],[1,6]], active:[4,20], box:[0,-245,110,-90], dmg:13, stun:24, push:5,
            knock:true, launch:[4,-12,2], name:"CROWN UPPERCUT" },
      airs:{ seq:[[15,5],[13,99]], active:[0,999], box:[0,-130,140,0], dmg:12, stun:22, push:8, knock:true,
            dive:[0,13,7], landFrame:21, name:"CROWN DROP" },
      super:{ seq:[[9,16],[5,8],[12,8],[6,8],[4,8],[12,8],[6,14]], active:[18,70], box:[-40,-220,145,-10],
            dmg:5, stun:16, push:3, multi:7, name:"KING OF BEALE", superMove:true },
    },
  },
};

/* ---------- 3. Input ---------- */
const held = {}, pressed = {};
const KEYMAP = { a:"left", arrowleft:"left", d:"right", arrowright:"right", w:"up", arrowup:"up", " ":"up",
  s:"down", arrowdown:"down", j:"p", z:"p", k:"k", x:"k", l:"s", c:"s", enter:"start" };
addEventListener("keydown", e=>{ const k=KEYMAP[e.key.toLowerCase()]; if(!k) return; e.preventDefault();
  if(!held[k]) pressed[k]=true; held[k]=true; audio.unlock(); });
addEventListener("keyup", e=>{ const k=KEYMAP[e.key.toLowerCase()]; if(k) held[k]=false; });
// Touch pad: each button tracks its own pointers so multi-touch (walk + punch) works.
if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) document.body.classList.add("touch");
document.querySelectorAll("#pad .b").forEach(b=>{
  const k=b.dataset.k, down=e=>{ e.preventDefault(); b.setPointerCapture?.(e.pointerId); if(!held[k]) pressed[k]=true;
    held[k]=true; b.classList.add("on"); audio.unlock(); },
    up=e=>{ held[k]=false; b.classList.remove("on"); };
  b.addEventListener("pointerdown",down); b.addEventListener("pointerup",up);
  b.addEventListener("pointercancel",up); b.addEventListener("lostpointercapture",up);
});
// Tapping the screen acts as Start/Confirm on menus.
document.getElementById("c").addEventListener("pointerdown", e=>{ pressed.tap = true; pressed.tapX = e.offsetX / e.target.clientWidth * VW; pressed.tapY = e.offsetY / e.target.clientHeight * 540; audio.unlock(); });

/* ---------- Audio: tiny synth, starts after first interaction ---------- */
const audio = {
  ctx:null, on:true,
  unlock(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; } }
    if(this.ctx.state==="suspended") this.ctx.resume(); this.startMusic(); },
  /* Background music: an ORIGINAL beat in the classic 90s Memphis underground style
     (dark horror-movie keys, eerie strings, melodic 808 cowbell, booming 808s, snare rolls, lo-fi tape sound).
     No samples and no melodies from existing songs; every note here is written for this game.
     150 BPM counted in half-time, C# minor, 8-bar loop of 16 sixteenth-notes per bar. */
  BPM:150,
  ROOTS:[69.30,69.30,69.30,69.30,55.00,55.00,51.91,51.91],             // 808 roots: C#, C#, C#, C#, A, A, G#, G#
  // Creepy key riff: {step: semitones above C#4}. Leans on the minor 2nd and tritone for that horror feel.
  RIFF:[{0:7,3:8,6:7,8:3,11:1,14:0},{0:7,3:8,6:7,8:3,11:6,14:3},{0:7,3:8,6:7,8:3,11:1,14:0},{0:12,2:11,4:8,6:7,8:6,10:3,12:1,14:0},
        {0:4,3:5,6:4,8:0,11:-2,14:-4},{0:4,3:5,6:4,8:0,11:3,14:0},{0:3,3:4,6:3,8:-1,11:-3,14:-5},{0:-1,2:0,4:3,6:6,8:7,10:8,12:11,14:12}],
  KICK:[[0,6,10],[0,3,10],[0,6,10],[0,6,10,13],[0,6,10],[0,3,10],[0,6,10],[0,3,6,10]],
  BELL:[0,2,3,6,8,10,11,14],                                             // melodic cowbell rhythm (bars 3-4 and 7-8)
  startMusic(){ if(this.mtimer||!this.ctx) return; const c=this.ctx;
    // music bus → tape-style saturation → dull lowpass (lo-fi) → volume
    this.mgain=c.createGain(); this.mgain.gain.value=this.on?0.5:0; this.mgain.connect(c.destination);
    const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=5200; lp.Q.value=.7; lp.connect(this.mgain);
    const sat=c.createWaveShaper(), k=new Float32Array(1024); for(let i=0;i<1024;i++){ const x=i/512-1; k[i]=Math.tanh(1.8*x); } sat.curve=k; sat.connect(lp);
    this.mbus=c.createGain(); this.mbus.gain.value=.9; this.mbus.connect(sat);
    this.mstep=0; this.mnext=c.currentTime+0.15; this.mtimer=setInterval(()=>this.schedule(),40); },
  schedule(){ const s16=60/this.BPM/4;
    while(this.mnext < this.ctx.currentTime+0.25){ this.playStep(this.mstep,this.mnext,s16); this.mnext+=s16; this.mstep++; } },
  mnote(f,t,d,type,v,filt,detune){ const c=this.ctx,o=c.createOscillator(),gn=c.createGain(); o.type=type; o.frequency.value=f; if(detune) o.detune.value=detune;
    gn.gain.setValueAtTime(v,t); gn.gain.exponentialRampToValueAtTime(.001,t+d);
    let n=o; if(filt){ const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=filt; o.connect(lp); n=lp; }
    n.connect(gn).connect(this.mbus); o.start(t); o.stop(t+d+.02); return o; },
  mnoise(t,d,v,freq,bp){ const c=this.ctx,b=c.createBuffer(1,Math.ceil(c.sampleRate*d),c.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<a.length;i++) a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);
    const src=c.createBufferSource(),f=c.createBiquadFilter(),gn=c.createGain(); src.buffer=b; f.type=bp?"bandpass":"highpass"; f.frequency.value=freq; gn.gain.value=v;
    src.connect(f).connect(gn).connect(this.mbus); src.start(t); },
  playStep(s,t,s16){ const c=this.ctx, bar=Math.floor(s/16)%8, i=s%16, root=this.ROOTS[bar], semi=n=>Math.pow(2,n/12);
    // 808 kick + long booming bass, sliding down at the end of each 4-bar phrase
    if(this.KICK[bar].includes(i)){
      const o=c.createOscillator(),gn=c.createGain(); o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(42,t+.09);
      gn.gain.setValueAtTime(1,t); gn.gain.exponentialRampToValueAtTime(.001,t+.28); o.connect(gn).connect(this.mbus); o.start(t); o.stop(t+.3);
      const last=i===this.KICK[bar][this.KICK[bar].length-1], b=this.mnote(root*(i===3||i===13?1.5:1),t,last?.85:.55,"sine",.7);
      if(last&&bar%4===3) b.frequency.exponentialRampToValueAtTime(root*.7,t+.6); }
    // snare + clap on beat 3, with the rolling snare fill that ends each phrase
    if(i===8){ this.mnoise(t,.2,.5,1900,true); this.mnoise(t,.12,.3,5000); this.mnote(190,t,.1,"triangle",.25); }
    if(bar%4===3&&i>=12){ for(let r=0;r<2;r++) this.mnoise(t+r*s16/2,.07,.16+.05*(i-12),2200,true); }
    if(bar%2===1&&i===15) this.mnoise(t,.09,.2,1900,true);
    // hi-hats: steady eighths with triplet and 32nd-note rolls
    const roll=(bar%2===0&&i>=14)||(bar%4===1&&i>=6&&i<8)||(bar%4===2&&i>=10&&i<12);
    if(roll){ const n=bar%4===2?3:2; for(let r=0;r<n;r++) this.mnoise(t+r*s16/n,.02,.08,9000); }
    else if(i%2===0) this.mnoise(t,.03,i%4===0?.12:.07,9000);
    if(i===14&&bar%2===1) this.mnoise(t,.22,.07,7000);                         // open hat
    // horror key riff: detuned, slightly out-of-tune piano/bell voice
    const n=this.RIFF[bar][i];
    if(n!==undefined){ const f=277.18*semi(n); this.mnote(f,t,.55,"triangle",.13,2600,-8); this.mnote(f*2,t,.3,"sine",.05,0,9); this.mnote(f*.5,t,.5,"sine",.05); }
    // eerie string pad: slow detuned saws holding root + minor third + fifth, with a wavering top note
    if(i===0){ const dur=s16*16*1.02; for(const [iv,dt] of [[12,-12],[15,10],[19,-6],[24,14]]){ const o=c.createOscillator(),gn=c.createGain(),lp=c.createBiquadFilter();
        o.type="sawtooth"; o.frequency.value=root*2*semi(iv); o.detune.value=dt; lp.type="lowpass"; lp.frequency.value=1100;
        gn.gain.setValueAtTime(.0001,t); gn.gain.linearRampToValueAtTime(.028,t+.35); gn.gain.linearRampToValueAtTime(.0001,t+dur);
        o.connect(lp).connect(gn).connect(this.mbus); o.start(t); o.stop(t+dur+.05); } }
    // orchestra hit at the top of each phrase
    if(i===0&&bar%4===0){ for(const iv of [0,7,12,15,19,24]) this.mnote(root*2*semi(iv),t,.45,"sawtooth",.06,1800,(iv%5)*6-10); this.mnoise(t,.25,.12,900,true); }
    // melodic 808 cowbell, the signature Memphis sound: two detuned squares through a bandpass, pitched to the chord
    if((bar%4>=2)&&this.BELL.includes(i)){ const hi=(i===3||i===11)?semi(3):(i===6||i===14)?semi(-2):1, base=root*8*hi;
      for(const m of [1,1.48]){ const o=c.createOscillator(),gn=c.createGain(),bp=c.createBiquadFilter(); o.type="square"; o.frequency.value=base*m;
        bp.type="bandpass"; bp.frequency.value=base*1.2; bp.Q.value=3; gn.gain.setValueAtTime(.09,t); gn.gain.exponentialRampToValueAtTime(.001,t+.16);
        o.connect(bp).connect(gn).connect(this.mbus); o.start(t); o.stop(t+.18); } }
  },
  // one-shot sound effects (bypass the lo-fi music bus so hits stay crisp)
  tone(f,d,type="square",v=.12,slide=0){ if(!this.on||!this.ctx) return; const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);
    g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+d); o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t+d); },
  noise(d,v=.2){ if(!this.on||!this.ctx) return; const c=this.ctx,b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<a.length;i++) a[i]=(Math.random()*2-1)*(1-i/a.length); const s=c.createBufferSource(),g=c.createGain(); g.gain.value=v; s.buffer=b; s.connect(g).connect(c.destination); s.start(); },
  hit(h){ this.noise(.12,.25); this.tone(h?90:140,.15,"sawtooth",.15,.5); },
  block(){ this.tone(900,.06,"square",.06); this.noise(.05,.08); },
  whiff(){ this.noise(.06,.05); },
  ko(){ this.tone(220,.9,"sawtooth",.15,.25); },
  bell(){ this.tone(660,.5,"triangle",.15); this.tone(990,.5,"triangle",.08); },
};
document.getElementById("mute").onclick = e => { audio.on=!audio.on; audio.unlock(); if(audio.mgain) audio.mgain.gain.value=audio.on?0.5:0;
  e.target.textContent = "Music & sound: "+(audio.on?"on":"off"); e.target.blur(); };

/* ---------- 4. Fighter ---------- */
const AS = 1.4;   // sprite atlases are stored at 1.4x so they stay sharp on high-density phone screens
const SPR = 1.25; // on-screen sprite scale; boxes scale with it
const GROUND = 500, GRAV = 0.9, WALK = 3.4, JUMP_V = -17, STAGE_L = 50, STAGE_R = 910;
class Fighter {
  constructor(key, x, facing, isCPU){
    this.c = ROSTER[key]; this.key = key; this.cpu = isCPU;
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = facing;
    this.hp = 100; this.meter = 0; this.state = "idle"; this.t = 0; this.wins = 0;
    this.move = null; this.hitDone = 0; this.lastHitTick = -99; this.stun = 0; this.flash = 0;
    this.inputLog = []; // recent directions for the Down, Forward motion
  }
  setState(s){ if(this.state!==s){ this.state=s; this.t=0; } }
  get grounded(){ return this.y >= 0; }
  get busy(){ return ["attack","hit","block","ko","land","win"].includes(this.state); }
  // Hurtbox in world space (shrinks when crouching)
  hurt(){ const h = (this.state==="crouch" ? 110 : 175)*SPR*this.c.size, w=35*SPR; return [this.x-w, GROUND+this.y-h, this.x+w, GROUND+this.y]; }
  // Live hitbox in world space, or null
  hitbox(){
    if(this.state==="airkick") return this.box([20,-130,115,-60]);
    if(this.state!=="attack") return null;
    const m=this.move, [a,b]=m.active; if(this.t<a||this.t>=b) return null;
    return this.box(m.box);
  }
  box([x1,y1,x2,y2]){ const f=this.facing, X=v=>this.x+v*SPR*f; y1*=SPR*this.c.size; y2*=SPR*this.c.size;
    return [Math.min(X(x1),X(x2)), GROUND+this.y+y1, Math.max(X(x1),X(x2)), GROUND+this.y+y2]; }
  startAttack(id){
    const m = this.c.moves[id];
    // Special with a full meter becomes an EX version: more damage, gold flash.
    this.ex = id==="super"; if(this.ex){ this.meter=0; match.shake=6; match.hitstop=10; spark(this.x,GROUND-120,"#ffc642",30); }
    if(id!=="p") this.chain=0;
    this.move = m; this.moveId=id; this.hitDone=0; this.lastHitTick=-99; this.setState("attack"); audio.whiff();
    if(m.name) match.callout(m.name, this.ex?"#ffc642":"#ff3fb4");
  }
  // Called once per tick with a control object {left,right,up,down,p,k,s,motion}
  control(ctl){
    const fwd = this.facing===1 ? ctl.right : ctl.left, back = this.facing===1 ? ctl.left : ctl.right;
    this.holdingBack = back && !ctl.up;
    // Chain combo: a light punch that connects can cancel into the next attack
    if(this.state==="attack" && this.moveId==="p" && this.hitDone && this.t>=this.move.active[0]){
      if(ctl.p){ this.chain=(this.chain||0)+1; return this.startAttack(this.chain>=2?"hp":"p"); }
      if(ctl.k) return this.startAttack(this.chain>=1?"k3":fwd?"hk":"k");
      if(ctl.s) return this.startAttack(ctl.down?"s2":back?"su":"s");
    }
    if(this.busy || this.state==="stand") return;
    if(!this.grounded){ // air control: one jump kick per jump
      if(ctl.s && this.state==="jump" && !this.usedAir && this.c.moves.airs){ this.usedAir=true; return this.startAttack("airs"); }
      if((ctl.k||ctl.p) && this.state==="jump" && !this.usedAir){ this.usedAir=true; this.state="airkick"; this.hitDone=0; audio.whiff(); }
      return;
    }
    // Down + Special (or Down, Back + Punch) = second special; Special (or Down, Forward + Kick) = first
    // Full meter + Special = super. Back + Special = anti-air. Down + Special = projectile.
    if((ctl.s || ctl.super) && this.meter>=100 && !ctl.down && !back) return this.startAttack("super");
    if((ctl.s && back) || ctl.su) return this.startAttack("su");
    if((ctl.s && ctl.down) || ctl.s2 || (ctl.p && ctl.motionBack)) return this.startAttack("s2");
    if(ctl.s || (ctl.k && ctl.motion)) return this.startAttack("s");
    // Down + button = crouching attack, for fighters with crouch-attack art
    if(ctl.down && ctl.p && this.c.moves.cp) return this.startAttack("cp");
    if(ctl.down && ctl.k && this.c.moves.ck) return this.startAttack("ck");
    // Forward + button = heavy version
    if(ctl.hp || (ctl.p && fwd)) return this.startAttack("hp");
    if(ctl.hk || (ctl.k && fwd)) return this.startAttack("hk");
    if(ctl.p){ this.chain=0; return this.startAttack("p"); } // fresh jab starts a new chain
    if(ctl.k) return this.startAttack("k");
    if(ctl.up){ this.vy=JUMP_V; this.y=-1; this.vx=(fwd?5:back?-5:0)*this.facing; this.usedAir=false; return this.setState("jump"); }
    if(ctl.down){ this.vx=0; return this.setState("crouch"); }
    if(fwd||back){ this.vx=(fwd?WALK:-WALK*0.8)*this.facing; return this.setState("walk"); }
    this.vx=0; this.setState("idle");
  }
  update(){
    this.t++; if(this.flash>0) this.flash--;
    // Physics
    if(!this.grounded || this.vy<0){ this.vy+=GRAV; this.y+=this.vy;
      if(this.y>=0){ this.y=0; this.vy=0;
        if(this.state==="ko" && !this.bounced){ this.bounced=true; this.vy=-5; this.y=-1; this.vx*=.5; spark(this.x,GROUND-6,"#d9c7b0",10); }   // one small bounce with dust
        if(this.state!=="ko"){
        this.landFrame = this.move && this.move.landFrame; if(this.landFrame!=null){ match.shake=10; spark(this.x+40*this.facing,GROUND-10,"#ff3fb4",20); audio.hit(true); }
        this.vx=0; this.move=null; this.setState("land"); } } }
    // State timers
    if(this.state==="attack"){
      const m=this.move, total=m.seq.reduce((s,f)=>s+f[1],0);
      if(m.dash){ const [a,b,v]=m.dash; this.vx = (this.t>=a&&this.t<b) ? v*this.facing : 0; }
      else if(m.dive){ if(this.t===m.dive[0]){ this.vy=m.dive[1]; this.vx=m.dive[2]*this.facing; } }
      else if(m.launch){ const [a,vy,vx]=m.launch; if(this.t===a){ this.vy=vy; this.y=-1; this.vx=vx*this.facing; } }
      else if(this.grounded) this.vx=0;
      if(m.projectile && this.t===m.projectile.at && !match.projectiles.some(q=>q.owner===this)){
        const pr=m.projectile; match.projectiles.push({owner:this,x:this.x+(pr.dx||70)*SPR*this.facing,y:GROUND+pr.y*SPR,vx:pr.speed*this.facing,
          color:pr.color,dmg:m.dmg,stun:m.stun,push:m.push,ex:this.ex,t:0}); audio.tone(300,.25,"sawtooth",.1,2.5); }
      if(this.t>=total){ this.move=null; this.setState("idle"); }
    }
    if(this.state==="land" && this.t>=(this.landFrame!=null?16:6)){ this.landFrame=null; this.setState("idle"); }
    if((this.state==="hit"||this.state==="block") && this.t>=this.stun) this.setState("idle");
    if(this.state==="ko"){ this.vx*=0.9; }
    this.x += this.vx;
    if(this.state==="hit"||this.state==="block") this.vx*=0.8;
    const pad = this.state==="ko" ? 110 : 0; // lying sprites are wide
    this.x = Math.max(STAGE_L+pad, Math.min(STAGE_R-pad, this.x));
  }
  // Returns [frameIndex, scale] for the current pose
  pose(){
    const A=this.c.anim, s=this.state;
    const play=(seq,loop=true)=>{ const total=seq.reduce((a,f)=>a+f[1],0); let t=loop?this.t%total:Math.min(this.t,total-1);
      for(const [f,d] of seq){ if(t<d) return f; t-=d; } return seq[seq.length-1][0]; };
    if(s==="attack"){ return [play(this.move.seq,false), this.c.stanceScale]; }
    if(s==="walk") return [play(A.walk), this.c.walkScale];
    if(s==="jump"||s==="airkick") return [s==="airkick"?A.airkick[0][0]:(this.vy<-4?A.jump[0][0]:A.air[0][0]), this.c.stanceScale];
    if(s==="hit") return [play(A.hit,false),1];
    if(s==="ko") return [play(A.ko,false),1];
    if(s==="block") return [play(A.block,false),this.c.stanceScale];
    if(s==="land" && this.landFrame!=null) return [this.landFrame,1];
    const seq=A[s]||A.idle;
    // fighters with a single idle frame get a slow breathing motion so they don't stand frozen
    return [play(seq, s==="idle"), (s==="idle"&&this.c.breathe) ? 1+.012*Math.sin(this.t*.09) : 1];
  }
}

/* ---------- 5. CPU ---------- */
const LEVELS = { EASY:{react:.35,aggr:.012,block:.25}, NORMAL:{react:.6,aggr:.025,block:.5}, HARD:{react:.85,aggr:.045,block:.75} };
function cpuControl(me, foe){
  const L=LEVELS[match.level], dist=Math.abs(foe.x-me.x), ctl={};
  const towards = foe.x>me.x ? "right" : "left", away = towards==="right" ? "left" : "right";
  me.ai = me.ai || {wait:0, plan:null};
  // React to incoming attacks by holding back (blocking)
  if((foe.state==="attack"||foe.state==="airkick") && dist<190){ if(me.ai.blockRoll===undefined) me.ai.blockRoll=Math.random()<L.block; if(me.ai.blockRoll){ ctl[away]=true; return ctl; } }
  else me.ai.blockRoll=undefined;
  if(me.meter>=100 && dist<220 && Math.random()<L.aggr*3){ ctl.super=true; return ctl; }
  if(!foe.grounded && dist<180 && Math.random()<L.react*.08){ ctl.su=true; return ctl; }
  if(me.ai.wait>0){ me.ai.wait--; if(me.ai.plan) ctl[me.ai.plan]=true; return ctl; }
  const r=Math.random();
  if(dist>260){ ctl[towards]=true; if(r<L.aggr*.6) ctl.s=true; else if(r<L.aggr*.9) ctl.s2=true; else if(r<L.aggr) { ctl.up=true; ctl[towards]=true; } }
  else if(dist>120){ if(r<L.aggr*.8) ctl.s2=true; else if(r<L.aggr*2) ctl.hk=true; else if(r<L.aggr*2.5) ctl.s=true; else if(r<.6) ctl[towards]=true; else if(r<.7){ me.ai.plan=away; me.ai.wait=12; } }
  else { if(r<L.aggr*3) ctl.p=true; else if(r<L.aggr*4) ctl.hp=true; else if(r<L.aggr*5.5) ctl.k=true; else if(r<L.aggr*6) ctl.s2=true; else if(r<L.aggr*7) ctl.s=true; else if(r<.15){ me.ai.plan=away; me.ai.wait=10; } }
  return ctl;
}

/* ---------- 6. Match ---------- */
const cv=document.getElementById("c"), g=cv.getContext("2d");
/* The world is 960 wide. The view (VW) shows a slice of it that follows the fighters:
   full 960 on wide screens, down to 540 on portrait phones so the fighters stay large. */
let VW=960, camX=0, DPR=1;
function fit(){
  const touch=document.body.classList.contains("touch");
  const w=document.getElementById("wrap").clientWidth, h=Math.max(240, innerHeight-(touch?330:110));
  VW=Math.round(Math.min(960, Math.max(540, 540*w/h)));
  // Render at the screen's real pixel density (capped) so art and text are not blurred by CSS scaling
  DPR=Math.min(window.devicePixelRatio||1, 3, 1920/VW);
  cv.width=Math.round(VW*DPR); cv.height=Math.round(540*DPR); cv.style.aspectRatio=VW+"/540";
}
addEventListener("resize",fit); fit();
const KEYS=["crimson","afterhours","marcoss","kom"];
const match = {
  stage:0,
  screen:"title", sel:0, level:"NORMAL", round:1, timer:99, frame:0, pause:0, banner:null, shake:0, hitstop:0,
  sparks:[], rings:[], calls:[], projectiles:[], p1:null, p2:null, winner:null,
  callout(text,color){ this.calls.push({text,color,t:0}); },
  start(){ const others=KEYS.filter((k,i)=>i!==this.sel), opp=others[Math.floor(Math.random()*others.length)];   // CPU plays a random other fighter
    this.p1=new Fighter(KEYS[this.sel],330,1,false); this.p2=new Fighter(opp,630,-1,true);
    this.round=1; this.newRound(); this.screen="fight"; },
  newRound(){ for(const [f,x,d] of [[this.p1,330,1],[this.p2,630,-1]]){ Object.assign(f,{x,y:0,vx:0,vy:0,facing:d,hp:100,state:"idle",t:0,move:null,flash:0,bounced:false}); }
    this.projectiles=[]; this.timer=60; this.frame=0; this.banner={text:"ROUND "+this.round,sub:"",t:0,dur:80,then:{text:"FIGHT!",dur:45}}; this.pause=125; this.over=false; audio.bell(); },
};
function readPlayer(f){
  const ctl={ left:held.left, right:held.right, up:!!pressed.up, down:held.down, p:pressed.p, k:pressed.k, s:pressed.s };
  // Motion input: Down then Forward within ~15 ticks
  const fwd = f.facing===1 ? held.right : held.left;
  if(held.down) f.inputLog.push({d:"down",t:match.frame}); if(fwd) f.inputLog.push({d:"fwd",t:match.frame});
  f.inputLog = f.inputLog.filter(e=>match.frame-e.t<18);
  const back = f.facing===1 ? held.left : held.right; if(back) f.inputLog.push({d:"back",t:match.frame});
  const di=f.inputLog.findIndex(e=>e.d==="down"); ctl.motion = di>=0 && f.inputLog.slice(di).some(e=>e.d==="fwd");
  ctl.motionBack = di>=0 && f.inputLog.slice(di).some(e=>e.d==="back");
  return ctl;
}
function resolveHits(a,b){
  const hb=a.hitbox(); if(!hb) return;
  const m = a.state==="airkick" ? {dmg:9,stun:16,push:6} : a.move;
  if(m.multi){ if(a.t-a.lastHitTick<m.multi) return; } else if(a.hitDone) return;
  const hu=b.hurt(); if(hb[2]<hu[0]||hb[0]>hu[2]||hb[3]<hu[1]||hb[1]>hu[3]) return;
  if(b.state==="ko") return;
  a.hitDone++; a.lastHitTick=a.t;
  const px=(hb[0]+hb[2])/2, py=(Math.max(hb[1],hu[1])+Math.min(hb[3],hu[3]))/2;
  applyHit(a,b,m,px,py);
}
function applyHit(a,b,m,px,py){
  const blocking = b.holdingBack && b.grounded && !["attack","hit"].includes(b.state) && b.state!=="crouch";
  if(blocking){ b.setState("block"); b.stun=12; b.vx=a.facing*m.push*.6;
    b.hp-=Math.round(m.dmg*0.1); b.meter=Math.min(100,b.meter+4); spark(px,py,"#45e0ff",8); audio.block(); match.hitstop=3; return; }
  const dmg=m.dmg;
  b.hp=Math.max(0,b.hp-dmg); b.flash=8; b.vx=a.facing*m.push; a.meter=Math.min(100,a.meter+dmg*1.2); b.meter=Math.min(100,b.meter+dmg*.6);
  spark(px,py, a.ex?"#ffc642":"#ff3fb4", 14); audio.hit(dmg>=10); match.hitstop = dmg>=10?7:4; match.shake = dmg>=10?8:4;
  if(b.hp<=0){ b.setState("ko"); b.vx=a.facing*4; b.vy=-8; b.y=-1; audio.ko(); match.hitstop=20; match.shake=14; endRound(a); }
  else if(m.knock && (!m.knockAt || a.t>=m.knockAt)){ b.setState("hit"); b.stun=m.stun; b.vy=-7; b.y=-1; } // launches; landing ends the stun
  else { b.setState("hit"); b.stun=m.stun; }
}
function spark(x,y,c,n){ if(n>=14) match.rings.push({x,y,c,born:match.frame}); for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=2+Math.random()*7; match.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:16+Math.random()*10,c}); } }
function endRound(w){
  if(match.over) return; match.over=true;
  const l = w===match.p1?match.p2:match.p1;
  if(w) w.wins++;
  const text = w ? (l.hp<=0?"K.O.":"TIME") : "DRAW";
  match.banner={text, sub: w? w.c.name+" WINS":"", t:0, dur:150};
  match.roundEnd=170;
}
function step(){
  match.frame++;
  if(match.screen==="title"){
    const blip=()=>{ audio.tone(500,.05); audio.tone(750,.08,"triangle",.08); };
    if(pressed.left||pressed.right){ match.sel=(match.sel+(pressed.right?1:KEYS.length-1))%KEYS.length; match.selT=match.frame; blip(); }
    if(pressed.up||pressed.down){ const L=Object.keys(LEVELS),i=L.indexOf(match.level); match.level=L[(i+(pressed.down?1:L.length-1))%L.length]; audio.tone(400,.05); }
    if(pressed.k){ match.stage=(match.stage+1)%STAGES.length; audio.tone(400,.05); }
    if(pressed.tap){ // touch menu: tap a fighter card, a stage, a difficulty, or the fight button
      const x=pressed.tapX,y=pressed.tapY, hit=r=>r&&x>r[0]&&x<r[0]+r[2]&&y>r[1]&&y<r[1]+r[3];
      const f=titleCards.findIndex(hit), st=titleStage.findIndex(hit), d=titleDiff.findIndex(hit);
      if(f>=0){ if(match.sel!==f){ match.sel=f; match.selT=match.frame; blip(); } }
      else if(st>=0){ match.stage=st; audio.tone(400,.05); }
      else if(d>=0){ match.level=Object.keys(LEVELS)[d]; audio.tone(400,.05); }
      else if(y>=446) match.start();
    }
    if(pressed.start||pressed.p) match.start();
    return;
  }
  if(match.screen==="result"){ if(pressed.start||pressed.p||pressed.tap) match.screen="title"; return; }
  // fight
  for(const c of match.calls) c.t++; match.calls=match.calls.filter(c=>c.t<70);
  if(match.banner){ match.banner.t++; if(match.banner.t>=match.banner.dur){ match.banner = match.banner.then ? {...match.banner.then,t:0,sub:""} : null; } }
  if(match.hitstop>0){ match.hitstop--; return; }
  if(match.shake>0) match.shake*=.85, match.shake<.5&&(match.shake=0);
  for(const s of match.sparks){ s.x+=s.vx; s.y+=s.vy; s.vx*=.9; s.vy*=.9; s.l--; } match.sparks=match.sparks.filter(s=>s.l>0);
  const {p1,p2}=match;
  if(match.pause>0){ match.pause--; p1.update(); p2.update(); return; }
  if(match.roundEnd>0){ p1.update(); p2.update();
    { const lo=p1.state==="ko"?p1:p2.state==="ko"?p2:null, w=lo===p1?p2:p1;   // the winner steps clear of the knocked-out fighter
      if(lo && lo.grounded && Math.abs(w.x-lo.x)<185){ const dir=Math.sign(w.x-lo.x)||w.facing*-1; w.x+=dir*5; if(w.x<=STAGE_L+2||w.x>=STAGE_R-2) lo.x-=dir*5; } }
    if(--match.roundEnd===60){ const w=p1.hp>p2.hp?p1:p2.hp>p1.hp?p2:null; if(w&&w.state!=="ko") w.setState("win"); }
    if(match.roundEnd===0){ if(p1.wins>=2||p2.wins>=2){ match.winner=p1.wins>=2?p1:p2; match.screen="result"; match.resultStart=match.frame; audio.bell(); } else { match.round++; match.newRound(); } }
    return; }
  // Face each other when free
  for(const [a,b] of [[p1,p2],[p2,p1]]) if(!a.busy && a.grounded) a.facing = b.x>a.x?1:-1;
  p1.control(readPlayer(p1)); p2.control(cpuControl(p2,p1));
  p1.update(); p2.update();
  // Push boxes: fighters can't overlap
  // Keep both fighters inside the camera view
  const maxSep=VW-120, sep=p2.x-p1.x; if(Math.abs(sep)>maxSep){ const o=(Math.abs(sep)-maxSep)/2*Math.sign(sep); p1.x+=o; p2.x-=o; }
  const down=p1.state==="ko"||p2.state==="ko";   // the winner steps clear of a knocked-out fighter
  const d=p2.x-p1.x, min=down?175:60; if(Math.abs(d)<min && (down||Math.abs(p1.y-p2.y)<120)){ const o=(min-Math.abs(d))/2*Math.sign(d||1); p1.x-=o; p2.x+=o; }
  resolveHits(p1,p2); resolveHits(p2,p1);
  for(const q of match.projectiles){ q.x+=q.vx; q.t++;
    const foe=q.owner===p1?p2:p1, hu=foe.hurt();
    if(foe.state!=="ko" && q.x+22>hu[0] && q.x-22<hu[2] && q.y+22>hu[1] && q.y-22<hu[3]){ q.dead=true;
      const fake={ facing:Math.sign(q.vx), move:{dmg:q.dmg,stun:q.stun,push:q.push}, ex:q.ex, meter:q.owner.meter, state:"proj" };
      applyHit(q.owner, foe, fake.move, q.x, q.y); }
    if(q.x<camX-60||q.x>camX+VW+60) q.dead=true; }
  match.projectiles=match.projectiles.filter(q=>!q.dead);
  if(match.frame%60===0 && !match.over){ match.timer--; if(match.timer<=0){ match.timer=0; const w=p1.hp>p2.hp?p1:p2.hp>p1.hp?p2:null; endRound(w); } }
}

/* ---------- 7. Render ---------- */
let titleCards=[], titleStage=[];
function drawFighter(f){
  const [fi,sc]=f.pose(), fr=FR[f.c.atlas][fi], img=IMG[f.c.atlas], fb=f.c.fallback||{};
  const k=sc*SPR*f.c.size/AS;                                           // atlas pixels → world units
  const cw=Math.min(fr[2], ((CLIP[f.c.atlas]||{})[fi]||1e9)*AS);
  const blit=()=>g.drawImage(img, fr[0],fr[1],cw,fr[3], -fr[4], -fr[5], cw, fr[3]);
  // contact shadow
  g.fillStyle="rgba(0,0,0,.5)"; g.beginPath(); g.ellipse(f.x,GROUND+3,64*(1+f.y/400),11,0,0,Math.PI*2); g.fill();
  // reflection on the wet street
  g.save(); g.beginPath(); g.rect(f.x-500,GROUND+2,1000,60); g.clip(); g.globalAlpha=.24;
  g.translate(f.x,GROUND-f.y+3); g.scale(f.facing*k,-k*.6); blit(); g.restore();
  // the fighter, with a neon rim light (pink = you, cyan = CPU, gold = super)
  g.save(); g.translate(f.x, GROUND+f.y - (f.state==="win"?Math.abs(Math.sin(f.t*.12))*12:0));
  g.scale(f.facing,1); if(f.state==="hit"&&fb.hit==="lean") g.rotate(-0.22); g.scale(k,k);
  const superOn=f.ex && f.state==="attack";
  g.shadowColor = superOn ? "rgba(255,198,66,.9)" : f.cpu ? "rgba(69,224,255,.55)" : "rgba(255,63,180,.55)";
  g.shadowBlur = (superOn?18:9)*DPR;
  if(f.flash>0 && f.flash%2) g.filter="brightness(2.2) saturate(.3)";
  else if(f.state==="ko" && f.t>14) g.filter="brightness(.8) saturate(.75)";
  if(f.state==="attack" && f.move.fx==="rush" && Math.abs(f.vx)>1){   // gold afterimages trailing a dash
    g.save(); g.shadowBlur=0; g.filter="brightness(1.6) sepia(1) saturate(4)";
    for(let i=3;i>=1;i--){ g.globalAlpha=.3/i; g.drawImage(img, fr[0],fr[1],cw,fr[3], -fr[4]-i*46/k*SPR*.6, -fr[5], cw, fr[3]); }
    g.restore(); }
  blit(); g.filter="none"; g.restore();
  // code-drawn extras, in world units
  g.save(); g.translate(f.x, GROUND+f.y); g.scale(f.facing,1);
  if(f.state==="block"&&fb.block==="shield"){ g.globalCompositeOperation="lighter"; g.strokeStyle="rgba(69,224,255,.9)"; g.lineWidth=5;
    g.shadowColor="#45e0ff"; g.shadowBlur=14*DPR; g.beginPath(); g.arc(50,-138,88,-1.1,1.1); g.stroke(); }
  if(f.state==="attack" && f.move.fx==="rush" && Math.abs(f.vx)>1){ g.globalCompositeOperation="lighter"; g.strokeStyle="rgba(255,198,66,.75)"; g.lineWidth=3;
    for(let i=0;i<6;i++){ const y=-40-i*38, x=-70-((f.t*17+i*53)%90); g.beginPath(); g.moveTo(x,y); g.lineTo(x-110,y); g.stroke(); } g.globalCompositeOperation="source-over"; }
  if(f.state==="attack" && f.move.fx==="burst" && f.t>=f.move.active[0] && f.t<f.move.active[1]){
    g.globalCompositeOperation="lighter"; g.translate((fr[2]-fr[4])*k-8, -fr[5]*k*0.8); g.rotate(f.t*.3); g.fillStyle="rgba(255,63,180,.85)";
    g.beginPath(); for(let i=0;i<16;i++){ const r=i%2?16:46; g.lineTo(Math.cos(i*Math.PI/8)*r,Math.sin(i*Math.PI/8)*r); } g.fill(); }
  g.restore();
}
// Soft additive glows where the neon signs and street lamp sit in the stage art (world x, y, radius, colour)
// Stages. `off` is how many world units of the image sit left of the playfield; glows are soft additive lights
// placed over the neon in each picture as [world x, y, radius, colour].
const STAGES=[
  { key:"bg", name:"BEALE STREET", off:62, glows:[[51,249,150,"255,63,180"],[919,170,170,"255,90,60"],[905,330,120,"69,224,255"],[285,62,80,"255,214,130"],[520,470,260,"255,120,200"]] },
  { key:"bg_palace", name:"CRYSTAL PALACE", off:0, glows:[[333,106,170,"255,190,90"],[152,264,90,"255,63,180"],[580,267,90,"200,90,255"],[365,255,110,"190,120,255"],[480,470,260,"255,120,200"]] },
  { key:"bg_coliseum", name:"MIDSOUTH COLISEUM", off:0, glows:[[476,274,260,"90,140,255"],[80,29,90,"255,214,130"],[878,26,90,"255,214,130"],[480,330,200,"255,160,60"]] },
];
function drawStage(){
  const st=STAGES[match.stage], bg=IMG[st.key], z=bg.height/540;
  g.drawImage(bg, (st.off+camX)*z, 0, VW*z, 540*z, 0, 0, VW, 540);
  g.save(); g.globalCompositeOperation="lighter";
  st.glows.forEach(([x,y,r,c],i)=>{ const fl=.10+.05*Math.sin(match.frame*.07+i*2.1)+(Math.sin(match.frame*.9+i)>.97?.08:0);
    const gr=g.createRadialGradient(x-camX,y,0,x-camX,y,r); gr.addColorStop(0,`rgba(${c},${fl})`); gr.addColorStop(1,`rgba(${c},0)`);
    g.fillStyle=gr; g.fillRect(x-camX-r,y-r,r*2,r*2); });
  g.restore();
  const gr=g.createLinearGradient(0,380,0,540); gr.addColorStop(0,"rgba(13,7,24,0)"); gr.addColorStop(1,"rgba(13,7,24,.45)"); g.fillStyle=gr; g.fillRect(0,380,VW,160);
}
function drawAtmosphere(){
  // drifting motes catching the neon, then a vignette to pull the eye to the fight
  g.save(); g.globalCompositeOperation="lighter";
  for(let i=0;i<28;i++){ const t=match.frame*.25, x=((i*137.5+t*(0.4+i%5*.15))%(VW+40))-20, y=540-((i*71.3+t*(0.3+i%3*.2))%560);
    g.globalAlpha=.25+.2*Math.sin(match.frame*.05+i); g.fillStyle=i%3?"#ffb3e6":"#9be9ff"; g.beginPath(); g.arc(x,y,1.2+i%3*.7,0,7); g.fill(); }
  g.restore();
  const v=g.createRadialGradient(VW/2,300,Math.min(VW,540)*.45,VW/2,300,Math.max(VW,540)*.85);
  v.addColorStop(0,"rgba(13,7,24,0)"); v.addColorStop(1,"rgba(13,7,24,.6)"); g.fillStyle=v; g.fillRect(0,0,VW,540);
}
function text(t,x,y,size,col,align="center",font="Bungee"){ g.font=`${size}px ${font}, Impact, sans-serif`; g.textAlign=align; g.lineWidth=Math.max(3,size/7); g.strokeStyle="#0d0718"; g.lineJoin="round"; g.strokeText(t,x,y); g.fillStyle=col; g.fillText(t,x,y); }
// Slanted arcade bar. pct fills from the outside edge toward the centre when rev is true.
function bar(x,y,w,h,pct,rev,c1,c2,ghost){
  const sk=h*.45, path=(a,b)=>{ g.beginPath(); g.moveTo(a+sk,y); g.lineTo(b+sk,y); g.lineTo(b,y+h); g.lineTo(a,y+h); g.closePath(); };
  path(x,x+w); g.fillStyle="rgba(13,7,24,.85)"; g.fill();
  const seg=q=>{ const pw=w*Math.max(0,Math.min(1,q)); return rev?[x+w-pw,x+w]:[x,x+pw]; };
  if(ghost!=null && ghost>pct){ path(...seg(ghost)); g.fillStyle="#ff4d6d"; g.fill(); }
  if(pct>0){ path(...seg(pct)); const gr=g.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,c1); gr.addColorStop(1,c2); g.fillStyle=gr; g.fill();
    g.save(); g.clip(); g.fillStyle="rgba(255,255,255,.28)"; g.fillRect(x,y,w+sk,h*.35); g.restore(); }
  path(x,x+w); g.strokeStyle="#f6eefc"; g.lineWidth=2; g.stroke();
}
const FACE={ crimson:[150,5,180], afterhours:[170,15,170], marcoss:[165,0,180], kom:[150,12,185] };   // face crop (x, y, size) in each select portrait
function portrait(f,cx,cy,r,col){
  const [sx,sy,ss]=FACE[f.key], sp=IMG["win_"+f.key], q=sp.width/506;
  g.save(); g.beginPath(); g.arc(cx,cy,r,0,7); g.clip(); g.drawImage(sp,sx*q,sy*q,ss*q,ss*q,cx-r,cy-r,r*2,r*2);
  if(f.state==="ko"){ g.fillStyle="rgba(13,7,24,.6)"; g.fillRect(cx-r,cy-r,r*2,r*2); } g.restore();
  g.beginPath(); g.arc(cx,cy,r,0,7); g.strokeStyle=col; g.lineWidth=3; g.shadowColor=col; g.shadowBlur=8*DPR; g.stroke(); g.shadowBlur=0;
}
function drawHUD(){
  const {p1,p2}=match, C=VW/2, x0=74, bw=C-x0-42, ns=VW<700?19:22;
  for(const f of [p1,p2]) f.hpLag = (f.hpLag==null||f.hpLag<f.hp) ? f.hp : f.hpLag+(f.hp-f.hpLag)*.045;
  const hpc=f=>f.hp>30?["#ffe27a","#ff9d2e"]:["#ff8a8a","#d81e3f"];
  bar(x0,20,bw,26,p1.hp/100,true,...hpc(p1),p1.hpLag/100);
  bar(VW-x0-bw-12,20,bw,26,p2.hp/100,false,...hpc(p2),p2.hpLag/100);
  const mc=f=>f.meter>=100?(Math.floor(match.frame/8)%2?["#fff3b0","#ffc642"]:["#ffc642","#ff9d2e"]):["#8ff0ff","#2a8cff"];
  bar(x0-6,52,bw*.62,10,p1.meter/100,false,...mc(p1));
  bar(VW-x0-bw*.62-2,52,bw*.62,10,p2.meter/100,true,...mc(p2));
  portrait(p1,40,42,27,"#ff3fb4"); portrait(p2,VW-40,42,27,"#45e0ff");
  text(p1.c.name,x0-8,88,ns,"#f6eefc","left"); text(p2.c.name,VW-x0+8,88,ns,"#f6eefc","right");
  for(let i=0;i<2;i++){ for(const [f,x] of [[p1,x0+bw-6-i*20],[p2,VW-x0-bw+6+i*20]]){ const on=i<f.wins;
      g.beginPath(); g.arc(x,72,7,0,7); g.fillStyle=on?"#ffc642":"rgba(13,7,24,.8)"; if(on){ g.shadowColor="#ffc642"; g.shadowBlur=8*DPR; } g.fill(); g.shadowBlur=0;
      g.strokeStyle="#f6eefc"; g.lineWidth=1.5; g.stroke(); } }
  text(String(match.timer).padStart(2,"0"),C+4,58,42,match.timer<=10?"#ff4d4d":"#f6eefc");
  if(p1.meter>=100) text("SUPER READY · press Special",x0-8,112,15,"#ffc642","left","Chakra Petch");
  match.calls.forEach((c,i)=>{ g.globalAlpha=Math.min(1,(70-c.t)/20); g.shadowColor=c.color; g.shadowBlur=12*DPR; text(c.text,C,152+i*32,VW<700?24:28,c.color); g.shadowBlur=0; g.globalAlpha=1; });
  if(match.banner){ const b=match.banner, s=b.t<10?1.6-.6*(b.t/10):1, big=VW<700?(b.text.length>6?60:80):(b.text.length>6?72:96);
    g.save(); g.translate(C,215); g.scale(s,s); g.globalAlpha=Math.min(1,b.t/6); g.transform(1,0,-0.16,1,0,0);   // italic slant like the K.O. card
    const fat=(t,y,sz,col)=>{ g.font=`${sz}px Bungee, Impact, sans-serif`; g.textAlign="center"; g.lineJoin="round"; g.lineWidth=sz*0.2; g.strokeStyle="#12081c"; g.strokeText(t,0,y); g.fillStyle=col; g.fillText(t,0,y); };
    g.shadowColor="#ff3fb4"; g.shadowBlur=24*DPR; fat(b.text,0,big,"#ff3fb4"); g.shadowBlur=0;
    if(b.sub) fat(b.sub+(b.text==="K.O."?"!":""),big*0.55,VW<700?30:38,"#ffd21f"); g.restore(); }
}
let titleDiff=[];
function plain(t,x,y,size,col,font="Bungee"){ g.font=`${size}px ${font}, Impact, sans-serif`; g.textAlign="center"; g.fillStyle=col; g.fillText(t,x,y); }
function slant(x,y,w,h,sk){ g.beginPath(); g.moveTo(x+sk,y); g.lineTo(x+w,y); g.lineTo(x+w-sk,y+h); g.lineTo(x,y+h); g.closePath(); }
function drawTitle(){
  const C=VW/2, F=match.frame, small=VW<700, touch=document.body.classList.contains("touch");
  // backdrop: the street at night, washed pink (your side) and cyan (CPU side), with light bands sweeping across
  camX=(960-VW)/2; drawStage(); g.fillStyle="rgba(13,7,24,.78)"; g.fillRect(0,0,VW,540);
  const wash=g.createLinearGradient(0,0,VW,0); wash.addColorStop(0,"rgba(255,63,180,.24)"); wash.addColorStop(.5,"rgba(0,0,0,0)"); wash.addColorStop(1,"rgba(69,224,255,.22)");
  g.fillStyle=wash; g.fillRect(0,0,VW,540);
  g.save(); g.globalCompositeOperation="lighter";
  for(let i=0;i<9;i++){ const x=((i*170+F*1.3)%(VW+520))-260; g.fillStyle=i%2?"rgba(255,63,180,.055)":"rgba(69,224,255,.055)";
    g.beginPath(); g.moveTo(x,540); g.lineTo(x+70,540); g.lineTo(x+310,0); g.lineTo(x+240,0); g.fill(); }
  g.restore();
  drawAtmosphere();
  // neon logo with an occasional flicker
  const fl=Math.sin(F*.9)>.965?.35:1;
  g.shadowColor="#45e0ff"; g.shadowBlur=20*DPR*fl; g.globalAlpha=.55+.45*fl; text("BEALE STREET",C,48,small?38:48,"#45e0ff"); g.globalAlpha=1;
  g.shadowColor="#ff3fb4"; g.shadowBlur=(26+6*Math.sin(F*.08))*DPR; text("BRAWL",C,102,small?58:70,"#ff3fb4"); g.shadowBlur=0;
  plain("M E M P H I S ,   T E N N E S S E E",C,122,small?10:11,"#ffc642","Chakra Petch");
  // fighter cards: tap one to play as that fighter; the CPU gets a random one of the others
  const n=KEYS.length, gap=small?8:14, cw=Math.min(210,(VW-40-gap*(n-1))/n), ch=206, top=132, sk=12, rowW=cw*n+gap*(n-1);
  KEYS.forEach((k,i)=>{
    const on=match.sel===i, c=ROSTER[k], col="#ff3fb4";
    const pop=on ? 1+.07*Math.max(0,1-(F-(match.selT||-99))/10) : .94;
    const cx=C-rowW/2+cw/2+i*(cw+gap);
    titleCards[i]=[cx-cw/2,top,cw,ch];
    g.save(); g.translate(cx,top+ch/2); g.scale(pop,pop); g.translate(-cw/2,-ch/2);
    slant(0,0,cw,ch,sk); g.shadowColor=col; g.shadowBlur=(on?22+8*Math.sin(F*.1):0)*DPR; g.fillStyle="#0d0718"; g.fill(); g.shadowBlur=0;
    g.save(); slant(0,0,cw,ch,sk); g.clip();
    const sp=IMG["win_"+k], z=on?1.1+.035*Math.sin(F*.035):1.02, sc=Math.max(cw/sp.width,ch/sp.height)*z, sw=cw/sc, sh=ch/sc;
    if(!on) g.filter="grayscale(.7) brightness(.55)";
    g.drawImage(sp,(sp.width-sw)/2,(sp.height-sh)*.08,sw,sh,0,0,cw,ch); g.filter="none";
    const fade=g.createLinearGradient(0,ch-90,0,ch); fade.addColorStop(0,"rgba(13,7,24,0)"); fade.addColorStop(.7,"rgba(13,7,24,.92)"); g.fillStyle=fade; g.fillRect(0,ch-90,cw,90);
    if(on){ const sx=((F*5)%(cw*4))-cw; g.globalCompositeOperation="lighter"; g.fillStyle="rgba(255,255,255,.16)";      // shine sweep
      g.beginPath(); g.moveTo(sx,ch); g.lineTo(sx+44,ch); g.lineTo(sx+110,0); g.lineTo(sx+66,0); g.fill(); g.globalCompositeOperation="source-over"; }
    g.restore();
    slant(0,0,cw,ch,sk); g.strokeStyle=on?col:"#4a3a70"; g.lineWidth=on?4:2; g.stroke();
    if(on){ slant(sk-4,-10,52,22,6); g.fillStyle="#ff3fb4"; g.fill(); g.strokeStyle="#fff"; g.lineWidth=1.5; g.stroke(); plain("YOU",sk+22,6,12,"#fff"); }
    text(c.name,cw/2-3,ch-26,small?(n>3?14:18):24,on?"#ffc642":"#b9aacf");
    plain((small||n>3)?c.style.split("  ·  ")[0]:c.style,cw/2-3,ch-10,small?8:11,on?"#f6eefc":"#8d7fa8","Chakra Petch");
    g.restore();
  });
  // stage row: thumbnails of each location
  const sh=46, sy=348;
  const stw=(rowW-gap*(STAGES.length-1))/STAGES.length;
  STAGES.forEach((st,i)=>{ const cw=stw, x=C-rowW/2+i*(cw+gap), on=match.stage===i, im=IMG[st.key]; titleStage[i]=[x,sy,cw,sh];
    g.save(); slant(x,sy,cw,sh,8); g.clip(); const sc=Math.max(cw/im.width,sh/im.height), sw=cw/sc, shh=sh/sc;
    if(!on) g.filter="brightness(.5) saturate(.6)"; g.drawImage(im,(im.width-sw)/2,(im.height-shh)*.42,sw,shh,x,sy,cw,sh); g.filter="none";
    g.fillStyle="rgba(13,7,24,.45)"; g.fillRect(x,sy+sh-17,cw,17); g.restore();
    slant(x,sy,cw,sh,8); g.strokeStyle=on?"#ffc642":"#4a3a70"; g.lineWidth=on?3:1.5; if(on){ g.shadowColor="#ffc642"; g.shadowBlur=10*DPR; } g.stroke(); g.shadowBlur=0;
    plain(small?st.name.replace("MIDSOUTH ",""):st.name,x+cw/2-2,sy+sh-5,small?9.5:11,on?"#ffc642":"#c9bce0"); });
  // difficulty: three tappable pills
  const L=Object.keys(LEVELS), pw=small?86:100, pg=8, px0=C-(pw*3+pg*2)/2;
  L.forEach((lv,i)=>{ const x=px0+i*(pw+pg), on=match.level===lv; titleDiff[i]=[x,404,pw,26];
    slant(x,404,pw,26,8); g.fillStyle=on?"#ffc642":"rgba(26,16,48,.85)"; if(on){ g.shadowColor="#ffc642"; g.shadowBlur=12*DPR; } g.fill(); g.shadowBlur=0;
    g.strokeStyle=on?"#fff3b0":"#4a3a70"; g.lineWidth=1.5; g.stroke(); plain(lv,x+pw/2,423,14,on?"#0d0718":"#b9aacf"); });
  // fight button
  const bw=Math.min(300,VW-90), pulse=1+.035*Math.sin(F*.14);
  g.save(); g.translate(C,470); g.scale(pulse,pulse);
  slant(-bw/2,-22,bw,44,12); const bg=g.createLinearGradient(0,-22,0,22); bg.addColorStop(0,"#ff6ac6"); bg.addColorStop(1,"#c2187f");
  g.shadowColor="#ff3fb4"; g.shadowBlur=(18+8*Math.sin(F*.14))*DPR; g.fillStyle=bg; g.fill(); g.shadowBlur=0; g.strokeStyle="#fff"; g.lineWidth=2; g.stroke();
  text(touch?"TAP TO FIGHT":"PRESS ENTER TO FIGHT",0,8,small?22:22,"#fff"); g.restore();
  plain(touch?"Tap a fighter and a stage":"◀ ▶ fighter   ·   ▲ ▼ difficulty   ·   K stage",C,526,12,"#c9bce0","Chakra Petch");
}
// Animated victory clips, stored as grids of 400px frames: {columns, frame count, frames per second}
// `order` is the playlist of frame numbers; clips play forward then backward so loops never jump.
const seq=(a,b)=>{ const o=[]; for(let i=a; a<=b?i<=b:i>=b; i+=a<=b?1:-1) o.push(i); return o; };
const VICTORY={
  crimson:{ cols:8, fps:10, fw:320, fh:320, order:[...seq(0,62), ...Array(8).fill(62), ...seq(61,1)] },
  afterhours:{ cols:7, fps:10, fw:320, fh:320, order:[...seq(0,38), ...Array(8).fill(38), ...seq(37,1)] },
  marcoss:{ cols:7, fps:8, fw:320, fh:320, order:[...seq(0,42), ...Array(8).fill(42), ...seq(41,1)] },
  kom:{ cols:6, fps:6, fw:480, fh:270, order:[...seq(0,29), ...Array(8).fill(29), ...seq(28,1)], wide:true },
};
function drawResult(){
  const C=VW/2, w=match.winner, you=w===match.p1, sp=IMG["va_"+w.key], va=VICTORY[w.key];
  const i=va.order[Math.floor((match.frame-match.resultStart)*va.fps/60)%va.order.length];
  const fx=(i%va.cols)*va.fw, fy=Math.floor(i/va.cols)*va.fh, sc=Math.max(VW/va.fw,540/va.fh), sw=VW/sc, sh=540/sc;
  if(va.wide && VW/540 < va.fw/va.fh*.9){
    // widescreen clip on a tall screen: show the whole picture over a dimmed, blurred copy of itself
    g.filter="blur(14px) brightness(.35)"; g.drawImage(sp, fx+(va.fw-sw)/2, fy, sw, sh, -20,-20,VW+40,580); g.filter="none";
    const h=VW*va.fh/va.fw; g.drawImage(sp, fx, fy, va.fw, va.fh, 0, 70, VW, h);
  } else g.drawImage(sp, fx+(va.fw-sw)/2, fy+(va.fh-sh)*.35, sw, sh, 0,0,VW,540);
  const gr=g.createLinearGradient(0,0,0,540); gr.addColorStop(0,"rgba(13,7,24,0)"); gr.addColorStop(.68,"rgba(13,7,24,0)"); gr.addColorStop(1,"rgba(13,7,24,.92)"); g.fillStyle=gr; g.fillRect(0,0,VW,540);
  // text sits at the bottom so it never covers a face
  text(you?"YOU WIN":"YOU LOSE",C,462,VW<700?54:64,you?"#ffc642":"#ff4d4d");
  text(w.c.name+" OWNS BEALE",C,492,VW<700?18:22,"#f6eefc");
  if(Math.floor(match.frame/30)%2) text(document.body.classList.contains("touch")?"TAP TO CONTINUE":"PRESS ENTER",C,526,18,"#45e0ff");
}
function render(){
  g.setTransform(DPR,0,0,DPR,0,0); g.imageSmoothingEnabled=true; g.imageSmoothingQuality="high";
  g.save();
  if(match.shake) g.translate((Math.random()-.5)*match.shake,(Math.random()-.5)*match.shake);
  if(match.screen==="title") drawTitle();
  else if(match.screen==="result") drawResult();
  else {
    // Camera eases toward the fighters' midpoint, clamped to the stage
    const mid=(match.p1.x+match.p2.x)/2, target=Math.max(0,Math.min(960-VW, mid-VW/2));
    camX += (target-camX)*0.15;
    drawStage();
    // Super move: dim the street and streak the air so the move owns the screen
    const sup=[match.p1,match.p2].find(f=>f.state==="attack"&&f.move&&f.move.superMove);
    if(sup){ g.fillStyle="rgba(13,7,24,.62)"; g.fillRect(0,0,VW,540); g.save(); g.globalCompositeOperation="lighter"; g.strokeStyle="rgba(255,198,66,.35)"; g.lineWidth=2;
      for(let i=0;i<18;i++){ const y=(i*53+match.frame*23)%540, x=(i*197)%VW; g.beginPath(); g.moveTo(x,y); g.lineTo(x+140,y-14); g.stroke(); } g.restore(); }
    g.save(); g.translate(-camX,0);
    const order=[match.p1,match.p2].sort((a,b)=>(a.state==="attack")-(b.state==="attack"));
    order.forEach(drawFighter);
    for(const q of match.projectiles){ g.save(); g.globalCompositeOperation="lighter";
      for(let i=10;i>=0;i--){ g.globalAlpha=.16; g.fillStyle=q.color; g.beginPath(); g.arc(q.x-q.vx*i*2.2,q.y+Math.sin(q.t*.6+i)*3,40-i*3,0,7); g.fill(); }
      g.globalAlpha=.9; g.fillStyle="#ffffff"; g.beginPath(); g.arc(q.x,q.y,16+Math.sin(q.t*.5)*4,0,7); g.fill();
      g.strokeStyle=q.color; g.lineWidth=3; for(let i=0;i<6;i++){ const a=q.t*.3+i; g.beginPath(); g.moveTo(q.x,q.y); g.lineTo(q.x+Math.cos(a)*48,q.y+Math.sin(a)*48); g.stroke(); }
      g.restore(); }
    // impact rings + streak sparks, additive so they glow
    g.save(); g.globalCompositeOperation="lighter"; g.lineCap="round";
    match.rings=match.rings.filter(r=>match.frame-r.born<13);
    for(const r of match.rings){ const a=match.frame-r.born, u=1-a/13;
      if(a<3){ g.globalAlpha=.8; g.fillStyle="#fff"; g.beginPath(); g.arc(r.x,r.y,34-a*6,0,7); g.fill(); }
      g.globalAlpha=u; g.strokeStyle=r.c; g.lineWidth=1+6*u; g.beginPath(); g.arc(r.x,r.y,14+a*8,0,7); g.stroke(); }
    for(const s of match.sparks){ g.globalAlpha=Math.min(1,s.l/14); g.strokeStyle=s.c; g.lineWidth=3.5;
      g.beginPath(); g.moveTo(s.x,s.y); g.lineTo(s.x-s.vx*2.6,s.y-s.vy*2.6); g.stroke(); }
    g.restore();
    g.restore();
    drawAtmosphere();
    drawHUD();
  }
  g.restore();
}

/* ---------- Main loop: fixed 60 Hz simulation, render every animation frame ---------- */
let acc=0, last=performance.now();
function loop(now){
  acc += Math.min(100, now-last); last=now;
  while(acc>=1000/60){ step(); for(const k in pressed) pressed[k]=false; acc-=1000/60; }
  render(); requestAnimationFrame(loop);
}
Promise.all([ load("crimson","assets/nicole-sprites.webp"), load("afterhours","assets/keelah-sprites.webp"), load("bg","assets/stage-beale-street.jpg"), load("kom","assets/kom-sprites.webp"), load("win_kom","assets/select-kom.jpg"), load("va_kom","assets/victory-kom.webp"), load("marcoss","assets/marcoss-sprites.webp"), load("bg_palace","assets/stage-crystal-palace.jpg"), load("bg_coliseum","assets/stage-midsouth-coliseum.jpg"), load("win_marcoss","assets/select-marcoss.jpg"), load("va_marcoss","assets/victory-marcoss.webp"), load("win_crimson","assets/select-nicole.jpg"), load("win_afterhours","assets/select-keelah.jpg"), load("va_crimson","assets/victory-nicole.webp"), load("va_afterhours","assets/victory-keelah.webp") ])
  .then(()=>requestAnimationFrame(loop));
