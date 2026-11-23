/* ==========================================================================
   LANGUAGE: English (as written) or Chinese.
   The site is written in English. In Chinese mode every piece of text the page
   shows is swapped for its Chinese version as it appears, using the dictionary
   in i18n-zh.js (exact sentences) plus ZH_PATTERNS (sentences with numbers or
   names in them). Names people typed for their ice creams are never translated.
   The choice is remembered on this device only.
   ========================================================================== */
const LANG_KEY = 'willYouFinishIt.lang.v1';
let LANG = (() => { try { return localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; } })();
const zhNorm = s => String(s).replace(/[\s ]+/g, ' ').trim();
const zhKey = s => zhNorm(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
const ZH_MAP = new Map(), ZH_EXACT = new Map();
for (const [k, v] of Object.entries(ZH)) { ZH_MAP.set(zhKey(k), v); ZH_EXACT.set(zhNorm(k), v); }

// One string → Chinese, or null when there is nothing to translate.
// zhFromDict says whether the last answer came word for word from the dictionary
// (and so may carry a little <b> markup) or was built from a pattern around
// someone's own words (always used as plain text).
let zhFromDict = false;
function zhOf(s) {
  const n = zhNorm(s);
  zhFromDict = false;
  if (!n || !/[A-Za-z]/.test(n)) return null;
  const hit = ZH_EXACT.get(n) ?? ZH_MAP.get(zhKey(n));
  if (hit != null) { zhFromDict = true; return hit; }
  // the same sentence written without its last full stop
  if (!/[.?!…]$/.test(n)) { const h2 = ZH_MAP.get(zhKey(n + '.')); if (h2 != null) { zhFromDict = true; return h2.replace(/[。.]$/, ''); } }
  for (const [re, rep] of ZH_PATTERNS) {
    const m = n.match(re);
    if (!m) continue;
    const out = typeof rep === 'function' ? rep(...m) : n.replace(re, rep);
    if (out != null) { zhFromDict = false; return out; }
  }
  return null;
}
const zhPlain = s => String(s).replace(/<[^>]+>/g, '');
// A piece inside a pattern: translate it if we can, otherwise leave it alone.
const zhBit = s => (s == null ? '' : zhOf(s) ?? s);

const ZH_INLINE = new Set(['B', 'I', 'EM', 'STRONG', 'BR', 'SMALL', 'U', 'MARK']);
const ZH_SKIP = 'script, style, textarea, [data-noi18n], [contenteditable]';
const zhOriginal = new WeakMap();
// A sentence split by <b> or <em> is looked up whole first.
function zhRich(el) {
  if (el.dataset.zhDone || el.closest(ZH_SKIP)) return false;
  let text = 0;
  for (const c of el.childNodes) {
    if (c.nodeType === 3) { if (c.nodeValue.trim()) text++; }
    else if (c.nodeType === 1) { if (!ZH_INLINE.has(c.tagName) || c.attributes.length > 1 || c.querySelector('*:not(br)')) return false; }
  }
  if (!text || el.children.length === 0) return false;
  if (el.querySelector('br')) return false;   // lines split by <br> are translated one by one
  const hit = zhOf(el.textContent);
  if (hit == null || !zhFromDict) return false;   // only whole sentences from the dictionary; the rest goes piece by piece
  el.dataset.zhDone = '1';
  if (zhFromDict && /</.test(hit)) el.innerHTML = hit; else el.textContent = zhPlain(hit);
  return true;
}
const zhSet = new WeakMap();   // what we wrote into each text node, so our own change is not translated twice
function zhText(node) {
  const p = node.parentElement;
  if (!p || p.closest(ZH_SKIP) || p.closest('[data-zh-done]')) return;
  const v = node.nodeValue;
  if (zhSet.get(node) === v) return;
  let hit = null;
  for (const [sel, words] of ZH_CONTEXT) if (p.closest(sel) && words[zhNorm(v)] != null) { hit = words[zhNorm(v)]; break; }
  if (hit == null) hit = zhOf(v);
  if (hit == null) return;
  let lead = v.match(/^\s*/)[0];
  const trail = v.match(/\s*$/)[0];
  // Chinese needs no space after a Chinese full stop: "你送我的。 我做甜点" → "你送我的。我做甜点"
  const before = node.previousSibling && node.previousSibling.textContent;
  if (lead && /^[\u3000-\u9fff\uff00-\uffef]/.test(zhPlain(hit)) && before && /[\u3000-\u9fff\uff00-\uffef]\s*$/.test(before)) lead = '';
  node.nodeValue = lead + zhPlain(hit) + trail;
  zhSet.set(node, node.nodeValue);
}
const ZH_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
function zhAttrs(el) {
  if (el.closest(ZH_SKIP)) return;
  for (const a of ZH_ATTRS) {
    const v = el.getAttribute(a);
    if (v) { const hit = zhOf(v); if (hit != null) el.setAttribute(a, zhPlain(hit)); }
  }
}
function zhTranslate(root) {
  if (LANG !== 'zh' || !root) return;
  if (root.nodeType === 3) { zhText(root); return; }
  if (root.nodeType !== 1) return;
  const els = [root, ...root.querySelectorAll('*')];
  for (const el of els) if (el.childNodes.length && el.isConnected !== false) zhRich(el);
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walk.nextNode()) texts.push(walk.currentNode);
  texts.forEach(zhText);
  for (const el of els) zhAttrs(el);
}
let zhObserver = null;
function startLanguage() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.dataset.lang = LANG;
  if (LANG !== 'zh') return;
  document.title = zhOf(document.title) || document.title;
  zhTranslate(document.body);
  zhObserver = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') zhText(m.target);
      else if (m.type === 'attributes') zhAttrs(m.target);
      else m.addedNodes.forEach(zhTranslate);
    }
  });
  zhObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ZH_ATTRS });
}
function setLanguage(l) {
  try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  location.reload();   // the page is drawn again from scratch in the new language
}
const langToggleHTML = () => `<span class="lang-toggle" data-noi18n>
  <button class="${LANG === 'en' ? 'on' : ''}" data-act="setLang" data-val="en" aria-label="English">EN</button><button class="${LANG === 'zh' ? 'on' : ''}" data-act="setLang" data-val="zh" aria-label="中文">中</button></span>`;
