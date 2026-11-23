# Will You Finish It?

An ice cream survival game, plus a Memory Freezer.

The site is one file, `index.html`, served by GitHub Pages.

## Changing it

Everything is edited in `source/`, then put together into `index.html`:

```
python3 source/build.py
```

- `source/src.html` – the page, styles and game
- `source/expansion.*` – verdicts, achievements, archive extras
- `source/memory-*.js`, `memory.css` – the Memory Freezer and its memories
- `source/i18n.js` – the English / 中文 switch
- `source/i18n/` – the Chinese text; after changing it run `python3 source/i18n/build_zh.py`, then `build.py`
- `source/apps-script.gs` – the Google Apps Script behind the shared archive

Records are kept in the shared archive (a Google Sheet), so a new address or device gets them back on first open.
