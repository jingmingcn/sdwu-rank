// Mobile-first decision helper
const state = {
  headers: [],
  rows: [],
  decisionColumn: null,
  steps: [],
  selections: [],
  currentStep: 0
};

const els = {
  startBtn: null, csvFile: null, resetBtn: null,
  stepsArea: null, progressArea: null, cards: null, stepTitle: null, progress: null, progressFill: null, progressSteps: null, progressStepLabels: null,
  prevBtn: null, nextBtn: null, resultArea: null, resultOutput: null, restartBtn: null,
  intro: null
};

function $(id){return document.getElementById(id)}

function init(){
  els.startBtn = $('startBtn'); els.csvFile = $('csvFile'); els.resetBtn = $('resetBtn');
  els.stepsArea = $('stepsArea'); els.progressArea = $('progressArea'); els.cards = $('cards'); els.stepTitle = $('stepTitle'); els.progress = $('progress');
  els.prevBtn = $('prevBtn'); els.nextBtn = $('nextBtn'); els.resultArea = $('resultArea'); els.resultOutput = $('resultOutput');
  els.restartBtn = $('restartBtn'); els.intro = $('intro');

  els.startBtn.addEventListener('click', ()=>startFlow());
  els.csvFile.addEventListener('change', handleFileUpload);
  els.prevBtn.addEventListener('click', ()=>navigate(-1));
  els.nextBtn.addEventListener('click', ()=>navigate(1));
  els.resetBtn.addEventListener('click', resetAll);
  els.restartBtn.addEventListener('click', resetAll);

  els.progressFill = $('progressFill'); els.progressSteps = $('progressSteps'); els.progressStepLabels = $('progressStepLabels');

  // try load default sample
  loadDefaultCSV();
}

function handleFileUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  Papa.parse(file, {header:true, skipEmptyLines:true, complete: (res)=>{
    loadData(res.meta.fields, res.data);
  }});
}

function loadDefaultCSV(){
  fetch('data.csv').then(r=>r.text()).then(txt=>{
    Papa.parse(txt, {header:true, skipEmptyLines:true, complete:(res)=>{loadData(res.meta.fields, res.data)}})
  }).catch(()=>{/*no sample available*/});
}

function loadData(headers, rows){
  state.headers = headers.slice();
  state.rows = rows.map(r=>{
    // normalize: keep keys as headers
    const obj={};
    for(const h of headers) obj[h]=r[h]===undefined?"" : String(r[h]).trim();
    return obj;
  });

  // detect decision column
  const lower = headers.map(h=>h.toLowerCase());
  let decIdx = lower.indexOf('decision');
  if(decIdx<0) decIdx = lower.indexOf('result');
  if(decIdx<0) decIdx = headers.length-1;
  state.decisionColumn = headers[decIdx];

  // build steps from headers excluding decision column
  state.steps = headers.filter(h=>h!==state.decisionColumn);
  state.selections = new Array(state.steps.length).fill(null);
}

function startFlow(){
  if(!state.rows.length){ alert('No data loaded. Upload a CSV.'); return; }
  els.intro.classList.add('hidden');
  els.resultArea.classList.add('hidden');
  els.stepsArea.classList.remove('hidden');
  els.progressArea.classList.remove('hidden');
  state.currentStep = 0;
  renderStep();
  updateNav();
}

function renderStep(){
  const stepIndex = state.currentStep;
  const key = state.steps[stepIndex];
  els.stepTitle.textContent = key;

  // compute unique options for this column, filter by previous selections
let options = [...new Set(state.rows.map(r=>r[key]).filter(v=>v!==''))];

// Filter by previous selections
for(let i = 0; i < stepIndex; i++){
    const prevKey = state.steps[i];
    const prevSel = state.selections[i];
    if(prevSel !== null){
        options = options.filter(opt => 
            state.rows.some(r => r[prevKey] === prevSel && r[key] === opt)
        );
    }
}

  els.cards.innerHTML = '';
  for(const opt of options){
    const div = document.createElement('div');
    div.className = 'card-option';
    div.textContent = opt;
    if(state.selections[stepIndex]===opt) div.classList.add('selected');
    div.addEventListener('click', ()=>{
      state.selections[stepIndex]=opt;
      // mark selected UI
      Array.from(els.cards.children).forEach(c=>c.classList.remove('selected'));
      div.classList.add('selected');
      // enable next
      els.nextBtn.disabled = false;
      // auto move forward a short delay for phone UX
      setTimeout(()=>{
        if(state.currentStep < state.steps.length-1) navigate(1); else computeResult();
      }, 250);
    });
    els.cards.appendChild(div);
  }
  // if no options
  if(options.length===0){ els.cards.innerHTML = '<div class="note">No options found for this step.</div>'; els.nextBtn.disabled=true; }
  
  if(options.length===1){
    // auto-select if only one option
    state.selections[stepIndex] = options[0];
    Array.from(els.cards.children).forEach(c=>c.classList.remove('selected'));
    els.cards.firstChild.classList.add('selected');
    els.nextBtn.disabled = false;
    setTimeout(()=>{
      if(state.currentStep < state.steps.length-1) navigate(1); else computeResult();
    }, 250);
  }
  
  // reflect selection
  updateNav();
  renderProgress();
}

function navigate(dir){
  if(dir>0 && state.selections[state.currentStep]==null){ alert('Please select an option to continue.'); return; }
  state.currentStep += dir;
  if(state.currentStep < 0) state.currentStep = 0;
  if(state.currentStep >= state.steps.length) state.currentStep = state.steps.length-1;
  renderStep();
}

function updateNav(){
  // update numeric label and controls
  $('currentStep').textContent = state.currentStep+1;
  $('totalSteps').textContent = state.steps.length;
  els.prevBtn.disabled = state.currentStep===0;
  els.nextBtn.disabled = state.selections[state.currentStep]==null;
}

function renderProgress(){
  const total = state.steps.length || 0;
  if(!els.progressSteps || !els.progressFill) return;
  // build segments
  els.progressSteps.innerHTML = '';
  for(let i=0;i<total;i++){
    const seg = document.createElement('div');
    seg.className = 'step-seg' + (i<=state.currentStep ? ' active' : '');
    els.progressSteps.appendChild(seg);
  }
  // build step labels and selections
  if(els.progressStepLabels){
    els.progressStepLabels.innerHTML = '';
    for(let i=0;i<total;i++){
      const item = document.createElement('div');
      item.className = 'step-item';
      
      const label = document.createElement('div');
      label.className = 'step-label' + (i===state.currentStep ? ' active' : '');
      label.textContent = state.steps[i];
      label.title = state.steps[i];
      item.appendChild(label);
      
      const selection = document.createElement('div');
      selection.className = 'step-selection' + (state.selections[i] ? '' : ' empty');
      selection.textContent = state.selections[i] || '—';
      selection.title = state.selections[i] || 'Not selected';
      item.appendChild(selection);
      
      els.progressStepLabels.appendChild(item);
    }
  }
  // fill percentage (show progress proportionally)
  const percent = total===0 ? 0 : Math.round(((state.currentStep+1)/total) * 100);
  els.progressFill.style.width = percent + '%';
  // update accessible label
  $('currentStep').textContent = state.currentStep+1;
  $('totalSteps').textContent = total;
}

function computeResult(){
    renderProgress();
  // filter rows where all selected columns match
  const filtered = state.rows.filter(r=>{
    for(let i=0;i<state.steps.length;i++){
      const key = state.steps[i];
      const sel = state.selections[i];
      if(sel==null) return false;
      if(String(r[key])!==String(sel)) return false;
    }
    return true;
  });

  els.resultArea.classList.remove('hidden');
  els.stepsArea.classList.add('hidden');
  els.resultOutput.innerHTML='';
  if(filtered.length===0){
    els.resultOutput.textContent = 'No matching decision for the selected combination.';
    return;
  }

  const decisions = [...new Set(filtered.map(r=>r[state.decisionColumn]))];
  if(decisions.length===1){
    els.resultOutput.textContent = decisions[0];
  } else {
    const list = document.createElement('div');
    list.innerHTML = '<strong>Multiple possible decisions:</strong>';
    const ul = document.createElement('ul');
    for(const d of decisions){
      const li = document.createElement('li'); li.textContent = `${d} (${filtered.filter(r=>r[state.decisionColumn]===d).length})`; ul.appendChild(li);
    }
    list.appendChild(ul);
    els.resultOutput.appendChild(list);
  }
}

function resetAll(){
  state.selections = new Array(state.steps.length).fill(null);
  state.currentStep = 0;
  els.intro.classList.remove('hidden');
  els.progressArea.classList.add('hidden');
  els.stepsArea.classList.add('hidden');
  els.resultArea.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', init);
