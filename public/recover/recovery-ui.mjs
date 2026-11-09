import { BACKUP_KEY, MAX_SIZE, exportSettings, validateBackup, previewSettings, importSettings, restoreSettings } from './settings.mjs';
const byId = id => document.getElementById(id);
let pending = null, rows = [];
const status = text => { byId('recovery-status').textContent = text; };
const download = (data, name) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
byId('export-settings').onclick = () => {
  try {
    const { backup, skipped } = exportSettings(localStorage, location.origin);
    if (!Object.keys(backup.entries).length) { status(`No supported settings found on this origin.${skipped.length ? ' Some invalid settings were left untouched: ' + skipped.join(', ') : ''}`); return; }
    download(backup, 'k-terminal-settings.json');
    status(`Exported ${Object.keys(backup.entries).length} settings. Keep this file private; it may contain your feedback draft.${skipped.length ? ' Invalid settings left untouched: ' + skipped.join(', ') : ''}`);
  } catch (e) { status(e.message); }
};
byId('import-file').onchange = async event => {
  pending = null; rows = []; byId('preview').replaceChildren(); byId('apply-settings').disabled = true;
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > MAX_SIZE) throw Error('Use a settings file smaller than 1 MB.');
    pending = validateBackup(JSON.parse(await file.text())); rows = previewSettings(pending, localStorage);
    for (const row of rows) {
      const label = document.createElement('label'), box = document.createElement('input'); box.type = 'checkbox'; box.value = row.key; box.checked = row.status === 'missing'; box.disabled = row.status === 'same';
      label.append(box, document.createTextNode(` ${row.label} — ${row.status === 'conflict' ? 'already exists; select to replace' : row.status === 'same' ? 'already matches; kept' : 'not saved here yet'}`)); byId('preview').append(label);
    }
    byId('apply-settings').disabled = !rows.some(r => r.status !== 'same'); status(`${rows.length} settings found. Review the selections before importing. Game and story progress are excluded.`);
  } catch(e) { pending = null; status(e.message); }
};
byId('apply-settings').onclick = () => {
  try {
    const selected = [...byId('preview').querySelectorAll('input:checked')].map(i => i.value);
    const result = importSettings(pending, selected, rows, localStorage, location.origin);
    status(`Imported ${result.count} settings. Download your pre-import backup, then reopen K Terminal. Old-origin data remains unchanged.`);
    byId('apply-settings').disabled = true;
  } catch(e) { status(e.message); }
  try { byId('download-backup').hidden = byId('restore-backup').hidden = !localStorage.getItem(BACKUP_KEY); } catch { /* status already reports storage failure */ }
};
byId('download-backup').onclick = () => {
  try { const value = localStorage.getItem(BACKUP_KEY); if (!value) throw Error('No pre-import backup found.'); download(JSON.parse(value), 'k-terminal-pre-import-backup.json'); } catch(e) { status(e.message); }
};
try { byId('download-backup').hidden = byId('restore-backup').hidden = !localStorage.getItem(BACKUP_KEY); } catch { status('Browser storage is unavailable. No settings can be read or changed here.'); }

byId('restore-backup').onclick = () => {
  try { const count = restoreSettings(localStorage, location.origin); status(`Restored ${count} settings to their pre-import values. Reopen K Terminal.`); byId('restore-backup').hidden = true; }
  catch(e) { status(e.message); }
};
