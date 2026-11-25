/* ==========================================================================
   THE ROOM: the whole site is one little ice cream bar.
   Back wall with the sign, a soft-serve machine (the machine that guesses),
   a counter with a plate, a glass case of flavor tubs, shelves of toppings and
   decorations, and the Memory Freezer in the corner. Making, eating and the
   verdict all happen here; anything with words to read or type opens in a
   small window.
   The scene is drawn in a 1500 × 900 box. On a computer it is scaled to fit the
   screen; on a phone it keeps its height and scrolls sideways, about one part
   of the room per screen.
   ========================================================================== */
const ROOM_W = 1500, ROOM_H = 900;
// x, y, width, height in room units, as CSS for an absolutely placed thing
const at = (x, y, w, h) => `left:calc(${x} * var(--u));top:calc(${y} * var(--u));width:calc(${w} * var(--u));${h != null ? `height:calc(${h} * var(--u));` : ''}`;
// the parts of the room, left to right (the phone snaps to these)
const ROOM_ZONES = { freezer: [0, 300], machine: [300, 600], counter: [600, 900], shelves: [900, 1200], case: [1200, 1500] };
let roomScrollKeep = null;   // where the phone was scrolled, kept across redraws of the same room

function roomMode() {
  if (game) return 'play';
  return draft ? 'making' : 'idle';
}

// The fixed drawing behind everything: wall, sign, shelves, counter, machine, case, freezer.
// Flat colours; the grain comes from the riso filter and the paper texture over the page.
function roomBackSVG() {
  const tiles = [];
  for (let x = -600, i = 0; x < 2100; x += 64, i++) tiles.push(`<rect x="${x}" y="866" width="64" height="640" fill="${i % 2 ? '#E3EEF1' : '#F8F6F0'}"/>`);
  const stripes = [];
  for (let x = 284; x < 2100; x += 96) stripes.push(`<rect x="${x}" y="630" width="38" height="206" fill="#F3FAFC"/>`);
  return `<svg class="room-back" viewBox="0 0 ${ROOM_W} ${ROOM_H}" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <pattern id="rmDots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.4" fill="#FFFFFF" opacity=".55"/></pattern>
    <pattern id="rmDotsInk" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#8B5E45" opacity=".16"/></pattern>
  </defs>
  <rect x="-600" y="-600" width="2700" height="1470" fill="#F1F2F2"/>
  <rect x="-600" y="478" width="2700" height="10" fill="#E6E8E8"/>
  ${tiles.join('')}
  <rect x="-600" y="866" width="2700" height="6" fill="#D9E4E8"/>

  <!-- the shop sign, top left: a soft serve on a waffle cone, hanging from an iron arm -->
  <defs><clipPath id="rmConeClip"><path d="M90 222 H282 L188 378 Z"/></clipPath></defs>
  <g class="rm-riso" transform="translate(0 26)">
    <rect x="0" y="22" width="14" height="56" rx="4" fill="#8B5E45"/>
    <path d="M10 36 H338" stroke="#8B5E45" stroke-width="7" stroke-linecap="round"/>
    <path d="M14 68 L118 36" stroke="#8B5E45" stroke-width="5" stroke-linecap="round"/>
    <path d="M338 36 q16 0 16 13 q0 11 -11 11 q-8 0 -8 -8" fill="none" stroke="#8B5E45" stroke-width="5" stroke-linecap="round"/>
    <path d="M132 36 V106 M240 36 V106" stroke="#B9A396" stroke-width="4" stroke-dasharray="5 4"/>
    <path d="M90 222 H282 L188 378 Z" fill="#F6C77F"/>
    <g clip-path="url(#rmConeClip)"><path d="${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `M${40 + k * 34} 210 l120 180 M${300 - k * 34} 210 l-120 180`).join(' ')}" stroke="#E7A75C" stroke-width="5"/><rect x="80" y="210" width="220" height="180" fill="url(#rmDotsInk)"/></g>
    <rect x="80" y="206" width="212" height="22" rx="8" fill="#FFE29A"/>
    <g fill="#FFF8EE" stroke="#F4BFCB" stroke-width="4">
      <rect x="70" y="162" width="232" height="50" rx="25"/>
      <rect x="98" y="126" width="176" height="46" rx="23"/>
      <rect x="126" y="94" width="122" height="42" rx="21"/>
      <path d="M150 100 C150 72 176 66 196 60 C206 57 212 48 210 38 C226 52 224 80 200 94 Z"/>
    </g>
    <path d="M96 182 q60 -14 150 -4 M124 144 q50 -10 112 -2 M150 110 q30 -6 70 -1" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>
    <g>${[[78, 186], [296, 186], [104, 148], [270, 148], [132, 114], [244, 114]].map(([x, y], i) => `<circle class="rm-bulb b${i % 3}" cx="${x}" cy="${y}" r="5.5" fill="#FFE9A3"/>`).join('')}</g>
  </g>

  <!-- the wall shelves: shapes, toppings, decorations -->
  <g class="rm-riso">
    ${[150, 262, 374].map(y => `<rect x="926" y="${y}" width="560" height="18" rx="4" fill="#EBC197"/><rect x="926" y="${y + 14}" width="560" height="4" fill="#D9A877"/><path d="M960 ${y + 18} v22 h16 M1452 ${y + 18} v22 h-16" stroke="#D9A877" stroke-width="7" fill="none"/>`).join('')}
  </g>

  <!-- the counter -->
  <rect x="284" y="626" width="1820" height="212" fill="#9BD0E5"/>
  ${stripes.join('')}
  <rect x="284" y="626" width="1820" height="212" fill="url(#rmDots)" opacity=".5"/>
  <rect x="284" y="836" width="1820" height="30" fill="#6FB6D2"/>
  <rect x="274" y="594" width="1830" height="34" rx="8" fill="#FFFBF3"/>
  <rect x="274" y="622" width="1830" height="8" fill="#EDE3D6"/>

  <!-- the soft-serve machine: the one that guesses -->
  <g class="rm-riso">
    <ellipse cx="464" cy="598" rx="150" ry="9" fill="#8B5E45" opacity=".1"/>
    <rect x="330" y="560" width="268" height="38" rx="10" fill="#F2D3BC"/>
    <rect x="346" y="396" width="236" height="170" rx="16" fill="#FFF6EA"/><rect x="548" y="396" width="34" height="170" rx="0" fill="#F3E4D3"/><rect x="346" y="396" width="236" height="170" rx="16" fill="none"/>
    <rect x="374" y="530" width="180" height="16" rx="6" fill="#E6DED6"/>
    <rect x="334" y="300" width="260" height="106" rx="26" fill="#FFB9CB"/><rect x="334" y="300" width="260" height="30" rx="15" fill="#FFCAD7"/>
    <rect x="370" y="318" width="188" height="64" rx="14" fill="#86C2D6"/>
    <g fill="#E3DCD5">${[402, 464, 526].map(x => `<rect x="${x - 15}" y="404" width="30" height="34" rx="6"/><path d="M${x - 9} 438 L${x + 9} 438 L${x + 4} 456 L${x - 4} 456 Z"/>`).join('')}</g>
  </g>

  <!-- the glass case of flavor tubs -->
  <g class="rm-riso">
    <ellipse cx="1206" cy="598" rx="290" ry="9" fill="#8B5E45" opacity=".1"/>
    <rect x="924" y="552" width="564" height="44" rx="10" fill="#FFF8EE"/><rect x="924" y="578" width="564" height="10" fill="#FFCFDA"/>
    <rect x="934" y="404" width="544" height="152" rx="10" fill="#E3F1F6"/>
    <rect x="924" y="390" width="564" height="20" rx="8" fill="#FFF8EE"/>
  </g>

  <!-- the Memory Freezer, in the corner -->
  <g class="rm-riso">
    <ellipse cx="160" cy="866" rx="150" ry="11" fill="#8B5E45" opacity=".1"/>
    <path d="M30 610 H290 L282 848 Q281 858 270 858 H50 Q39 858 38 848 Z" fill="#C9E6F0"/>
    <path d="M30 610 H290 L282 848 Q281 858 270 858 H50 Q39 858 38 848 Z" fill="url(#rmDots)" opacity=".6"/>
    <rect x="34" y="664" width="252" height="22" fill="#FFCFDA"/>
    <path d="M16 590 Q16 572 34 572 H286 Q304 572 304 590 V606 Q304 618 290 618 H30 Q16 618 16 606 Z" fill="#FFFBF3"/>
    <path d="M38 578 H282 L292 600 H28 Z" fill="#DDEFF5"/>
    <g opacity=".9"><path d="M64 598 q0 -26 20 -26 q20 0 20 26 l-6 -5 l-7 5 l-7 -5 l-7 5 l-7 -5z" fill="#FFFFFF"/><rect x="124" y="570" width="26" height="30" rx="8" fill="#FFC6D5"/><path d="M184 600 l12 -26 l12 26z" fill="#F2CD95"/><circle cx="196" cy="575" r="12" fill="#FFF6D6"/><rect x="238" y="574" width="22" height="26" rx="6" fill="#D0D2FB"/></g>
    <rect x="122" y="700" width="76" height="12" rx="6" fill="#FFFBF3"/>
    <g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85">${[[64, 770, 9], [246, 800, 7], [224, 730, 5]].map(([x, y, s]) => `<path d="M${x} ${y - s} V${y + s} M${x - s * .87} ${y - s / 2} L${x + s * .87} ${y + s / 2} M${x - s * .87} ${y + s / 2} L${x + s * .87} ${y - s / 2}"/>`).join('')}</g>
  </g>
</svg>`;
}
// The glass in front of the tubs, drawn over them
const ROOM_GLASS = `<svg class="room-glass" viewBox="924 390 564 170" preserveAspectRatio="none" aria-hidden="true">
  <rect x="934" y="404" width="544" height="152" fill="#DDEFF6" opacity=".18"/>
  <path d="M968 414 L948 520 M1002 414 L980 540 M1430 420 L1410 520" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".55"/></svg>`;

// one flavor tub, seen from the front: a pan with the flavor heaped in it
function tubSVG(k) {
  const f = FLAVORS[k], id = 'tb' + (++svgId);
  const mound = 'M5 27 Q3 3 30 3 Q57 3 55 27 Z';
  return `<svg viewBox="0 0 60 54" aria-hidden="true"><g class="rm-riso">
    <clipPath id="${id}"><path d="${mound}"/></clipPath>
    <path d="${mound}" fill="${f.base}"/>
    <g clip-path="url(#${id})"><g transform="translate(30 15) scale(.46)">${flavorBits(f, 0, 0, 50, 22, 9, null)}</g></g>
    <rect x="2" y="25" width="56" height="27" rx="5" fill="#E8E3DD"/><rect x="2" y="25" width="56" height="6" fill="#F6F2EE"/></g></svg>`;
}
// a glass jar on a shelf, its contents inside
function jarHTML(act, k, thumb, label, on, cls) {
  return `<button class="rm-jar ${cls} ${on ? 'on' : ''}" data-act="${act}" data-val="${k}" aria-pressed="${!!on}" aria-label="${esc(label)}" title="${esc(label)}">
    <span class="jar-lid"></span><span class="jar-glass">${thumb}</span></button>`;
}

// What the machine's little screen says
function machineScreenHTML(mode) {
  if (mode === 'play') {
    const g = game;
    return `<span class="ms-small">MACHINE SAYS ${g.prediction.predictedBites}</span><span class="melty ms-big" id="counter" aria-live="polite">BITE ${g.bites}</span>`;
  }
  if (mode === 'making') {
    const d = draft, ready = d.form && d.flavor;
    return `<span class="ms-small">${ready ? 'READY WHEN YOU ARE' : !d.form ? 'PICK A SHAPE' : 'PICK A FLAVOR'}</span><span class="melty ms-big">${ready ? 'PULL ME' : '…'}</span>`;
  }
  return `<span class="ms-small">PRESS TO</span><span class="melty ms-big">MAKE ONE</span>`;
}

// The order slip on the front of the counter: the things with words
function ticketHTML() {
  const d = draft;
  const place = d.place === PLACE_OTHER_LABEL ? d.placeOther : d.place;
  const row = (k, label, value, empty) => `<button class="tk-row" data-act="openTicket" data-val="${k}"><span class="chunky tk-k">${esc(label)}</span><span class="tk-v ${value ? '' : 'tk-blank'}" ${value ? 'data-noi18n' : ''}>${esc(value || empty)}</span><span class="tk-edit" aria-hidden="true">✎</span></button>`;
  return `<div class="rm-ticket" id="ticket">
    <div class="chunky tk-head">YOUR ORDER</div>
    ${row('name', 'NAME', d.name, 'What’s it called?')}
    ${row('place', 'FROM', place, 'Where’s it from?')}
    ${row('why', 'WHY', d.reason ? REASONS[d.reason].label : '', 'Why did you buy it?')}
    <button class="btn c-strawberry tk-go" data-act="enterArena">ENTER THE ARENA</button>
    <button class="link tk-nope" data-act="benchResisted">Actually, I didn’t buy it</button>
  </div>`;
}
// What sits on the front of the counter while eating
function biteControlsHTML() {
  const g = game;
  return `<div class="rm-ticket rm-bitebar">
    <div class="status" id="status" aria-live="polite">${esc(biteStatus(g))}</div>
    <div class="pair">
      <button class="btn c-white" data-act="done">I’M DONE.</button>
      <button class="btn c-pistachio" data-act="finished">I FINISHED IT</button>
    </div>
    <div class="undo"><span id="undoWrap" ${g.bites ? '' : 'style="visibility:hidden"'}><button class="link" data-act="undoBite">Oops, that wasn’t a bite</button></span><button class="link" data-act="goQuick">Quick record</button></div>
  </div>`;
}

// The room, with whatever is happening in it. `win` is a small window on top.
function screenRoom(win) {
  const mode = roomMode();
  if (!win) setFlood('#F1F2F2', null, '#F1F2F2');
  const d = draft, g = game;
  const entries = allEntries();
  const last = entries[entries.length - 1];
  const idleLine = last && !last.isDemo ? (isResisted(last) ? 'Last time, you resisted. The machine is still recovering.' : `The last one lasted ${plural(last.actualBites)}.`) : pick(COPY.home.quips);
  const thumbFlavor = d && d.flavor ? d.flavor : 'blank';
  const on = (list, k) => !!(d && list.includes(k));

  // the plate: the ice cream being made, or the one being eaten
  let plate;
  if (mode === 'play' && (g.stage === 'bite' || !win)) {
    plate = `<div class="rm-arena" id="arena" style="${at(566, 60, 360, 554)}">
      <div class="machine-say" id="machineSay" role="status" aria-live="polite"></div>
      <button class="arena-btn rm-bite ${g.bites ? '' : 'untouched'}" id="biteBtn" data-act="${g.stage === 'bite' ? 'bite' : 'resume'}" aria-label="Take a bite of ${esc(g.name)}">
        <span class="chr wobble" id="biteChar">${iceCream({ form: g.form, flavor: g.flavor, toppings: g.toppings, decor: g.decor, bites: g.bites, mood: moodFor(g), falling: g.bites > 0, label: g.name })}</span>
        <span class="tap-ring" aria-hidden="true"></span>
        <span class="chunky tap-chip">${esc(COPY.tapToBite)}</span>
      </button></div>`;
  } else if (mode === 'play') {
    plate = `<div class="rm-plate-ic" style="${at(566, 60, 360, 554)}">${iceCream({ form: g.form, flavor: g.flavor, toppings: g.toppings, decor: g.decor, bites: g.bites, mood: g.stage === 'finish' ? 'cool' : g.stage === 'predict' || g.stage === 'loading' ? 'worried' : 'sad', label: g.name })}</div>`;
  } else {
    plate = `<div class="rm-stage" id="stage" style="${at(566, 60, 360, 554)}">
      <button class="preview wobble rm-preview" id="preview" data-act="${mode === 'idle' ? 'machine' : 'pokePreview'}" aria-label="${mode === 'idle' ? 'Make an ice cream' : 'Your ice cream'}">${mode === 'idle' ? idlePlateSVG() : benchIceCream()}</button>
      <div class="bubble rm-bubble" id="benchBubble" aria-live="polite">${mode === 'idle' ? `<span id="homeBubble">${esc(idleLine)}</span> <small>${esc('Press the machine, or pick anything.')}</small>` : esc(COPY.bench.start)}</div>
    </div>`;
  }
  const front = mode === 'making' ? ticketHTML() : mode === 'play' && g.stage === 'bite' ? biteControlsHTML() : '';
  const resume = mode === 'play';
  return `<section class="screen room-screen" id="roomScreen" data-mode="${mode}">
    <header class="room-top">
      <span class="top-right">${langToggleHTML()}<button class="link" data-go="about">About</button></span>
    </header>
    <div class="room-scroll" id="roomScroll">
    <div class="room" id="room">
      ${roomBackSVG()}
      ${Object.entries(ROOM_ZONES).map(([k, [a, b]]) => `<i class="rm-zone" data-zone="${k}" style="${at(a, 0, b - a, ROOM_H)}"></i>`).join('')}
      <h1 class="rm-sign" style="${at(26, 176, 330, 150)}" aria-label="Will you finish it?"><span>Will you</span><span>finish it?</span></h1>
      <span class="chunky rm-sign-sub" style="${at(40, 412, 300, 22)}">An ice cream survival game</span>

      <button class="rm-freezer" data-go="freezer" style="${at(14, 560, 296, 304)}" aria-label="The Memory Freezer"><span class="chunky rm-fz-name" style="${at(58, 172, 180, null)}">THE MEMORY FREEZER</span></button>
      ${mode === 'idle' ? `<button class="rm-ghost" data-act="iResisted" style="${at(200, 436, 120, 130)}">${ghostSVG('hmm', 'rl-ghost')}<span class="chunky">I resisted one</span></button>` : ''}

      <button class="rm-machine ${mode}" data-act="${mode === 'play' ? (g.stage === 'bite' ? 'bite' : 'resume') : mode === 'making' ? 'enterArena' : 'machine'}" style="${at(330, 296, 268, 300)}"
        aria-label="${mode === 'making' ? 'Enter the arena' : mode === 'play' ? 'The machine' : 'Make an ice cream'}">
        <span class="m-screen" style="${at(40, 22, 188, 64)}">${machineScreenHTML(mode)}</span>
        <span class="m-lever" style="${at(214, 104, 22, 70)}" aria-hidden="true"></span>
        ${mode !== 'play' ? `<span class="m-swirl" style="${at(104, 158, 60, 72)}" aria-hidden="true"></span>` : ''}
      </button>
      ${mode === 'making' ? `<button class="rm-dice" id="diceBtn" data-act="randomize" style="${at(884, 546, 50, 50)}" aria-label="${esc(COPY.bench.random)}" title="${esc(COPY.bench.random)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="#FFC6D5"/><g fill="#8B5E45"><circle cx="8.5" cy="8.5" r="1.7"/><circle cx="15.5" cy="8.5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="8.5" cy="15.5" r="1.7"/><circle cx="15.5" cy="15.5" r="1.7"/></g></svg></button>` : ''}

      <div class="rm-shelf rm-forms" id="trayForm" style="${at(944, 40, 524, 110)}">
        ${Object.entries(FORMS).map(([k, v]) => `<button class="rm-form ${d && d.form === k ? 'on' : ''}" data-act="pickForm" data-val="${k}" aria-pressed="${!!(d && d.form === k)}" aria-label="${esc(v.label)}" title="${esc(v.label)}"><span class="thumb" data-formthumb="${k}">${iceCream({ form: k, flavor: thumbFlavor, face: false })}</span></button>`).join('')}
        <span class="chunky rm-shelf-tag">SHAPE</span>
      </div>
      ${plate}
      <div class="rm-front" style="${at(596, 642, 308, 192)}">${front}</div>
      ${mode === 'play' ? `<span class="chunky rm-name" data-noi18n style="${at(600, 600, 300, null)}">${esc(g.name)}</span>` : ''}

      <div class="rm-shelf rm-tops" id="trayTopping" style="${at(944, 182, 524, 80)}">
        ${Object.entries(TOPPINGS).map(([k, v]) => jarHTML('pickTopping', k, benchThumbForTopping(k), v.label, on(d ? d.toppings : [], k), 'small')).join('')}
        <span class="chunky rm-shelf-tag">TOPPINGS</span>
      </div>
      <div class="rm-shelf rm-decor" id="trayDecor" style="${at(944, 290, 524, 84)}">
        ${Object.entries(DECORATIONS).map(([k, v]) => jarHTML('pickDecor', k, benchThumbForDecor(k), v.label, on(d ? d.decor : [], k), 'big')).join('')}
        <span class="chunky rm-shelf-tag">DECORATIONS</span>
      </div>
      <div class="rm-case" id="trayFlavor" style="${at(934, 406, 544, 148)}">
        ${Object.entries(FLAVORS).map(([k, v]) => `<button class="rm-tub ${d && d.flavor === k ? 'on' : ''}" data-act="pickFlavor" data-val="${k}" aria-pressed="${!!(d && d.flavor === k)}" aria-label="${esc(v.label)}" title="${esc(v.label)}">${tubSVG(k)}</button>`).join('')}
      </div>
      <div class="rm-glass-wrap" style="${at(924, 390, 564, 170)}">${ROOM_GLASS}</div>
      <span class="chunky rm-case-tag" id="flavorTag" style="${at(924, 552, 564, null)}">${d && d.flavor ? 'TODAY: ' + esc(FLAVORS[d.flavor].label) : 'FLAVORS'}</span>
    </div>
    </div>
    <div class="rm-swipe" aria-hidden="true"><span>‹</span><span>›</span></div>
    ${win ? `<div class="room-window-wrap" id="roomWindow"><div class="room-window">${resume ? '' : ''}${win}</div></div>` : ''}
  </section>`;
}
// an empty plate with a dotted outline: something goes here
function idlePlateSVG() {
  return `<svg class="ic" viewBox="-6 -72 272 422" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Empty plate">
    <g fill="none" stroke="#E3C9B9" stroke-width="5" stroke-dasharray="3 13" stroke-linecap="round"><path d="M60 176 L126 320 Q130 328 134 320 L200 176"/><path d="M48 150 Q48 38 130 38 Q212 38 212 150 Z"/></g>
    <text x="130" y="128" text-anchor="middle" font-family="Chubby Scoop, ZH Bold, sans-serif" font-size="60" fill="#EAD5C8">?</text></svg>`;
}

// The small windows: a screen's own content, in a card over the room
function roomWindowFor(route, param) {
  if (route === 'about') return screenAbout();
  if (route === 'resisted') return screenResisted(param);
  if (route === 'result') return screenResult(param);
  if (route === 'play' && game && game.stage !== 'bite') {
    return ({ loading: screenLoading, predict: screenPredict, quit: screenQuit, rest: screenRest, rebuy: screenRebuy, finish: screenFinish, quick: screenQuick }[game.stage] || (() => null))();
  }
  return null;
}

// After the room is drawn: keep the phone's place, or bring the right part into view
function afterRoom(prevMode) {
  const sc = document.getElementById('roomScroll');
  if (!sc || sc.scrollWidth <= sc.clientWidth + 4) return;
  const mode = roomMode();
  const zone = mode === 'idle' ? 'freezer' : 'counter';   // a phone opens at the left: the sign first
  if (roomScrollKeep != null && prevMode === mode) { sc.scrollLeft = roomScrollKeep; return; }
  scrollRoomTo(zone, false);
}
function scrollRoomTo(zone, smooth) {
  const sc = document.getElementById('roomScroll'), el = document.querySelector(`.rm-zone[data-zone="${zone}"]`);
  if (!sc || !el) return;
  const left = el.offsetLeft + el.offsetWidth / 2 - sc.clientWidth / 2;
  sc.scrollTo({ left: Math.max(0, left), behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
}
// on a phone, bring a shelf into view before nudging it
function roomShow(el) {
  const sc = document.getElementById('roomScroll');
  if (!sc || !el || sc.scrollWidth <= sc.clientWidth + 4) return;
  const r = el.getBoundingClientRect();
  sc.scrollBy({ left: r.left + r.width / 2 - sc.clientWidth / 2, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

// The text questions, each in a small window
function openTicket(which) {
  const d = draft;
  if (!d) return;
  const reasonColors = ['lemon', 'strawberry', 'pistachio', 'blueberry', 'caramel', 'ice', 'white'];
  let body = '';
  if (which === 'name') {
    body = `<label class="field"><span class="chunky">What’s it called?</span>
      <input id="fName" maxlength="60" autocomplete="off" placeholder="${esc(NAME_EXAMPLES[allRecords().length % NAME_EXAMPLES.length])}" value="${esc(d.name)}"></label>
      <p class="tk-note">Leave it empty and it’s called what it is.</p>`;
  } else if (which === 'place') {
    body = `<div class="field"><span class="chunky">Where’s it from?</span>
      <div class="picks" id="placePicks">${[...PLACES, PLACE_OTHER_LABEL].map(p => `<button class="pick ${d.place === p ? 'on' : ''}" data-act="pickPlace" data-val="${esc(p)}" aria-pressed="${d.place === p}">${esc(p)}</button>`).join('')}</div>
      <input id="fPlace" maxlength="60" autocomplete="off" placeholder="So where was it?" value="${esc(d.placeOther)}" ${d.place === PLACE_OTHER_LABEL ? '' : 'hidden'} style="margin-top:8px"></div>
      <div class="field"><span class="chunky">Been here before? <small>a place from the Memory Freezer, optional</small></span>
      ${locSelectHTML('setLoc', d.loc)}
      <div class="place-memory" id="placeMemory" hidden></div></div>`;
  } else {
    body = `<div class="field" style="margin-bottom:2px"><span class="chunky">Why did you buy it?</span>
      <div class="picks reasons" id="reasonPicks">${Object.entries(REASONS).map(([k, v], i) => `<button class="pick c-${reasonColors[i]} ${d.reason === k ? 'on' : ''}" data-act="pickReason" data-val="${k}" aria-pressed="${d.reason === k}">${esc(v.label)}</button>`).join('')}</div></div>`;
  }
  overlay.innerHTML = `<div class="sheet tk-sheet" role="dialog" aria-label="Your order">${body}
    <button class="btn c-white" data-act="closeTicket" style="margin-top:14px">DONE</button></div>`;
  overlay.classList.add('open');
  const name = document.getElementById('fName');
  if (name) { name.addEventListener('input', () => { draft.name = name.value; }); name.addEventListener('keydown', e => { if (e.key === 'Enter') ROOM_ACTIONS.closeTicket(); }); setTimeout(() => name.focus(), 60); }
  const placeInput = document.getElementById('fPlace');
  if (placeInput) { placeInput.addEventListener('input', () => { draft.placeOther = placeInput.value; updatePlaceMemory(); }); updatePlaceMemory(); }
}
function refreshTicket() {
  const t = document.getElementById('ticket');
  if (t && draft) t.outerHTML = ticketHTML();
  const ms = document.querySelector('.rm-machine .m-screen');
  if (ms && roomMode() === 'making') ms.innerHTML = machineScreenHTML('making');
  const tag = document.getElementById('flavorTag');
  if (tag) tag.textContent = draft && draft.flavor ? 'TODAY: ' + FLAVORS[draft.flavor].label : 'FLAVORS';
}
// The first thing picked in an idle room starts a new ice cream
function ensureMaking() {
  if (draft || game) return false;
  startDraft();
  history.replaceState(null, '', '#create');
  roomScrollKeep = document.getElementById('roomScroll')?.scrollLeft ?? null;
  render();
  return true;
}
function pullLever() {
  const m = document.querySelector('.rm-machine');
  if (!m || reducedMotion()) return;
  m.classList.remove('pulled'); void m.offsetWidth; m.classList.add('pulled');
}

const ROOM_ACTIONS = {
  // the machine: in an empty room it starts a new ice cream; while making, it's the way in
  machine() {
    if (game) { go('play'); return; }
    pullLever();
    if (!draft) { startDraft(); go('create'); }
    setTimeout(() => {
      const b = document.getElementById('benchBubble');
      if (b) b.textContent = 'Start with a shape. Up on the shelf.';
      roomShow(document.getElementById('trayForm'));
    }, 60);
  },
  pokePreview() {
    const b = document.getElementById('benchBubble');
    if (!b || !draft) return;
    b.textContent = !draft.form ? COPY.bench.needShape : !draft.flavor ? COPY.bench.needFlavor : pick(COPY.home.quips);
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  },
  openTicket(v) { openTicket(v); },
  closeTicket() { closeOverlay(); refreshTicket(); },
  closeWindow() { go(game ? 'play' : 'home'); },
};
