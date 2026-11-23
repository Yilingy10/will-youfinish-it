/* ==========================================================================
   EXPANSION: the temptation, where the rest went, the three-part verdict, the
   machine's moods, waste on the freezer door, achievements, and the links between the
   game and the Memory Freezer.

   Nothing here guesses. Every line, mood, title and badge is worked out from
   saved records with fixed rules, so the same records always give the same
   result. Two small things are stored on top of the records:
     KEPT_KEY      memories written for a record and kept on this device only
     ACH_SEEN_KEY  which achievements this device has already celebrated
   The 22 memories are only ever linked to, never counted.
   ========================================================================== */
const KEPT_KEY = 'willYouFinishIt.keptMemories.v1';
const ACH_SEEN_KEY = 'willYouFinishIt.achievementsSeen.v1';

// WHERE THE REST WENT. The game no longer asks this (I'M DONE goes straight from
// "what killed it" to "buy it again"), but records saved while it did ask keep
// their answer, and it still shows wherever one exists. Keys are stored with records.
const REST = {
  trashed: { label: 'I THREW IT AWAY',          short: 'Thrown away',      stamp: 'THROWN AWAY',     head: 'REST IN PEACE.',     line: 'You had potential.', color: 'strawberry', icon: 'bin' },
  shared:  { label: 'I SHARED IT WITH SOMEONE', short: 'Shared',           stamp: 'SHARED',          head: 'RESCUE SUCCESSFUL.', line: 'Another human has been assigned.', color: 'pistachio', icon: 'hands' },
  saved:   { label: 'I SAVED IT FOR LATER',     short: 'Saved for later',  stamp: 'SAVED FOR LATER', head: 'PUT ON ICE.',        line: 'Its fate is pending. The machine will not guess.', color: 'blueberry', icon: 'box' },
  unsaid:  { label: 'I’D RATHER NOT SAY',       short: 'Classified',       stamp: 'CLASSIFIED',      head: 'NO COMMENT.',        line: 'The machine respects this. It is also slightly offended.', color: 'white', icon: 'lock' },
};
const REST_UNKNOWN = { short: 'Not recorded', stamp: 'NOT FINISHED', head: 'FATE UNKNOWN.', line: 'Nobody told the machine where the rest went.', icon: 'q' };

// WHY DID YOU STOP? is no longer asked (it lives in WHAT KILLED IT? now).
// Kept so older records that answered it still read properly.
const WHY_STOP = {
  taste:       { label: 'I JUST WANTED A TASTE', short: 'Just wanted a taste' },
  toomuch:     { label: 'IT WAS TOO MUCH',       short: 'It was too much' },
  dislike:     { label: 'I DIDN’T LIKE IT',      short: 'Didn’t like it' },
  complicated: { label: 'IT’S COMPLICATED',      short: 'It’s complicated' },
};

// The machine's lines while you eat. Each one plays at most once per ice cream.
const BITE_LINES = {
  first:    'A promising start.',
  approach: 'We’re approaching the danger zone.',
  past:     'You’re not supposed to make it this far.',
  far:      'MY DATA. MY BEAUTIFUL DATA.',
};

// THE MACHINE'S MOODS. machineMind() picks one from the records (rules below);
// a line is picked from the mood without repeating the last one shown.
const MOODS = {
  blank:     { label: 'FACTORY NEW',            lines: ['I know nothing about you. I am ready to know everything.', 'No data. Infinite confidence.'] },
  listened:  { label: 'IN SHOCK',               lines: ['WAIT. YOU LISTENED?', 'It worked? The advice actually worked?'] },
  stunned:   { label: 'RECALIBRATING',          lines: ['Wait. You actually resisted?', 'The machine was not prepared for this.'] },
  weary:     { label: 'TIRED, BUT PRESENT',     lines: ['We’ve had this conversation.', 'The machine has said this before. It will say it again.'] },
  crumbling: { label: 'QUESTIONING EVERYTHING', lines: ['Something is terribly wrong with my calculations.', 'Perhaps I know nothing about you.'] },
  hopeful:   { label: 'CAUTIOUSLY PROUD',       lines: ['Perhaps I’m getting better at this.', 'The numbers are getting closer. Don’t ruin this.'] },
  smug:      { label: 'SMUG',                   lines: ['I understand your habits perfectly.', 'I have seen enough. (It has not seen enough.)'] },
  confident: { label: 'FAIRLY CONFIDENT',       lines: ['I know you. Mostly.', 'Statistically, I am right more often than not.'] },
  uncertain: { label: 'UNSURE',                 lines: ['I have data. I do not have answers.', 'Taste remains annoyingly personal.'] },
};

// ADVICE. Given once per unfinished ice cream, saved with it, so the machine
// remembers what it has already said. It never claims anyone took it.
const ADVICE = {
  smaller:   'Maybe get a smaller one next time.',
  sample:    'Have you considered asking for a sample?',
  share:     'Next time, maybe bring someone who wants the rest.',
  discussed: 'We’ve discussed this before.',
  life:      'The machine respectfully recommends reconsidering your life choices.',
};

const EXP = {
  resisted: {
    title: 'WAIT. YOU ACTUALLY RESISTED?', listened: 'WAIT. YOU LISTENED?',
    lines: ['The machine was not prepared for this.', 'No ice cream was harmed today.'],
    where: 'Where were you?', changed: 'Actually… I bought it.',
  },
  quick: { title: 'QUICK RECORD', sub: 'Eat in peace. Tell the machine when you’re done.', bites: 'bites, roughly', finished: 'Did you finish it?', save: 'SAVE IT', back: 'Back to tapping' },
  rest: { title: 'WHAT HAPPENED TO THE REST?', skip: 'Skip it' },
};

/* --- Small facts about a record --------------------------------------------- */
const restInfo = r => REST[r.rest] || REST_UNKNOWN;
function inGraveyard(r) { return !r.finished; }   // every unfinished one; where the rest went is no longer asked
function statusStamp(r) {
  if (isResisted(r)) return 'RESISTED';
  return r.finished ? 'FINISHED!' : 'NOT FINISHED';
}
function statusWords(r) {
  if (isResisted(r)) return 'Not bought';
  if (r.finished) return 'Finished';
  return 'Not finished';
}
const isHit = r => Math.abs(r.predictionError) <= ACCURACY_TOLERANCE_BITES;
const capFirst = t => String(t).charAt(0).toUpperCase() + String(t).slice(1);
function shortDate(iso, withYear) {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('en-US', withYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' });
}

/* --- The machine's mind --------------------------------------------------------
   Rules, top to bottom; the first that matches wins.
   1. no entries at all                                  → blank
   2. the latest entry is a resisted one                 → listened, if it had given advice before; else stunned
   3. 3+ purchases made since its first piece of advice  → weary
   4. 4 of the last 5 predictions off by more than 1     → crumbling
   5. clearly more accurate lately than at first         → hopeful
   6. 3 or fewer ice creams on file                      → smug
   7. right (within 1 bite) at least half the time       → confident
   8. otherwise                                          → uncertain */
const sortedEntries = () => [...allEntries()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
function adviceBefore(entry, list = sortedEntries()) {
  return list.filter(x => !isResisted(x) && ADVICE[x.advice] && String(x.date) < String(entry.date));
}
function purchasesSinceFirstAdvice(list = sortedEntries()) {
  const bought = list.filter(x => !isResisted(x));
  const first = bought.findIndex(x => ADVICE[x.advice]);
  return first < 0 ? 0 : bought.length - first - 1;
}
function machineMind(list = sortedEntries()) {
  const bought = list.filter(r => !isResisted(r));
  const last = list[list.length - 1];
  let mood;
  if (!list.length) mood = 'blank';
  else if (isResisted(last)) mood = adviceBefore(last, list).length ? 'listened' : 'stunned';
  else if (purchasesSinceFirstAdvice(list) >= 3) mood = 'weary';
  else {
    const errs = bought.map(r => Math.abs(r.predictionError));
    const recent = errs.slice(-5), half = Math.floor(errs.length / 2);
    const improving = half >= 3 && mean(errs.slice(0, half)) - mean(errs.slice(half)) > .75;
    const accuracy = errs.length ? errs.filter(e => e <= ACCURACY_TOLERANCE_BITES).length / errs.length : 0;
    if (recent.length >= 4 && recent.filter(e => e > ACCURACY_TOLERANCE_BITES).length >= 4) mood = 'crumbling';
    else if (improving) mood = 'hopeful';
    else if (bought.length <= 3) mood = 'smug';
    else mood = accuracy >= .5 ? 'confident' : 'uncertain';
  }
  return { mood, ...MOODS[mood] };
}
const lastMindLine = {};
function mindLine(mind) {
  const lines = mind.lines.filter(l => l !== lastMindLine[mind.mood]);
  const line = pick(lines.length ? lines : mind.lines);
  lastMindLine[mind.mood] = line;
  return line;
}

/* --- Advice -------------------------------------------------------------------
   For an unfinished ice cream, from its own facts and what came before:
   given twice already (and not just "discussed")  → discussed
   3+ confirmed thrown away                         → life
   "too much", or stopped because full / too heavy  → smaller
   "just a taste", or 2 bites or fewer              → sample
   thrown away                                      → share
   anything else                                    → no advice */
function chooseAdvice(r) {
  if (r.finished || isResisted(r)) return null;
  const before = sortedEntries().filter(x => !isResisted(x) && x.id !== r.id && String(x.date) < String(r.date));
  const given = before.filter(x => ADVICE[x.advice]);
  if (given.length >= 2 && given[given.length - 1].advice !== 'discussed') return 'discussed';
  if ([...before, r].filter(x => x.rest === 'trashed').length >= 3) return 'life';
  if (whyOf(r) === 'toomuch' || r.stopReason === 'full' || r.stopReason === 'too_heavy') return 'smaller';
  if (whyOf(r) === 'taste' || r.actualBites <= 2) return 'sample';
  if (r.rest === 'trashed') return 'share';
  return null;
}

/* --- Achievements -------------------------------------------------------------
   Worked out from the records every time, so they can't be unlocked twice or
   lost. Nothing rewards wasting anything. */
const ACHIEVEMENTS = [
  { id: 'great_escape',   title: 'THE GREAT ESCAPE',   how: 'Resisted an ice cream.',                          test: (b, res) => res[0] },
  { id: 'rare_survivor',  title: 'RARE SURVIVOR',      how: 'Finished an ice cream.',                          test: b => b.find(r => r.finished) },
  { id: 'nightmare',      title: 'MACHINE’S NIGHTMARE', how: 'Made a confident prediction miss by a lot.',     test: b => b.find(isConfidentlyWrong) },
  { id: 'sharing',        title: 'SHARING IS CARING',  how: 'Shared the rest with someone.',                   test: b => b.find(r => r.rest === 'shared'), hidden: true },   // only from older records
  { id: 'just_a_taste',   title: 'JUST A TASTE',       how: 'Stopped because you only wanted a taste, and said so.', test: b => b.find(r => whyOf(r) === 'taste') },
  { id: 'second_thoughts',title: 'SECOND THOUGHTS',    how: 'Changed your mind about buying one.',             test: (b, res) => [...b, ...res].find(r => r.changedMind) },
  { id: 'bullseye',       title: 'BULLSEYE',           how: 'The machine guessed the exact number of bites.',  test: b => b.find(r => r.predictionError === 0) },
];
const STICKERS = {
  great_escape: `<path d="M18 50 V26 C18 14 25 9 32 9 C39 9 46 14 46 26 V50 Q42 46 38 50 Q34 54 32 50 Q28 46 25 50 Q21 54 18 50Z" fill="#FFFFFF"/><circle cx="27" cy="27" r="2.6" fill="#7E6A60"/><circle cx="37" cy="27" r="2.6" fill="#7E6A60"/><path d="M28 35 q4 3 8 0" stroke="#7E6A60" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  rare_survivor: `<path d="M14 26 L20 46 H44 L50 26 L40 34 L32 16 L24 34Z" fill="#FFE98F"/><circle cx="32" cy="16" r="3.4" fill="#EE6B83"/>`,
  nightmare: `<rect x="16" y="18" width="32" height="26" rx="8" fill="#D6D7EE"/><path d="M23 27 l6 6 M29 27 l-6 6 M35 27 l6 6 M41 27 l-6 6" stroke="#6F655C" stroke-width="2.2" stroke-linecap="round"/><path d="M32 18 V11" stroke="#6F655C" stroke-width="2.2"/><circle cx="32" cy="10" r="2.6" fill="#EE6B83"/><path d="M26 40 q6 -4 12 0" stroke="#6F655C" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  sharing: `<path d="M22 30 L28 50 L34 30Z M30 30 L36 50 L42 30Z" fill="#F3D3A4"/><circle cx="28" cy="26" r="8" fill="#FFC6D5"/><circle cx="37" cy="26" r="8" fill="#D6EDBC"/><path d="M32 12 C29 7 22 10 25 15 L32 20 L39 15 C42 10 35 7 32 12Z" fill="#EE6B83"/>`,
  just_a_taste: `<ellipse cx="25" cy="24" rx="9" ry="12" fill="#E3E7EC"/><path d="M28 34 L44 52" stroke="#C9CED6" stroke-width="5" stroke-linecap="round"/><ellipse cx="25" cy="22" rx="5" ry="6" fill="#FFC6D5"/>`,
  second_thoughts: `<path d="M16 26 H40 L34 20 M48 38 H24 L30 44" stroke="#6F655C" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  bullseye: `<circle cx="32" cy="32" r="20" fill="#FFC6D5"/><circle cx="32" cy="32" r="13" fill="#FFFFFF"/><circle cx="32" cy="32" r="6" fill="#EE6B83"/>`,
};
function achievements(list = sortedEntries()) {
  const bought = list.filter(r => !isResisted(r)), resisted = list.filter(isResisted);
  return ACHIEVEMENTS.map(a => { const r = a.test(bought, resisted); return { ...a, earned: !!r, at: r ? r.date : null }; });
}
function seenAchievements() { try { const v = JSON.parse(storeGet(ACH_SEEN_KEY)); return Array.isArray(v) ? v : null; } catch (e) { return null; } }
// The ones earned since this device last celebrated. Calling it marks them as celebrated.
function takeNewAchievements() {
  const seen = seenAchievements() || [];
  const fresh = achievements().filter(a => a.earned && !seen.includes(a.id));
  if (fresh.length) storeSet(ACH_SEEN_KEY, JSON.stringify([...seen, ...fresh.map(a => a.id)]));
  return fresh;
}
// First visit after this update: what's already earned is filed quietly, without a parade.
// On a new device (or a new web address) the records arrive from the shared archive a moment
// after the page opens. Old achievements then count as already seen, so they don't all pop up at once.
let seedAfterPull = false;
function seedAchievements() {
  if (seenAchievements() !== null) return;
  storeSet(ACH_SEEN_KEY, JSON.stringify(achievements().filter(a => a.earned).map(a => a.id)));
  if (!allEntries().length) seedAfterPull = true;
}
function seedAchievementsAfterPull() {
  if (!seedAfterPull) return;
  seedAfterPull = false;
  storeSet(ACH_SEEN_KEY, JSON.stringify(achievements().filter(a => a.earned).map(a => a.id)));
}
const stickerSVG = (a, size = 64) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="${a.earned === false ? '#ECEAE5' : '#FFFEFA'}"/>${a.earned === false ? '<text x="32" y="41" text-anchor="middle" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="24" fill="#C9C3BA">?</text>' : STICKERS[a.id]}</svg>`;

/* --- Links to the Memory Freezer ------------------------------------------------
   Only two kinds, never mixed up:
   SAME PLACE    the record has a place picked by hand from LOCATIONS
   SIMILAR       a memory with the same kind of ending (never bought, shared,
                 thrown away, finished). Shown some of the time, decided by the
                 record's id, so it doesn't change when the page is reopened. */
function similarMemory(r) {
  const roll = seeded('egg' + r.id)(), which = seeded('which' + r.id)();
  const from = (ids, chance, line) => roll < chance && ids.length ? { kind: 'similar', memory: memoryById(ids[Math.floor(which * ids.length)]), line } : null;
  if (isResisted(r)) return from(MEMORY_SERIES.never.ids, .6, 'There’s an old story in the freezer. You didn’t buy that one either.');
  if (r.finished) return from(MEMORIES.filter(m => m.fate === 'FINISHED!').map(m => m.id), .4, 'This has happened before. Rarely.');
  if (r.rest === 'shared') return from(MEMORY_SERIES.exchange.ids, .6, 'We’ve seen something like this before. Desserts have changed hands.');
  if (r.rest === 'trashed') return from(MEMORIES.filter(m => m.fate === 'THROWN AWAY').map(m => m.id), .35, 'This feels familiar.');
  return null;
}
function samePlaceMemory(r) { return r.loc && LOCATIONS[r.loc] ? memoryForPlace(r.loc) : null; }
function eggHTML(r) {
  const same = isResisted(r) ? samePlaceMemory(r) : null;   // a purchase at a known place gets THEN & NOW instead
  const egg = same ? { kind: 'same', memory: same, line: MEMORY_SERIES.never.ids.includes(same.id) ? 'This feels familiar. Same place as an old memory, and you didn’t buy one then either.' : 'Same place as an old memory in the freezer.' }
    : (!r.loc ? similarMemory(r) : null);
  if (!egg || !egg.memory) return '';
  return `<div class="egg"><span class="egg-kind chunky">${egg.kind === 'same' ? 'SAME PLACE' : 'A SIMILAR MOMENT'}</span>
    <p>${esc(egg.line)}</p><p class="egg-mem">${esc(egg.memory.when)} · ${esc(egg.memory.title)}</p>
    <button class="btn small c-white" data-act="openMemory" data-val="${egg.memory.id}">SEE MEMORY</button></div>`;
}
function thenAndNowHTML(r) {
  const m = !isResisted(r) && samePlaceMemory(r);
  if (!m) return '';
  return `<div class="then-now"><p class="chunky tn-head">THEN &amp; NOW <small>${esc(LOCATIONS[r.loc].label)}</small></p>
    <div class="tn-grid">
      <button class="tn then" data-act="openMemory" data-val="${m.id}"><span class="tn-tag chunky">THEN</span><b>${esc(m.title)}</b><span>${esc(m.when)}</span><span>${esc(m.what)}</span><span class="chunky tn-stamp">${esc(m.fate)}</span><span class="link">See memory</span></button>
      <div class="tn now"><span class="tn-tag chunky">NOW</span><b>${esc(r.name)}</b><span>${esc(shortDate(r.date, true))}</span><span>${esc(plural(r.actualBites))}, predicted ${r.predictedBites}</span><span class="chunky tn-stamp">${esc(statusStamp(r))}</span></div>
    </div></div>`;
}
function locSelectHTML(act, current, id = '') {
  return `<select class="loc-select" data-change="${act}" ${id ? `data-id="${esc(id)}"` : ''} aria-label="A place from the Memory Freezer">
    <option value="">Not that I know of</option>${Object.entries(LOCATIONS).map(([k, v]) => `<option value="${k}" ${current === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>`;
}

/* --- Drawings for entries ---------------------------------------------------- */
const ghostSVG = (face, cls = '') => `<svg class="memsvg ghost-ic ${cls}" viewBox="34 40 132 186" aria-hidden="true">${ghostArt({ face })}</svg>`;
function entryThumb(r) {
  if (isResisted(r)) return ghostSVG('hmm');
  return iceCream({ form: r.form, flavor: r.flavorCategory, toppings: r.toppings || [], decor: r.decorations || [], bites: r.finished ? 0 : r.actualBites, mood: r.finished ? 'cool' : r.rest === 'shared' ? 'happy' : 'dead', label: '' });
}
const REST_ICONS = {
  bin: `<path d="M14 18 H50 L46 54 H18Z" fill="#E3E1DB"/><rect x="10" y="12" width="44" height="7" rx="3" fill="#C9C3BA"/><path d="M24 26 V46 M32 26 V46 M40 26 V46" stroke="#C9C3BA" stroke-width="3" stroke-linecap="round"/>`,
  hands: `<path d="M8 40 Q20 30 32 38 Q44 30 56 40 L56 50 H8Z" fill="#F3D3A4"/><path d="M24 16 L30 34 L36 16Z" fill="#F3D3A4"/><circle cx="30" cy="14" r="8" fill="#FFC6D5"/>`,
  box: `<rect x="12" y="16" width="40" height="38" rx="8" fill="#E9EAE6"/><rect x="18" y="24" width="28" height="22" rx="5" fill="#FFFFFF"/><circle cx="32" cy="35" r="6" fill="#D6D7EE"/><path d="M40 20 h6" stroke="#C9C3BA" stroke-width="3" stroke-linecap="round"/>`,
  lock: `<rect x="16" y="28" width="32" height="26" rx="7" fill="#F4E3B0"/><path d="M22 28 V22 Q22 12 32 12 Q42 12 42 22 V28" stroke="#C9C3BA" stroke-width="5" fill="none"/><circle cx="32" cy="40" r="4" fill="#9A8C80"/>`,
  q: `<circle cx="32" cy="32" r="22" fill="#ECEAE5"/><text x="32" y="43" text-anchor="middle" font-family="Puffy Scoop, ZH Bold, sans-serif" font-size="30" fill="#A8998C">?</text>`,
};
const restIcon = key => `<svg viewBox="0 0 64 64" width="46" height="46" aria-hidden="true">${REST_ICONS[key] || REST_ICONS.q}</svg>`;


/* --- I RESISTED ------------------------------------------------------------------ */
function makeResisted(changedMind) {
  const r = { id: newId(), kind: 'resisted', date: new Date().toISOString(), name: 'The one you didn’t buy', finalVerdict: 'RESISTED', ...(changedMind ? { changedMind: true } : {}) };
  saveRecord(r);
  go('resisted/' + r.id);
}
function screenResisted(id) {
  const r = findRecord(id);
  if (!r || !isResisted(r)) return null;
  setFlood(PALE.blueberry, null);
  const listened = adviceBefore(r).length > 0;
  const count = resistedEntries().length;
  const nth = resistedEntries().filter(x => String(x.date) <= String(r.date)).length;
  return `<section class="screen resisted-screen" id="resisted"><div class="verdict">
    <div class="chunky kicker">NO PURCHASE DETECTED</div>
    <h1 class="melty vtitle slam" style="${fitSize(listened ? EXP.resisted.listened : EXP.resisted.title, 64)}">${esc(listened ? EXP.resisted.listened : EXP.resisted.title)}</h1>
    <div class="ghost-stage">${ghostSVG('hmm', 'floaty')}</div>
    ${EXP.resisted.lines.map(l => `<p class="vcopy">${esc(l)}</p>`).join('')}
    <div class="chunky scoreboard single"><div>ICE CREAMS RESISTED<b>${count}</b><small>${nth === count ? 'including this one' : `this was number ${nth}`}</small></div></div>
    <label class="field loc-field"><span class="chunky">${esc(EXP.resisted.where)} <small>optional</small></span>${locSelectHTML('setEntryLoc', r.loc || '', r.id)}</label>
    ${eggHTML(r)}
    ${newStickersHTML(takeNewAchievements())}
    <p class="filed-note">This counts as a real decision. It doesn’t count as a purchase, a bite, or waste.</p>
    <div class="verdict-foot">
      <button class="btn huge c-white" data-go="home">HOME</button>
      <button class="link" data-act="changedMindBought" data-val="${esc(r.id)}">${esc(EXP.resisted.changed)}</button>
    </div>
  </div></section>`;
}

/* --- QUICK RECORD: eat now, record afterwards. Same record, same rules. ---------- */
function screenQuick() {
  const g = game, q = g.quick || (g.quick = { bites: g.bites, finished: null, rest: null });
  setFlood(PALE.lemon, null);
  return `<section class="screen" id="quick">
    <div class="gamebar">
      <button class="link" data-act="home" style="padding:2px 6px 2px 0;font-size:13px">Pause</button>
      <div class="chunky who">${esc(g.name)}</div>
      <div class="chunky machine">MACHINE<br>SAYS ${g.prediction.predictedBites}</div>
    </div>
    <h1 class="melty bighead" style="margin-top:10px">${esc(EXP.quick.title)}</h1>
    <p class="center quick-sub">${esc(EXP.quick.sub)}</p>
    <div class="mini-char" style="height:min(20vh,170px)">${iceCream({ form: g.form, flavor: g.flavor, toppings: g.toppings, decor: g.decor, bites: q.bites, mood: q.finished ? 'cool' : 'ok', label: g.name })}</div>
    <div class="stepper" role="group" aria-label="Bites">
      <button class="btn c-white" data-act="quickBites" data-val="-1" aria-label="One bite fewer">−</button>
      <output class="melty" id="qBites" aria-live="polite">${q.bites}</output>
      <button class="btn c-white" data-act="quickBites" data-val="1" aria-label="One bite more">+</button>
    </div>
    <p class="center chunky" style="font-size:13px;margin-top:-2px">${esc(EXP.quick.bites)}</p>
    <h2 class="chunky center" style="font-size:20px;margin:14px 0 8px">${esc(EXP.quick.finished)}</h2>
    <div class="pair">
      <button class="btn ${q.finished === true ? 'c-pistachio' : 'c-white'}" data-act="quickFinished" data-val="yes" aria-pressed="${q.finished === true}">YES</button>
      <button class="btn ${q.finished === false ? 'c-strawberry' : 'c-white'}" data-act="quickFinished" data-val="no" aria-pressed="${q.finished === false}">NO</button>
    </div>
    <div class="stack" style="margin-top:16px">
      <button class="btn huge c-lemon" data-act="quickSave" ${q.finished === null ? 'disabled' : ''}>${esc(EXP.quick.save)}</button>
      <button class="link" data-act="quickBack">${esc(EXP.quick.back)}</button>
    </div>
  </section>`;
}

/* --- WHAT HAPPENED TO THE REST? ---------------------------------------------------- */
function screenRest() {
  const g = game;
  setFlood(PALE.strawberry, null);
  return `<section class="screen" id="rest">
    <div class="mini-char" style="height:min(24vh,200px)">${iceCream({ form: g.form, flavor: g.flavor, toppings: g.toppings, decor: g.decor, bites: g.bites, mood: 'worried', label: g.name })}</div>
    <h1 class="melty bighead">${esc(EXP.rest.title)}</h1>
    <div class="tiles rest-tiles" style="margin-top:10px">${Object.entries(REST).map(([k, v]) => `
      <button class="tile" data-act="pickRest" data-val="${k}">${restIcon(v.icon)}${esc(v.label)}</button>`).join('')}</div>
    <div class="center"><button class="link" data-act="pickRest" data-val="">${esc(EXP.rest.skip)}</button></div>
  </section>`;
}

/* --- THE FINAL VERDICT, in three parts ---------------------------------------------- */
// THE MACHINE'S ONE LINE on the verdict. How far off it was decides the kind of line;
// its mood at the time (from the records up to this one) can colour it.
function machineVerdictLine(r) {
  const e = Math.abs(r.predictionError);
  const upTo = sortedEntries().filter(x => String(x.date) <= String(r.date));
  const mood = machineMind(upTo).mood;
  if (e === 0) return 'Exactly. I would like that noted.';
  if (e <= ACCURACY_TOLERANCE_BITES) return mood === 'hopeful' ? 'Perhaps I’m getting better at this.' : mood === 'smug' ? 'I understand your habits perfectly.' : 'I KNEW IT.';
  if (e >= 5) return mood === 'crumbling' ? 'Perhaps I know nothing about you.' : 'MY DATA. MY BEAUTIFUL DATA.';
  if (isConfidentlyWrong(r)) return 'I was so confident.';
  if (mood === 'weary') return 'We’ve had this conversation.';
  return 'Well, that was embarrassing.';
}
// Two short tags: where it ended up, and what you said about it. Only what was
// actually answered; nothing is guessed. Older records may say where the rest went.
function verdictTags(r) {
  const fate = r.finished ? ['FINISHED', 'pistachio']
    : r.rest === 'trashed' ? ['THROWN AWAY', 'strawberry'] : r.rest === 'shared' ? ['SHARED', 'pistachio']
    : r.rest === 'saved' ? ['SAVED FOR LATER', 'blueberry'] : ['NOT FINISHED', 'strawberry'];
  let said = null;
  if (!r.finished && STOP_REASONS[r.stopReason]) said = STOP_REASONS[r.stopReason].label;
  else if (!r.finished && r.whyStop && WHY_STOP[r.whyStop]) said = WHY_STOP[r.whyStop].label;
  else if (r.repurchase) said = { yes: 'WOULD BUY AGAIN', maybe: 'MIGHT BUY AGAIN', no: r.finished ? 'NOT BUYING AGAIN' : 'NEVER AGAIN' }[r.repurchase];
  return [fate, said && [said, 'white']].filter(Boolean);
}
function humanFacts(r) {
  const later = r.laterReactions || [];
  const rows = [
    r.firstReaction && ['First bite', capFirst(r.firstReaction.label.toLowerCase())],
    later.length && ['Last check-in', capFirst(later[later.length - 1].label.toLowerCase())],
    r.repurchase && ['Buy it again?', capFirst((r.finished ? REBUY_FINISH : REBUY_QUIT)[r.repurchase].toLowerCase())],
    r.mode === 'quick' && ['Recorded', 'Afterwards, with Quick Record'],
  ].filter(Boolean);
  return rows.length ? `<dl class="hfacts">${rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>` : '';
}
// MORE DETAILS: everything the verdict used to say out loud, folded away.
function verdictDetailsHTML(r) {
  const v = verdictOf(r);
  const others = allRecords().filter(o => o.id !== r.id);
  const badges = [
    isConfidentlyWrong(r) && `<span class="chunky badge">CONFIDENTLY WRONG</span>`,
    r.predictionError === 0 && `<span class="chunky badge good">BULLSEYE</span>`,
    Math.abs(r.predictionError) >= 5 && `<span class="chunky badge">MACHINE EMBARRASSED</span>`,
  ].filter(Boolean).join('');
  const advice = ADVICE[r.advice];
  return `
    <div class="vsec">
      <p class="vsec-h chunky">${esc(r.name)}</p>
      <p class="vcopy">${esc(verdictCopy(v, r))}</p>
      <dl class="hfacts">
        <dt>Date</dt><dd>${esc(shortDate(r.date, true))}</dd>
        ${r.predictionConfidence ? `<dt>Confidence</dt><dd>${esc(capFirst(r.predictionConfidence))}</dd>` : ''}
        ${r.finishOddsOneIn ? `<dt>Odds of finishing</dt><dd>1 in ${r.finishOddsOneIn}</dd>` : ''}
      </dl>
    </div>
    <div class="vsec machine-sec">
      <p class="vsec-h chunky">THE MACHINE</p>
      <h2 class="chunky wrongby">${esc(accuracyHeadline(r.predictionError))}</h2>
      ${r.predictionError === 0 || isConfidentlyWrong(r) ? '' : `<p class="afterline">${esc(afterline(r, others))}</p>`}
      ${badges ? `<div class="badges">${badges}</div>` : ''}
      ${advice ? `<p class="afterline"><b>Machine recommendation:</b> ${esc(advice)}</p>` : ''}
    </div>
    ${humanFacts(r) ? `<div class="vsec"><p class="vsec-h chunky">THE HUMAN</p>${humanFacts(r)}</div>` : ''}
    ${thenAndNowHTML(r)}
    ${eggHTML(r)}
    <p class="filed-links"><button class="link" data-act="openKeep" data-val="${esc(r.id)}">${keptOf(r) ? 'Edit its memory' : 'Keep this memory'}</button></p>`;
}
// A just-finished game: the little ice cream drops into a freezer drawer. No words.
function filedHTML(r, isNew) {
  if (!isNew) return '';
  return `<div class="filed filed-small ${reducedMotion() ? '' : 'go'}" role="img" aria-label="Saved to the Memory Freezer">
    <span class="filed-ic">${entryThumb(r)}</span><span class="filed-drawer" aria-hidden="true"></span></div>`;
}
// Achievements: a sticker pops up with its name. The explanation lives in the Archive.
function newStickersHTML(list) {
  if (!list.length) return '';
  return `<div class="unlocked ach-row">${list.map((a, i) => `<span class="sticker-pop" style="animation-delay:${.5 + i * .14}s">${stickerSVG(a, 46)}<b class="chunky">${esc(a.title)}</b></span>`).join('')}</div>`;
}

/* --- WASTE: on the freezer door (the Archive), next to everything else it knows --- */
function currentRecommendation(bought, resisted, list) {
  const last = list[list.length - 1];
  if (!bought.length && !resisted.length) return 'Nothing to recommend yet. A suspiciously clean record.';
  if (last && isResisted(last)) return 'Keep doing whatever that was.';
  const trashed = bought.filter(r => r.rest === 'trashed').length;
  const tooMuch = bought.filter(r => !r.finished && (whyOf(r) === 'toomuch' || r.stopReason === 'full' || r.stopReason === 'too_heavy')).length;
  const tastes = bought.filter(r => whyOf(r) === 'taste').length;
  const unfinished = bought.filter(r => !r.finished);
  if (trashed >= 3) return ADVICE.life;
  if (tooMuch >= 2) return ADVICE.smaller;
  if (tastes >= 2 || (unfinished.length >= 2 && mean(unfinished.map(r => r.actualBites)) <= 3)) return ADVICE.sample;
  if (bought.filter(r => r.finished).length / bought.length >= .5) return 'Carry on. Somehow, this is working.';
  return ADVICE.smaller;
}
// Extra magnets for the freezer door: resisting,
// the machine's mood and advice. Counts ice creams, never grams.
function wasteMagnetsHTML(list = sortedEntries()) {
  const bought = list.filter(r => !isResisted(r)), resisted = list.filter(isResisted);
  const unfinished = bought.filter(r => !r.finished);
  // Unfinished is not the same as thrown away. Only older records that said so count as thrown away.
  const confirmedTrashed = unfinished.filter(r => r.rest === 'trashed').length;
  const mind = machineMind(list);
  const given = bought.filter(r => ADVICE[r.advice]).length;
  const tempting = bought.length + resisted.length;
  return `
      <div class="mag round rot-d" style="background:#E6ECF4"><span class="cap">Times resisted</span><span class="big">${resisted.length}</span><small>${tempting ? `of ${plural(tempting, 'tempting moment')}` : 'Nothing tempting yet'}</small></div>
      <div class="mag label rot-b" style="background:#F6EEE6"><span class="cap">Not finished</span><span class="big">${unfinished.length}</span><small>${confirmedTrashed ? `${confirmedTrashed} confirmed thrown away` : 'None confirmed thrown away'}</small></div>
      <div class="mag label rot-a" style="background:var(--strawberry)"><span class="cap">Machine mood</span><span class="big txt">${esc(mind.label)}</span><small>“${esc(mindLine(mind))}”</small></div>
      <div class="mag note rot-c advice-mag"><span class="cap">Machine recommendation</span><b>${esc(currentRecommendation(bought, resisted, list))}</b>
        <small>${given ? `Advice issued ${plural(given, 'time')}. Whether anyone listened is not on file.` : 'No advice issued yet.'}</small></div>`;
}
function commendationsHTML(list = sortedEntries()) {
  return `<h2 class="melty lane-head">COMMENDATIONS</h2>
    <div class="sticker-sheet">${achievements(list).filter(a => a.earned || !a.hidden).map(a => `<div class="stk ${a.earned ? 'on' : ''}">${stickerSVG(a, 56)}<b class="chunky">${a.earned ? esc(a.title) : '???'}</b><small>${a.earned ? esc(a.how) + (a.at ? ' ' + esc(shortDate(a.at, true)) + '.' : '') : 'Not yet.'}</small></div>`).join('')}</div>
    <p class="door-fine">The machine counts ice creams, not grams. A bite is not a unit of waste. No one is in trouble.</p>`;
}

/* --- FRESHLY FROZEN: every game record, in its own drawer of the freezer ------------------ */
function freezerDrawersHTML() {
  const list = sortedEntries().reverse();
  const kept = list.filter(r => keptOf(r));
  return `<div class="drawers">
    <button class="crisper ${thawedList().includes('more') ? 'thawed' : ''}" data-act="openMemory" data-val="more" aria-label="${esc(MEMORY_MORE.title)}">
      <span class="crisper-window" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      <span class="chunky crisper-tag">${esc(MEMORY_COPY.drawer)}</span>
    </button>
    <button class="crisper fresh-drawer" data-act="openFresh" aria-label="Freshly Frozen: ${list.length} new records">
      <span class="crisper-window fresh-window">${list.slice(0, 3).map(r => `<span class="fz">${entryThumb(r)}</span>`).join('') || '<em>Empty, for now.</em>'}</span>
      <span class="chunky crisper-tag">FRESHLY FROZEN · ${list.length}</span>
    </button>
    ${kept.length ? `<button class="crisper kept-drawer" data-act="openKept" aria-label="Extended memories: ${kept.length}">
      <span class="crisper-window fresh-window">${kept.slice(0, 3).map(r => `<span class="fz">${entryThumb(r)}</span>`).join('')}</span>
      <span class="chunky crisper-tag">EXTENDED MEMORIES · ${kept.length}</span>
    </button>` : ''}
  </div>`;
}
function drawerSheet(title, sub, list) {
  overlay.innerHTML = `<div class="sheet drawer-sheet"><h2 class="melty">${esc(title)}</h2><p class="q">${esc(sub)}</p>
    ${list.length ? `<div class="fz-grid">${list.map(r => `<button class="fz-item" data-act="openMemory" data-val="${esc(r.id)}">
      <span class="fz-art">${entryThumb(r)}</span><span class="fz-date">${esc(shortDate(r.date, true))}</span>
      <span class="chunky fz-name">${esc((keptOf(r) || {}).title || r.name)}</span><span class="fz-stamp chunky">${esc(statusStamp(r))}</span></button>`).join('')}</div>`
      : '<p class="center" style="font-weight:700;margin:18px 0">Nothing in here yet. Play a round and it will appear.</p>'}
    <button class="btn small c-white" style="margin-top:12px" data-act="closeSheet">CLOSE</button></div>`;
  overlay.classList.add('open');
}

/* --- A record, shown with the Memory Freezer's melting view ---------------------------
   The 22 memories melt into a story. A record melts into the machine's log, and
   into a story only if someone chose to keep one. */
function recordMemory(id) {
  const r = findRecord(id);
  if (!r) return null;
  const kept = keptOf(r);
  const loc = LOCATIONS[r.loc];
  const base = { id: r.id, isRecord: true, record: r, kept, when: shortDate(r.date, true), short: shortDate(r.date), unsure: [], fate: statusStamp(r),
    story: kept ? kept.text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : [] };
  if (isResisted(r)) {
    return { ...base, kind: 'ghost', art: {}, title: (kept && kept.title) || 'The One You Didn’t Buy', where: loc ? loc.label : 'Somewhere tempting',
      what: 'Never bought', flavor: 'Never got that far',
      log: [['Decision', 'Did not buy it'], ['Counted as', 'Not a purchase, not waste'], ...(loc ? [['Place', loc.label]] : []), ['Human memory', kept ? 'Added.' : 'Not added yet.']] };
  }
  const f = FLAVORS[r.flavorCategory] || FLAVORS.other;
  const form = FORMS[r.form] ? FORMS[r.form].label.toLowerCase() : 'ice cream';
  const look = r.form === 'cup' ? { kind: 'cup', art: { cup: '#FFFEFA', pattern: 'stripes', accent: f.light, scoop: f.base } }
    : r.form === 'popsicle' ? { kind: 'popsicle', art: { wrap: f.light, bar: f.base, label: f.short.toUpperCase().slice(0, 10) } }
    : { kind: 'special', art: { special: 'cone', scoop: f.base } };
  return { ...base, ...look, title: (kept && kept.title) || r.name, where: loc ? loc.label : (r.place || 'Somewhere'), what: `A ${form}`, flavor: capFirst(f.short),
    log: [['Flavor', capFirst(f.short)], ['Predicted', plural(r.predictedBites)], ['Actual', plural(r.actualBites)], ['Final status', statusWords(r)],
      ['Machine’s verdict', capFirst(verdictOf(r).title.toLowerCase())], ['Human memory', kept ? 'Added.' : 'Not added yet.']] };
}
function recordLogHTML(m) {
  return `<div class="bm-log"><p class="bm-log-h">MACHINE LOG · ${esc(m.id.slice(-6).toUpperCase())}</p>${m.log.map(([a, b]) => `<p><span>${esc(a)}:</span> ${esc(b)}</p>`).join('')}</div>`;
}
function recordAfterHTML(m) {
  if (!m.isRecord) return '';
  return `<div class="rec-after">
    <button class="btn c-lemon" data-act="openKeep" data-val="${esc(m.id)}">${m.kept ? 'EDIT THIS MEMORY' : 'KEEP THIS MEMORY'}</button>
    ${m.kept ? '' : '<p class="filed-note">The machine saved the numbers. A memory is only added when someone writes one.</p>'}
    <button class="link" data-act="eraseEntry" data-val="${esc(m.id)}" style="font-size:12.5px;font-weight:500">Erase this record</button>
  </div>`;
}

/* --- KEEP THIS MEMORY --------------------------------------------------------------------
   Kept on this device unless "share" is ticked. Shared ones travel with the
   record to the shared archive, so they show on the other phone too. */
function keptLocal() { try { const v = JSON.parse(storeGet(KEPT_KEY)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
function keptOf(r) {
  if (!r) return null;
  const local = keptLocal()[r.id];
  if (local && local.text) return { ...local, shared: false };
  return r.keep && r.keep.text ? { ...r.keep, shared: true } : null;
}
function openKeep(id) {
  const r = findRecord(id);
  if (!r) return;
  const k = keptOf(r);
  overlay.innerHTML = `<div class="sheet keep-sheet"><h2 class="melty">${k ? 'EDIT THIS MEMORY' : 'KEEP THIS MEMORY'}</h2>
    <p class="q">The machine saved the numbers. This part is yours: what actually happened?</p>
    <label class="field"><span class="chunky">Title</span><input id="keepTitle" maxlength="60" value="${esc(k ? k.title : (isResisted(r) ? 'The One You Didn’t Buy' : r.name))}"></label>
    <label class="field"><span class="chunky">The memory</span><textarea id="keepText" rows="6" maxlength="2000" placeholder="Leave a blank line between paragraphs.">${esc(k ? k.text : '')}</textarea></label>
    <fieldset class="keep-where"><legend class="chunky">Where should it live?</legend>
      <label><input type="radio" name="keepShare" value="local" ${!k || !k.shared ? 'checked' : ''}> Only on this device</label>
      ${SHARED_ARCHIVE_URL && !r.isDemo ? `<label><input type="radio" name="keepShare" value="shared" ${k && k.shared ? 'checked' : ''}> Shared archive: it shows on both phones</label>` : ''}
    </fieldset>
    <div class="stack"><button class="btn c-lemon" data-act="saveKeep" data-val="${esc(r.id)}">${k ? 'SAVE CHANGES' : 'KEEP IT'}</button>
      <button class="btn small c-white" data-act="closeSheet">CANCEL</button>
      ${k ? `<button class="link" data-act="removeKeep" data-val="${esc(r.id)}">Remove this memory (the record stays)</button>` : ''}</div></div>`;
  overlay.classList.add('open');
}
function writeKeep(r, value, shared) {
  const local = keptLocal();
  delete local[r.id];
  if (value && !shared) local[r.id] = value;
  storeSet(KEPT_KEY, JSON.stringify(local));
  const wantShared = value && shared ? value : null;
  if (JSON.stringify(r.keep || null) !== JSON.stringify(wantShared)) {
    if (wantShared) r.keep = wantShared; else delete r.keep;
    updateRecord(r);
  }
}

/* --- Actions ---------------------------------------------------------------------------- */
const EXTRA_ACTIONS = {
  iBoughtIt() { startDraft(); go('create'); },
  iResisted() { makeResisted(false); },
  benchResisted() { draft = null; makeResisted(true); },   // "Actually, I didn't buy it": a changed mind
  changedMindBought(id) { deleteEntry(id); startDraft(true); go('create'); },
  setEntryLoc(v, el) {
    const r = findRecord(el.dataset.id);
    if (!r) return;
    if (LOCATIONS[v]) r.loc = v; else delete r.loc;
    updateRecord(r);
    const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  setLoc(v) { draft.loc = LOCATIONS[v] ? v : ''; updatePlaceMemory(); },
  goQuick() { if (!game) return; game.quick = { bites: game.bites, finished: null, rest: null }; setStage('quick'); },
  quickBites(v) {
    if (!game || !game.quick) return;
    game.quick.bites = Math.max(0, Math.min(99, game.quick.bites + Number(v)));
    saveCurrentGame();
    const out = document.getElementById('qBites');
    if (out) { out.textContent = game.quick.bites; out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop'); }
  },
  quickFinished(v) { if (!game || !game.quick) return; game.quick.finished = v === 'yes'; if (game.quick.finished) game.quick.rest = null; setStage('quick'); },
  quickRest(v) { if (!game || !game.quick) return; game.quick.rest = game.quick.rest === v ? null : v; setStage('quick'); },
  quickBack() { if (!game || !game.quick) return; game.bites = game.quick.bites; game.quick = null; setStage('bite'); },
  quickSave() {   // a double tap lands here twice; the second finds no game and does nothing
    const q = game && game.quick;
    if (!q || q.finished === null) return;
    game.bites = q.bites; game.mode = 'quick'; game.rest = q.finished ? null : q.rest;
    endGame(q.finished, null);
  },
  pickRest(v) { if (!game) return; game.rest = REST[v] ? v : null; setStage('rebuy'); },
  openFresh() { drawerSheet('FRESHLY FROZEN', 'Every ice cream the game has recorded, newest first. Tap one to melt it.', sortedEntries().reverse()); },
  openKept() { drawerSheet('EXTENDED MEMORIES', 'Records someone decided were worth remembering.', sortedEntries().reverse().filter(r => keptOf(r))); },
  openKeep(id) { openKeep(id); },
  saveKeep(id) {
    const r = findRecord(id);
    if (!r) return;
    const text = document.getElementById('keepText').value.trim();
    if (!text) { document.getElementById('keepText').focus(); toast('Write something first. Even a sentence.'); return; }
    const title = document.getElementById('keepTitle').value.trim() || r.name;
    const shared = (overlay.querySelector('input[name=keepShare]:checked') || {}).value === 'shared';
    const before = keptOf(r);
    writeKeep(r, { title, text, at: (before && before.at) || new Date().toISOString() }, shared);
    closeOverlay();
    toast(shared ? 'Kept, and shared with the freezer.' : 'Kept on this device.');
    if (location.hash.startsWith('#memory')) render();
  },
  removeKeep(id) { const r = findRecord(id); if (r) writeKeep(r, null, false); closeOverlay(); toast('Memory removed. The record stays.'); render(); },
  eraseEntry(v) { confirmSheet('ERASE THIS RECORD?', 'It will be gone from the freezer, the archive and the machine’s memory.', 'YES, ERASE IT', 'eraseEntryYes', v); },
  eraseEntryYes(v) { const local = keptLocal(); delete local[v]; storeSet(KEPT_KEY, JSON.stringify(local)); deleteEntry(v); closeOverlay(); go('freezer'); },
};

/* --- The machine talks while you eat ------------------------------------------------------ */
function biteMachineLine(g) {
  g.said = g.said || [];   // games started before this update don't have it
  const p = g.prediction.predictedBites, b = g.bites;
  const key = b === 1 ? 'first' : p >= 3 && b === p - 1 ? 'approach' : b === p + 1 ? 'past' : b === p + 4 ? 'far' : null;
  return key && !g.said.includes(key) ? key : null;
}
let sayTimer = null;
function showMachineSay(text) {
  const el = document.getElementById('machineSay');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
