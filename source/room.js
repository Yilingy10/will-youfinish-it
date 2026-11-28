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
const ROOM_ZONES = { door: [0, 290], machine: [290, 600], counter: [600, 920], shelves: [920, 1200], case: [1200, 1500] };
let roomScrollKeep = null;
let lastRoomRoute = null;   // so the door can swing shut after Next Scoop   // where the phone was scrolled, kept across redraws of the same room

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
  ${tiles.join('')}
  <rect x="-600" y="866" width="2700" height="6" fill="#D9E4E8"/>

  <!-- a little mat in front of the door -->
  <ellipse cx="146" cy="872" rx="118" ry="13" fill="#F6C9D3" opacity=".9" class="rm-riso"/>

  <!-- the wall shelves: shapes, toppings, decorations -->
  <g class="rm-riso">
    ${[150, 262, 374].map(y => `<rect x="926" y="${y}" width="560" height="18" rx="4" fill="#EBC197"/><rect x="926" y="${y + 14}" width="560" height="4" fill="#D9A877"/><path d="M960 ${y + 18} v22 h16 M1452 ${y + 18} v22 h-16" stroke="#D9A877" stroke-width="7" fill="none"/>`).join('')}
  </g>

</svg>
<svg class="room-back room-front" viewBox="0 0 ${ROOM_W} ${ROOM_H}" preserveAspectRatio="none" aria-hidden="true">
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

</svg>`;
}
// The Memory Freezer: in the corner, standing in front of the door
const ROOM_FREEZER = `<svg class="rm-fz-art" viewBox="0 556 320 320" aria-hidden="true"><g class="rm-riso">
    <ellipse cx="160" cy="866" rx="150" ry="11" fill="#8B5E45" opacity=".1"/>
    <path d="M30 610 H290 L282 848 Q281 858 270 858 H50 Q39 858 38 848 Z" fill="#C9E6F0"/>
    <path d="M30 610 H290 L282 848 Q281 858 270 858 H50 Q39 858 38 848 Z" fill="url(#rmDots)" opacity=".6"/>
    <rect x="34" y="664" width="252" height="22" fill="#FFCFDA"/>
    <path d="M16 590 Q16 572 34 572 H286 Q304 572 304 590 V606 Q304 618 290 618 H30 Q16 618 16 606 Z" fill="#FFFBF3"/>
    <path d="M38 578 H282 L292 600 H28 Z" fill="#DDEFF5"/>
    <g opacity=".9"><path d="M64 598 q0 -26 20 -26 q20 0 20 26 l-6 -5 l-7 5 l-7 -5 l-7 5 l-7 -5z" fill="#FFFFFF"/><rect x="124" y="570" width="26" height="30" rx="8" fill="#FFC6D5"/><path d="M184 600 l12 -26 l12 26z" fill="#F2CD95"/><circle cx="196" cy="575" r="12" fill="#FFF6D6"/><rect x="238" y="574" width="22" height="26" rx="6" fill="#D0D2FB"/></g>
    <rect x="122" y="700" width="76" height="12" rx="6" fill="#FFFBF3"/>
    <g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85">${[[64, 770, 9], [246, 800, 7], [224, 730, 5]].map(([x, y, s]) => `<path d="M${x} ${y - s} V${y + s} M${x - s * .87} ${y - s / 2} L${x + s * .87} ${y + s / 2} M${x - s * .87} ${y + s / 2} L${x + s * .87} ${y - s / 2}"/>`).join('')}</g>
  </g></svg>`;
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
    ${reactRowHTML('bite')}
    <div class="pair">
      <button class="btn c-white" data-act="done">I’M DONE.</button>
      <button class="btn c-pistachio" data-act="finished">I FINISHED IT</button>
    </div>
    <div class="undo"><span id="undoWrap" ${g.bites ? '' : 'style="visibility:hidden"'}><button class="link" data-act="undoBite">Oops, that wasn’t a bite</button></span><button class="link" data-act="goQuick">Quick record</button></div>
  </div>`;
}

/* --- HOW IS IT? A quiet row of little faces on the counter ----------------------
   Instead of a window popping up every few bites, five small faces sit by the
   buttons. Tap one whenever you like; the ice cream's face follows. It only
   nudges once, after the first bite. If you never tapped, the last window asks
   once how it was overall. The answers feed the same verdicts as before. */
const REACTS = [
  { score: 5, mood: 'delighted', tint: '#E4F2D6', label: 'WAIT THIS IS ACTUALLY GOOD', later: 'Still good. Suspicious.' },
  { score: 4, mood: 'happy',     tint: '#FFF4C9', label: 'PRETTY GOOD',                later: 'Still pretty good. Noted.' },
  { score: 3, mood: 'ok',        tint: '#F7F3EC', label: 'IT’S FINE',                  later: 'Fine. Holding steady.' },
  { score: 2, mood: 'worried',   tint: '#F6E6D6', label: 'HMMMM…',                     later: 'The hmmmm is growing.' },
  { score: 1, mood: 'panicked',  tint: '#FBE0E6', label: 'WHY DID I BUY THIS',         later: 'And yet it’s still in your hand.' },
];
const reactFace = x => `<svg viewBox="-50 -50 100 100" aria-hidden="true"><circle r="47" fill="${x.tint}"/>${faceSVG(x.mood, 0, 3, .98, FLAVORS.vanilla)}</svg>`;
function currentReactScore() {
  if (!game) return null;
  const later = game.laterReactions[game.laterReactions.length - 1];
  return later ? later.score : game.firstReaction ? game.firstReaction.score : null;
}
function reactRowHTML(kind = 'bite') {
  const now = currentReactScore();
  return `<div class="rm-react ${kind}" data-kind="${kind}" role="group" aria-label="${kind === 'overall' ? 'How was it, overall?' : 'How is it?'}">
    <span class="rr-q">${kind === 'overall' ? 'How was it, overall?' : 'How is it?'}</span>
    ${REACTS.map(x => `<button class="rr-face ${now === x.score ? 'on' : ''}" data-act="tapReact" data-val="${x.score}" aria-pressed="${now === x.score}" aria-label="${esc(x.label)}" title="${esc(x.label)}">${reactFace(x)}</button>`).join('')}
  </div>`;
}
// the last window asks once, only if no face was ever tapped
const overallAskHTML = () => game && !game.firstReaction && !game.laterReactions.length ? reactRowHTML('overall') : '';

// The room, with whatever is happening in it. `win` is a small window on top.
function screenRoom(win, route) {
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
    <span class="chunky room-tagline">An ice cream survival game</span>
    <header class="room-top">
      <span class="top-right">${langToggleHTML()}<button class="link" data-go="about">About</button></span>
    </header>
    <div class="room-scroll" id="roomScroll">
    <div class="room" id="room">
      ${roomBackSVG().replace('</svg>\n<svg class="room-back room-front"', `</svg>\n${doorHTML(route === 'nextscoop' || lastRoomRoute === 'nextscoop')}\n<svg class="room-back room-front"`)}
      ${Object.entries(ROOM_ZONES).map(([k, [a, b]]) => `<i class="rm-zone" data-zone="${k}" style="${at(a, 0, b - a, ROOM_H)}"></i>`).join('')}
      <h1 class="rm-sign rm-title" style="${at(1104, 652, 370, 176)}" aria-label="Will you finish it?"><span>Will you</span><span>finish it?</span></h1>

      <button class="rm-freezer" data-go="freezer" style="${at(0, 556, 320, 320)}" aria-label="The Memory Freezer">${ROOM_FREEZER}<span class="chunky rm-fz-name" style="${at(70, 172, 180, null)}">THE MEMORY FREEZER</span></button>
      ${mode === 'idle' ? `<button class="rm-ghost" data-act="iResisted" style="${at(392, 196, 200, 104)}">${ghostSVG('hmm', 'rl-ghost')}<span class="chunky">I resisted one</span></button>` : ''}

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
  if (route === 'nextscoop') return screenNextScoop();
  if (route === 'resisted') return screenResisted(param);
  if (route === 'result') return screenResult(param);
  if (route === 'play' && game && game.stage !== 'bite') {
    return ({ loading: screenLoading, predict: screenPredict, quit: screenQuit, rest: screenRest, rebuy: screenRebuy, finish: screenFinish, quick: screenQuick }[game.stage] || (() => null))();
  }
  return null;
}

// After the room is drawn: keep the phone's place, or bring the right part into view
function afterRoom(prevMode) {
  const door = document.querySelector('.rm-door.open');
  if (door && !location.hash.startsWith('#nextscoop')) requestAnimationFrame(() => requestAnimationFrame(() => door.classList.remove('open')));
  lastRoomRoute = (location.hash.slice(1).split('/')[0]) || 'home';
  const sc = document.getElementById('roomScroll');
  if (!sc || sc.scrollWidth <= sc.clientWidth + 4) return;
  const mode = roomMode();
  const zone = mode === 'idle' ? 'case' : 'counter';   // a phone opens where the name is written, on the counter
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
  // a face tapped: how it's going right now (tapping again at the same bite changes your mind)
  tapReact(v) {
    const x = REACTS.find(k => k.score === +v);
    if (!game || !x) return;
    const entry = { checkpoint: 'tap', label: x.label, score: x.score };
    const lastLater = game.laterReactions[game.laterReactions.length - 1];
    if (!game.firstReaction) game.firstReaction = { ...entry, checkpoint: 'first' };
    else if (!game.laterReactions.length && game.firstReactionBite === game.bites) game.firstReaction = { ...entry, checkpoint: 'first' };
    else if (lastLater && lastLater.bite === game.bites) game.laterReactions[game.laterReactions.length - 1] = { bite: game.bites, ...entry };
    else game.laterReactions.push({ bite: game.bites, ...entry });
    if (game.firstReaction && game.firstReactionBite == null) game.firstReactionBite = game.bites;
    game.lastSay = game.bites <= 1 ? (CHECKPOINTS.first.options.find(o => o.score === x.score) || {}).say || x.later : x.later;
    game.lastSayBite = game.bites;
    saveCurrentGame();
    document.querySelectorAll('.rm-react').forEach(el => { el.outerHTML = reactRowHTML(el.dataset.kind); });
    if (game.stage === 'bite') updateBiteScreen(false);
  },
};


/* --- THE DOOR: Next Scoop ------------------------------------------------------
   A door on the left wall with a little sign. Press it: it swings open a little,
   and a window suggests a flavor from how your recent ice creams went, and the
   nearest real ice cream shops around you (from OpenStreetMap). Your location is
   asked for only when you press FIND ONE NEAR ME, used for that one search, and
   never saved or sent anywhere else. */
function doorHTML(open) {
  const W = 330, H = 830, i = 18, top = 18;
  const arch = (k, t) => `M${k} ${H} V${120 + k / 2} Q${k} ${t} ${W / 2} ${t} Q${W - k} ${t} ${W - k} ${120 + k / 2} V${H} Z`;
  const cx = W / 2, gl = 44, gb = Math.round(H * .4), knobY = Math.round(H * .56), signY = Math.round(H * .43);
  return `<button class="rm-door ${open ? 'open' : ''}" data-act="openNextScoop" style="${at(6, 36, W, H)}" aria-label="Next Scoop: where to get the next one">
    <svg class="door-frame" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>
      <linearGradient id="dfFrame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBF4"/><stop offset="1" stop-color="#F1E4D3"/></linearGradient>
      <radialGradient id="dfLight" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#FFFCF3"/><stop offset=".6" stop-color="#FBF0DC"/><stop offset="1" stop-color="#F2E2C8"/></radialGradient></defs>
      <g class="rm-riso"><path d="${arch(0, 0)}" fill="url(#dfFrame)"/><path d="${arch(i, top)}" fill="url(#dfLight)"/></g></svg>
    <svg class="door-panel" viewBox="${i} ${top} ${W - 2 * i} ${H - top}" aria-hidden="true"><defs>
      <linearGradient id="dpBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF9EC"/><stop offset="1" stop-color="#F4E5CD"/></linearGradient>
      <linearGradient id="dpGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F4F9"/><stop offset="1" stop-color="#B8DCEA"/></linearGradient>
      <linearGradient id="dpKnob" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8B98F"/><stop offset="1" stop-color="#BE8660"/></linearGradient>
      <linearGradient id="dpSign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#FFE6EC"/></linearGradient>
      <linearGradient id="dpInk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98F66"/><stop offset="1" stop-color="#8B5E45"/></linearGradient></defs>
      <g class="rm-riso">
        <path d="${arch(i, top)}" fill="url(#dpBody)"/>
        <path d="M${gl} ${gb} V${top + 110} Q${gl} ${top + 30} ${cx} ${top + 30} Q${W - gl} ${top + 30} ${W - gl} ${top + 110} V${gb} Z" fill="url(#dpGlass)"/>
        <path d="M84 120 L64 ${gb - 70} M120 92 L96 ${gb - 40}" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" opacity=".6"/>
        <rect x="40" y="${Math.round(H * .6)}" width="${W - 80}" height="${Math.round(H * .13)}" rx="12" fill="#E9D6B8" opacity=".45"/>
        <rect x="40" y="${Math.round(H * .76)}" width="${W - 80}" height="${Math.round(H * .13)}" rx="12" fill="#E9D6B8" opacity=".45"/>
        <rect x="${i}" y="${H - 24}" width="${W - 2 * i}" height="24" fill="#E8D5B6"/>
        <circle cx="${W - 46}" cy="${knobY}" r="12" fill="url(#dpKnob)"/>
        <path d="M${cx} ${signY - 38} L${cx - 66} ${signY - 4} M${cx} ${signY - 38} L${cx + 66} ${signY - 4}" stroke="#CDB9AC" stroke-width="3"/><circle cx="${cx}" cy="${signY - 38}" r="4" fill="#B98C6E"/>
        <g transform="rotate(-3 ${cx} ${signY + 34})"><rect x="${cx - 96}" y="${signY - 6}" width="192" height="80" rx="16" fill="url(#dpSign)"/>
        <text x="${cx}" y="${signY + 44}" text-anchor="middle" font-family="'Sign Script', cursive" font-size="42" fill="url(#dpInk)" data-noi18n>Next Scoop</text></g>
      </g></svg>
  </button>`;
}

// What to get: from how your recent ice creams went (records only, never the memories)
function nextScoopAdvice() {
  const recs = allRecords().slice(-8);
  if (!recs.length) return { flavor: 'vanilla', form: 'cup', title: 'A small cup of vanilla.', why: ['No history yet. Start small. The machine will learn.'] };
  const fin = recs.filter(r => r.finished).length;
  const rate = fin / recs.length;
  const by = {};
  for (const r of recs) {
    const k = r.flavorCategory; if (!FLAVORS[k]) continue;
    const scores = [r.firstReaction, ...(r.laterReactions || [])].filter(Boolean).map(x => x.score);
    const taste = scores.length ? (mean(scores) - 3) / 4 : 0;
    const got = r.finished ? 1 : Math.min(1, r.actualBites / Math.max(1, r.predictedBites));
    (by[k] = by[k] || { k, n: 0, fin: 0, sum: 0 });
    by[k].n++; by[k].fin += r.finished ? 1 : 0; by[k].sum += got + taste;
  }
  const best = Object.values(by).sort((a, b) => b.sum / b.n - a.sum / a.n || b.n - a.n)[0] || { k: 'vanilla', n: 0, fin: 0 };
  const forms = recs.filter(r => r.finished).map(r => r.form);
  const form = rate < .5 ? 'cup' : (forms.sort((a, b) => forms.filter(x => x === b).length - forms.filter(x => x === a).length)[0] || 'cup');
  const fl = FLAVORS[best.k].label, fm = FORMS[form] ? FORMS[form].label : 'CUP';
  const why = [`You finished ${fin} of your last ${recs.length}.`];
  why.push(best.fin ? `${capFirst(fl.toLowerCase())} has your best record: finished ${best.fin} of ${best.n}.` : `Your best bites came from ${fl.toLowerCase()}.`);
  if (rate < .5) why.push('Small cup. History says the big ones don’t make it.');
  return { flavor: best.k, form, title: `${capFirst(fl.toLowerCase())}, ${rate < .5 ? 'a small cup' : 'as a ' + fm.toLowerCase()}.`, why };
}
function screenNextScoop() {
  const a = nextScoopAdvice();
  return `<section class="screen next-scoop" id="nextScoop">
    <p class="chunky ns-k">NEXT SCOOP</p>
    <div class="ns-pick">
      <span class="ns-art">${iceCream({ form: a.form, flavor: a.flavor, mood: 'happy', label: FLAVORS[a.flavor].label })}</span>
      <div><p class="chunky ns-label">The machine suggests</p><h1 class="melty ns-title">${esc(a.title)}</h1>
      ${a.why.map(w => `<p class="ns-why">${esc(w)}</p>`).join('')}</div>
    </div>
    <div class="ns-shops" id="nsShops">
      <button class="btn c-lemon" data-act="findScoop">FIND ONE NEAR ME</button>
      <p class="ns-note">Your location is only used for this one search. It isn’t saved.</p>
      ${scoopPlacesHTML()}
    </div>
    <button class="btn c-white" data-act="closeWindow" style="margin-top:12px">CLOSE THE DOOR</button>
  </section>`;
}
// Or skip the location and pick a neighborhood (handy for a demo, or with location off)
const SCOOP_PLACES = { pratt: ['Pratt', 40.6913, -73.9634], dtbk: ['Downtown Brooklyn', 40.6925, -73.9875], soho: ['SoHo', 40.7245, -73.9985], midtown: ['Midtown', 40.7536, -73.9832] };
const scoopPlacesHTML = () => `<div class="ns-places"><span>Or pick a spot:</span>${Object.entries(SCOOP_PLACES).map(([k, [n]]) => `<button class="link" data-act="scoopAt" data-val="${k}">${esc(n)}</button>`).join('')}</div>`;
function showScoopShops(here, label) {
  const box = document.getElementById('nsShops');
  if (!box) return false;
  scoopInUS = inUS(here);
  const local = builtInShops(here, nextScoopAdvice().flavor);
  if (!local) return false;
  box.innerHTML = (label ? `<p class="chunky ns-label ns-at">Around ${esc(label)}</p>` : '') + shopsHTML(local) + scoopPlacesHTML();
  return true;
}
const metersTo = (a, b) => {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
// miles in the US (wherever the phone's language is set to), metres elsewhere
let scoopInUS = null;
const inUS = p => p.lat > 24 && p.lat < 50 && p.lon > -125 && p.lon < -66;
const usUnits = () => scoopInUS ?? /^en-US$/i.test(navigator.language || '');
function distanceText(m) {
  if (usUnits()) { const mi = m / 1609.34; return mi < .2 ? `${Math.round(m * 3.281 / 50) * 50} ft` : `${mi.toFixed(mi < 10 ? 1 : 0)} mi`; }
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
async function nearbyIceCream(here, radius) {
  const q = `[out:json][timeout:15];(nwr["amenity"="ice_cream"](around:${radius},${here.lat},${here.lon});nwr["shop"="ice_cream"](around:${radius},${here.lat},${here.lon});nwr["cuisine"~"ice_cream|gelato|frozen_yogurt"](around:${radius},${here.lat},${here.lon}););out center tags 60;`;
  let last;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url + '?data=' + encodeURIComponent(q));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const seen = new Set();
      return (data.elements || []).map(e => {
        const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon), t = e.tags || {};
        if (lat == null || !t.name) return null;
        const key = t.name.toLowerCase() + Math.round(lat * 1000) + Math.round(lon * 1000);
        if (seen.has(key)) return null; seen.add(key);
        const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
        return { name: t.name, lat, lon, d: metersTo(here, { lat, lon }), hours: t.opening_hours || '', street, web: t.website || t['contact:website'] || '' };
      }).filter(Boolean).sort((x, y) => x.d - y.d);
    } catch (e) { last = e; }
  }
  throw last || new Error('no map');
}
// Shops near Pratt, Downtown Brooklyn / DUMBO, and Lower and Midtown Manhattan, picked
// from recent Time Out and Infatuation guides and the shops' own pages (checked Nov 2026). Built in, so the answer
// comes at once, without waiting for the map. `f` = flavors of ours they're good for.
const NYC_SHOPS = [
  { name: 'Biddrina Gelato', lat: 40.6855, lon: -73.9622, street: '129 Gates Ave, Clinton Hill', try: 'turmeric amarena cherry, or crema with marmalade', f: ['fruit', 'vanilla', 'other', 'weird'] },
  { name: 'Van Leeuwen (Downtown Brooklyn)', lat: 40.6913, lon: -73.9829, street: '445 Gold St, City Point', try: 'Sicilian pistachio or honeycomb', f: ['pistachio', 'caramel', 'chocolate', 'oreo', 'vanilla'] },
  { name: 'Soft Swerve (DeKalb Market Hall)', lat: 40.6906, lon: -73.9835, street: '445 Albee Square W, City Point, lower level', try: 'Thai tea, Hong Kong milk tea or ube soft serve', f: ['thaitea', 'tea', 'coffee', 'softserve', 'weird', 'oreo'] },
  { name: 'Van Leeuwen (Brooklyn Heights)', lat: 40.6946, lon: -73.9918, street: '151 Montague St, Brooklyn Heights', try: 'Sicilian pistachio or honeycomb', f: ['pistachio', 'caramel', 'chocolate', 'vanilla'] },
  { name: 'Van Leeuwen (Boerum Hill)', lat: 40.6862, lon: -73.9893, street: '81 Bergen St, Boerum Hill', try: 'Sicilian pistachio or honeycomb', f: ['pistachio', 'caramel', 'chocolate', 'vanilla'] },
  { name: 'The Ice Cream Shop', lat: 40.6895, lon: -73.9735, street: '186 DeKalb Ave, Fort Greene', try: 'a classic scoop in a cone', f: ['vanilla', 'chocolate', 'fruit', 'oreo'] },
  { name: 'Brooklyn Ice Cream Factory', lat: 40.7026, lon: -73.9937, street: '14 Old Fulton St, DUMBO', try: 'French vanilla or butter pecan', f: ['vanilla', 'nutty', 'chocolate'] },
  { name: 'Van Leeuwen (Brooklyn Bridge Park)', lat: 40.7034, lon: -73.9952, street: '1 Water St, Fulton Ferry Landing', try: 'Sicilian pistachio or honeycomb', f: ['pistachio', 'caramel', 'chocolate', 'oreo'] },
  { name: 'L’Artigiano Gelato (Time Out Market)', lat: 40.7036, lon: -73.9918, street: '55 Water St, DUMBO', try: 'stracciatella or tiramisù', f: ['vanilla', 'coffee', 'chocolate'] },
  { name: 'Malai', lat: 40.6820, lon: -73.9932, street: '268 Smith St, Carroll Gardens', try: 'saffron pistachio or masala chai', f: ['pistachio', 'tea', 'thaitea', 'weird', 'nutty'] },
  { name: 'Brooklyn Farmacy & Soda Fountain', lat: 40.6813, lon: -74.0003, street: '513 Henry St, Carroll Gardens', try: 'a sundae or an egg cream', f: ['vanilla', 'chocolate', 'caramel'] },
  { name: 'Morgenstern’s Finest Ice Cream', lat: 40.7272, lon: -74.0009, street: '88 W Houston St, Greenwich Village', try: 'caramel crème fraîche or bitter chocolate ash', f: ['caramel', 'chocolate', 'weird', 'other'] },
  { name: 'Julia Jean’s', lat: 40.7139, lon: -73.9866, street: '202 Clinton St, Lower East Side', try: 'butter pecan or orange sherbet', f: ['nutty', 'fruit', 'vanilla'] },
  { name: 'Il Laboratorio del Gelato', lat: 40.7221, lon: -73.9870, street: '188 Ludlow St, Lower East Side', try: 'hazelnut or dark chocolate', f: ['nutty', 'chocolate', 'fruit', 'mango'] },
  { name: 'Chinatown Ice Cream Factory', lat: 40.7154, lon: -73.9984, street: '65 Bayard St, Chinatown', try: 'black sesame, egg custard or red bean', f: ['weird', 'tea', 'coconut', 'mango', 'other'] },
  { name: 'Taiyaki NYC', lat: 40.7182, lon: -73.9995, street: '119 Baxter St, Chinatown', try: 'matcha-hojicha soft serve in a fish cone', f: ['tea', 'softserve'] },
  { name: 'Sundaes and Cones', lat: 40.7309, lon: -73.9892, street: '95 E 10th St, East Village', try: 'black sesame or Thai iced tea', f: ['thaitea', 'tea', 'oreo', 'weird'] },
  { name: 'Caffè Panna', lat: 40.7369, lon: -73.9868, street: '77 Irving Pl, Gramercy', try: 'stracciatella, or a sundae with panna', f: ['vanilla', 'coffee', 'oreo', 'fruit'] },
  { name: 'Salt & Straw', lat: 40.7346, lon: -74.0066, street: '540 Hudson St, West Village', try: 'sea salt with caramel ribbons or honey lavender', f: ['caramel', 'other', 'weird', 'vanilla'] },
  { name: 'Sundaes Best', lat: 40.7470, lon: -73.9857, street: '319 5th Ave, Koreatown', try: 'miso caramel or Jeju mandarin sorbet', f: ['caramel', 'fruit', 'mango', 'tea'] },
  { name: 'Eataly Flatiron (gelato counter)', lat: 40.7421, lon: -73.9896, street: '200 5th Ave, Flatiron', try: 'pistachio or nocciola gelato', f: ['pistachio', 'nutty', 'chocolate', 'coffee'] },
  { name: 'Milky Ice', lat: 40.7612, lon: -73.9700, street: '130 E 57th St, Midtown', try: 'the tall soft serve', f: ['softserve', 'vanilla'] },
];
// From the built-in list: the ones near you, the best match for the suggested flavor first
function builtInShops(here, flavor) {
  const all = NYC_SHOPS.map(s => ({ ...s, d: metersTo(here, s) })).sort((a, b) => a.d - b.d);
  if (!all.length || all[0].d > 6000) return null;   // not around these neighborhoods
  const near = all.filter(s => s.d <= Math.max(1500, all[0].d * 1.8));
  const match = near.find(s => s.f.includes(flavor));
  if (match) { match.why = 'good for ' + FLAVORS[flavor].label.toLowerCase(); return [match, ...all.filter(s => s !== match)]; }
  return all;
}
function mapsLink(s) {
  const apple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  return apple ? `https://maps.apple.com/?q=${encodeURIComponent(s.name)}&ll=${s.lat},${s.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}%20${s.lat}%2C${s.lon}`;
}
function shopsHTML(list) {
  const [top, ...rest] = list;
  const walk = m => Math.max(1, Math.round(m / 80));
  return `<div class="ns-top">
      <p class="chunky ns-label">${top.why ? 'Near you, and ' + esc(top.why) : 'Closest to you'}</p>
      <h2 class="ns-shop" data-noi18n>${esc(top.name)}</h2>
      <p class="ns-meta">${distanceText(top.d)} · about ${walk(top.d)} min on foot${top.street ? ` · <span data-noi18n>${esc(top.street)}</span>` : ''}</p>
      ${top.try ? `<p class="ns-meta">Try: <span data-noi18n>${esc(top.try)}</span></p>` : ''}
      ${top.hours ? `<p class="ns-meta">Hours: <span data-noi18n>${esc(top.hours)}</span></p>` : ''}
      <a class="btn c-strawberry ns-go" href="${mapsLink(top)}" target="_blank" rel="noopener">GET DIRECTIONS</a>
    </div>
    ${rest.length ? `<p class="chunky ns-label" style="margin-top:12px">Also nearby</p><ul class="ns-more">${rest.slice(0, 3).map(s => `<li><a href="${mapsLink(s)}" target="_blank" rel="noopener"><span data-noi18n>${esc(s.name)}</span></a><span>${distanceText(s.d)}</span></li>`).join('')}</ul>` : ''}
    <p class="ns-note">${top.try ? 'Picked from recent NYC ice cream guides.' : 'Shops from OpenStreetMap.'} Check they’re open before you go.</p>`;
}
Object.assign(ROOM_ACTIONS, {
  // the door swings open a little, then the window
  openNextScoop() {
    const d = document.querySelector('.rm-door');
    if (d) d.classList.add('open');
    setTimeout(() => go('nextscoop'), d && !reducedMotion() ? 620 : 0);
  },
  scoopAt(v) { const p = SCOOP_PLACES[v]; if (p) showScoopShops({ lat: p[1], lon: p[2] }, p[0]); },
  async findScoop() {
    const box = document.getElementById('nsShops');
    if (!box) return;
    const say = (t, extra = '') => { box.innerHTML = `<p class="ns-status">${esc(t)}</p>${extra}`; };
    if (!navigator.geolocation) { say('This browser can’t tell where you are. The flavor advice still stands.'); return; }
    say('Looking around you…');
    let here;
    try {
      here = await new Promise((ok, no) => navigator.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude }), no, { enableHighAccuracy: false, timeout: 8000, maximumAge: 1800000 }));
    } catch (e) {
      say('No location, no shop. The flavor advice still stands.', `<button class="btn c-white" data-act="findScoop" style="margin-top:8px">TRY AGAIN</button>${scoopPlacesHTML()}`);
      return;
    }
    // around Pratt, Downtown Brooklyn or Lower/Midtown Manhattan: answer at once from the built-in list
    if (showScoopShops(here)) return;
    scoopInUS = inUS(here);
    say('Asking the map about shops near you…');
    try {
      let list = await nearbyIceCream(here, 2500);
      if (!list.length) list = await nearbyIceCream(here, 8000);
      if (!document.getElementById('nsShops')) return;
      if (!list.length) { say('No ice cream shop anywhere near you. That might be for the best.'); return; }
      box.innerHTML = shopsHTML(list) + scoopPlacesHTML();
    } catch (e) {
      say('Couldn’t reach the map just now.', `<button class="btn c-white" data-act="findScoop" style="margin-top:8px">TRY AGAIN</button>`);
    }
  },
});

// A window you only read (the verdict, About, Next Scoop, an ending): a tap
// anywhere outside it closes it. Windows that are asking you something stay.
document.addEventListener('click', e => {
  if (e.target.id !== 'roomWindow') return;
  const route = location.hash.slice(1).split('/')[0];
  if (['result', 'about', 'resisted', 'nextscoop'].includes(route)) ROOM_ACTIONS.closeWindow();
});
