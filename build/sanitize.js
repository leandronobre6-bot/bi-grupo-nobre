// Funções de sanitização determinísticas para a versão PÚBLICA dos BI.
// Nunca deixar passar nome/telefone/e-mail/CPF de cliente.
const EMAIL=/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
function pretty(e){var l=String(e).split('@')[0].replace(/[._]+/g,' ').trim();return l.replace(/\b\w/g,c=>c.toUpperCase());}
// troca e-mails por um "nome bonito" (usado em dados de equipe; cliente nunca deve aparecer)
function sanEmails(v){ if(typeof v==='string') return v.replace(EMAIL,m=>pretty(m));
  if(Array.isArray(v)) return v.map(sanEmails);
  if(v&&typeof v==='object'){var o={};for(var k in v)o[k]=sanEmails(v[k]);return o;} return v; }
// mascara telefone em texto (ex.: lead_source do Kommo)
function maskPhones(v){ if(typeof v==='string') return v.replace(/\(?\d{2}\)?\s?9?\d{4,5}-?\d{4}/g,'(linha WhatsApp)');
  if(Array.isArray(v)) return v.map(maskPhones);
  if(v&&typeof v==='object'){var o={};for(var k in v)o[k]=maskPhones(v[k]);return o;} return v; }
// converte linhas [valor,valor,...] em objetos pelas chaves dadas
function rowsToObj(rows,keys){ return (rows||[]).map(r=>{const o={};keys.forEach((k,i)=>o[k]=r[i]);return o;}); }
// parser CSV ciente de aspas: trata campo entre aspas com virgula interna ("Roberto Paulo,")
// e aspas escapadas (""). Sem isso, um split simples por virgula desloca as colunas e vaza PII.
function parseCsvLine(line){
  const out=[]; let cur=''; let q=false;
  for(let i=0;i<line.length;i++){ const c=line[i];
    if(q){ if(c==='"'){ if(line[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else { if(c===','){out.push(cur);cur='';} else if(c==='"'){q=true;} else cur+=c; }
  }
  out.push(cur); return out;
}
function csvField(v){ v=String(v==null?'':v); return /[",\n\r]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
// zera colunas de PII num CSV (por nome de cabeçalho), respeitando aspas. Mantem o resto.
function blankCsvCols(csv, colNames){
  const lines=String(csv).split(/\r?\n/); if(!lines.length) return csv;
  const head=parseCsvLine(lines[0]); const idx=colNames.map(c=>head.findIndex(h=>h.trim().toLowerCase()===c.trim().toLowerCase())).filter(i=>i>=0);
  for(let i=1;i<lines.length;i++){ if(!lines[i]) continue; const cols=parseCsvLine(lines[i]); idx.forEach(j=>{ if(j<cols.length) cols[j]=''; }); lines[i]=cols.map(csvField).join(','); }
  return lines.join('\n');
}
// anonimiza linhas do principia_painel: nome -> "Aluno N", tel/telFmt -> ""
function anonPainelLinhas(painel){
  if(painel&&Array.isArray(painel.linhas)){ painel.linhas=painel.linhas.map((l,i)=>Object.assign({},l,{nome:'Aluno '+(i+1), tel:'', telFmt:''})); }
  return painel;
}
module.exports={ sanEmails, maskPhones, rowsToObj, blankCsvCols, anonPainelLinhas };
