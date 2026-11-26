# Robô de atualização automática do BI público (Grupo Nobre)

Objetivo: manter `data/comercial.json` e `data/geral.json` frescos, para o site público
(bi.nobreeducacao.com.br) se atualizar sozinho. NUNCA publicar dado pessoal de cliente.
NUNCA publicar dado velho em silêncio: se uma fonte falhar/pedir login, avisar o Leandro e não sobrescrever.

## Passos de cada rodada (sessão agendada, com as conexões do Leandro)

1. Puxar as fontes (seguir também /areas/bi-grupo-nobre.md para os detalhes/ids/campos):
   - Google Drive (download_file_content):
     - principia_bi.json  -> fileId 1xCmtH2AQkmlxHCsAEyAob4E7xhHK6oCB
     - principia_painel.json -> fileId 15XkAn0IiT5Dn5V66v_-K5rQCZXjBR1bo
     - setti (geral)       -> fileId 1HpKAQS_LOL7nlIUPgoTeJlVZetEekmwl
     - Leads (CSV, export) -> fileId 1h2vSyiHlhR6YvMfrY4LKjeCqHQgtfRsVyfMit_V5CUA
   - Windsor.ai get_data (connector kommo): funil (campos pipeline_name,stage_name,lead_status_id,lead_price);
     vendedor (campos user_name,lead_price; filtro lead_status_id eq 142); origem (campos com lead_source).
   - Windsor.ai get_data (geral): googleanalytics4 (ga), instagram_public (ig), facebook_organic (fb),
     tiktok_organic (tt), youtube (yt).
   - Metas: ArtifactData (read_db) da coleção "metas" do artifact BI Comercial.

2. Sanitizar (usar build/sanitize.js):
   - PRB = sanEmails(principia_bi.json)
   - PAINEL = anonPainelLinhas(sanEmails(principia_painel.json))   // nome -> "Aluno N", tel/telFmt vazio
   - LEADS_CSV = blankCsvCols(leadsCsv, ["Nome","Telefone comercial"])
   - KF = rowsToObj(kommo_funil, ["pipeline_name","stage_name","lead_status_id","lead_price"])
   - KV = rowsToObj(kommo_vend,  ["user_name","lead_price"])
   - KO = maskPhones(kommo_origem_objs)   // mascara telefone em lead_source
   - DRIVE[principia_bi id] = PRB ; DRIVE[setti id] = setti (sem PII de cliente)

3. Montar os bundles:
   - data/comercial.json = { SNAP_TS:Date.now(), KF, KV, KO, PRB, PAINEL, LEADS_CSV, METAS, LEADS_ID:"1h2vSyiHlhR6YvMfrY4LKjeCqHQgtfRsVyfMit_V5CUA" }
   - data/geral.json     = { SNAP_TS:Date.now(), WS:{ga,ig,fb,tt,yt,kommo_funil,kommo_vend}, DRIVE:{ "1xCmtH2AQkmlxHCsAEyAob4E7xhHK6oCB":PRB, "1HpKAQS_LOL7nlIUPgoTeJlVZetEekmwl":setti } }
   (WS.kommo_funil/kommo_vend em geral = as MESMAS linhas cruas do Windsor, no formato que o geral espera.)

4. TRAVA obrigatória: `node build/check_pii.js data/comercial.json data/geral.json`.
   - Se achar PII (sai != 0): NÃO publicar. Avisar o Leandro na conversa com o que vazou.

5. Se a trava passou E todas as fontes vieram: commit + push de data/*.json. Avisar o Leandro (curto).
   Se alguma fonte falhou/pediu login: avisar o Leandro, NÃO sobrescrever o arquivo (fica o último bom).

Observação: o HTML (comercial.html / geral.html) quase nunca muda; só os data/*.json. O histórico do BI Geral
fica embutido no geral.html (atualiza quando o HTML for regerado, não a cada rodada).
