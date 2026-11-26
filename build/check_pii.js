// Trava anti-PII: varre um texto JSON/CSV atrás de dado pessoal de CLIENTE.
// Retorna lista de achados. Usada como gate: se achar algo, NÃO publica.
function scanPII(s){
  s = String(s||"");
  const out = [];
  // e-mails (menos os de staff @nobreeducacao / @gmail de equipe sao tratados pelo sanitizador antes;
  // aqui qualquer e-mail sobrando conta como achado)
  const emails = (s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[])
    .filter(x=>!/@users\.noreply\.github|example\.com/.test(x));
  const cpf = (s.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g)||[]);
  // telefone BR formatado com DDD entre parenteses: (11) 91234-5678 ou (11) 1234-5678
  const fones = (s.match(/\(\d{2}\)\s?9?\d{4}-\d{4}/g)||[]);
  if(emails.length) out.push({tipo:"email", qtd:emails.length, exemplos:[...new Set(emails)].slice(0,5)});
  if(cpf.length)    out.push({tipo:"cpf",   qtd:cpf.length,   exemplos:cpf.slice(0,3)});
  if(fones.length)  out.push({tipo:"telefone", qtd:fones.length, exemplos:fones.slice(0,3)});
  return out;
}
module.exports = { scanPII };
if(require.main===module){
  const fs=require("fs");
  let bad=false;
  for(const f of process.argv.slice(2)){
    const found=scanPII(fs.readFileSync(f,"utf8"));
    if(found.length){ bad=true; console.error("PII em "+f+":", JSON.stringify(found)); }
    else console.log("OK (sem PII): "+f);
  }
  process.exit(bad?1:0);
}
