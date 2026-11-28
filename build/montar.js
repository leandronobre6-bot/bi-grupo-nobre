// Monta data/comercial.json e data/geral.json a partir das fontes puxadas.
// Uso: node build/montar.js <dir-das-fontes>
const fs = require('fs');
const path = require('path');
const S = require('./sanitize.js');

const SRC = process.argv[2];       // dir com os arquivos de fonte (JSON crus)
const OUT = process.argv[3] || path.join(__dirname, '..', 'data');

const rd = f => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

// --- Drive ---
const principia_bi   = rd('principia_bi.json');
const painel         = rd('principia_painel.json');
const setti          = rd('setti.json');            // (hoje o arquivo e thinkr_bi)
const leadsCsv       = fs.readFileSync(path.join(SRC, 'leads.csv'), 'utf8');

// --- Windsor ---
const kommo_funil = rd('kommo_funil.json');   // objetos {pipeline_name,stage_name,lead_status_id,lead_price}
const kommo_vend  = rd('kommo_vend.json');    // objetos {user_name,lead_price}
const kommo_orig  = rd('kommo_orig.json');    // objetos {lead_source,lead_price}
const ga_raw = rd('ga.json');                 // tem screen_page_views -> remapear p/ screenpageviews
const ig = rd('ig.json');
const fb = rd('fb.json');
const tt = rd('tt.json');
const yt = rd('yt.json');

// --- Metas ---
const METAS = rd('metas.json');

// GA: o geral.html espera a chave "screenpageviews"
const ga = ga_raw.map(r => ({
  date: r.date, sessions: r.sessions, totalusers: r.totalusers,
  newusers: r.newusers, screenpageviews: r.screen_page_views, conversions: r.conversions
}));

// Sanitizacao conforme RUNBOOK
const PRB    = S.sanEmails(principia_bi);
const PAINEL = S.anonPainelLinhas(S.sanEmails(painel));
const SETTI  = S.maskPhones(S.sanEmails(setti));           // "sem PII de cliente"
const LEADS_CSV = S.blankCsvCols(leadsCsv, ["Nome", "Telefone comercial"]);
const KF = kommo_funil;                                    // ja vem como objetos
const KV = kommo_vend;
const KO = S.maskPhones(kommo_orig);                       // mascara telefone em lead_source

const SNAP_TS = Date.now();

const comercial = {
  SNAP_TS, KF, KV, KO, PRB, PAINEL, LEADS_CSV, METAS,
  LEADS_ID: "1h2vSyiHlhR6YvMfrY4LKjeCqHQgtfRsVyfMit_V5CUA"
};

const geral = {
  SNAP_TS,
  WS: { ga, ig, fb, tt, yt, kommo_funil: KF, kommo_vend: KV },
  DRIVE: {
    "1xCmtH2AQkmlxHCsAEyAob4E7xhHK6oCB": PRB,
    "1HpKAQS_LOL7nlIUPgoTeJlVZetEekmwl": SETTI
  }
};

fs.writeFileSync(path.join(OUT, 'comercial.json'), JSON.stringify(comercial));
fs.writeFileSync(path.join(OUT, 'geral.json'), JSON.stringify(geral));
console.log('OK montado. comercial KF/KV/KO:', KF.length, KV.length, KO.length,
  '| geral WS ga/ig/fb/tt/yt:', ga.length, ig.length, fb.length, tt.length, yt.length,
  '| SNAP_TS', SNAP_TS, new Date(SNAP_TS).toISOString());
