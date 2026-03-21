// ================================================================
// DZEL — SINCRONIZAÇÃO COM GOOGLE SHEETS
// ================================================================
// Usa no-cors + FormData para contornar bloqueio CORS do Apps Script.
// A resposta não pode ser lida, mas o POST chega normalmente.

async function syncSheets(modulo, operacao, dado) {
    if (!GOOGLE_SCRIPT_URL) return;
    try {
        const form = new FormData();
        form.append('payload', JSON.stringify({ modulo, operacao, dado }));
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode:   'no-cors',
            body:   form
        });
    } catch (e) {
        console.warn('Sync Sheets falhou (não crítico):', e.message);
    }
}
