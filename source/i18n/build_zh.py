# Rebuilds ../i18n-zh.js (the Chinese text) from:
#   dict_base.json  English sentence -> Chinese
#   extras.tsv      more of the same, one "English<TAB>Chinese" per line (later lines win)
#   patterns.js     sentences with numbers, dates or names in them
# Then run ../build.py.     python3 source/i18n/build_zh.py
import json
from pathlib import Path
d = Path(__file__).parent
words = json.loads((d / 'dict_base.json').read_text(encoding='utf8'))
for line in (d / 'extras.tsv').read_text(encoding='utf8').splitlines():
    if line.strip():
        en, zh = line.split('\t', 1)
        words[en] = zh
out = '/* Chinese for every sentence on the site, keyed by the English as written. */\nconst ZH = ' + json.dumps(words, ensure_ascii=False, indent=0) + ';\n' + (d / 'patterns.js').read_text(encoding='utf8')
(d.parent / 'i18n-zh.js').write_text(out, encoding='utf8')
print(len(words), 'entries')
