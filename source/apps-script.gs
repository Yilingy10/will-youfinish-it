/**
 * WILL YOU FINISH IT?  Shared archive.
 *
 * Paste this whole file into a Google Sheet: Extensions > Apps Script.
 * It turns the sheet into the game's shared archive:
 *   - "Records"  one row per ice cream (easy to read, sort and chart)
 *   - "Deleted"  anything erased in the game lands here, so nothing is lost
 *
 * The game talks to it through the web app address you get when you deploy.
 * Leave the "json" column alone: the game reads its records back from it.
 * The columns after it (kind, rest, whyStop...) are just for reading. Rows
 * with kind "resisted" are ice creams that were NOT bought.
 * Updating this script is optional: older versions keep working, they just
 * don't show those extra columns.
 */

const SHEET = 'Records';
const TRASH = 'Deleted';
const COLUMNS = [
  'id', 'date', 'name', 'place', 'form', 'flavorCategory', 'toppings', 'decorations', 'reasonForBuying',
  'predictedBites', 'predictionConfidence', 'actualBites', 'finished', 'firstReaction', 'laterReactions',
  'stopReason', 'repurchase', 'finalVerdict', 'predictionError', 'json',
  'kind', 'rest', 'whyStop', 'challenge', 'mode', 'loc',
];

// The game asks for every record
function doGet() {
  const sheet = sheet_(SHEET);
  const rows = sheet.getDataRange().getValues().slice(1);
  const col = COLUMNS.indexOf('json');
  const records = rows.map(r => { try { return JSON.parse(r[col]); } catch (e) { return null; } }).filter(Boolean);
  return out_({ ok: true, records });
}

// The game saves, erases one, or erases everything
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = sheet_(SHEET);
    const ids = sheet.getRange(1, 1, Math.max(1, sheet.getLastRow()), 1).getValues().map(r => String(r[0]));

    if (body.action === 'save') {
      const record = body.record;
      if (!record || !record.id) return out_({ ok: false, error: 'missing record' });
      const at = ids.indexOf(String(record.id));
      if (at > 0) sheet.getRange(at + 1, 1, 1, COLUMNS.length).setValues([row_(record)]);
      else sheet.appendRow(row_(record));
      return out_({ ok: true });
    }
    if (body.action === 'delete') {
      const at = ids.indexOf(String(body.id));
      if (at > 0) toTrash_(sheet, [at + 1]);
      return out_({ ok: true });
    }
    if (body.action === 'reset') {
      const all = [];
      for (let n = sheet.getLastRow(); n >= 2; n--) all.push(n);
      toTrash_(sheet, all);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function row_(r) {
  return COLUMNS.map(c => {
    if (c === 'json') return JSON.stringify(r);
    if (c === 'kind') return r.kind || 'bought';
    if (c === 'toppings' || c === 'decorations') return (r[c] || []).join(', ');
    if (c === 'firstReaction') return r.firstReaction ? r.firstReaction.label : '';
    if (c === 'laterReactions') return (r.laterReactions || []).map(x => 'Bite ' + x.bite + ': ' + x.label).join(' / ');
    if (c === 'date' || c === 'name' || c === 'place') return r[c] ? "'" + r[c] : '';   // keep as text, never auto-converted
    return r[c] === null || r[c] === undefined ? '' : r[c];
  });
}

function toTrash_(sheet, rowNumbers) {
  const trash = sheet_(TRASH);
  rowNumbers.sort((a, b) => b - a).forEach(n => {
    trash.appendRow(sheet.getRange(n, 1, 1, COLUMNS.length).getValues()[0]);
    sheet.deleteRow(n);
  });
}

function sheet_(name) {
  const book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < COLUMNS.length) {
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);   // a sheet from an older version gets the new headings
  }
  return sheet;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
