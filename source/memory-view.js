/* ==========================================================================
   ONE MEMORY: a big ice cream with the story frozen inside it.
   Tap it about twice (or drag across it) and it melts: the colour runs down
   and drips off, and the story shows through what's left.
   Drawings use a 300 x 460 box. "win" is where the story sits inside it.
   ========================================================================== */
const BIG_W = 300, BIG_H = 460;
const SOFT_INK = '#8F877E';
function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

const SH = {
  scoop: 'M34 172 L34 160 C28 92 84 26 150 26 C216 26 272 92 266 160 L266 172 Z',
  scoopArc: 'M34 160 C28 92 84 26 150 26 C216 26 272 92 266 160',
  cup: 'M28 166 L272 166 L250 420 Q150 434 50 420 Z',
  cupSides: 'M28 166 L50 420 Q150 434 250 420 L272 166',
  bar: 'M62 112 C62 52 104 20 150 20 C196 20 238 52 238 112 L238 350 C238 366 226 378 210 378 L90 378 C74 378 62 366 62 350 Z',
  ghost: 'M40 420 L40 150 C40 72 90 28 150 28 C210 28 260 72 260 150 L260 420 Q242 402 224 420 Q206 438 187 420 Q168 402 150 420 Q132 438 113 420 Q94 402 76 420 Q58 438 40 420 Z',
  glass: 'M30 160 L270 160 L248 428 Q150 444 52 428 Z',
  glassSides: 'M30 160 L52 428 Q150 444 248 428 L270 160',
  aScoop: 'M64 172 L64 168 C60 108 102 64 150 64 C198 64 240 108 236 168 L236 172 Z',
  aScoopArc: 'M64 168 C60 108 102 64 150 64 C198 64 240 108 236 168',
  mound: 'M42 240 L42 236 C38 128 92 58 150 58 C208 58 262 128 258 236 L258 240 Z',
  moundArc: 'M42 236 C38 128 92 58 150 58 C208 58 262 128 258 236',
  bowl: 'M14 228 L286 228 Q282 408 150 414 Q18 408 14 228 Z',
  block: 'M50 74 Q50 56 68 56 L232 56 Q250 56 250 74 L250 392 L50 392 Z',
  cscoop: 'M36 236 C28 124 84 30 150 30 C216 30 272 124 264 236 Q242 258 218 240 Q196 260 172 242 Q150 262 128 242 Q104 260 82 240 Q58 258 36 236 Z',
  cone: 'M60 236 L240 236 L156 442 Q150 452 144 442 Z',
};

// Where everything goes, per kind of memory
function bigSpec(m) {
  const s = memStyle(m), a = m.art;
  const base = s === 'ghost' ? '#EEEEF3' : s === 'smash' ? '#C9926B' : coatColor(m);
  const spec = { s, base, mode: s === 'ghost' ? 'fog' : 'drain', face: [150, 112, 1.3], drips: [], puddle: null, strands: [96, 166, 222] };
  switch (s) {
    case 'cup': Object.assign(spec, { body: [SH.scoop, SH.cup], win: [58, 86, 184, 322], top: 26, bottom: 430, puddle: [150, 446, 122],
      drips: [[24, 172, 444, .06], [276, 178, 444, .16], [104, 424, 446, .3], [198, 424, 446, .44]] }); break;
    case 'popsicle': Object.assign(spec, { body: [SH.bar], win: [80, 70, 140, 294], top: 20, bottom: 378, puddle: [150, 448, 100], face: [150, 92, 1.15],
      drips: [[94, 372, 446, .18], [150, 376, 446, .3], [208, 372, 446, .42]], strands: [104, 150, 196] }); break;
    case 'ghost': Object.assign(spec, { body: [SH.ghost], win: [64, 98, 172, 300], top: 28, bottom: 436, face: [150, 66, 1] }); break;
    case 'affogato': Object.assign(spec, { body: [SH.aScoop, SH.glass], win: [60, 98, 180, 318], top: 64, bottom: 436, face: [150, 112, 1.05] }); break;
    case 'bowl': Object.assign(spec, { body: [SH.mound, SH.bowl], win: [54, 98, 192, 298], top: 58, bottom: 414, face: [150, 122, 1.25] }); break;
    case 'smash': Object.assign(spec, { body: [SH.block], win: [66, 82, 168, 298], top: 56, bottom: 392, face: [150, 108, 1.1],
      drips: [[92, 390, 410, .2], [150, 392, 412, .36], [208, 390, 410, .52]], puddle: [150, 412, 112] }); break;
    default: Object.assign(spec, { body: [SH.cscoop], win: [0, 62, 300, 184], top: 30, bottom: 262, face: [150, 96, 1.2],
      drips: [[64, 244, 452, .12], [236, 244, 452, .28]], puddle: [150, 452, 92], strands: [100, 160, 210] });
  }
  return spec;
}

function massGradient(id, spec) {
  if (spec.s === 'smash') {
    const bands = ['#F7C49A', '#B48468', '#D8AA88', '#FFF4E4'];
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${spec.top}" x2="0" y2="${spec.bottom}">${bands.map((c, i) =>
      `<stop offset="${i / 4}" stop-color="${c}"/><stop offset="${(i + 1) / 4}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  }
  if (spec.s === 'ghost') return `<radialGradient id="${id}" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6E6EE"/></radialGradient>`;
  const light = mixHex(spec.base, '#FFFFFF', .5), dark = mixHex(spec.base, '#7A6658', .1);
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${spec.top}" x2="0" y2="${spec.bottom}">
    <stop offset="0" stop-color="${light}"/><stop offset=".45" stop-color="${spec.base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
}

// What stays behind: frosted containers and a faint tint of the flavour
function bigBack(m, spec, id) {
  const a = m.art, tint = `<g fill="${spec.base}" opacity=".3">${spec.body.map(d => `<path d="${d}"/>`).join('')}</g>`;
  const frost = d => `<path d="${d}" fill="#FFFFFF" opacity=".78"/>`;
  const ground = (cy, rx) => `<ellipse cx="150" cy="${cy}" rx="${rx}" ry="8" fill="#6F655C" opacity=".07"/>`;
  switch (spec.s) {
    case 'cup': return `${ground(446, 120)}${frost(SH.cup)}${tint}${bigCupPattern(a, id + 'xp', .28)}
      <rect x="20" y="156" width="260" height="24" rx="12" fill="#FFFFFF" opacity=".7"/>`;
    case 'popsicle': {
      const second = a.count === 2 ? `<g transform="translate(78 26) rotate(7 150 200) scale(.86)" opacity=".9"><rect x="132" y="360" width="36" height="76" rx="16" fill="#EFDDBF"/><path d="${SH.bar}" fill="${(a.bars || [])[1] || a.bar}"/></g>` : '';
      return `${ground(448, 100)}${second}<rect x="132" y="360" width="36" height="78" rx="16" fill="#EFDDBF"/>${frost(SH.bar)}${tint}`;
    }
    case 'ghost': return `<ellipse cx="150" cy="440" rx="110" ry="8" fill="#6F655C" opacity=".06"/><path d="${SH.ghost}" fill="#FFFFFF" opacity=".7"/>`;
    case 'affogato': return `${ground(446, 112)}${frost(SH.glass)}<clipPath id="${id}xg"><path d="${SH.glass}"/></clipPath>
      <g clip-path="url(#${id}xg)"><rect x="0" y="300" width="300" height="160" fill="#B7865F" opacity=".22"/></g>${tint}`;
    case 'bowl': return `${ground(420, 134)}<path d="${SH.bowl}" fill="#FCE9EE" opacity=".85"/>${tint}`;
    case 'smash': return `<ellipse cx="150" cy="406" rx="146" ry="24" fill="#FFFFFF" opacity=".9"/>${tint}`;
    default: return `<path d="${SH.cone}" fill="#F3DCB6"/><clipPath id="${id}xk"><path d="${SH.cone}"/></clipPath>
      <g clip-path="url(#${id}xk)" stroke="#E2C08F" stroke-width="3">${[...Array(10)].map((_, i) => `<path d="M${i * 30 - 60} 236 l140 220 M${i * 30 + 60} 236 l-140 220"/>`).join('')}</g>
      ${spec.s === 'cone' ? '' : `<g transform="translate(212 38) rotate(24)"><rect x="-8" y="-70" width="16" height="96" rx="7" fill="#C9A487"/></g>`}${tint}`;
  }
}

// What sits in front: frosted glass over cups and bowls, and small props. No outlines:
// the shapes are flat, like the rest of the drawings. It never moves.
const SPOON = '#CDD2DA';
function bigFront(m, spec) {
  const a = m.art, frost = (d, o = .2) => `<path d="${d}" fill="#FFFFFF" opacity="${o}"/>`;
  const spoon = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${SPOON}" stroke-width="7" stroke-linecap="round"/>`;
  switch (spec.s) {
    case 'cup': return frost(SH.cup, .14);
    case 'ghost': return a.prop === 'question' ? `<g transform="translate(232 40) scale(1.1) translate(-150 -70)">${GHOST_PROPS.question}</g>`
        : `<g transform="translate(238 404) scale(1.1) translate(-160 -184)">${GHOST_PROPS[a.prop] || ''}</g>`;
    case 'affogato': return frost(SH.glass, .14) + spoon(262, 20, 206, 150);
    case 'bowl': return `<path d="${SH.bowl}" fill="#FCE9EE" opacity=".42"/><path d="M14 228 H286" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".7"/>` + spoon(258, 196, 292, 112);
    case 'smash': return spoon(26, 6, 80, 64) + spoon(274, 6, 220, 64);   // stuck in the top, clear of the story
    case 'popsicle': case 'cone': return '';
    default: return `<g class="bm-twin" transform="translate(262 368) scale(.32) translate(-150 -240)"><path d="${SH.cone}" fill="#F3DCB6"/><path d="${SH.cscoop}" fill="${spec.base}"/></g>
        <text class="bm-twin" x="262" y="446" text-anchor="middle" font-family="Soft Scoop, ZH Text, sans-serif" font-size="12" fill="${SOFT_INK}">a kid’s</text>`;
  }
}

// The cup, glass or bowl in its own colour while it's full. It is masked by the
// ice cream itself, so as the ice cream drains the colour drains with it and the
// frosted container (in bigBack and bigFront) is what's left.
// The big cup is the freezer's little cup drawing, scaled up: the same pattern
// stretched from its 200 x 230 box onto the big cup.
const BIG_CUP_FIT = 'translate(150 172) scale(2.5 2.88) translate(-100 -120)';
const SMALL_CUP = 'M52 120 L148 120 L137 206 Q100 214 63 206 Z';
function bigCupPattern(a, id, opacity = 1) {
  return a.pattern ? `<g transform="${BIG_CUP_FIT}" opacity="${opacity}"><clipPath id="${id}"><path d="${SMALL_CUP}"/></clipPath>${cupPattern(a, id)}</g>` : '';
}
function bigCupFront(m, spec, sid) {
  const a = m.art, shade = mixHex(spec.base, '#B9A593', .28);
  const bumps = [44, 79, 114, 150, 186, 221, 256].map((x, i) => `<circle cx="${x}" cy="${182 + (i % 2) * 3}" r="${i % 2 ? 17 : 19}"/>`).join('');
  return `<clipPath id="${sid}cs"><path d="${SH.scoop}"/></clipPath>
    <ellipse cx="150" cy="176" rx="126" ry="34" fill="${shade}" opacity=".45" clip-path="url(#${sid}cs)"/>
    <ellipse cx="104" cy="76" rx="34" ry="16" transform="rotate(-28 104 76)" fill="#FFFFFF" opacity=".6"/>
    <path d="${SH.cup}" fill="${a.cup || '#FFFEFA'}"/>${bigCupPattern(a, sid + 'cp')}
    <path d="M62 196 L76 396" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity=".5"/>
    <g fill="${spec.base}">${bumps}</g>
    <rect x="20" y="156" width="260" height="24" rx="12" fill="#FFFEFA"/>`;
}
function bigVessel(m, spec, sid) {
  const a = m.art;
  if (spec.s === 'cup') return `<mask id="${sid}vm" maskUnits="userSpaceOnUse" x="0" y="0" width="${BIG_W}" height="${BIG_H}"><path id="bmVesselMask" fill="#FFFFFF" d="" filter="url(#goo)"/></mask>
    <g mask="url(#${sid}vm)">${bigCupFront(m, spec, sid)}</g>`;
  const v = spec.s === 'bowl' ? [SH.bowl, '#FCE3EA', .75] : spec.s === 'affogato' ? [SH.glass, '#FFFFFF', .32] : null;
  if (!v) return '';
  const rim = spec.s === 'cup' ? '<rect x="22" y="158" width="256" height="18" rx="9" fill="#FFFFFF" opacity=".55"/>' : spec.s === 'affogato' ? '<rect x="22" y="152" width="256" height="14" rx="7" fill="#FFFFFF" opacity=".5"/>' : '';
  const shine = spec.s === 'affogato' ? '' : `<path d="M62 ${spec.s === 'bowl' ? 250 : 190} L74 ${spec.s === 'bowl' ? 360 : 400}" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity=".45"/>`;
  return `<mask id="${sid}vm" maskUnits="userSpaceOnUse" x="0" y="0" width="${BIG_W}" height="${BIG_H}"><path id="bmVesselMask" fill="#FFFFFF" d="" filter="url(#goo)"/></mask>
    <g mask="url(#${sid}vm)"><path d="${v[0]}" fill="${v[1]}" opacity="${v[2]}"/>${shine}${rim}</g>`;
}

// Popsicle wrapper, split down the middle so it can tear open
function bigWrapper(m, id) {
  const a = m.art, label = ((a.labels || [])[0] ?? a.label ?? '') || '?';
  let tear = '';
  for (let y = 12, i = 0; y <= 392; y += 14, i++) tear += ` L${150 + (i % 2 ? 5 : -5)} ${y}`;
  const crimp = (x0, x1, y, dy) => { let d = ''; for (let x = x0, i = 0; x <= x1; x += 10, i++) d += ` L${x} ${y + (i % 2 ? dy : 0)}`; return d; };
  const left = `M50 22${crimp(50, 150, 10, 12)}${tear} L150 392${crimp(50, 150, 404, -12).split(' L').filter(Boolean).reverse().map(p => ' L' + p).join('')} Z`;
  const right = `M150 22${crimp(150, 250, 10, 12)} L250 392${crimp(150, 250, 404, -12).split(' L').filter(Boolean).reverse().map(p => ' L' + p).join('')}${tear.split(' L').filter(Boolean).reverse().map(p => ' L' + p).join('')} Z`;
  const art = `<rect x="40" y="0" width="220" height="420" fill="${a.wrap}"/><path d="M72 0 V420 M228 0 V420" stroke="#fff" stroke-width="10" opacity=".55"/>
    <ellipse cx="150" cy="190" rx="66" ry="34" fill="#FFFEFA"/><text x="150" y="${label.length > 3 ? 196 : 202}" text-anchor="middle" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="${label.length > 3 ? 17 : 30}" fill="#6F655C">${esc(label)}</text>`;
  const half = (d, n) => `<g id="bmWrap${n}"><clipPath id="${id}w${n}"><path d="${d}"/></clipPath><g clip-path="url(#${id}w${n})">${art}</g>
    </g>`;
  return half(left, 'L') + half(right, 'R');
}

function storyHTML(m) {
  if (m.isRecord) return m.story.map(p => `<p>${esc(p)}</p>`).join('') + recordLogHTML(m);   // a game record: the kept memory, if any, then the machine's log
  return m.story.map(p => p.startsWith('> ') ? `<p class="bm-quote">${esc(p.slice(2))}</p>` : `<p>${esc(p)}</p>`).join('')
    + (m.unsure.length ? `<p class="bm-unsure">${esc(MEMORY_COPY.unsure)}: ${m.unsure.map(esc).join(', ').toLowerCase()}.</p>` : '');
}

let memFrom = null;   // 'bench' when opened from the ice cream workbench
// One memory, frozen and ready to melt: used on the freezer's stage, and as a page
// of its own when opened from the workbench ("Been here before?").
function memoryCardHTML(m, ctx = {}) {
  const spec = bigSpec(m), sid = 'bm' + (++svgId);
  const index = MEMORIES.indexOf(m);
  const series = seriesOf(m).filter(([k]) => MEMORY_SERIES[k].story);
  const [wx, wy, ww, wh] = spec.win;
  const pct = (v, of) => (v / of * 100).toFixed(3) + '%';
  const hint = spec.s === 'popsicle' ? MEMORY_COPY.hints.unwrap : (MEMORY_COPY.hints[spec.s] || MEMORY_COPY.hints.cup);
  const drips = spec.drips.map((_, i) => `<path class="bm-drip" data-i="${i}" d=""/>`).join('');
  const fx = spec.face;
  const storyLinks = ctx.stage ? '' : series.map(([, s]) => {
    const at = s.ids.indexOf(m.id), prev = s.ids[at - 1], next = s.ids[at + 1];
    const link = (mid, dir) => mid ? `<button class="series-link ${dir}" data-act="openMemory" data-val="${mid}">${dir === 'prev' ? '‹ ' : ''}${esc(memoryById(mid).title)}${dir === 'next' ? ' ›' : ''}</button>` : '<span></span>';
    return `<div class="series-card"><div class="chunky series-name">${esc(s.title)}</div><div class="series-part">${esc(MEMORY_COPY.part(at + 1, s.ids.length))}</div>
      <div class="series-links">${link(prev, 'prev')}${link(next, 'next')}</div></div>`;
  }).join('');
  // on the stage, a story chip opens that story in the freezer
  const chips = series.length ? `<div class="bm-chips">${series.map(([k, s]) => ctx.stage && fz.view !== 'story'
    ? `<button class="bm-chip chip-link" data-act="openStory" data-val="${k}">${esc(s.title)} ›</button>` : `<span class="bm-chip">${esc(s.title)}</span>`).join('')}</div>` : '';
  return `<div class="bigmem k-${spec.s} ${m.isRecord ? 'is-record' : ''} ${ctx.stage ? 'in-stage' : ''}" id="memory" data-id="${esc(m.id)}">
    <header class="bm-head">
      <p class="bm-when">${esc(m.when)}${index >= 0 ? `<span class="chunky bm-num">${m.id} / ${MEMORIES.length}</span>` : `<span class="chunky bm-num">${m.isRecord ? (m.kept ? 'EXTENDED MEMORY' : 'FRESHLY FROZEN') : 'EXTRA'}</span>`}</p>
      <p class="bm-where">${esc(m.where)}</p>
      <h1 class="bm-title">${esc(m.title)}</h1>
      <p class="bm-what">${esc(m.what)}. Flavor: ${esc(m.flavor)}</p>
      ${m.isRecord ? `<span class="bm-chip rec-chip">${m.kept ? 'A kept memory, from a game record' : 'A game record. Melts into the machine’s log.'}</span>` : ''}
      ${chips}
    </header>
    <div class="bm-stage" id="bigStage">
      <svg class="bm-layer bm-back" viewBox="0 0 ${BIG_W} ${BIG_H}" aria-hidden="true">${bigBack(m, spec, sid)}</svg>
      <div class="bm-text" id="bmText" data-y="${wy}" data-h="${wh}" style="left:0;top:${pct(wy, BIG_H)};width:100%;height:${pct(wh, BIG_H)}"><i class="bm-wall l"></i><i class="bm-wall r"></i><div class="bm-text-in">${storyHTML(m)}</div></div>
      <svg class="bm-layer bm-melt" viewBox="0 0 ${BIG_W} ${BIG_H}" aria-hidden="true">
        <defs>${massGradient(sid + 'g', spec)}
          <clipPath id="${sid}b">${spec.body.map(d => `<path d="${d}"/>`).join('')}</clipPath>
          <filter id="${sid}f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur id="bmFogBlur" stdDeviation="0"/></filter></defs>
        <g fill="${spec.base}" filter="url(#goo)">${drips}${spec.puddle ? `<ellipse id="bmPuddle" cx="${spec.puddle[0]}" cy="${spec.puddle[1]}" rx="0" ry="0"/>` : ''}</g>
        <g clip-path="url(#${sid}b)"><g id="bmMassG" ${spec.mode === 'fog' ? `filter="url(#${sid}f)"` : 'filter="url(#goo)"'}><path id="bmMass" fill="url(#${sid}g)" d=""/></g></g>
        <g id="bmFace" opacity="1">${faceSVG('nervous', fx[0], fx[1], fx[2], FLAVORS.vanilla)}</g>
        ${bigVessel(m, spec, sid)}
        ${spec.s === 'popsicle' ? bigWrapper(m, sid) : ''}
      </svg>
      <svg class="bm-layer bm-front" viewBox="0 0 ${BIG_W} ${BIG_H}" aria-hidden="true">${bigFront(m, spec)}
        ${spec.s === 'bowl' ? `<g class="bm-sparkle" fill="#F4D98A">${[[48, 70, 9], [262, 96, 7], [150, 30, 11]].map(([x, y, r]) => `<path transform="translate(${x} ${y})" d="M0 ${-r} Q${r * .15} ${-r * .15} ${r} 0 Q${r * .15} ${r * .15} 0 ${r} Q${-r * .15} ${r * .15} ${-r} 0 Q${-r * .15} ${-r * .15} 0 ${-r}Z"/>`).join('')}</g>` : ''}
      </svg>
      <span class="chunky bm-stamp">${esc(m.fate)}</span>
    </div>
    <div class="bm-under">
      <p class="chunky bm-hint" id="memHint">${esc(hint)}</p>
      <button class="link bm-skip" data-act="memSkip">${esc(MEMORY_COPY.skip)}</button>
    </div>
    <div class="bm-after">
      ${recordAfterHTML(m)}
      ${storyLinks}
      <div class="mem-after-btns">
        ${ctx.bench ? `<button class="btn c-white" data-act="memBackBench">${esc(MEMORY_COPY.backBench.toUpperCase())}</button>` : ''}
        <button class="link" data-act="memAgain">${esc(MEMORY_COPY.again)}</button>
      </div>
    </div>
  </div>`;
}
// A memory as a page of its own: only from the workbench, so it can lead back there.
function screenMemory(id, from) {
  const m = memoryById(id);
  if (!m) return null;
  memFrom = 'bench';
  setFlood('var(--cream)', null);
  return `<section class="screen bigmem-page" id="memoryPage">
    <div class="bm-top"><button class="link" data-act="memBackBench">${esc(MEMORY_COPY.backBench)}</button></div>
    ${memoryCardHTML(m, { bench: true })}
  </section>`;
}

// Shapes the story to the ice cream's outline: two invisible walls whose edges
// follow the drawing, so every line stays inside it. Then shrinks the type to fit.
function shapeStory() {
  const box = document.getElementById('bmText'), view = document.getElementById('memory');
  if (!box || !view) return;
  const spec = bigSpec(memoryById(view.dataset.id));
  const svg = document.querySelector('#bigStage .bm-back');
  const probe = spec.body.map(d => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); p.setAttribute('visibility', 'hidden'); svg.appendChild(p); return p; });
  const y0 = +box.dataset.y, h = +box.dataset.h, scale = box.clientWidth / BIG_W, pad = 15;
  const inside = (x, y) => probe.some(p => { try { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return p.isPointInFill(pt); } catch (e) { return false; } });
  const rows = [];
  for (let y = y0; y <= y0 + h + .1; y += 5) {
    const ys = [y - 9, y, y + 9];                       // the line's top, middle and bottom must all fit
    let l = 150, r = 150;
    for (let x = 0; x <= 150; x += 2) if (ys.every(v => inside(x, v))) { l = x; break; }
    for (let x = BIG_W; x >= 150; x -= 2) if (ys.every(v => inside(x, v))) { r = x; break; }
    rows.push({ y, l: l + pad, r: r - pad });
  }
  // keep only the stretch where a line has room; text stops before the shape gets too narrow
  const roomy = rows.map(w => w.r - w.l >= 64);
  let first = roomy.indexOf(true), last = first;
  while (last + 1 < rows.length && roomy[last + 1]) last++;
  const use = first < 0 ? rows : rows.slice(first, last + 1);
  const top = use[0].y, hh = use[use.length - 1].y - top;
  box.style.top = (top / BIG_H * 100) + '%';
  box.style.height = (hh / BIG_H * 100) + '%';
  const L = use.map(w => [w.l * scale, (w.y - top) * scale]), Rr = use.map(w => [(BIG_W - w.r) * scale, (w.y - top) * scale]);
  probe.forEach(p => p.remove());
  const hp = hh * scale, poly = pts => `polygon(0 0, ${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')}, 0 ${hp.toFixed(1)}px)`;
  const wl = box.querySelector('.bm-wall.l'), wr = box.querySelector('.bm-wall.r');
  const maxL = Math.max(...L.map(p => p[0])) + 1, maxR = Math.max(...Rr.map(p => p[0])) + 1;
  wl.style.cssText = `width:${maxL}px;height:${hp}px;shape-outside:${poly(L)}`;
  const polyR = `polygon(${maxR}px 0, ${Rr.map(([x, y]) => `${(maxR - x).toFixed(1)}px ${y.toFixed(1)}px`).join(', ')}, ${maxR}px ${hp.toFixed(1)}px)`;
  wr.style.cssText = `width:${maxR}px;height:${hp}px;shape-outside:${polyR}`;
}
function fitStory() {
  const box = document.getElementById('bmText');
  if (!box) return;
  shapeStory();
  const inner = box.querySelector('.bm-text-in');
  let size = 15.5;
  box.style.fontSize = size + 'px';
  while (inner.offsetHeight > box.clientHeight && size > 10.5) { size -= .5; box.style.fontSize = size + 'px'; }
  box.classList.toggle('scrolls', inner.offsetHeight > box.clientHeight);
}

let memState = null;
function bindMemoryStage(startThawed) {
  const view = document.getElementById('memory');
  const stage = document.getElementById('bigStage');
  if (!view || !stage) return;
  const m = memoryById(view.dataset.id), spec = bigSpec(m);
  const $ = id => stage.querySelector('#' + id);
  const vesselMask = $('bmVesselMask');
  const mass = $('bmMass'), massG = $('bmMassG'), fog = $('bmFogBlur'), face = $('bmFace'), puddle = $('bmPuddle');
  const wrapL = $('bmWrapL'), wrapR = $('bmWrapR'), hint = document.getElementById('memHint');
  const drips = [...stage.querySelectorAll('.bm-drip')];
  const range = spec.bottom - spec.top + 48;
  if (memState && memState.raf) cancelAnimationFrame(memState.raf);
  const st = memState = { p: 0, v: 0, target: 0, t: 0, raf: 0, last: 0, done: false, fast: false };
  fitStory();
  // the text font can arrive late and run longer: refit if the story ever spills out
  if (window.ResizeObserver) {
    const box = stage.querySelector('#bmText'), inner = box.querySelector('.bm-text-in');
    new ResizeObserver(() => { if (box.isConnected && !box.classList.contains('scrolls') && inner.offsetHeight > box.clientHeight + 1) fitStory(); }).observe(inner);
  }

  // Draw one moment of the melt. p: 0 frozen, 1 gone. t: time, for the wobble.
  function frame(p, t) {
    const melt = spec.s === 'popsicle' ? clamp01((p - .12) / .88) : p;
    if (spec.mode === 'fog') {
      mass.setAttribute('d', spec.body[0]);
      massG.setAttribute('opacity', (1 - smooth(0, 1, p)).toFixed(3));
      massG.setAttribute('transform', `translate(0 ${(-30 * p).toFixed(1)})`);
      fog.setAttribute('stdDeviation', (16 * p).toFixed(2));
    } else {
      const level = spec.top - 16 + range * melt, wob = melt > 0 && melt < 1 ? 1 : 0;
      const strand = x => spec.strands.reduce((sum, sx, k) => {
        const q = clamp01((melt - (.04 + k * .22)) / .42), h = 46 * Math.pow(Math.sin(Math.PI * q), 1.4);
        return sum + h * Math.exp(-(((x - sx) / 8) ** 2));
      }, 0);
      let d = `M-10 ${BIG_H + 20} L-10 ${level.toFixed(1)}`;
      for (let x = -10; x <= 310; x += 4) {
        const y = level + wob * (5 * Math.sin(x * .05 + t * 1.8) + 3 * Math.sin(x * .13 - t * 1.25)) - strand(x);
        d += ` L${x} ${y.toFixed(1)}`;
      }
      mass.setAttribute('d', melt >= 1 ? '' : d + ` L310 ${BIG_H + 20} Z`);
      if (vesselMask) vesselMask.setAttribute('d', mass.getAttribute('d'));
    }
    // the face rides the surface down, then melts away
    const fo = 1 - smooth(.06, .42, p);
    const dy = spec.mode === 'fog' ? -24 * p : Math.max(0, spec.top - 16 + range * melt + 34 - spec.face[1]) * .7;
    face.setAttribute('opacity', fo.toFixed(3));
    face.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
    // drips run down and gather in a puddle
    drips.forEach((el, i) => {
      const [x, y0, y1, a] = spec.drips[i], u = clamp01((p - a) / .5);
      if (u <= 0 || u >= 1) { el.setAttribute('d', ''); return; }
      const len = (y1 - y0) * Math.pow(Math.min(1, u / .7), 1.7), w = 11 * (1 - .55 * u), r = w * .78;
      const tip = y0 + len;
      el.setAttribute('d', `M${x - w / 2} ${y0} L${x - w / 2} ${tip} A${w / 2} ${w / 2} 0 0 0 ${x + w / 2} ${tip} L${x + w / 2} ${y0} Z M${x} ${tip - r} a${r} ${r} 0 1 0 0.01 0Z`);
      el.setAttribute('opacity', (1 - smooth(.8, 1, u)).toFixed(3));
    });
    if (puddle) {
      const rx = spec.puddle[2] * (.08 + .92 * Math.sqrt(smooth(.08, 1, p)));
      puddle.setAttribute('rx', rx.toFixed(1));
      puddle.setAttribute('ry', (rx * .085 + (p > .08 ? 3 : 0)).toFixed(1));
    }
    if (wrapL) {
      const u = smooth(0, .28, p);
      wrapL.setAttribute('transform', `translate(${(-150 * u).toFixed(1)} ${(46 * u).toFixed(1)}) rotate(${(-24 * u).toFixed(1)} 60 400)`);
      wrapR.setAttribute('transform', `translate(${(150 * u).toFixed(1)} ${(46 * u).toFixed(1)}) rotate(${(24 * u).toFixed(1)} 240 400)`);
      wrapL.setAttribute('opacity', (1 - u * u).toFixed(3)); wrapR.setAttribute('opacity', (1 - u * u).toFixed(3));
      if (hint) hint.textContent = p < .1 ? MEMORY_COPY.hints.unwrap : MEMORY_COPY.hints.popsicle;
    }
  }
  function finish() {
    if (st.done) return;
    st.done = true;
    view.classList.add('thawed');
    markThawed(m.id);
  }
  // A soft spring carries the melt to its target, so it flows instead of jumping.
  function loop(now) {
    const dt = st.last ? Math.min(.05, (now - st.last) / 1000) : .016;
    st.last = now; st.t += dt;
    const k = st.fast ? 46 : 13, c = 2 * Math.sqrt(k);
    st.v += ((st.target - st.p) * k - st.v * c) * dt;
    st.p = Math.max(0, st.p + st.v * dt);
    frame(Math.min(1, st.p), st.t);
    if (st.target >= 1 && st.p > .97) finish();   // reads as melted already; the last drips can keep falling
    if (Math.abs(st.target - st.p) < .002 && Math.abs(st.v) < .003) {
      st.p = st.target; frame(st.p, st.t); st.raf = 0; st.fast = false;
      if (st.p >= 1) finish();
      return;
    }
    st.raf = requestAnimationFrame(loop);
  }
  function meltTo(target, fast) {
    st.target = clamp01(target);
    if (fast) st.fast = true;
    if (reducedMotion()) { st.p = st.target; frame(st.p, 0); if (st.p >= 1) finish(); return; }
    if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(loop); }
  }
  st.step = () => meltTo(Math.min(1, Math.round(st.target * 2) / 2 + .5));
  st.skip = () => meltTo(1, true);
  st.again = () => {
    cancelAnimationFrame(st.raf); st.raf = 0;
    st.done = false; view.classList.remove('thawed');
    st.p = st.v = st.target = 0; frame(0, 0);
    if (!view.classList.contains('in-stage')) stage.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  // a tap melts it about halfway; dragging across it melts it as far as you drag
  let press = null;
  stage.addEventListener('pointerdown', e => {
    if (st.done || e.target.closest('button, a')) return;
    press = { x: e.clientX, y: e.clientY, travel: 0, from: st.target, moved: false };
  });
  stage.addEventListener('pointermove', e => {
    if (!press) return;
    press.travel += Math.hypot(e.clientX - press.x, e.clientY - press.y);
    press.x = e.clientX; press.y = e.clientY;
    if (press.travel > 12) { press.moved = true; meltTo(press.from + press.travel / 520); }
  });
  stage.addEventListener('pointerup', () => { if (press && !press.moved && !st.done) st.step(); press = null; });
  stage.addEventListener('pointercancel', () => { press = null; });
  if (startThawed) { st.p = st.target = 1; frame(1, 0); finish(); } else frame(0, 0);
}
window.addEventListener('resize', () => { if (document.getElementById('bmText')) fitStory(); });
