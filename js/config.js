// ================================================================
// DZEL — CONFIGURAÇÕES GLOBAIS
// ================================================================

const supabaseUrl = 'https://cmdmjprdsxglfjvohcyp.supabase.co';
const supabaseKey = 'sb_publishable_2kT53IwbI5_A3ag5zu_CFg_3fhWCcAr';

const sb = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBN33NHgwpMSK9Re9YjzWHNeTdwswmH7cuzkY4aM_wKniL5v-qscTNh0N9KQkBijMq/exec';

// ── Variáveis globais de estado ──────────────────────────────────
let demandas    = [];
let frota       = [];
let visitantes  = [];
let eventos     = [];
let logs        = [];
let appUsers    = [];
let crachas     = [];
let ocorrencias = [];

let currentUserRole = null;
let currentUserData = null;
let streamGeral     = null;  // stream da webcam
let osPrintAtualId  = null;  // id da OS aberta no modal de impressão

// Instâncias dos charts (Chart.js) — registrado sob demanda em ensureCharts()
let chartVolume  = null;
let chartGaragem = null;
