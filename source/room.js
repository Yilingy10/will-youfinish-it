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
// the four parts of the room, left to right (the phone snaps to these)
const ROOM_ZONES = { freezer: [0, 330], machine: [330, 720], counter: [720, 1100], case: [1100, 1500] };
let roomScrollKeep = null;   // where the phone was scrolled, kept across redraws of the same room

function roomMode() {
  if (game) return 'play';
  return draft ? 'making' : 'idle';
}

// The fixed drawing behind everything: wall, shelves, counter, machine, case, freezer.
function roomBackSVG() {
  const tiles = [];
  for (let x = -600, i = 0; x < 2100; x += 60, i++) tiles.push(`<path d="M${x} 868 H${x + 60} V1500 H${x} Z" fill="${i % 2 ? '#F3D8CC' : '#F8E6DC'}"/>`);
  const stripes = [];
  for (let x = 300; x < 2100; x += 120) stripes.push(`<rect x="${x + 10}" y="640" width="100" height="196" rx="14" fill="rgba(255,255,255,.22)"/>`);
  return `<svg class="room-back" viewBox="0 0 ${ROOM_W} ${ROOM_H}" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="rmWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCF2E8"/><stop offset="1" stop-color="#F6DFD0"/></linearGradient>
    <linearGradient id="rmFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D3EAF2"/><stop offset="1" stop-color="#B7D9E6"/></linearGradient>
    <linearGradient id="rmTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFEFA"/><stop offset="1" stop-color="#F3ECE2"/></linearGradient>
    <linearGradient id="rmPlank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2CFA8"/><stop offset="1" stop-color="#E2B68A"/></linearGradient>
    <linearGradient id="rmMachineHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD3DE"/><stop offset="1" stop-color="#FFB7C9"/></linearGradient>
    <linearGradient id="rmMachineBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF4E8"/><stop offset=".55" stop-color="#FFFBF4"/><stop offset="1" stop-color="#F1E1D1"/></linearGradient>
    <linearGradient id="rmGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(214,236,246,.55)"/><stop offset="1" stop-color="rgba(190,222,236,.75)"/></linearGradient>
    <linearGradient id="rmFreezer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9EEF6"/><stop offset="1" stop-color="#C2E1EC"/></linearGradient>
    <linearGradient id="rmSign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6CF"/><stop offset="1" stop-color="#FFE8A6"/></linearGradient>
    <radialGradient id="rmLamp" cx=".5" cy="0" r="1"><stop offset="0" stop-color="rgba(255,250,232,.9)"/><stop offset="1" stop-color="rgba(255,250,232,0)"/></radialGradient>
  </defs>
  <rect x="-600" y="-600" width="2700" height="1240" fill="url(#rmWall)"/>
  <g opacity=".55"><ellipse cx="530" cy="-40" rx="460" ry="360" fill="url(#rmLamp)"/><ellipse cx="1290" cy="-40" rx="420" ry="330" fill="url(#rmLamp)"/></g>
  <rect x="-600" y="560" width="2700" height="16" fill="#F2D6C6" opacity=".8"/>
  ${tiles.join('')}
  <rect x="-600" y="862" width="2700" height="8" fill="#EBC9BA"/>
  <!-- the sign, hanging on two strings -->
  <g class="rm-riso"><path d="M420 18 L452 60 M640 18 L608 60" stroke="#D9B9A6" stroke-width="3" stroke-linecap="round"/>
    <rect x="356" y="56" width="348" height="222" rx="30" fill="url(#rmSign)"/><rect x="370" y="70" width="320" height="194" rx="22" fill="none" stroke="#FFFDF2" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/></g>
  <!-- shelves: shapes above the counter; toppings and decorations above the case -->
  <g class="rm-riso">
    <rect x="736" y="236" width="352" height="16" rx="5" fill="url(#rmPlank)"/><path d="M770 252 v18 h14 M1054 252 v18 h-14" stroke="#E2B68A" stroke-width="6" fill="none"/>
    <rect x="1110" y="200" width="382" height="14" rx="5" fill="url(#rmPlank)"/><path d="M1140 214 v16 h12 M1462 214 v16 h-12" stroke="#E2B68A" stroke-width="6" fill="none"/>
    <rect x="1110" y="338" width="382" height="14" rx="5" fill="url(#rmPlank)"/><path d="M1140 352 v16 h12 M1462 352 v16 h-12" stroke="#E2B68A" stroke-width="6" fill="none"/>
  </g>
  <!-- the counter -->
  <rect x="300" y="626" width="1800" height="226" fill="url(#rmFront)"/>
  ${stripes.join('')}
  <rect x="300" y="836" width="1800" height="30" fill="#A9D0DE"/>
  <rect x="292" y="596" width="1808" height="34" rx="10" fill="url(#rmTop)"/>
  <rect x="292" y="624" width="1808" height="6" fill="#E7DCD0"/>
  <!-- the soft-serve machine -->
  <g class="rm-riso">
    <ellipse cx="530" cy="598" rx="150" ry="10" fill="rgba(140,100,80,.14)"/>
    <rect x="396" y="560" width="268" height="38" rx="10" fill="#EFD2BC"/>
    <rect x="412" y="396" width="236" height="170" rx="18" fill="url(#rmMachineBody)"/>
    <rect x="440" y="530" width="180" height="16" rx="6" fill="#E4DCD4"/><rect x="452" y="526" width="156" height="6" rx="3" fill="#F3EEE8"/>
    <rect x="400" y="300" width="260" height="106" rx="26" fill="url(#rmMachineHead)"/>
    <rect x="436" y="318" width="188" height="64" rx="14" fill="#8EC5D8"/><rect x="442" y="324" width="176" height="20" rx="10" fill="rgba(255,255,255,.22)"/>
    <g fill="#E1DAD3">${[468, 530, 592].map(x => `<rect x="${x - 15}" y="404" width="30" height="34" rx="6"/><path d="M${x - 9} 438 L${x + 9} 438 L${x + 4} 456 L${x - 4} 456 Z"/>`).join('')}</g>
    <path d="M520 268 q10 -30 10 -30 q0 0 10 30 z" fill="#FFB7C9" opacity=".0"/>
  </g>
  <!-- the glass case of flavor tubs -->
  <g class="rm-riso">
    <ellipse cx="1300" cy="598" rx="196" ry="10" fill="rgba(140,100,80,.14)"/>
    <rect x="1112" y="556" width="376" height="42" rx="10" fill="#FFF8EE"/><rect x="1112" y="580" width="376" height="10" fill="#FFD6DF"/>
    <rect x="1120" y="404" width="360" height="156" rx="12" fill="#EAF5F9"/>
    <rect x="1112" y="392" width="376" height="18" rx="8" fill="#FFF8EE"/>
  </g>
  <!-- the Memory Freezer, in the corner -->
  <g class="rm-riso">
    <ellipse cx="166" cy="866" rx="150" ry="12" fill="rgba(140,100,80,.14)"/>
    <path d="M36 610 H296 L288 848 Q287 858 276 858 H56 Q45 858 44 848 Z" fill="url(#rmFreezer)"/>
    <rect x="40" y="664" width="252" height="22" fill="#FFD6DF"/>
    <path d="M22 590 Q22 572 40 572 H292 Q310 572 310 590 V606 Q310 618 296 618 H36 Q22 618 22 606 Z" fill="#FFFEFA"/>
    <path d="M44 578 H288 L298 600 H34 Z" fill="#D4EAF2"/>
    <g opacity=".85"><path d="M70 598 q0 -26 20 -26 q20 0 20 26 l-6 -5 l-7 5 l-7 -5 l-7 5 l-7 -5z" fill="#FFFFFF"/><rect x="130" y="570" width="26" height="30" rx="8" fill="#FFC6D5"/><path d="M190 600 l12 -26 l12 26z" fill="#F2CD95"/><circle cx="202" cy="575" r="12" fill="#FFF6D6"/><rect x="244" y="574" width="22" height="26" rx="6" fill="#D0D2FB"/></g>
    <path d="M44 578 H288 L298 600 H34 Z" fill="rgba(255,255,255,.35)"/>
    <rect x="128" y="700" width="76" height="12" rx="6" fill="#FFFEFA"/>
    <g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8">${[[70, 770, 9], [252, 800, 7], [230, 730, 5]].map(([x, y, s]) => `<path d="M${x} ${y - s} V${y + s} M${x - s * .87} ${y - s / 2} L${x + s * .87} ${y + s / 2} M${x - s * .87} ${y + s / 2} L${x + s * .87} ${y - s / 2}"/>`).join('')}</g>
  </g>
</svg>`;
}
// The glass in front of the tubs, drawn over them
const ROOM_GLASS = `<svg class="room-glass" viewBox="1110 396 380 170" preserveAspectRatio="none" aria-hidden="true">
  <path d="M1120 410 H1480 V560 H1120 Z" fill="url(#rmGlass)" opacity=".2"/>
  <path d="M1150 420 L1132 520 M1180 420 L1160 540 M1420 430 L1402 520" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".6"/></svg>`;

// one flavor tub, seen from the front: a metal pan with the flavor heaped in it
function tubSVG(k) {
  const f = FLAVORS[k], id = 'tb' + (++svgId);
  const mound = 'M5 26 Q4 4 30 3 Q56 4 55 26 Z';
  return `<svg viewBox="0 0 60 54" aria-hidden="true"><g class="rm-riso">
    <clipPath id="${id}"><path d="${mound}"/></clipPath>
    <path d="${mound}" fill="${f.base}"/>
    <g clip-path="url(#${id})"><g transform="translate(30 15) scale(.46)">${flavorBits(f, 0, 0, 50, 22, 9, null)}</g></g>
    <path d="M13 11 Q20 6 29 6" stroke="rgba(255,255,255,.65)" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <rect x="2" y="24" width="56" height="28" rx="6" fill="#E6E1DB"/><rect x="2" y="24" width="56" height="7" rx="3" fill="#F4F0EB"/></g></svg>`;
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
  if (!win) setFlood('#FCF2E8', null, '#FCF2E8');
  const d = draft, g = game;
  const entries = allEntries();
  const last = entries[entries.length - 1];
  const idleLine = last && !last.isDemo ? (isResisted(last) ? 'Last time, you resisted. The machine is still recovering.' : `The last one lasted ${plural(last.actualBites)}.`) : pick(COPY.home.quips);
  const thumbFlavor = d && d.flavor ? d.flavor : 'blank';
  const on = (list, k) => !!(d && list.includes(k));

  // the plate: the ice cream being made, or the one being eaten
  let plate;
  if (mode === 'play' && (g.stage === 'bite' || !win)) {
    plate = `<div class="rm-arena" id="arena" style="${at(760, 236, 300, 362)}">
      <div class="machine-say" id="machineSay" role="status" aria-live="polite"></div>
      <button class="arena-btn rm-bite ${g.bites ? '' : 'untouched'}" id="biteBtn" data-act="${g.stage === 'bite' ? 'bite' : 'resume'}" aria-label="Take a bite of ${esc(g.name)}">
        <span class="chr wobble" id="biteChar">${iceCream({ form: g.form, flavor: g.flavor, toppings: g.toppings, decor: g.decor, bites: g.bites, mood: moodFor(g), falling: g.bites > 0, label: g.name })}</span>
        <span class="tap-ring" aria-hidden="true"></span>
        <span class="chunky tap-chip">${esc(COPY.tapToBite)}</span>
      </button></div>`;
  } else if (mode === 'play') {
    plate = `<div class="rm-plate-ic" style="${at(790, 250, 240, 348)}">${iceCream({ form: g.form, flavor: g.flavor, toppings: g.toppings, decor: g.decor, bites: g.bites, mood: g.stage === 'finish' ? 'cool' : g.stage === 'predict' || g.stage === 'loading' ? 'worried' : 'sad', label: g.name })}</div>`;
  } else {
    plate = `<div class="rm-stage" id="stage" style="${at(760, 236, 300, 362)}">
      <button class="preview wobble rm-preview" id="preview" data-act="${mode === 'idle' ? 'machine' : 'pokePreview'}" aria-label="${mode === 'idle' ? 'Make an ice cream' : 'Your ice cream'}">${mode === 'idle' ? idlePlateSVG() : benchIceCream()}</button>
      <div class="bubble rm-bubble" id="benchBubble" aria-live="polite">${esc(mode === 'idle' ? 'Pick anything. A shape, a flavor, a jar.' : COPY.bench.start)}</div>
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
      <h1 class="melty rm-sign" style="${at(356, 66, 348, 196)}" aria-label="Will you finish it?"><span>WILL YOU</span><span>FINISH</span><span>IT?</span></h1>
      <span class="chunky rm-sign-sub" style="${at(356, 252, 348, null)}">An ice cream survival game</span>

      <button class="rm-freezer" data-go="freezer" style="${at(20, 560, 296, 304)}" aria-label="The Memory Freezer"><span class="chunky rm-tag">THE MEMORY FREEZER</span></button>
      ${mode === 'idle' ? `<button class="rm-ghost" data-act="iResisted" style="${at(96, 404, 140, 150)}">${ghostSVG('hmm', 'rl-ghost')}<span class="chunky">I resisted one</span></button>` : ''}

      <button class="rm-machine ${mode}" data-act="${mode === 'play' ? (g.stage === 'bite' ? 'bite' : 'resume') : mode === 'making' ? 'enterArena' : 'machine'}" style="${at(396, 296, 268, 300)}"
        aria-label="${mode === 'making' ? 'Enter the arena' : mode === 'play' ? 'The machine' : 'Make an ice cream'}">
        <span class="m-screen" style="${at(40, 22, 188, 64)}">${machineScreenHTML(mode)}</span>
        <span class="m-lever" style="${at(214, 104, 22, 70)}" aria-hidden="true"></span>
        ${mode !== 'play' ? `<span class="m-swirl" style="${at(104, 158, 60, 72)}" aria-hidden="true"></span>` : ''}
      </button>
      ${mode === 'idle' ? `<div class="rm-chalk" style="${at(400, 664, 260, 150)}"><span class="chunky">TODAY’S SPECIAL</span><span class="chalk-line" id="homeBubble">${esc(idleLine)}</span><span class="chalk-hint">Press the machine, or pick anything.</span></div>` : ''}
      ${mode === 'making' ? `<button class="rm-dice" id="diceBtn" data-act="randomize" style="${at(1040, 540, 48, 48)}" aria-label="${esc(COPY.bench.random)}" title="${esc(COPY.bench.random)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="#FFC6D5"/><g fill="#8B5E45"><circle cx="8.5" cy="8.5" r="1.7"/><circle cx="15.5" cy="8.5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="8.5" cy="15.5" r="1.7"/><circle cx="15.5" cy="15.5" r="1.7"/></g></svg></button>` : ''}

      <div class="rm-shelf rm-forms" id="trayForm" style="${at(744, 140, 336, 98)}">
        ${Object.entries(FORMS).map(([k, v]) => `<button class="rm-form ${d && d.form === k ? 'on' : ''}" data-act="pickForm" data-val="${k}" aria-pressed="${!!(d && d.form === k)}" aria-label="${esc(v.label)}" title="${esc(v.label)}"><span class="thumb" data-formthumb="${k}">${iceCream({ form: k, flavor: thumbFlavor, face: false })}</span></button>`).join('')}
        <span class="chunky rm-shelf-tag">SHAPE</span>
      </div>
      ${plate}
      <div class="rm-front" style="${at(744, 640, 336, 196)}">${front}</div>
      ${mode === 'play' ? `<span class="chunky rm-name" data-noi18n style="${at(760, 604, 300, null)}">${esc(g.name)}</span>` : ''}

      <div class="rm-shelf rm-tops" id="trayTopping" style="${at(1118, 144, 366, 58)}">
        ${Object.entries(TOPPINGS).map(([k, v]) => jarHTML('pickTopping', k, benchThumbForTopping(k), v.label, on(d ? d.toppings : [], k), 'small')).join('')}
        <span class="chunky rm-shelf-tag">TOPPINGS</span>
      </div>
      <div class="rm-shelf rm-decor" id="trayDecor" style="${at(1118, 276, 366, 64)}">
        ${Object.entries(DECORATIONS).map(([k, v]) => jarHTML('pickDecor', k, benchThumbForDecor(k), v.label, on(d ? d.decor : [], k), 'big')).join('')}
        <span class="chunky rm-shelf-tag">DECORATIONS</span>
      </div>
      <div class="rm-case" id="trayFlavor" style="${at(1120, 410, 360, 148)}">
        ${Object.entries(FLAVORS).map(([k, v]) => `<button class="rm-tub ${d && d.flavor === k ? 'on' : ''}" data-act="pickFlavor" data-val="${k}" aria-pressed="${!!(d && d.flavor === k)}" aria-label="${esc(v.label)}" title="${esc(v.label)}">${tubSVG(k)}</button>`).join('')}
      </div>
      <div class="rm-glass-wrap" style="${at(1110, 396, 380, 170)}">${ROOM_GLASS}</div>
      <span class="chunky rm-case-tag" id="flavorTag" style="${at(1112, 562, 376, null)}">${d && d.flavor ? 'TODAY: ' + esc(FLAVORS[d.flavor].label) : 'FLAVORS'}</span>
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
  const zone = mode === 'idle' ? 'machine' : 'counter';
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
