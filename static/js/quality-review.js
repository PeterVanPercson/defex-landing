(() => {
  const app = document.getElementById('review-app');
  if (!app) return;
  const $ = id => document.getElementById(id);
  const token = app.querySelector('[name=csrfmiddlewaretoken]').value;
  let input = null, result = null, revision = 0, busy = false;
  const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
  const message = text => { $('status').textContent = text; };
  const canGenerate = () => { $('generate').disabled = !input || !$('consent').checked || busy; };
  async function post(url, body) {
    const response = await fetch(url, {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','X-CSRFToken':token}, body:JSON.stringify(body)});
    let data; try { data = await response.json(); } catch { throw new Error('The server could not complete the request. Please try again.'); }
    if (!response.ok) throw new Error(data.error || 'The request failed.');
    return data;
  }
  function showStats(s) {
    const target = $('statistics'); target.replaceChildren();
    const stats = node('div',undefined,'stat-grid');
    [['Inspected',s.inspected],['FAIL decisions',s.failed],['FAIL rate',s.fail_rate_pct+'%']].forEach(([label,value]) => { const cell=node('div',undefined,'stat'); cell.append(node('strong',String(value)),node('span',label)); stats.append(cell); }); target.append(stats);
    const table=node('table',undefined,'fact-table'), head=node('tr'); ['Evidence / group','Inspected','FAIL'].forEach(t=>head.append(node('th',t))); const thead=node('thead');thead.append(head);table.append(thead);const tbody=node('tbody');
    s.facts.forEach(f=>{const row=node('tr'); row.append(node('td',f.id+' · '+f.label),node('td',f.inspected===undefined?'—':String(f.inspected)),node('td',String(f.failed)));tbody.append(row);});table.append(tbody);target.append(table);
    const details=node('details'), list=node('ul');details.append(node('summary','Data limitations'));s.warnings.forEach(w=>list.append(node('li',w)));details.append(list);target.append(details);
  }
  async function load(next, label) {
    const version = ++revision; input=null; result=null; $('report-panel').hidden=true; $('consent').checked=false; canGenerate(); message('Checking inspection records…');
    try {const data=await post(app.dataset.analyze,next); if(version!==revision)return; input=next; $('source-label').textContent=label; showStats(data.summary);$('custom-access').hidden=!!next.sample_id;message('Source statistics are ready. Generate a review when you are ready to share the aggregates.');}
    catch(e){if(version!==revision)return; $('statistics').replaceChildren(node('p',e.message,'empty'));message(e.message);}
    canGenerate();
  }
  const sampleNames={'defect-spike':'Synthetic example · defect spike','clean-run':'Synthetic example · no FAIL decisions','uncertain':'Synthetic example · low-confidence decisions'};
  app.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{if(busy)return;app.querySelectorAll('[data-sample]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('csv-file').value='';load({sample_id:button.dataset.sample},sampleNames[button.dataset.sample]);}));
  $('csv-file').addEventListener('change',async()=>{
    const version=++revision; input=null; result=null;
    $('report-panel').hidden=true; $('consent').checked=false;
    $('statistics').replaceChildren(); $('source-label').textContent='';
    canGenerate();
    const file=$('csv-file').files[0]; if(!file)return;
    app.querySelectorAll('[data-sample]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(file.size>256000){message('Use a CSV smaller than 256 KB.');$('csv-file').value='';return;}
    message('Reading CSV…');
    try {const text=await file.text();if(version!==revision)return;load({csv:text},'Your CSV · '+file.name);}
    catch(e){if(version===revision)message('Could not read this CSV. Select the file again.');}
  });
  $('consent').addEventListener('change',canGenerate);
  $('generate').addEventListener('click',async()=>{if(!input||busy||!$('consent').checked)return;busy=true;canGenerate();$('csv-file').disabled=true;const version=revision;message('Nebius is generating a review from the evidence…');$('report-panel').hidden=true;
    try {const data=await post(app.dataset.generate,{...input,consent:true,access_code:input.sample_id?'':$('access-code').value});if(version!==revision)return;result=data;const r=data.report,m=data.measurement,target=$('report');target.replaceChildren(node('p',r.summary,'report-summary'),node('p','Suggested priority: '+r.priority));
      r.findings.forEach(f=>{target.append(node('h3',f.title),node('p',f.detail));f.evidence_ids.forEach(id=>{const fact=data.summary.facts.find(x=>x.id===id);target.append(node('p',id+' · '+fact.label+' · '+(fact.inspected!==undefined?fact.failed+' / '+fact.inspected+' FAIL ('+fact.fail_rate_pct+'%)':fact.failed+' FAIL'), 'evidence-ref'));});});
      [['Suggested checks',r.checks],['Limitations',r.limitations]].forEach(([title,items])=>{target.append(node('h3',title));const list=node('ul');items.forEach(x=>list.append(node('li',x)));target.append(list);});target.append(node('p','Root cause: not established by these records.','small'));
      $('measurement').textContent=(m.cached?'Previously generated sample report · ':'Live inference · ')+m.provider+' · '+m.model+' · original inference '+m.inference_seconds+' s · '+m.generated_at;
      $('report-panel').hidden=false;message(m.cached?'Loaded a cached sample report. This request did not make a new inference call.':'Review generated. Check its claims against the evidence before acting.');
    }catch(e){message(e.message);}finally{busy=false;$('csv-file').disabled=false;canGenerate();}});
  $('download-report').addEventListener('click',()=>{if(!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='defex-quality-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
})();
