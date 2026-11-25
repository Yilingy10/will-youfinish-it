/* ==========================================================================
   MEMORY FREEZER: drawings, the freezer screen and the melting memory view.
   The data and words are in MEMORIES / MEMORY_COPY near the top of the file.
   ========================================================================== */
const ALL_MEMORIES = [...MEMORIES, MEMORY_MORE];
// A game record can be opened the same way (see recordMemory in the expansion); it is never one of the 22.
const memoryById = id => ALL_MEMORIES.find(m => m.id === id) || recordMemory(id);
const THAWED_KEY = 'willYouFinishIt.thawedMemories.v1';   // which memories this phone has opened (just for the frost)
function thawedList() { try { const v = JSON.parse(storeGet(THAWED_KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function markThawed(id) { const list = thawedList(); if (!list.includes(id)) { list.push(id); storeSet(THAWED_KEY, JSON.stringify(list)); } }
const seriesOf = m => Object.entries(MEMORY_SERIES).filter(([, s]) => s.ids.includes(m.id));
const MEM_STEPS = { cup: 4, popsicle: 4, ghost: 3, special: 4 };
const memStyle = m => m.kind === 'special' ? m.art.special : m.kind;   // cup, popsicle, ghost, affogato, bowl, smash, matching

/* --- Drawings. Every memory is drawn in a 200 x 230 box. --------------------------
   Parts that melt read CSS variables set on the page: --m (0 frozen, 1 gone) and,
   for popsicles, --u (0 wrapped, 1 unwrapped). */
const MEM_INK = INK;
const qFlag = (x, y, rot = 14) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 V-34" stroke="${MEM_INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M0 -34 L26 -28 L0 -20Z" fill="#FFFEFA"/><text x="9" y="-23.5" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="10" fill="${MEM_INK}" text-anchor="middle">?</text></g>`;

function cupPattern(a, clip) {
  const s = `stroke="${a.accent}"`;
  const g = inner => `<g clip-path="url(#${clip})">${inner}</g>`;
  switch (a.pattern) {
    case 'dots':    return g([[68, 140], [96, 132], [124, 142], [80, 168], [110, 164], [136, 170], [92, 192], [120, 194]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${a.accent}"/>`).join(''));
    case 'stripes': return g(`<path d="M72 118 L77 210 M94 118 L95 212 M112 118 L110 212 M132 118 L126 210" ${s} stroke-width="9"/>`);
    case 'film':    return g(`<rect x="40" y="148" width="120" height="30" fill="${a.accent}"/>${[52, 68, 84, 100, 116, 132, 148].map(x => `<rect x="${x}" y="151" width="7" height="5" rx="1.5" fill="#FFFEFA"/><rect x="${x}" y="170" width="7" height="5" rx="1.5" fill="#FFFEFA"/>`).join('')}`);
    case 'stars':   return g([[70, 140], [104, 134], [132, 150], [86, 170], [118, 178], [100, 198]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0 -8 Q1.4 -1.4 8 0 Q1.4 1.4 0 8 Q-1.4 1.4 -8 0 Q-1.4 -1.4 0 -8Z" fill="${a.accent}"/>`).join(''));
    case 'waves':   return g(`<path d="M40 146 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 M40 172 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" ${s} stroke-width="6" fill="none"/>`);
    case 'zigzag':  return g(`<path d="M40 158 l12 -12 l12 12 l12 -12 l12 12 l12 -12 l12 12 l12 -12 l12 12 l12 -12 l12 12" ${s} stroke-width="7" fill="none" stroke-linejoin="round"/>`);
  }
  return '';
}
function scoopShape(x, y, r, fill, speck) {
  const bumps = [-0.86, -0.43, 0, 0.43, 0.86].map(t => `<circle cx="${x + t * r}" cy="${y + r * .5}" r="${r * .27}"/>`).join('');
  const specks = speck ? [[-.4, -.3], [.3, -.45], [.45, .05], [-.15, .1], [-.55, .15], [.1, -.7]].map(([dx, dy]) => `<path d="M${x + dx * r - 4} ${y + dy * r} l3 -3 l5 1 l-1 4Z" fill="${speck}"/>`).join('') : '';
  return `<g fill="${fill}"><path d="M${x - r} ${y + r * .45} C${x - r * 1.05} ${y - r * .55} ${x - r * .5} ${y - r} ${x} ${y - r} C${x + r * .5} ${y - r} ${x + r * 1.05} ${y - r * .55} ${x + r} ${y + r * .45}Z"/>${bumps}</g>
    <g stroke="none"><path d="M${x - r} ${y + r * .45} C${x - r * 1.05} ${y - r * .55} ${x - r * .5} ${y - r} ${x} ${y - r} C${x + r * .5} ${y - r} ${x + r * 1.05} ${y - r * .55} ${x + r} ${y + r * .45}Z" fill="${fill}"/>${[-0.86, -0.43, 0, 0.43, 0.86].map(t => `<circle cx="${x + t * r}" cy="${y + r * .5}" r="${r * .27 - 1.5}" fill="${fill}"/>`).join('')}
    <ellipse cx="${x - r * .42}" cy="${y - r * .48}" rx="${r * .26}" ry="${r * .14}" transform="rotate(-28 ${x - r * .42} ${y - r * .48})" fill="#fff" opacity=".6"/>${specks}</g>`;
}
function puddle(color, base = .25) {
  return `<ellipse class="mx-puddle" style="--bp:${base}" cx="100" cy="214" rx="78" ry="10" fill="${color}"/>`;
}
function snowflakes() {
  return [[22, 40, 9], [178, 64, 7], [30, 150, 6], [176, 170, 8], [56, 18, 5]].map(([x, y, r]) => `<g transform="translate(${x} ${y})" stroke="#A9CBEA" stroke-width="2" stroke-linecap="round"><path d="M0 ${-r} V${r} M${-r * .87} ${-r / 2} L${r * .87} ${r / 2} M${-r * .87} ${r / 2} L${r * .87} ${-r / 2}"/></g>`).join('');
}

function cupArt(a) {
  const id = 'mc' + (++svgId);
  const cup = 'M52 120 L148 120 L137 206 Q100 214 63 206 Z';
  const tilt = a.abandoned ? 'transform="rotate(-6 100 210)"' : '';
  const base = a.abandoned ? 'style="--bs:.74;--bdy:10px"' : '';
  return `${a.snow ? snowflakes() : ''}${puddle(a.scoop, a.abandoned ? .55 : .12)}
    <g ${tilt}>
      <defs><clipPath id="${id}"><path d="${cup}"/></clipPath><clipPath id="${id}s"><rect x="-20" y="-60" width="240" height="184"/></clipPath></defs>
      <path d="${cup}" fill="${a.cup}"/>${cupPattern(a, id)}
      <g clip-path="url(#${id}s)"><g class="mx-scoop" ${base}>${scoopShape(100, 104, 50, a.scoop, a.speck)}${a.flag ? qFlag(124, 70) : ''}</g></g>
      <g fill="${a.scoop}">
        <path class="mx-drip" style="--bd:${a.abandoned ? 1.4 : .6}" d="M66 122 v12 a6 6 0 0 0 12 0 v-12Z"/>
        <path class="mx-drip" style="--bd:${a.abandoned ? 1.8 : .4}" d="M118 122 v8 a5 5 0 0 0 10 0 v-8Z"/>
      </g>
      <rect x="45" y="112" width="110" height="16" rx="8" fill="#FFFEFA"/>
    </g>`;
}

// One popsicle with its wrapper. The wrapper tears down the middle.
function onePopsicle(a, unknown) {
  const id = 'mp' + (++svgId);
  const top = 34, bot = 186, L = 58, Rt = 142;
  let tear = '';
  for (let y = top + 4, i = 0; y <= bot - 4; y += 9, i++) tear += ` L${100 + (i % 2 ? 4 : -4)} ${y}`;
  const crimpTop = side => { let d = ''; for (let x = side < 0 ? L : 100, i = 0; side < 0 ? x <= 100 : x <= Rt; x += 7, i++) d += ` L${x} ${top + (i % 2 ? 0 : 9)}`; return d; };
  const crimpBot = side => { let d = ''; for (let x = side < 0 ? 100 : Rt, i = 0; side < 0 ? x >= L : x >= 100; x -= 7, i++) d += ` L${x} ${bot - (i % 2 ? 0 : 9)}`; return d; };
  const left = `M${L} ${top + 9}${crimpTop(-1)}${tear} L100 ${bot}${crimpBot(-1)} Z`;
  const right = `M100 ${top + 9}${crimpTop(1)} L${Rt} ${bot}${crimpBot(1)}${tear.split(' L').reverse().filter(Boolean).map(p => ' L' + p).join('')} Z`;
  const label = `<ellipse cx="100" cy="110" rx="34" ry="19" fill="#FFFEFA"/><text x="100" y="${a.label ? 113.5 : 117}" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="${a.label ? 10 : 20}" fill="${MEM_INK}" text-anchor="middle">${a.label ? esc(a.label) : '?'}</text>`;
  const half = (d, cls, cid) => `<g class="${cls}"><defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${a.wrap}"/>
      <g clip-path="url(#${cid})"><path d="M64 34 V190 M134 34 V190" stroke="#fff" stroke-width="7" opacity=".55"/>${label}</g></g>`;
  return `<rect x="92" y="150" width="16" height="56" rx="7" fill="#F3D3A4"/>
    <g class="mx-scoop"><rect x="72" y="46" width="56" height="120" rx="26" fill="${a.bar}"/><rect x="80" y="62" width="9" height="78" rx="4.5" fill="#fff" opacity=".65"/>${unknown ? `<text x="108" y="118" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="22" fill="${MEM_INK}" opacity=".55" text-anchor="middle">?</text>` : ''}</g>
    <path class="mx-drip" style="--bd:.2" d="M94 164 v6 a5 5 0 0 0 10 0 v-6Z" fill="${a.bar}"/>
    ${half(left, 'mx-wl', id + 'l')}${half(right, 'mx-wr', id + 'r')}`;
}
const DESSERT_ICONS = {
  cookie:  `<circle r="13" fill="#E8C296"/><circle cx="-4" cy="-3" r="2.4" fill="#8C6248"/><circle cx="5" cy="-5" r="2" fill="#8C6248"/><circle cx="2" cy="5" r="2.4" fill="#8C6248"/><circle cx="-6" cy="5" r="1.6" fill="#8C6248"/>`,
  pudding: `<path d="M-12 10 L-8 -6 Q0 -12 8 -6 L12 10Z" fill="#FFE29A"/><path d="M-8 -6 Q0 -12 8 -6 Q8 -1 4 -1 Q2 3 0 -1 Q-3 2 -5 -1 Q-8 -1 -8 -6Z" fill="#B97F4F"/>`,
  cake:    `<path d="M-13 10 L-13 -3 L13 -10 L13 10Z" fill="#FFF6DA"/><path d="M-13 3 L13 -2" stroke="#FFB3C8" stroke-width="3"/><circle cx="6" cy="-12" r="3.6" fill="#EE6B83"/>`,
  tart:    `<circle r="13" fill="#EBC48F"/><circle r="8.5" fill="#FFD86B"/><circle cx="-2" cy="-2" r="2.4" fill="#F2A65A" opacity=".7"/>`,
  danish:  `<circle r="13" fill="#F0C98F"/><path d="M0 0 m-7 0 a7 7 0 1 1 7 7 a4 4 0 1 1 -4 -4" fill="none" stroke="#C98B4E" stroke-width="2.4" stroke-linecap="round"/><circle r="3" fill="#EE6B83"/>`,
};
function popsicleArt(a) {
  // bars / labels give each popsicle in a pair its own colour and label; '?' means not remembered
  const one = n => { const label = (a.labels || [])[n] ?? a.label; return { ...a, bar: (a.bars || [])[n] ?? a.bar, label: label === '?' ? '' : label }; };
  const draw = n => onePopsicle(one(n), !one(n).label);
  const bars = a.count === 2
    ? `<g transform="translate(-34 10) scale(.84)">${draw(0)}</g><g transform="translate(66 2) scale(.84) rotate(5 100 120)">${draw(1)}</g>`
    : draw(0);
  const tag = `<path d="M108 200 Q130 214 150 196" fill="none" stroke="${MEM_INK}" stroke-width="1.6" stroke-dasharray="3 3"/>
    <g transform="translate(166 190) rotate(-8)"><path d="M-22 -18 H16 L24 0 L16 18 H-22Z" fill="#FFFEFA"/><circle cx="16" cy="0" r="2.6" fill="none" stroke="${MEM_INK}" stroke-width="1.6"/><g transform="translate(-3 0) scale(.95)">${DESSERT_ICONS[a.dessert] || ''}</g></g>`;
  return puddle((a.bars || [])[0] || a.bar, .08) + bars + tag + (a.count === 2 ? `<g transform="translate(26 38) rotate(-10)"><circle r="15" fill="#FF9DB8"/><text y="5" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="14" fill="#FFFEFA" text-anchor="middle">x2</text></g>` : '');
}

const GHOST_PROPS = {
  coffee:   `<g transform="translate(160 182)"><path d="M-16 -22 H16 L12 22 H-12Z" fill="#FFFEFA"/><rect x="-14" y="-6" width="28" height="12" fill="#C9A17E"/><rect x="-19" y="-30" width="38" height="9" rx="3" fill="#B08A70"/><path d="M-4 -40 q4 -6 0 -12 M6 -40 q4 -6 0 -12" stroke="#C9B7A8" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  closed:   `<g transform="translate(160 176)"><path d="M-10 34 L0 10 L10 34" stroke="${MEM_INK}" stroke-width="2.6" fill="none"/><rect x="-28" y="-20" width="56" height="32" rx="5" fill="#FFFEFA"/><text y="-6" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="11" fill="#EE6B83" text-anchor="middle">CLOSED</text><text y="7" font-family="Soft Scoop, ZH Text, sans-serif" font-size="9" fill="${MEM_INK}" text-anchor="middle">~5pm</text></g>`,
  coaster:  `<g transform="translate(158 180)" fill="none" stroke="${MEM_INK}" stroke-width="2.6" stroke-linecap="round"><path d="M-34 28 Q-20 -40 2 -20 Q20 -4 0 6 Q-18 14 -6 -16 Q8 -46 34 28" stroke="#C3C5F8" stroke-width="6"/><path d="M-34 28 Q-20 -40 2 -20 Q20 -4 0 6 Q-18 14 -6 -16 Q8 -46 34 28"/><path d="M-24 28 V0 M24 28 V2 M0 28 V8"/><rect x="-12" y="-36" width="16" height="10" rx="3" fill="#FF9DB8" stroke-width="2" transform="rotate(-30 -4 -31)"/></g>`,
  ticket:   `<g transform="translate(160 186) rotate(-10)"><path d="M-30 -16 H30 V-6 A6 6 0 0 0 30 6 V16 H-30 V6 A6 6 0 0 0 -30 -6Z" fill="#FFF0A6"/><path d="M14 -16 V16" stroke="${MEM_INK}" stroke-width="1.6" stroke-dasharray="3 3"/><text x="-8" y="4" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="9" fill="${MEM_INK}" text-anchor="middle">CINEMA</text></g>`,
  question: `<g transform="translate(150 70)"><path d="M-34 -22 H34 Q42 -22 42 -14 V10 Q42 18 34 18 H-6 L-20 30 L-16 18 H-34 Q-42 18 -42 10 V-14 Q-42 -22 -34 -22Z" fill="#FFFEFA"/><text y="1" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="10" fill="${MEM_INK}" text-anchor="middle">IS IT</text><text y="13" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="10" fill="${MEM_INK}" text-anchor="middle">GOOD?</text></g>`,
  basket:   `<g transform="translate(158 188)"><path d="M-32 -12 H32 L26 22 H-26Z" fill="#F3D3A4"/><path d="M-20 -12 V22 M0 -12 V22 M20 -12 V22 M-29 4 H29" stroke="#D9B07C" stroke-width="2.2"/><path d="M-22 -12 Q0 -46 22 -12" fill="none" stroke="${MEM_INK}" stroke-width="2.6"/></g>`,
};
function ghostArt(a) {
  const face = a.face === 'nope'
    ? `<path d="M80 102 h12 M108 102 h12" stroke="#7E6A60" stroke-width="3.2" stroke-linecap="round"/><path d="M92 122 h16" stroke="#7E6A60" stroke-width="3" stroke-linecap="round"/>`
    : a.face === 'hmm'
      ? `<circle cx="86" cy="102" r="5" fill="#7E6A60"/><circle cx="114" cy="102" r="5" fill="#7E6A60"/><path d="M106 88 l14 -4" stroke="#7E6A60" stroke-width="3" stroke-linecap="round"/><path d="M92 124 q6 -5 14 0" stroke="#7E6A60" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="86" cy="102" r="5" fill="#7E6A60"/><circle cx="114" cy="102" r="5" fill="#7E6A60"/><ellipse cx="100" cy="122" rx="5" ry="6.5" fill="#7E6A60"/>`;
  const body = 'M54 204 L54 116 C54 74 76 58 100 58 C124 58 146 74 146 116 L146 204 Q136 192 126 204 Q114 216 100 204 Q86 192 74 204 Q64 216 54 204 Z';
  return `<g class="mx-ghost"><g class="mx-float">
      <path d="${body}" fill="#FFFFFF" fill-opacity=".62"/>
      <g opacity=".85">${face}</g>
      <ellipse cx="80" cy="114" rx="7" ry="4" fill="#FF9DB8" opacity=".35"/><ellipse cx="120" cy="114" rx="7" ry="4" fill="#FF9DB8" opacity=".35"/>
    </g></g>${GHOST_PROPS[a.prop] || ''}`;
}

function affogatoArt() {
  const id = 'ma' + (++svgId);
  const glass = 'M54 92 L146 92 L134 198 Q100 210 66 198 Z';
  return `<g transform="translate(26 182)" opacity=".9"><path d="M8 -14 a12 12 0 1 0 12 14 a9 9 0 1 1 -12 -14Z" fill="#FFE98F"/><text x="26" y="-10" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="11" fill="${MEM_INK}">z?</text></g>
    <defs><clipPath id="${id}"><path d="${glass}"/></clipPath></defs>
    <path d="${glass}" fill="#FFFFFF" fill-opacity=".5"/>
    <g class="mx-sink">${scoopShape(100, 84, 40, '#FFF6E6')}${qFlag(118, 56)}</g>
    <g clip-path="url(#${id})"><rect class="mx-coffee" x="40" y="120" width="120" height="96" fill="#B7865F" opacity=".92"/><path class="mx-coffee" d="M40 120 q15 -6 30 0 t30 0 t30 0 t30 0" fill="none" stroke="#D9B48F" stroke-width="3"/></g>
    <path d="${glass}" fill="#FFFFFF" fill-opacity=".28"/>
    <path d="M64 100 L72 190" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>
    <path d="M140 40 L118 150" stroke="#C9CED6" stroke-width="7" stroke-linecap="round"/><ellipse cx="143" cy="34" rx="8" ry="11" transform="rotate(25 143 34)" fill="#E3E7EC"/>`;
}
function bowlArt(a) {
  const sparkle = (x, y, r) => `<path transform="translate(${x} ${y})" d="M0 ${-r} Q${r * .16} ${-r * .16} ${r} 0 Q${r * .16} ${r * .16} 0 ${r} Q${-r * .16} ${r * .16} ${-r} 0 Q${-r * .16} ${-r * .16} 0 ${-r}Z" fill="#FFE98F"/>`;
  return `<ellipse cx="100" cy="206" rx="70" ry="9" fill="#EDE3D6"/>
    <g class="mx-eat">${scoopShape(100, 118, 50, a.mound)}<g fill="#F7B05A">${[[78, 108], [108, 96], [122, 120], [92, 126]].map(([x, y]) => `<rect x="${x}" y="${y}" width="11" height="11" rx="3"/>`).join('')}</g>${qFlag(120, 84)}</g>
    <path d="M30 140 Q34 206 100 206 Q166 206 170 140 Z" fill="#FFE3EB"/>
    <path d="M30 140 H170" stroke="#FFD2DD" stroke-width="4" stroke-linecap="round"/><path d="M44 160 Q100 184 156 160" stroke="#FFB3C8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M150 116 L182 58" stroke="#C9CED6" stroke-width="7" stroke-linecap="round"/><ellipse cx="146" cy="124" rx="9" ry="12" transform="rotate(30 146 124)" fill="#E3E7EC"/>
    <g class="mx-sparkle">${sparkle(56, 102, 11)}${sparkle(150, 86, 8)}${sparkle(100, 76, 13)}</g>`;
}
function smashArt() {
  const pieces = [[-46, -6, '#C9926B'], [-26, 10, '#9C6B52'], [-6, -14, '#F7B27A'], [18, 8, '#C9926B'], [40, -8, '#9C6B52'], [-38, 14, '#F7B27A'], [30, 16, '#FFF6E6'], [6, 18, '#9C6B52'], [-14, 4, '#FFF6E6'], [50, 10, '#F7B27A']];
  return `<ellipse cx="100" cy="196" rx="86" ry="18" fill="#FFFEFA"/><ellipse cx="100" cy="194" rx="62" ry="11" fill="none" stroke="#EDE3D6" stroke-width="3"/>
    <g class="mx-whole">
      <rect x="62" y="148" width="76" height="40" rx="8" fill="#C9926B"/>
      <rect x="62" y="122" width="76" height="30" rx="8" fill="#9C6B52"/>
      <rect x="62" y="100" width="76" height="26" rx="8" fill="#F7B27A"/>
      ${scoopShape(100, 84, 32, '#FFF6E6')}
      <path d="M84 128 h10 M104 136 h14 M76 168 h12 M108 160 h16" stroke="#F3E2C8" stroke-width="3" stroke-linecap="round"/>
    </g>
    ${pieces.map(([dx, dy, c], i) => `<path class="mx-piece" style="--dx:${dx}px;--dy:${dy}px" transform="translate(${100 + dx * .2} ${184 + dy * .2}) rotate(${i * 47})" d="M-9 -2 L-3 -9 L8 -6 L9 4 L0 9 L-8 6Z" fill="${c}"/>`).join('')}
    <g transform="translate(62 70) rotate(-35)"><rect x="-4" y="-50" width="8" height="58" rx="4" fill="#C9CED6"/><ellipse cx="0" cy="14" rx="9" ry="12" fill="#E3E7EC"/></g>
    <g transform="translate(140 70) rotate(35)"><rect x="-4" y="-50" width="8" height="58" rx="4" fill="#C9CED6"/><ellipse cx="0" cy="14" rx="9" ry="12" fill="#E3E7EC"/></g>`;
}
function coneShape(x, y, s, scoop) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-36 0 L36 0 L2 86 Q0 90 -2 86 Z" fill="#F3D3A4"/>
    <path d="M-26 6 L14 70 M-10 2 L22 44 M8 2 L28 18 M26 6 L-14 70 M10 2 L-22 44 M-8 2 L-28 18" stroke="#DFB27C" stroke-width="2.4"/>
    <g class="mx-scoop" style="--k:.45;--sink:0px"><g transform="rotate(22 22 -60)"><rect x="16" y="-92" width="11" height="58" rx="5" fill="#B98563"/><path d="M18 -84 l7 4 M18 -74 l7 4 M18 -64 l7 4 M18 -54 l7 4" stroke="#8C6248" stroke-width="1.8"/></g>${scoopShape(0, -18, 40, scoop)}</g>
  </g>`;
}
function matchingArt(a) {
  return `${puddle(a.scoop, .06)}${coneShape(84, 118, 1, a.scoop)}
    <g class="mx-twin">${coneShape(166, 156, .55, a.scoop)}<text x="166" y="226" font-family="Soft Scoop, ZH Text, sans-serif" font-size="10" fill="${MEM_INK}" text-anchor="middle">a kid’s</text></g>`;
}

// tight: crop the empty margin around the drawing (on the shelves, where space is short).
// Anything that pokes out past the crop still shows, because the svg doesn't clip.
function memArt(m, tight) {
  const style = memStyle(m);
  const body = style === 'cup' ? cupArt(m.art) : style === 'popsicle' ? popsicleArt(m.art) : style === 'ghost' ? ghostArt(m.art)
    : style === 'affogato' ? affogatoArt() : style === 'bowl' ? bowlArt(m.art) : style === 'smash' ? smashArt() : matchingArt(m.art);
  return `<svg class="memsvg" viewBox="${tight ? '24 26 152 192' : '0 0 200 230'}" role="img" aria-label="${esc(m.title)}">${body}</svg>`;
}
// The colour of the frozen layer that covers each story
function coatColor(m) {
  const a = m.art, s = memStyle(m);
  if (s === 'cup') return a.scoop === '#FFFFFF' ? '#F7F7F2' : a.scoop;
  if (s === 'popsicle') return (a.bars || [])[0] || a.bar;
  if (s === 'affogato') return '#E2C3A0';
  if (s === 'bowl') return a.mound;
  if (s === 'matching' || s === 'cone') return a.scoop;
  return '#FFFFFF';
}

/* --- THE FREEZER: a horizontal chest freezer, and a stage beside it ----------------
   Left, the 22 memories lie in a chest freezer, each in its own fixed spot. Right,
   the one you pick is taken out and melts on the stage, its story showing through.
   Two ways to look: every ice cream on its own (with a small filter by kind), or
   OUR STORIES, the few that were tied together on purpose (by id, never guessed). */

// Where each memory lies in the chest: [x, y, tilt, size]. x and y are the bottom
// centre of the ice cream, in the chest's 1000 × 680 drawing; further back (smaller
// y) is drawn smaller. Left to right roughly follows the seasons. Fixed on purpose:
// the freezer looks the same every time it opens.
const CHEST = {
  '01': [118, 334, -7, 0.92], '02': [128, 470, 5, 1.0], '03': [200, 196, -8, 0.82], '04': [297, 206, 0, 0.82], '05': [240, 344, 10, 0.92], '06': [254, 480, -4, 1.0],
  '07': [362, 334, 4, 0.92], '08': [378, 470, 12, 1.0], '09': [502, 480, -3, 1.0], '10': [394, 196, 0, 0.82], '11': [484, 344, 0, 0.92], '12': [491, 206, 7, 0.82],
  '13': [626, 470, -6, 1.0], '14': [606, 334, 3, 0.92], '15': [588, 196, -5, 0.82], '16': [685, 206, 0, 0.82], '17': [728, 344, -8, 0.92], '18': [750, 480, 6, 1.0],
  '19': [852, 334, 14, 0.92], '20': [782, 196, 0, 0.82], '21': [879, 206, 0, 0.82], '22': [874, 470, -4, 1.0],
};
const CHEST_TAGS = [[112, 'WINTER ’25'], [272, 'SPRING ’26'], [520, 'JUNE ’26'], [792, 'SUMMER & FALL ’26']];   // little tags on the back wall
const KIND_FILTERS = { all: 'Everything', cup: 'Cups', popsicle: 'Popsicles', ghost: 'Ghosts', special: 'Specials' };
const STORY_KEYS = Object.keys(MEMORY_SERIES).filter(k => MEMORY_SERIES[k].story);   // the ones put together by hand
// fz: what the freezer is showing. view: 'none' (empty stage), 'memory', 'stories' (the list),
// 'story' (one story, step by step), 'fresh' (the Freshly Frozen drawer) or 'door' (the archive).
let fz = { mode: 'all', filter: 'all', view: 'none', sel: null, story: null, step: 0 };

function chestItem(m) {
  const [x, y, r, s] = CHEST[m.id];
  const thawed = thawedList().includes(m.id);
  return `<button class="cmem k-${m.kind} ${m.art.count === 2 ? 'two' : ''} ${thawed ? 'thawed' : 'frozen'}" data-act="pickMemory" data-val="${m.id}"
      style="left:${x / 10}%;top:${y / 6.8}%;--r:${r}deg;--s:${s};z-index:${y}" aria-label="${esc(m.title)}, ${esc(m.when)}">
    <span class="cmem-art">${memArt(m, true)}</span>
    <span class="cmem-tip" aria-hidden="true"><b>${esc(m.title)}</b><span>${esc(m.short)}</span></span>
  </button>`;
}
// The chest itself: drawn once in a 1000 × 680 box that always keeps its shape.
const CHEST_BACK = `<svg class="chest-svg" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="tubG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3EB"/><stop offset=".16" stop-color="#DCEDF3"/><stop offset="1" stop-color="#EEF7FA"/></linearGradient>
    <linearGradient id="frontG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9EEF6"/><stop offset="1" stop-color="#C9E4EF"/></linearGradient>
  </defs>
  <ellipse cx="500" cy="664" rx="480" ry="15" fill="rgba(120,90,70,.12)"/>
  <path d="M40 502 H960 L948 636 Q946 648 932 648 H68 Q54 648 52 636 Z" fill="url(#frontG)"/>
  <path d="M44 516 H956 L954 540 H46 Z" fill="#FFD6DF"/>
  <path d="M92 26 H908 Q930 26 936 46 L986 482 Q990 506 966 506 H34 Q10 506 14 482 L64 46 Q70 26 92 26 Z" fill="#FFFEFA"/>
  <path d="M108 52 H892 L948 480 H52 Z" fill="url(#tubG)"/>
  <path d="M108 52 H892 L886 96 H114 Z" fill="#C6DDE7" opacity=".7"/>
  <path d="M108 52 L114 96 L58 480 L52 480 Z" fill="#C6DDE7" opacity=".45"/><path d="M892 52 L886 96 L942 480 L948 480 Z" fill="#C6DDE7" opacity=".45"/>
  <g fill="#FFFFFF" opacity=".75">${[[130, 62, 9], [180, 59, 5], [300, 60, 7], [470, 58, 6], [640, 61, 8], [790, 59, 5], [870, 63, 9], [98, 150, 6], [82, 290, 8], [906, 160, 7], [926, 320, 6], [68, 440, 7], [938, 450, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
</svg>`;
const CHEST_FRONT = `<svg class="chest-svg chest-over" viewBox="0 0 1000 680" preserveAspectRatio="none" aria-hidden="true">
  <path d="M52 480 H948 L966 506 H34 Z" fill="#FFFEFA"/><path d="M60 482 H940" stroke="#E4EEF2" stroke-width="3"/>
  <path d="M700 52 H892 L948 480 H752 Z" fill="rgba(255,255,255,.16)" stroke="rgba(170,200,212,.55)" stroke-width="2.5"/>
  <path d="M770 74 L744 160 M806 80 L764 226 M884 300 L868 364" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".5"/>
  <g class="chest-mist" fill="#FFFFFF"><ellipse cx="260" cy="134" rx="120" ry="26"/><ellipse cx="620" cy="290" rx="150" ry="30"/><ellipse cx="420" cy="420" rx="130" ry="24"/></g>
</svg>`;
function chestHTML() {
  return `<div class="chest" id="chest">
    ${CHEST_BACK}
    ${CHEST_TAGS.map(([x, t], i) => `<span class="chunky chest-tag" style="left:${x / 10}%;--t:${[-3, 2, -2, 3][i]}deg">${esc(t)}</span>`).join('')}
    <svg class="threads" id="threads" aria-hidden="true"></svg>
    ${MEMORIES.map(chestItem).join('')}
    ${CHEST_FRONT}
    <div class="chest-front">
      <button class="crisper chest-drawer ${thawedList().includes('more') ? 'thawed' : ''}" data-act="pickMemory" data-val="more" aria-label="${esc(MEMORY_MORE.title)}">
        <span class="crisper-window" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="chunky crisper-tag">${esc(MEMORY_COPY.drawer)}</span></button>
      <button class="chest-note" data-act="openDoor" aria-label="The archive: everything the machine thinks it knows">
        <svg viewBox="0 0 120 70" aria-hidden="true"><g class="note-ic"><path d="M8 6 H112 L108 64 H12 Z" fill="#FFF0A6"/><path d="M44 0 H76 V12 H44 Z" fill="#F7C9D4" opacity=".9"/>
          <path d="M24 50 V38 M38 50 V28 M52 50 V42 M66 50 V24 M80 50 V34 M94 50 V30" stroke="#E3A6B4" stroke-width="7" stroke-linecap="round"/></g></svg>
        <span class="chunky">ARCHIVE</span></button>
      ${freshDrawerButton()}
    </div>
  </div>`;
}
// The Freshly Frozen drawer on the front: the newest three peek through
function freshDrawerButton() {
  const fresh = sortedEntries();
  return `<button class="crisper chest-drawer fresh-drawer ${fz.view === 'fresh' ? 'on' : ''}" data-act="openFresh" aria-label="Freshly Frozen: ${fresh.length} new records">
        <span class="crisper-window fresh-window">${fresh.slice(-3).reverse().map(r => `<span class="fz">${entryThumb(r)}</span>`).join('') || '<em>Empty, for now.</em>'}</span>
        <span class="chunky crisper-tag">FRESHLY FROZEN · ${fresh.length}</span></button>`;
}
// New records arrived from the shared sheet: only the drawer changes, so a memory
// halfway through melting on the stage is left alone.
function refreshFreezerRecords() {
  const d = document.querySelector('#chest .fresh-drawer');
  if (d) d.outerHTML = freshDrawerButton();
  const want = decodeURIComponent(location.hash.split('/')[1] || '');   // a record that wasn't here yet when the page opened
  if (want && !['fresh', 'stories', 'story', 'door'].includes(want) && fz.sel !== want && memoryById(want)) { fz = { ...fz, mode: 'all', view: 'memory', sel: want }; renderStage(false); }
  else if (fz.view === 'fresh' || fz.view === 'door') renderStage(false);
  // a record on the stage may have gained a kept memory; redraw it unless it is halfway through melting
  else if (fz.view === 'memory' && (memoryById(fz.sel) || {}).isRecord && (!memState || memState.p === 0 || memState.done)) renderStage(false);
}
// Which ice creams the chest is pointing at right now
function chestState() {
  const story = fz.view === 'story' ? MEMORY_SERIES[fz.story] : null;
  document.querySelectorAll('#chest .cmem').forEach(el => {
    const id = el.dataset.val, m = memoryById(id);
    const inStory = story && story.ids.includes(id);
    el.classList.toggle('on', fz.sel === id && (fz.view === 'memory' || fz.view === 'story'));
    el.classList.toggle('lift', !!inStory);
    el.classList.toggle('dim', story ? !inStory : fz.mode === 'all' && fz.filter !== 'all' && m.kind !== fz.filter);
    el.classList.toggle('thawed', thawedList().includes(id));
    if (inStory) el.dataset.order = story.ids.indexOf(id) + 1; else delete el.dataset.order;
  });
  document.querySelector('#chest .fresh-drawer')?.classList.toggle('on', fz.view === 'fresh');
  document.querySelector('#chest .chest-note')?.classList.toggle('on', fz.view === 'door');
  drawThreads();
}
const freezerHash = () => fz.view === 'fresh' ? 'freezer/fresh' : fz.view === 'door' ? 'freezer/door' : fz.view === 'stories' ? 'freezer/stories'
  : fz.view === 'story' ? `freezer/story/${fz.story}/${fz.step + 1}` : fz.view === 'memory' && fz.sel ? 'freezer/' + fz.sel : 'freezer';
// the top bar: the two ways of looking, and the small filter
function freezerBarHTML() {
  return `<div class="fz-bar">
    <div class="fz-modes" role="tablist">
      <button class="chunky ${fz.mode === 'all' ? 'on' : ''}" role="tab" aria-selected="${fz.mode === 'all'}" data-act="freezerMode" data-val="all">All Ice Creams</button>
      <button class="chunky ${fz.mode === 'stories' ? 'on' : ''}" role="tab" aria-selected="${fz.mode === 'stories'}" data-act="freezerMode" data-val="stories">Our Stories</button>
    </div>
    ${fz.mode === 'all' ? `<details class="fz-filter"><summary class="chunky">${fz.filter === 'all' ? 'Filter' : esc(KIND_FILTERS[fz.filter])}</summary>
      <div class="fz-filter-list">${Object.entries(KIND_FILTERS).map(([k, l]) => `<button class="${fz.filter === k ? 'on' : ''}" data-act="freezerFilter" data-val="${k}">${esc(l)}</button>`).join('')}</div></details>` : ''}
    <p class="fz-hint">Pick an ice cream to remember.</p>
  </div>`;
}
// The stage: whatever is out of the freezer right now
function stageHTML() {
  if (fz.view === 'none') return '';
  const narrow = !wideFreezer();
  const up = `<div class="stage-top">${narrow ? `<button class="link stage-up" data-act="stageUp"><span aria-hidden="true">↑ </span><span>${esc(MEMORY_COPY.back)}</span></button>` : '<span></span>'}
    <button class="stage-close" data-act="closeStage" aria-label="Put it back"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 4 L16 16 M16 4 L4 16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button></div>`;
  if (fz.view === 'fresh') return up + freshDrawerHTML();
  if (fz.view === 'door') return up + `<div class="door-view">${archiveBodyHTML()}</div>`;
  if (fz.view === 'stories') return up + `<div class="stage-empty stories-index"><p class="chunky stage-k">OUR STORIES</p>
    ${STORY_KEYS.map(k => { const s = MEMORY_SERIES[k]; return `<button class="story-pick" data-act="openStory" data-val="${k}"><b class="melty">${esc(s.title)}</b><span>${esc(s.note)}</span><small class="chunky">${s.ids.length} ICE CREAMS</small></button>`; }).join('')}</div>`;
  if (fz.view === 'story') {
    const s = MEMORY_SERIES[fz.story], id = s.ids[fz.step];
    return `${up}<div class="story-bar">
        <button class="link" data-act="freezerMode" data-val="stories">‹ Our Stories</button>
        <span class="chunky story-name">${esc(s.title)}</span>
        <span class="story-steps"><button class="step-btn" data-act="storyStep" data-val="-1" ${fz.step ? '' : 'disabled'} aria-label="Previous">‹</button><span class="chunky">${fz.step + 1} / ${s.ids.length}</span><button class="step-btn" data-act="storyStep" data-val="1" ${fz.step < s.ids.length - 1 ? '' : 'disabled'} aria-label="Next">›</button></span>
      </div>${memoryCardHTML(memoryById(id), { stage: true })}`;
  }
  if (fz.view === 'memory' && memoryById(fz.sel)) {
    const m = memoryById(fz.sel);
    return up + (m.isRecord ? `<div class="story-bar"><button class="link" data-act="openFresh">‹ Freshly Frozen</button><span></span><button class="link" data-act="open" data-val="${esc(m.id)}">Record details</button></div>` : '') + memoryCardHTML(m, { stage: true });
  }
  return '';
}
function renderStage(scroll) {
  const box = document.getElementById('memStagePanel');
  if (!box) return;
  box.innerHTML = stageHTML();
  box.scrollTop = 0;
  setStageOpen();
  if (document.getElementById('memory')) bindMemoryStage(false);
  chestState();
  history.replaceState(null, '', '#' + freezerHash());
  if (scroll && !wideFreezer()) box.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}
// The chest has the whole screen to itself until something is taken out of it
function setStageOpen() {
  const f = document.getElementById('freezer');
  if (f) f.dataset.open = fz.view !== 'none' ? 'true' : 'false';
}
function refreshFreezerBar() {
  const bar = document.querySelector('#freezer .fz-bar');
  if (bar) bar.outerHTML = freezerBarHTML();
}
// read #freezer, #freezer/<id>, #freezer/fresh, #freezer/stories, #freezer/story/<key>/<n>
function freezerFromHash(param, extra, more) {
  if (param === 'fresh') fz = { ...fz, mode: 'all', view: 'fresh' };
  else if (param === 'door') fz = { ...fz, mode: 'all', view: 'door' };
  else if (param === 'stories') fz = { ...fz, mode: 'stories', view: 'stories' };
  else if (param === 'story' && MEMORY_SERIES[extra] && STORY_KEYS.includes(extra)) {
    const n = Math.max(0, Math.min(MEMORY_SERIES[extra].ids.length - 1, (parseInt(more, 10) || 1) - 1));
    fz = { ...fz, mode: 'stories', view: 'story', story: extra, step: n, sel: MEMORY_SERIES[extra].ids[n] };
  } else if (param && memoryById(param)) {
    const s = fz.view === 'story' && MEMORY_SERIES[fz.story];
    if (s && s.ids.includes(param)) fz = { ...fz, step: s.ids.indexOf(param), sel: param };
    else fz = { ...fz, mode: 'all', view: 'memory', sel: param };
  }
  else if (!param) fz = { ...fz, view: fz.mode === 'stories' ? 'stories' : 'none', sel: null };
}
function screenFreezer(param, extra, more) {
  setFlood('#F1F2F2', null);
  freezerFromHash(param, extra, more);
  return `<section class="screen wide" id="freezer" data-open="${fz.view !== 'none'}">
    <div class="fz-head"><h1 class="melty fz-title">${esc(MEMORY_COPY.title)}</h1>${freezerBarHTML()}</div>
    <div class="fz-scene">
      <p class="chest-swipe" aria-hidden="true">Swipe to see the whole freezer ›</p>
      <div class="chest-scroll" id="chestScroll">${chestHTML()}</div>
      <div class="mem-stage-panel" id="memStagePanel" aria-live="polite">${stageHTML()}</div>
    </div>
    ${ticketStrip('freezer')}
  </section>`;
}
const wideFreezer = () => matchMedia('(min-width: 820px)').matches;
// On a computer the whole scene fits one screen: the chest gets as wide as the
// height allows. Phones scroll the chest sideways instead (CSS).
function fitFreezer() {
  const view = document.getElementById('freezer'), chest = document.getElementById('chest');
  if (!view || !chest) return;
  if (window.ResizeObserver && !chest.dataset.watched) {
    chest.dataset.watched = '1';
    new ResizeObserver(() => { if (chest.isConnected) drawThreads(); }).observe(chest);
    const panel = document.getElementById('memStagePanel');
    let t = 0;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (document.getElementById('bmText')) fitStory(); }, 60); }).observe(panel);
  }
  chestState();
  if (document.getElementById('memory')) fitStory();
}

// The string that ties a story together: only while a story is chosen.
function drawThreads() {
  const svg = document.getElementById('threads'), chest = document.getElementById('chest');
  if (!svg || !chest) return;
  const story = fz.view === 'story' ? MEMORY_SERIES[fz.story] : null;
  if (!story) { svg.innerHTML = ''; return; }
  const box = chest.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  const pts = story.ids.map(id => {
    const el = chest.querySelector(`.cmem[data-val="${id}"] .cmem-art`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left - box.left + r.width / 2, r.top - box.top + r.height * .55];
  }).filter(Boolean);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
    d += ` C${x0 + (x1 - x0) * .3} ${Math.max(y0, y1) + 26} ${x0 + (x1 - x0) * .7} ${Math.max(y0, y1) + 26} ${x1} ${y1}`;
  }
  svg.innerHTML = `<path class="thread-line" d="${d}" fill="none" stroke="#FF9DB8" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>`;
}
function openFindSheet() {
  const thawed = thawedList();
  const row = m => `<button class="find-row" data-act="openMemory" data-val="${m.id}">
      <span class="find-art">${memArt(m)}</span>
      <span><span class="find-when">${esc(m.when)}</span><span class="chunky find-title">${esc(m.title)}</span><span class="find-where">${esc(m.where)}</span></span>
      <span class="find-state">${thawed.includes(m.id) ? 'thawed' : ''}</span></button>`;
  overlay.innerHTML = `<div class="sheet find-sheet"><h2 class="melty">${esc(MEMORY_COPY.find.toUpperCase())}</h2>
    ${SHELVES.map(s => `<h3 class="chunky find-shelf">${esc(s.label)}</h3>${s.ids.map(id => row(memoryById(id))).join('')}`).join('')}
    <h3 class="chunky find-shelf">${esc(MEMORY_COPY.drawer)}</h3>${row(MEMORY_MORE)}
    <button class="btn small c-white" style="margin-top:12px" data-act="closeSheet">CLOSE</button></div>`;
  overlay.classList.add('open');
}

/* --- The game's workbench: a quiet note when the place picked by hand has an old memory ---
   Only an explicit pick from LOCATIONS counts. A place category or a typed-in place never does. */
function memoryForPlace(loc) {
  const list = (LOCATIONS[loc] || {}).memories || [];
  return list.length ? memoryById(list[list.length - 1]) : null;   // the most recent one there
}
function updatePlaceMemory() {
  const box = document.getElementById('placeMemory');
  if (!box || !draft) return;
  const m = memoryForPlace(draft.loc);
  if (!m) { box.hidden = true; box.innerHTML = ''; return; }
  if (box.dataset.id === m.id && !box.hidden) return;
  box.dataset.id = m.id;
  box.hidden = false;
  box.innerHTML = `<svg viewBox="-10 -10 20 20" width="16" height="16" aria-hidden="true"><path d="M0 -8 V8 M-7 -4 L7 4 M-7 4 L7 -4" stroke="#8DB8E0" stroke-width="2" stroke-linecap="round"/></svg>
    <span>${esc(MEMORY_COPY.placeHint)}</span>
    <button class="link" data-act="openMemory" data-val="${m.id}" data-from="bench">${esc(MEMORY_COPY.placeLook)}</button>`;
}
