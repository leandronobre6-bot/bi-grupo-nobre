// Substitui, com segurança, um bloco embutido window.<NOME>={...} num HTML por conteudo novo (JSON).
// Uso: node build/replace_block.js <arquivo.html> <NOME> <novo.json>
// Trava: só substitui se o novo JSON for objeto não-vazio (evita apagar dados por engano).
const fs=require("fs");
const [,,htmlFile,name,jsonFile]=process.argv;
if(!htmlFile||!name||!jsonFile){console.error("uso: replace_block.js <html> <NOME> <json>");process.exit(2);}
let novo;
try{ novo=JSON.parse(fs.readFileSync(jsonFile,"utf8")); }catch(e){ console.error("JSON invalido:",e.message); process.exit(1); }
if(!novo || typeof novo!=="object" || (Array.isArray(novo)?novo.length===0:Object.keys(novo).length===0)){
  console.error("Recusado: conteudo novo vazio para window."+name); process.exit(1);
}
const lines=fs.readFileSync(htmlFile,"utf8").split("\n");
let idx=-1;
for(let i=0;i<lines.length;i++){ if(lines[i].indexOf("window."+name+"=")===0){ idx=i; break; } }
if(idx<0){ console.error("Nao achei a linha 'window."+name+"=' em "+htmlFile); process.exit(1); }
lines[idx]="window."+name+"="+JSON.stringify(novo)+";";
fs.writeFileSync(htmlFile, lines.join("\n"));
console.log("OK: window."+name+" atualizado em "+htmlFile+" (linha "+(idx+1)+")");
