// Sentences with numbers, dates or someone's own words in them.
const ZH_MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const ZH_MONTH_RE = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const zhMon = m => ZH_MON[m.toLowerCase()];
// "Sep 6, 2026" → "2026年9月6日"
function zhDate(s) {
  let m = s.match(new RegExp('^' + ZH_MONTH_RE + ' (\\d{1,2}), (\\d{4})$'));
  if (m) return `${m[3]}年${zhMon(m[1])}月${m[2]}日`;
  m = s.match(new RegExp('^' + ZH_MONTH_RE + ' (\\d{1,2})$'));
  if (m) return `${zhMon(m[1])}月${m[2]}日`;
  m = s.match(new RegExp('^' + ZH_MONTH_RE + ' (\\d{4})$'));
  if (m) return `${m[2]}年${zhMon(m[1])}月`;
  m = s.match(new RegExp('^' + ZH_MONTH_RE + ' ’(\\d\\d)$'));
  if (m) return `${m[2]}年${zhMon(m[1])}月`;
  return null;
}
const ZH_FLAVOR = { chocolate: '巧克力', vanilla: '香草', fruit: '水果', mango: '芒果', pistachio: '开心果', nutty: '坚果', coconut: '椰子',
  coffee: '咖啡', tea: '茶', 'thai tea': '泰式奶茶', oreo: '奥利奥', caramel: '焦糖', experimental: '实验性', unclassifiable: '无法归类', blank: '空白' };
const ZH_FORM = { 'ice cream': '雪糕', cone: '甜筒', cup: '杯装雪糕', softserve: '软雪糕', 'soft serve': '软雪糕', popsicle: '冰棍', sandwich: '雪糕三明治', other: '雪糕' };
const ZH_FLAVOR_RE = '(chocolate|vanilla|fruit|mango|pistachio|nutty|coconut|coffee|tea|thai tea|oreo|caramel|experimental|unclassifiable|blank)';
const ZH_FORM_RE = '(cone|cup|softserve|soft serve|popsicle|sandwich|other|ice cream)';
const zhN = n => n;   // numbers stay as they are
// a list "a, b and c" where every piece is known
const zhList = (s, sep = '、') => { const parts = s.split(/, | and /); const out = parts.map(p => zhOf(p)); return out.every(x => x != null) ? out.join(sep) : null; };
const ZH_NUMWORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const ZH_PATTERNS = [
  [/^It said (\d+) bites?\. You said “watch me\.” You did (\d+)\.$/, '它说 $1 口。你说“看我的”。你吃了 $2 口。'],   // older records only
  [/^(\d+) confirmed thrown away$/, '其中 $1 支确认扔掉了'],
  [/^1 in (\d+)$/, '1/$1'],
  [/^(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|\d+) bites too many\.$/i, (_, n) => `多了 ${ZH_NUMWORD[n.toLowerCase()] || n} 口。`],
  [/^It has more data than ever and is getting worse: ([\d.]+) bites off at first, ([\d.]+) lately\.$/, '它的数据比以往都多，却越猜越差：一开始差 $1 口，最近差 $2 口。'],
  [/^Honorary: (.+)$/, (_, a) => `特别入选：${zhBit(a)}`],
  [new RegExp('^' + ZH_FLAVOR_RE + ' ' + ZH_FORM_RE + '$', 'i'), (_, f, k) => ZH_FLAVOR[f.toLowerCase()] + ZH_FORM[k.toLowerCase()]],
  [new RegExp('^Unnamed ' + ZH_FLAVOR_RE + ' ' + ZH_FORM_RE + '$', 'i'), (_, f, k) => '无名' + ZH_FLAVOR[f.toLowerCase()] + ZH_FORM[k.toLowerCase()]],
  [/^(.+) won’t be recorded\.$/, (_, a) => `${zhBit(a)}不会被记录。`],
  [/^Take a bite of (.+)$/, (_, a) => `咬一口${zhBit(a)}`],
  [/^BACK TO (.+)$/, (_, a) => `回到${zhBit(a)}`],
  [/^A (cone|cup|soft serve|popsicle|sandwich|other)$/i, (_, k) => ZH_FORM[k.toLowerCase()]],
  [/^(.+?)\.{1,2} Flavor: (.+)$/, (_, a, b) => `${zhBit(a).replace(/[。.]$/, '')}。口味：${zhBit(b)}`],
  [/^Cause of death: (.+)\.$/, (_, a) => `死因：${zhBit(a)}。`],
  [/^Not sure about: (.+)\.$/, (_, a) => { const l = zhList(a); return l ? `不确定的事：${l}。` : null; }],
  [/^Stopped at bite (\d+)\.$/, '停在第 $1 口。'],
  [/^(\d+) bites?$/i, '$1 口'],
  [/^(\d+) bites?, predicted (\d+)$/, '$1 口，预测 $2 口'],
  [/^BITE (\d+)$/, '第 $1 口'],
  [/^MACHINE SAYS (\d+)$/, '机器说 $1 口'],
  [/^You finished (\d+) of your last (\d+)\.$/, '你最近 $2 支吃完了 $1 支。'],
  [/^(.+) has your best record: finished (\d+) of (\d+)\.$/, (_, f, a, b) => `${zhBit(f.toUpperCase())}的记录最好：${b} 支吃完了 ${a} 支。`],
  [/^Your best bites came from (.+)\.$/, (_, f) => `你吃得最开心的是${zhBit(f.toUpperCase())}。`],
  [/^(.+), a small cup\.$/, (_, f) => { const t = zhOf(f.toUpperCase()); return t ? `${t}，小杯。` : null; }],
  [/^(.+), as a (.+)\.$/, (_, f, m) => { const t = zhOf(f.toUpperCase()), u = zhOf(m.toUpperCase()); return t && u ? `${t}，${u}。` : null; }],
  [/^(\d[\d.,]*) (ft|mi|m|km) · about (\d+) min on foot(.*)$/, (_, n, u, w, rest) => `${n} ${({ ft: '英尺', mi: '英里', m: '米', km: '公里' })[u]} · 步行约 ${w} 分钟${rest}`],
  [/^Hours: (.*)$/, '营业时间：$1'],
  [/^TODAY: (.+)$/, (_, f) => { const t = zhOf(f); return t ? '今日：' + t : null; }],
  [/^Bite (\d+): (.+)$/, (_, n, a) => `第 ${n} 口：${zhBit(a)}`],
  [/^(\d+) of (\d+) thawed\.$/, '已解冻 $1 / $2。'],
  [/^(\d+) real records? saved\.$/, '已保存 $1 条真实记录。'],
  [/^(\d+) tried, (\d+) finished$/, '试了 $1 支，吃完 $2 支'],
  [/^(\d+)% finished, ([\d.]+) bites on average$/, '吃完率 $1%，平均 $2 口'],
  [/^(\d+) changes? waiting to be sent\. It’ll go through next time there’s a connection\.$/, '有 $1 处修改等待发送，下次联网时会自动发出。'],
  [/^(\d+) ice creams? remembered fondly, if briefly\.$/, '$1 支雪糕，被深情而短暂地怀念着。'],
  [/^(\d+) questionable purchases?$/, '$1 次可疑消费'],
  [/^(\d+) victims?$/, '$1 个受害者'],
  [/^(\d+), holding nothing$/, '$1 位，两手空空'],
  [/^([\d.]+) bites on average, which proves nothing$/, '平均 $1 口，这说明不了什么'],
  [/^(\d+) memories, (.+) to (.+)\.$/, (_, n, a, b) => `${n} 段回忆，${zhDate(a) || a}到${zhDate(b) || b}。`],
  [/^Advice issued (\d+) times?\. Whether anyone listened is not on file\.$/, '建议已发出 $1 次。有没有人听，档案里没写。'],
  [/^Issued (\d+) times? so far\. Whether anyone listened is not on file\.$/, '目前已发出 $1 次。有没有人听，档案里没写。'],
  [/^Against all odds\. The odds were 1 in (\d+)\.$/, '奇迹发生了。几率只有 1/$1。'],
  [/^All this data and it’s still off by about ([\d.]+) bites\. Taste remains annoyingly personal\.$/, '数据这么多，它还是平均差了大约 $1 口。口味这东西就是烦人地因人而异。'],
  [/^It’s improving: off by ([\d.]+) bites on average at first, ([\d.]+) lately\. Do something about that\.$/, '它在进步：一开始平均差 $1 口，最近只差 $2 口。你看着办吧。'],
  [/^(.+) has lasted anywhere from (\d+) to (\d+) bites\. Apparently you contain multitudes\.$/, (_, f, a, b) => `${zhBit(f)}撑过 ${a} 到 ${b} 口不等。看来你包罗万象。`],
  [/^averaged ([\d.]+)$/, '平均 $1 口'],
  [/^(.+) record: (\d+) survived, (\d+) fell$/, (_, f, a, b) => `${zhBit(f)}战绩：活下来 ${a} 支，倒下 ${b} 支`],
  [/^Finish rate (\d+)%$/, '吃完率 $1%'],
  [/^Machine accuracy: (\d+)%$/, '机器准确率：$1%'],
  [/^Odds of finishing it: 1 in (\d+)$/, '吃完的几率：1/$1'],
  [/^of (\d+) tempting moments?$/, '共 $1 次诱惑'],
  [/^Part (\d+) of (\d+)$/, '第 $1 段，共 $2 段'],
  [/^SAYS (\d+)$/, '猜 $1 口'],
  [/^The last one lasted (\d+) bites?\.$/, '上一支撑了 $1 口。'],
  [/^The machine gives it (\d+) more bites?\.$/, '机器觉得它还能再撑 $1 口。'],
  [/^THE SYSTEM WAS WRONG BY (\d+) BITES?\.$/, '系统差了 $1 口。'],
  [/^this was number (\d+)$/, '这是第 $1 次'],
  [/^x(\d+)$/, '×$1'],
  [/^~(\d+)pm$/, '约下午 $1 点'],
  [/^\(right to within (\d+) bites?\)$/, '（误差在 $1 口以内）'],
  [/^Freshly Frozen: (\d+) new records?$/, '新鲜冷冻：$1 条新记录'],
  [/^(.+): off by (\d+) bites?$/, (_, a, n) => `${zhBit(a)}：差了 ${n} 口`],
  [/^How many bites off the machine was for each ice cream, oldest first: (.+)$/, '机器对每支雪糕差了几口，最早的在前：$1'],
  [/^Other (.+) ones$/, (_, f) => `其他${zhBit(f)}的`],
  [new RegExp('^' + ZH_MONTH_RE + ' (\\d{1,2}), (\\d{4}), that night$'), (_, m, d, y) => `${y}年${zhMon(m)}月${d}日，那天晚上`],
  // a sentence followed by a date: "Finished an ice cream. Sep 6, 2026."
  [new RegExp('^(.+\\.) (' + ZH_MONTH_RE + ' \\d{1,2}, \\d{4})\\.$'), (_, a, d) => { const t = zhOf(a); return t ? `${t}${zhDate(d)}。` : null; }],
  // an ice cream in the chest: "Title, Sep 6, 2026" (or "…, that night")
  [new RegExp('^(.+?), (' + ZH_MONTH_RE + ' \\d{1,2}, \\d{4})(, that night)?$'), (_, t, d, m1, night) => {
    const x = zhOf(t); if (!x) return null; return `${x}，${zhDate(d) || d}${night ? '，那天晚上' : ''}`; }],
  // "3 ICE CREAMS" in a story
  [/^(\d+) ICE CREAMS$/, '$1 支雪糕'],
  // a memory's label: "Title, Sep 6, 2026, Place"
  [new RegExp('^(.+?), (' + ZH_MONTH_RE + ' \\d{1,2}, \\d{4}|' + ZH_MONTH_RE + ' \\d{4})(, that night)?, (.+)$'), (_, t, d, m1, m2, night, place) => {
    const x = zhOf(t); if (!x) return null; return `${x}，${zhDate(d) || d}${night ? '，那天晚上' : ''}，${zhBit(place)}`; }],
  // a date on its own
  [new RegExp('^' + ZH_MONTH_RE + ' (\\d{1,2}|\\d{4}|’\\d\\d)(, \\d{4})?$'), s => zhDate(s)],
  // "‹ Title" and "Title ›" (previous and next memory)
  [/^‹ (.+)$/, (_, a) => { const t = zhOf(a); return t ? `‹ ${t}` : null; }],
  [/^(.+) ›$/, (_, a) => { const t = zhOf(a); return t ? `${t} ›` : null; }],
  // a quote
  [/^“(.+)”$/, (_, a) => { const t = zhOf(a); return t ? `“${t.replace(/^“|”$/g, '')}”` : null; }],
  // "Label: 3" and "Label (3)"
  [/^(.+): (\d+)$/, (_, a, n) => { const t = zhOf(a); return t ? `${t.replace(/[：:]$/, '')}：${n}` : null; }],
  [/^(.+) \((\d+)\)$/, (_, a, n) => { const t = zhOf(a); return t ? `${t}（${n}）` : null; }],
  // pieces joined by a dot: "Sep 6, 2026 · The Earl Grey Incident", "MACHINE LOG · A-51KX"
  [/^(.+?) · (.+)$/, (_, a, b) => { const x = zhOf(a); const y = zhOf(b); return x || y ? `${x || a} · ${y || b}` : null; }],
  // two known pieces joined by a comma: "Coffee, popsicle"
  [/^([^,]+), ([^,]+)$/, (_, a, b) => { const x = zhOf(a), y = zhOf(b); return x && y ? `${x}，${y}` : null; }],
];
// The same English word meaning two things: "Home" is the front page, except where it is a place.
const ZH_CONTEXT = [
  ['[data-act=pickPlace], dd, .bm-where, .hfacts', { Home: '家里', Other: '其他' }],
];
