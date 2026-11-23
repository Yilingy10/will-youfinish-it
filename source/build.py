# Builds the site: puts every piece into src.html and writes ../index.html,
# the one file GitHub Pages serves.   python3 source/build.py
from pathlib import Path
d = Path(__file__).parent
s = (d / 'src.html').read_text(encoding='utf8')
for marker, f in [('/*__MEMORY_CSS__*/', 'memory.css'), ('//__MEMORY_DATA__', 'memory-data.js'), ('//__MEMORY_JS__', 'memory.js'),
                  ('//__MEMORY_VIEW__', 'memory-view.js'), ('//__EXPANSION__', 'expansion.js'), ('/*__EXPANSION_CSS__*/', 'expansion.css'),
                  ('/*__FONTS__*/', 'fonts.css'), ('//__I18N_ZH__', 'i18n-zh.js'), ('//__I18N__', 'i18n.js')]:
    assert s.count(marker) == 1, marker
    s = s.replace(marker, (d / f).read_text(encoding='utf8'))
(d.parent / 'index.html').write_text(s, encoding='utf8')
print(len(s) // 1024, 'KB')
