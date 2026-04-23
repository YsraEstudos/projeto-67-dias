import{f as d,p as S,H as w,I as h,J as R}from"./ConcursoBootstrap-CK6jIZ3-.js";const l=t=>t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"),f=t=>new Intl.DateTimeFormat("pt-BR",{weekday:"short",timeZone:"UTC"}).format(S(t)),g=t=>{const[e,s]=t.split("-").map(Number);return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(e,s-1,1)))},b=t=>t.hasSimulado&&t.hasRedacao?"Simulado + Redacao":t.hasSimulado?"Simulado":t.hasRedacao?"Redacao":"Sem evento especial",$=t=>t.planMode==="manual"?`Manual (Semana ${t.weekNumber??"-"})`:"Automatico",y=t=>t.isRestDay?["Domingo de descanso fixo"]:t.planMode==="manual"&&t.manualBlocks&&t.manualBlocks.length>0?t.manualBlocks.map(e=>{const s=e.movedFromSunday?" [realocado do domingo]":"",i=(()=>{const n=w(e)?.replaceAll(" | "," / ");return n?` | Conteúdo programático: ${n}`:""})();return`${e.area}: ${e.title} - ${e.detail}${i}${s}`}):[`Materia: ${h(t.subjects[0])} (bloco principal)`,`Materia: ${h(t.subjects[1])} (bloco principal)`,`Trabalho: ${R(t.workActivity)} (bloco rotativo)`],P=()=>new Date().toISOString().slice(0,10),v=(t,e,s)=>{const i=new Blob([t],{type:s}),m=URL.createObjectURL(i),n=document.createElement("a");n.href=m,n.download=e,document.body.append(n),n.click(),n.remove(),URL.revokeObjectURL(m)},D=t=>{const e=[...t].sort((o,c)=>o.date.localeCompare(c.date)),s=e[0]?.date??"",i=e[e.length-1]?.date??"",m=e.filter(o=>o.hasSimulado).length,n=e.filter(o=>o.hasRedacao).length,u=[...new Set(e.map(o=>o.monthKey))],r=["# Plano Completo de Estudos","",`Periodo: ${d(s)} a ${d(i)}`,`Gerado em: ${new Date().toLocaleString("pt-BR")}`,`Simulados planejados: ${m}`,`Redacoes planejadas: ${n}`,""];for(const o of u){r.push(`## ${g(o)}`),r.push("");const c=e.filter(a=>a.monthKey===o);for(const a of c){r.push(`### ${f(a.date)} ${d(a.date)} | ${$(a)} | ${b(a)}`),r.push(`- Meta de questoes objetivas: ${a.targets.objectiveQuestions}`);for(const p of y(a))r.push(`- ${p}`);r.push("")}}return r.join(`
`)},k=t=>{const e=[...t].sort((o,c)=>o.date.localeCompare(c.date)),s=e[0]?.date??"",i=e[e.length-1]?.date??"",m=e.filter(o=>o.hasSimulado).length,n=e.filter(o=>o.hasRedacao).length,r=[...new Set(e.map(o=>o.monthKey))].map(o=>{const c=e.filter(a=>a.monthKey===o).map(a=>{const p=y(a).map(x=>`<li>${l(x)}</li>`).join("");return`
            <article class="day">
              <h3>${l(f(a.date))} ${l(d(a.date))}</h3>
              <p class="meta">${l($(a))} | ${l(b(a))} | Questoes: ${a.targets.objectiveQuestions}</p>
              <ul>${p}</ul>
            </article>
          `}).join("");return`<section><h2>${l(g(o))}</h2>${c}</section>`}).join("");return`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Plano Completo de Estudos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin: 0 0 8px; }
          h2 { margin: 28px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db; text-transform: capitalize; }
          h3 { margin: 0 0 6px; font-size: 15px; }
          p { margin: 4px 0; }
          .summary { margin-bottom: 16px; font-size: 14px; }
          .day { margin: 0 0 12px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .meta { color: #374151; font-size: 13px; }
          ul { margin: 8px 0 0 18px; padding: 0; }
          li { margin: 2px 0; font-size: 13px; }
          @media print { body { margin: 12mm; } .day { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <h1>Plano Completo de Estudos</h1>
        <div class="summary">
          <p><strong>Periodo:</strong> ${l(d(s))} a ${l(d(i))}</p>
          <p><strong>Gerado em:</strong> ${l(new Date().toLocaleString("pt-BR"))}</p>
          <p><strong>Simulados:</strong> ${m} | <strong>Redacoes:</strong> ${n}</p>
        </div>
        ${r}
      </body>
    </html>
  `},L=t=>{const e=D(t),s=`plano-completo-${P()}.md`;v(e,s,"text/markdown;charset=utf-8")},A=t=>{const e=window.open("","_blank","noopener,noreferrer");if(!e)throw new Error("Popup bloqueado. Permita popups para gerar o PDF.");e.document.write(k(t)),e.document.close(),e.focus(),e.print()};export{A as a,L as e};
