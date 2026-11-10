/* ============================================================
   1. RULES  - all health logic & content lives here.
      Edit thresholds / text here only. Cite sources in the UI.
   ============================================================ */
const LV = {ok:0, warn:1, crit:2};
const LEVEL_LABEL = {ok:'Nominal', warn:'Attention', crit:'Critical'};
const LEVEL_COLOR = {ok:'#3ddc97', warn:'#ffc84a', crit:'#ff5d6c'};

const METRICS = {
  hr:{
    label:'Heart rate', unit:'bpm', icon:'\u2764', band:[50,100],
    val:r=>r.hr, series:r=>r.hr, complete:r=>isNum(r.hr),
    level:r=>{const v=r.hr; if(v<40||v>=120) return 'crit'; if(v<50||v>100) return 'warn'; return 'ok';},
    ranges:'Nominal 50-100 bpm. Attention <50 or >100. Critical <40 or >=120.',
    how:'Rest 5 minutes, restrained or seated. Use the wrist/chest sensor, or count your wrist pulse for 30 s and double it.',
    why:'Microgravity shifts fluid toward the head and deconditions the heart. Stress, poor sleep and cabin CO\u2082 also raise resting HR. A slow rise over several days is an early warning.',
    tips:{
      ok:'Within expected range. Keep up daily aerobic exercise to counter cardiovascular deconditioning.',
      warn:'Rest 10 minutes and re-measure. Check hydration, caffeine, stress and cabin air quality. If it stays out of range for 24 h, tell the crew medical officer.',
      crit:'Stop strenuous activity and re-measure. If still out of range, or with chest pain, dizziness or fainting: alert the crew medical officer and flight surgeon now.'
    }
  },
  bp:{
    label:'Blood pressure', unit:'mmHg', icon:'\ud83e\ude78', band:[90,129],
    val:r=>r.sys+'/'+r.dia, series:r=>r.sys, series2:r=>r.dia, complete:r=>isNum(r.sys)&&isNum(r.dia),
    level:r=>{
      if(r.sys>=180||r.dia>=120||r.sys<80||r.dia<50) return 'crit';
      if(r.sys>=130||r.dia>=80||r.sys<95||r.dia<55) return 'warn';
      return 'ok';
    },
    ranges:'Nominal <130/80 (and not too low). Attention >=130/80 or <95/55. Critical >=180/120 or <80/50.',
    how:'Rest 5 minutes, cuff on the upper arm at heart level, stay still and silent. Take two readings and log the second.',
    why:'Fluid shifts and cardiovascular deconditioning change BP in orbit. High sodium food and stress can raise it. Low readings with dizziness matter after returning to gravity.',
    tips:{
      ok:'Within range. Keep fluids up and limit very salty foods.',
      warn:'Re-measure after 5 minutes of rest. Review hydration and sodium. Recheck in a few hours and report to the flight surgeon if it repeats.',
      crit:'Re-measure now. If confirmed, or with headache, vision change or chest pain, contact the flight surgeon immediately.'
    }
  },
  glucose:{
    label:'Blood glucose', unit:'mg/dL', icon:'\ud83e\ude78', band:[70,99],
    val:r=>r.glucose, series:r=>r.glucose, complete:r=>isNum(r.glucose),
    level:r=>{const v=r.glucose; if(v<54||v>180) return 'crit'; if(v<70||v>=100) return 'warn'; return 'ok';},
    ranges:'Fasting nominal 70-99 mg/dL. Attention 54-69 or 100-180. Critical <54 or >180.',
    how:'Wash and dry hands, use a fingerstick glucometer, ideally fasting (before breakfast). Dispose of lancets in the sharps container.',
    why:'Altered diet, lower activity, stress and fluid changes can shift glucose handling. Tracking it supports nutrition monitoring on long missions.',
    tips:{
      ok:'Within the fasting range. Keep meals regular and balanced.',
      warn:'Repeat the test. If low and shaky/sweaty/confused, take about 15 g fast carbohydrate and recheck in 15 minutes. If high, hydrate and avoid sugary food.',
      crit:'Confirm with a repeat test. Treat low glucose immediately with fast carbohydrate. Contact the flight surgeon for any critical value.'
    }
  },
  temp:{
    label:'Body temperature', unit:'\u00b0C', icon:'\ud83c\udf21', band:[36.1,37.2],
    val:r=>r.temp, series:r=>r.temp, complete:r=>isNum(r.temp),
    level:r=>{const v=r.temp; if(v>=38||v<35) return 'crit'; if(v>=37.3||v<36.0) return 'warn'; return 'ok';},
    ranges:'Nominal 36.1-37.2 \u00b0C. Attention 37.3-37.9 or <36.0. Critical >=38.0 or <35.0.',
    how:'Use the oral or ear thermometer at rest. Wait 15 minutes after exercise or hot drinks and avoid warm vents.',
    why:'Fever can signal infection. Spaceflight alters immune function and closed habitats spread germs. Without convection, body heat also builds up around you in microgravity.',
    tips:{
      ok:'Normal. Keep surfaces clean and wash/wipe hands regularly.',
      warn:'Recheck in 30-60 minutes. Check cabin temperature and ventilation. Rest and hydrate.',
      crit:'Possible fever. Limit contact with crewmates, hydrate and contact the flight surgeon.'
    }
  },
  spo2:{
    label:'Blood oxygen', unit:'%', icon:'\ud83e\udec1', band:[95,100],
    val:r=>r.spo2, series:r=>r.spo2, complete:r=>isNum(r.spo2),
    level:r=>{const v=r.spo2; if(v<92) return 'crit'; if(v<95) return 'warn'; return 'ok';},
    ranges:'Nominal 95-100%. Attention 92-94%. Critical <92%.',
    how:'Warm your hands, clip the pulse oximeter on a still fingertip and wait about 10 s for a steady number. Remove nail polish.',
    why:'A closed habitat can develop atmosphere problems (low O\u2082 or high CO\u2082), and lunar/Martian dust irritates lungs. Low SpO\u2082 is an early flag.',
    tips:{
      ok:'Normal oxygen saturation.',
      warn:'Re-measure with warm, still hands. Check cabin O\u2082/CO\u2082 readouts and ventilation. Take slow deep breaths.',
      crit:'Check atmosphere alarms, move to a well-ventilated module and contact the crew medical officer and flight surgeon.'
    }
  },
  sleep:{
    label:'Sleep', unit:'h', icon:'\ud83d\ude34', band:[7,9],
    val:r=>r.sleep, series:r=>r.sleep, complete:r=>isNum(r.sleep),
    level:r=>{const v=r.sleep; if(v<5) return 'crit'; if(v<7||v>9) return 'warn'; return 'ok';},
    ranges:'Nominal 7-9 h. Attention 5-6.9 h or >9 h. Critical <5 h.',
    how:'Log the hours you actually slept (wearable or your own estimate) and note interruptions.',
    why:'Light cycles, noise, schedule shifts and stress cut sleep in orbit. Poor sleep hurts mood, memory and reaction time, which matters for critical tasks.',
    tips:{
      ok:'Good sleep. Keep a consistent schedule.',
      warn:'Dim lights 1 hour before bed, reduce noise, use eye mask/earplugs and keep a fixed sleep schedule. Tell the crew if the schedule is the cause.',
      crit:'Severe sleep loss raises error risk. Notify the crew/flight surgeon and avoid critical tasks (EVA, robotics) until rested.'
    }
  },
  mood:{
    label:'Mood', unit:'/5', icon:'\ud83e\udde0', band:[4,5],
    val:r=>r.mood, series:r=>r.mood, complete:r=>isNum(r.mood),
    level:r=>{const v=r.mood; if(v<=1) return 'crit'; if(v<=3) return 'warn'; return 'ok';},
    ranges:'Self-rating 1-5. Nominal 4-5. Attention 2-3. Critical 1.',
    how:'Rate how you feel from 1 (very low) to 5 (great). Be honest - trends matter more than any single day.',
    why:'Isolation, confinement and distance from home affect behavioral health. Mood often drops before other signs appear.',
    tips:{
      ok:'Good mood. Keep your routines and social time.',
      warn:'Schedule a call with family or friends, share a meal with crew and try a relaxation routine. If it lasts several days, talk to the crew medical officer or behavioral health support.',
      crit:'Very low mood. Reach out to a crewmate now and contact the flight surgeon or behavioral health support.'
    }
  },
  exercise:{
    label:'Exercise', unit:'min', icon:'\ud83c\udfcb', band:[120,180],
    val:r=>r.exercise, series:r=>r.exercise, complete:r=>isNum(r.exercise),
    level:r=>{const v=r.exercise; if(v<45) return 'crit'; if(v<120) return 'warn'; return 'ok';},
    ranges:'Nominal >=120 min/day (ISS crews train about 2 h/day). Attention 45-119. Critical <45.',
    how:'Add today\'s minutes of aerobic and resistive exercise (treadmill, cycle, resistive device).',
    why:'Without gravity loading, bones and muscles weaken and the heart deconditions. Exercise is the main countermeasure.',
    tips:{
      ok:'Target met. Keep mixing aerobic and resistive work.',
      warn:'Add a resistive session today. Skipped exercise speeds bone and muscle loss.',
      crit:'Very low exercise. Protect time for training, since bone loss accumulates quickly. Flag any barrier to the crew or flight surgeon.'
    }
  }
};

const SYMPTOMS = {
  headache:'Headache', nausea:'Nausea', vision:'Blurred vision', dizziness:'Dizziness',
  pain:'Muscle/joint pain', cough:'Cough/congestion', anxiety:'Anxiety/irritability'
};
const SYM2PART = {headache:'brain', anxiety:'brain', vision:'eyes', cough:'lungs', pain:'muscle', dizziness:'heart', nausea:'gut'};

const MOODS = ['', '1 - Very low', '2 - Low', '3 - Neutral', '4 - Good', '5 - Great'];

/* Spaceflight hazards (NASA HRP) */
const HAZ = {
  radiation:{label:'Space radiation', link:'Immune function, long-term cancer and CNS risk'},
  isolation:{label:'Isolation & confinement', link:'Mood, sleep, team cohesion'},
  distance:{label:'Distance from Earth', link:'Medical autonomy, delayed support'},
  gravity:{label:'Gravity fields', link:'Bones, muscles, heart, fluid shift, vision'},
  closed:{label:'Hostile closed environment', link:'Air quality, noise, microbes, nutrition'}
};

/* Environments - hazard intensity 0-5 is an illustrative estimate */
const ENVS = {
  iss:{name:'Space station (LEO)', gravity:'Microgravity', h:{radiation:2,isolation:2,distance:1,gravity:5,closed:4},
       delay:'Comms delay: about 0 s. Real-time contact with flight surgeons (short gaps possible).',
       escalate:'Contact flight surgeons right away. Real-time support is available.'},
  lunar:{name:'Lunar base', gravity:'1/6 g', h:{radiation:4,isolation:3,distance:2,gravity:3,closed:4},
       delay:'Comms delay: about 1.3 s one-way. Near real-time support.',
       escalate:'Contact flight surgeons. Short delay, but plan for brief gaps. Lunar dust is a lung and eye irritant.'},
  transit:{name:'Mars transit', gravity:'Microgravity', h:{radiation:5,isolation:5,distance:5,gravity:5,closed:5},
       delay:'Comms delay: up to ~22 min one-way. Messages are not real-time.',
       escalate:'Do not wait for a reply. Follow onboard medical protocols first, then send the report to flight surgeons.'},
  mars:{name:'Mars surface base', gravity:'0.38 g', h:{radiation:4,isolation:5,distance:5,gravity:2,closed:4},
       delay:'Comms delay: roughly 3-22 min one-way depending on planet positions.',
       escalate:'Do not wait for a reply. Follow onboard medical protocols first, then send the report to flight surgeons.'}
};

/* Body regions */
const BODY = {
  brain:{name:'Brain & behavior', metrics:['mood','sleep'], hazards:['isolation','distance','radiation'],
    fn:'Controls thinking, mood, decision-making and the sleep-wake cycle.',
    effects:'Isolation, confinement and disrupted light cycles can degrade sleep, mood and performance. Cosmic radiation is also studied as a long-term risk to the nervous system.',
    actions:['Keep a fixed sleep schedule and dim lights before bed','Schedule calls home and shared crew meals','Report several days of low mood early']},
  eyes:{name:'Eyes', metrics:[], hazards:['gravity'],
    fn:'Vision and visual processing.',
    effects:'Fluid shifting toward the head is linked to Spaceflight Associated Neuro-ocular Syndrome (SANS): optic disc swelling, eyeball flattening and vision changes.',
    actions:['Report blurred vision or near-vision changes promptly','Complete scheduled eye checks','Follow exercise and fluid protocols']},
  heart:{name:'Heart & circulation', metrics:['hr','bp'], hazards:['gravity','radiation'],
    fn:'Pumps blood through the body and regulates blood pressure.',
    effects:'Fluid shifts and the lack of gravity load deconditions the heart and changes BP and heart rate. Radiation is studied for long-term vascular effects.',
    actions:['Do daily aerobic exercise','Stay hydrated and limit very salty food','Log resting HR and BP on schedule']},
  lungs:{name:'Lungs & breathing', metrics:['spo2'], hazards:['closed'],
    fn:'Exchange oxygen and carbon dioxide.',
    effects:'Closed habitats can build up CO\u2082 or dust. Lunar and Martian dust can irritate the lungs and eyes.',
    actions:['Check cabin O\u2082/CO\u2082 readouts','Keep ventilation and filters clean','Report persistent cough or breathlessness']},
  bones:{name:'Bones', metrics:['exercise'], hazards:['gravity'],
    fn:'Support the body and store calcium.',
    effects:'Without gravity loading, bone density in weight-bearing areas can drop by roughly 1-1.5% per month on long missions (typical figure reported by NASA HRP; verify before citing).',
    actions:['Do resistive exercise (e.g. the resistive device) daily','Get enough calcium and vitamin D','Follow bone-density monitoring plans']},
  muscle:{name:'Muscles', metrics:['exercise'], hazards:['gravity'],
    fn:'Movement, posture and strength.',
    effects:'Unloaded muscles shrink and weaken, especially in the legs and back. Reduced strength is a risk for surface operations and landing.',
    actions:['Combine aerobic and resistive training','Eat enough protein and calories','Report ongoing muscle or joint pain']},
  gut:{name:'Metabolism & immune system', metrics:['glucose','temp'], hazards:['radiation','closed','isolation'],
    fn:'Digestion, energy balance and defence against infection.',
    effects:'Spaceflight alters immune function and can reactivate dormant viruses. Diet, stress and low activity affect glucose. Closed spaces spread germs.',
    actions:['Keep meals and nutrition on plan','Clean shared surfaces and wash/wipe hands','Report fever, rash or ongoing digestive problems']}
};

/* ============================================================
   2. STATE & STORAGE
   ============================================================ */
const KEY = 'vitalorbit_v1';
const isNum = v => typeof v === 'number' && !isNaN(v);
const pad = n => String(n).padStart(2,'0');
const dstr = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayStr = () => dstr(new Date());
const addDays = (s,n) => { const d = new Date(s+'T00:00:00'); d.setDate(d.getDate()+n); return dstr(d); };
const daysBetween = (a,b) => Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}

/* 30 days of fake data ending yesterday, with a decline in the last 6 days (demo story) */
function makeMock(){
  const rnd = mulberry(42), n = (c,s)=>c+(rnd()-.5)*2*s, out = [], start = addDays(todayStr(),-30);
  for(let i=0;i<30;i++){
    const late = Math.max(0,i-24);
    let mood = late>=4 ? 2 : late>=2 ? 3 : Math.round(n(4.2,.5));
    mood = Math.min(5,Math.max(1,mood));
    out.push({
      date:addDays(start,i),
      hr:Math.round(n(62,3)+late*2.6),
      sys:Math.round(n(115,4)+late*2),
      dia:Math.round(n(73,3)+late*1.2),
      glucose:Math.round(n(88,6)),
      temp:+n(36.6,.2).toFixed(1),
      spo2:Math.min(100,Math.round(n(97.3,.7))),
      sleep:+(n(7.3,.5)-late*.35).toFixed(1),
      mood,
      exercise:Math.round(n(130,15)-late*14),
      symptoms: late>=4 ? ['headache'] : []
    });
  }
  out[28].spo2 = 95; out[29].spo2 = 94;
  return out;
}

function load(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY));
    if(s && Array.isArray(s.records) && s.records.length) return s;
  }catch(e){}
  return {env:'iss', records:makeMock()};
}
function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

let state = load();
let selectedPart = 'heart';
let chart = null;

const latest = () => state.records[state.records.length-1];

/* ============================================================
   3. ANALYSIS: trends, readiness, streak, badges
   ============================================================ */
const avg = (arr,f) => arr.reduce((s,r)=>s+f(r),0)/arr.length;

function analyze(){
  const R = state.records, out = [];
  if(R.length < 3) return out;
  const last3 = R.slice(-3), last = R[R.length-1];
  const base = R.length > 8 ? R.slice(0,-5) : R.slice(0,3);

  // 1. Fatigue / behavioral health pattern
  if(avg(last3,r=>r.sleep) < 6.5 && avg(last3,r=>r.mood) <= 3 && avg(last3,r=>r.hr) > avg(base,r=>r.hr)+6){
    out.push({level:'crit', title:'Fatigue and behavioral-health pattern',
      text:'3-day average: low sleep ('+avg(last3,r=>r.sleep).toFixed(1)+' h), low mood and resting HR above your baseline. Combined, this is a stronger signal than any single reading. Rest, reduce workload where possible and talk to the crew medical officer or flight surgeon.'});
  }
  // 2. Blood pressure
  if(last3.every(r=>r.sys>=130||r.dia>=80)){
    out.push({level:'warn', title:'Blood pressure elevated 3 days in a row',
      text:'Review sodium, hydration and stress. Report the trend to the flight surgeon.'});
  }
  // 3. SpO2 + symptoms -> cabin atmosphere
  if(last.spo2 <= 95 && (last.symptoms||[]).some(s=>s==='headache'||s==='dizziness')){
    out.push({level:'warn', title:'Possible cabin atmosphere issue',
      text:'Lower SpO\u2082 together with headache or dizziness can point to low O\u2082 or high CO\u2082. Check atmosphere readouts and ventilation, and report if confirmed.'});
  }
  // 4. Exercise
  const w = R.slice(-7);
  if(avg(w,r=>r.exercise) < 90){
    out.push({level:'warn', title:'Exercise below target this week',
      text:'7-day average is '+Math.round(avg(w,r=>r.exercise))+' min/day (target about 120). Bone and muscle loss accelerate without regular loading.'});
  }
  // 5. Sleep debt
  if(last3.every(r=>r.sleep<6.5)){
    out.push({level:'warn', title:'Sleep debt building',
      text:'Under 6.5 h for 3 nights in a row. Protect sleep time and review lighting and noise.'});
  }
  return out;
}

function readiness(){
  const r = latest(); let s = 100;
  Object.values(METRICS).forEach(m => { const l = m.level(r); s -= l==='crit'?14 : l==='warn'?5 : 0; });
  analyze().forEach(a => s -= a.level==='crit'?8:4);
  return Math.max(0, Math.min(100, Math.round(s)));
}

function streak(){
  const dates = new Set(state.records.map(r=>r.date));
  let d = todayStr(); if(!dates.has(d)) d = addDays(d,-1);
  let n = 0; while(dates.has(d)){ n++; d = addDays(d,-1); }
  return n;
}

function badges(){
  const R = state.records, w = R.slice(-7);
  return [
    {icon:'\ud83d\ude80', name:'First log', got:R.length>=1},
    {icon:'\ud83d\udd25', name:'7-day streak', got:streak()>=7},
    {icon:'\ud83d\udcca', name:'14 check-ins', got:R.length>=14},
    {icon:'\ud83d\ude34', name:'Sleep guardian', got:w.length>=7 && avg(w,r=>r.sleep)>=7},
    {icon:'\ud83c\udfcb', name:'Iron crew', got:w.filter(r=>r.exercise>=120).length>=5}
  ];
}

function xpInfo(){
  const b = badges().filter(x=>x.got).length;
  const xp = state.records.length*20 + streak()*10 + b*50;
  return {xp, lvl:Math.floor(xp/200)+1};
}

/* ============================================================
   4. RENDERING
   ============================================================ */
function spark(values){
  const w=200,h=34; if(values.length<2) return '';
  const mn=Math.min(...values), mx=Math.max(...values), rg=(mx-mn)||1;
  const pts = values.map((v,i)=>(i/(values.length-1)*w).toFixed(1)+','+(h-3-((v-mn)/rg)*(h-6)).toFixed(1)).join(' ');
  return '<svg class="spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><polyline points="'+pts+'"/></svg>';
}

function renderHeader(){
  const first = state.records[0].date;
  $('#mday').textContent = daysBetween(first, todayStr())+1;
  const x = xpInfo(); $('#xp').textContent = x.xp; $('#lvl').textContent = x.lvl;
  $('#env').innerHTML = Object.entries(ENVS).map(([k,e])=>'<option value="'+k+'"'+(k===state.env?' selected':'')+'>'+e.name+'</option>').join('');
}

function renderDashboard(){
  const r = latest(), env = ENVS[state.env], alerts = analyze();

  // banner when today's check-in is missing
  $('#banner').innerHTML = r.date < todayStr()
    ? '<div class="alert st-warn"><b>Daily check-in due.</b> No readings logged today. <button class="btn" style="margin-left:10px;padding:5px 14px" onclick="showView(\'checkin\')">Log now</button></div>' : '';

  // trend alerts + critical single readings
  let html = '';
  Object.entries(METRICS).forEach(([k,m])=>{
    if(m.level(r)==='crit') html += '<div class="alert st-crit"><b>Critical: '+m.label+' ('+m.val(r)+' '+m.unit+').</b> '+m.tips.crit+'</div>';
  });
  alerts.forEach(a => html += '<div class="alert st-'+a.level+'"><b>'+a.title+'.</b> '+a.text+'</div>');
  $('#alerts').innerHTML = html;

  // readiness ring
  const sc = readiness(), lvl = sc>=80?'ok':sc>=60?'warn':'crit';
  $('#ring').className = 'ring st-'+lvl;
  $('#score').textContent = sc;
  requestAnimationFrame(()=>{ $('#ringfg').style.strokeDashoffset = 326.7*(1-sc/100); });
  $('#streak').textContent = streak();
  $('#badges').innerHTML = badges().map(b=>'<span class="badge'+(b.got?' got':'')+'" title="'+(b.got?'Earned':'Locked')+'">'+b.icon+' '+b.name+'</span>').join('');

  // hazards
  $('#envname').textContent = '- '+env.name;
  $('#hazards').innerHTML = Object.entries(HAZ).map(([k,h])=>
    '<div class="haz"><div class="hl"><span>'+h.label+(k==='gravity'?' &middot; '+env.gravity:'')+'</span><span class="mono">'+env.h[k]+'/5</span></div>'+
    '<div class="bar"><i style="width:'+env.h[k]*20+'%"></i></div><small>'+h.link+'</small></div>').join('');
  $('#delay').textContent = env.delay;

  // escalation
  const worst = Math.max(...Object.values(METRICS).map(m=>LV[m.level(r)]), ...alerts.map(a=>LV[a.level]));
  const el = ['ok','warn','crit'][worst];
  $('#escalate').className = 'panel st-'+el;
  $('#escalate').style.borderColor = 'var(--c)';
  $('#escalate').innerHTML = '<h2>Medical escalation</h2>'+
    '<p><span class="pill">'+LEVEL_LABEL[el]+'</span> '+
    (worst===2 ? '<b>Contact the crew medical officer and flight surgeon now.</b> ' : worst===1 ? 'Monitor closely and report if it persists. ' : 'No action needed. Continue routine monitoring. ')+
    env.escalate+'</p>'+
    '<button class="btn ghost" onclick="exportReport()">Export report for flight surgeon</button>';

  // vitals cards
  $('#latestdate').textContent = '- '+r.date;
  const recent = state.records.slice(-14);
  $('#vitals').innerHTML = Object.entries(METRICS).map(([k,m])=>{
    const l = m.level(r);
    return '<article class="panel vital st-'+l+'"><div class="vh"><b>'+m.icon+' '+m.label+'</b><span class="pill">'+LEVEL_LABEL[l]+'</span></div>'+
      '<div class="vv mono">'+m.val(r)+'<small>'+m.unit+'</small></div>'+
      spark(recent.map(m.series))+
      '<details'+(l!=='ok'?' open':'')+'><summary>What should I do?</summary><p>'+m.tips[l]+'</p></details></article>';
  }).join('');
}

/* ---- check-in form ---- */
function initForm(){
  $$('[data-help]').forEach(p => p.textContent = 'How: '+METRICS[p.dataset.help].how+' Why: '+METRICS[p.dataset.help].why);
  $('#syms').innerHTML = Object.entries(SYMPTOMS).map(([k,l])=>'<label><input type="checkbox" value="'+k+'"> '+l+'</label>').join('');
  $('#moodlabel').textContent = MOODS[3];
  $('#f-mood').addEventListener('input', e=>{ $('#moodlabel').textContent = MOODS[e.target.value]; liveCheck(); });
  $('#form').addEventListener('input', liveCheck);
  $('#save').addEventListener('click', saveCheckin);
  $('#reset').addEventListener('click', ()=>{
    if(confirm('Reset to demo data? Your saved readings will be replaced.')){ state = {env:state.env, records:makeMock()}; persist(); renderAll(); toast('Demo data restored'); }
  });
}

function readForm(){
  const num = id => { const v = $(id).value; return v===''?NaN:parseFloat(v); };
  return {
    date:todayStr(), hr:num('#f-hr'), sys:num('#f-sys'), dia:num('#f-dia'), glucose:num('#f-glucose'),
    temp:num('#f-temp'), spo2:num('#f-spo2'), sleep:num('#f-sleep'), mood:num('#f-mood'), exercise:num('#f-exercise'),
    symptoms:$$('#syms input:checked').map(i=>i.value)
  };
}

function liveCheck(){
  const r = readForm();
  $$('.field[data-m]').forEach(f=>{
    const m = METRICS[f.dataset.m];
    f.classList.remove('st-ok','st-warn','st-crit');
    const live = f.querySelector('.live');
    if(m.complete(r)){ const l = m.level(r); f.classList.add('st-'+l); live.textContent = LEVEL_LABEL[l]+': '+m.tips[l]; }
    else live.textContent = '';
  });
}

function saveCheckin(){
  const r = readForm();
  const missing = Object.entries(METRICS).filter(([k,m])=>!m.complete(r)).map(([k,m])=>m.label);
  if(missing.length){ toast('Please fill in: '+missing.join(', ')); return; }
  const i = state.records.findIndex(x=>x.date===r.date);
  if(i>=0) state.records[i] = r; else state.records.push(r);
  state.records.sort((a,b)=>a.date.localeCompare(b.date));
  persist();
  $('#form').reset(); $('#moodlabel').textContent = MOODS[3]; liveCheck();
  renderAll(); showView('dashboard'); toast('Check-in saved');
}

/* ---- body map ---- */
function partLevel(k){
  const r = latest(); let lv = 0;
  BODY[k].metrics.forEach(m => lv = Math.max(lv, LV[METRICS[m].level(r)]));
  (r.symptoms||[]).forEach(s => { if(SYM2PART[s]===k) lv = Math.max(lv,1); });
  return ['ok','warn','crit'][lv];
}

function renderBody(){
  $$('.part').forEach(el=>{
    const k = el.dataset.part;
    el.classList.remove('st-ok','st-warn','st-crit','sel');
    el.classList.add('st-'+partLevel(k));
    if(k===selectedPart) el.classList.add('sel');
  });
  $('#partlist').innerHTML = Object.entries(BODY).map(([k,b])=>
    '<button class="st-'+partLevel(k)+(k===selectedPart?' sel':'')+'" data-part="'+k+'">'+b.name+'</button>').join('');

  const b = BODY[selectedPart], r = latest(), lv = partLevel(selectedPart);
  const syms = (r.symptoms||[]).filter(s=>SYM2PART[s]===selectedPart).map(s=>SYMPTOMS[s]);
  $('#partinfo').innerHTML =
    '<h3>'+b.name+' <span class="pill st-'+lv+'">'+LEVEL_LABEL[lv]+'</span></h3>'+
    '<p><b>What it does:</b> '+b.fn+'</p>'+
    '<p><b>How spaceflight affects it:</b> '+b.effects+'</p>'+
    '<div>'+b.hazards.map(h=>'<span class="tag">'+HAZ[h].label+'</span>').join('')+'</div>'+
    (b.metrics.length ? '<p><b>Linked readings:</b></p><ul>'+b.metrics.map(m=>{const l=METRICS[m].level(r); return '<li>'+METRICS[m].label+': <b class="mono" style="color:'+LEVEL_COLOR[l]+'">'+METRICS[m].val(r)+' '+METRICS[m].unit+'</b> ('+LEVEL_LABEL[l]+')</li>';}).join('')+'</ul>' : '')+
    (syms.length ? '<p><b>Reported symptoms:</b> '+syms.join(', ')+'</p>' : '')+
    '<p><b>What you can do:</b></p><ul>'+b.actions.map(a=>'<li>'+a+'</li>').join('')+'</ul>';
  update3D();
}

/* ---- trends chart ---- */
const bandPlugin = {
  id:'band',
  beforeDatasetsDraw(c){
    const b = c.options.plugins.band; if(!b) return;
    const {ctx, chartArea:a, scales:{y}} = c; if(!a) return;
    const top = Math.max(a.top, y.getPixelForValue(b.hi)), bot = Math.min(a.bottom, y.getPixelForValue(b.lo));
    if(bot<=top) return;
    ctx.save(); ctx.fillStyle = 'rgba(61,220,151,.12)'; ctx.fillRect(a.left, top, a.right-a.left, bot-top); ctx.restore();
  }
};

function renderTrends(){
  const key = $('#tmetric').value, days = parseInt($('#trange').value,10), m = METRICS[key];
  const recs = state.records.slice(-days);
  const sets = [{
    label:m.label+' ('+m.unit+')', data:recs.map(m.series), borderColor:'#38e1ff', backgroundColor:'#38e1ff',
    tension:.3, pointRadius:5, pointBackgroundColor:recs.map(r=>LEVEL_COLOR[m.level(r)])
  }];
  if(m.series2) sets.push({label:'Diastolic', data:recs.map(m.series2), borderColor:'#8a6bff', backgroundColor:'#8a6bff', tension:.3, pointRadius:3});
  if(key==='bp') sets[0].label = 'Systolic';
  if(chart) chart.destroy();
  if(typeof Chart === 'undefined'){ $('.chartbox').innerHTML = '<p>Chart library could not load (check your connection).</p>'; return; }
  chart = new Chart($('#chart'), {
    type:'line',
    data:{labels:recs.map(r=>r.date.slice(5)), datasets:sets},
    plugins:[bandPlugin],
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:sets.length>1, labels:{color:'#e6ecff'}}, band:{lo:m.band[0], hi:m.band[1]}},
      scales:{
        x:{ticks:{color:'#8d9ac8'}, grid:{color:'rgba(255,255,255,.05)'}},
        y:{ticks:{color:'#8d9ac8'}, grid:{color:'rgba(255,255,255,.05)'}}
      }
    }
  });
}

/* ---- learn ---- */
function renderLearn(){
  $('#learncards').innerHTML = Object.values(METRICS).map(m=>
    '<div class="panel"><h3>'+m.icon+' '+m.label+'</h3>'+
    '<p><b>How to measure:</b> '+m.how+'</p>'+
    '<p><b>Why it matters in space:</b> '+m.why+'</p>'+
    '<p><small>'+m.ranges+'</small></p></div>').join('');
}

/* ---- export ---- */
function exportReport(){
  const r = latest(), env = ENVS[state.env];
  const lines = ['VITALORBIT - CREW HEALTH REPORT','Date: '+r.date,'Environment: '+env.name,'Mission day: '+(daysBetween(state.records[0].date,r.date)+1),'',
    'LATEST READINGS'];
  Object.values(METRICS).forEach(m => lines.push(m.label+': '+m.val(r)+' '+m.unit+' ['+LEVEL_LABEL[m.level(r)]+']'));
  lines.push('Symptoms: '+((r.symptoms||[]).map(s=>SYMPTOMS[s]).join(', ')||'none reported'),'','TREND ALERTS');
  const al = analyze();
  if(al.length) al.forEach(a=>lines.push('- ['+a.level.toUpperCase()+'] '+a.title+': '+a.text)); else lines.push('- none');
  lines.push('','Readiness score: '+readiness()+'/100','','Prototype decision-support output. Not a diagnosis.');
  const url = URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));
  const a = document.createElement('a'); a.href = url; a.download = 'crew-health-report-'+r.date+'.txt'; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   5. NAVIGATION, EVENTS, INIT
   ============================================================ */
function showView(v){
  $$('.view').forEach(s => s.hidden = s.id !== 'v-'+v);
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view===v));
  if(v==='trends') renderTrends();
  if(v==='body'){ renderBody(); init3D(); start3D(); } else stop3D();
  window.scrollTo({top:0});
}

let toastTimer;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

function renderAll(){ renderHeader(); renderDashboard(); renderBody(); renderLearn(); if(!$('#v-trends').hidden) renderTrends(); }

/* ============================================================
   3D BODY MAP (Three.js). Falls back to the 2D SVG map if
   Three.js or WebGL is unavailable. Same regions, same status colours.
   ============================================================ */
const B3 = {ready:false, failed:false, running:false, parts:{}, pickables:[], hover:null,
            rotY:.5, rotX:.08, dist:8.2, lastTouch:0, last:0, moved:0, pinch:0, ptrs:new Map()};
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

function init3D(){
  if(B3.ready || B3.failed) return;
  const host = $('#body3d');
  try{
    if(typeof THREE === 'undefined') throw new Error('Three.js not loaded');
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    host.insertBefore(renderer.domElement, host.firstChild);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    scene.add(new THREE.AmbientLight(0x8899ff, .75));
    const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(3,6,6); scene.add(key);
    const rim = new THREE.PointLight(0x8a6bff, 1.3, 30); rim.position.set(-5,3,-5); scene.add(rim);
    const figure = new THREE.Group(); scene.add(figure);

    /* one material per region so status colour/glow applies to the whole region */
    const opac = {brain:.9, eyes:.95, heart:.95, lungs:.75, gut:.75, bones:.9, muscle:.3};
    Object.keys(BODY).forEach(k=>{
      B3.parts[k] = {meshes:[], level:'ok', mat:new THREE.MeshStandardMaterial({
        color:0x3ddc97, emissive:0x3ddc97, emissiveIntensity:.35, roughness:.45, metalness:.1,
        transparent:true, opacity:opac[k], depthWrite:k!=='muscle'})};
    });
    const add = (k, geo, pos, o={}) => {
      const m = new THREE.Mesh(geo, B3.parts[k].mat);
      m.position.set(pos[0],pos[1],pos[2]);
      if(o.scale) m.scale.set(o.scale[0],o.scale[1],o.scale[2]);
      if(o.rot) m.rotation.set(o.rot[0],o.rot[1],o.rot[2]);
      m.userData.part = k; m.userData.base = m.scale.clone();
      figure.add(m); B3.parts[k].meshes.push(m); B3.pickables.push(m);
      return m;
    };

    /* holographic body shell (not clickable) */
    const ghost = new THREE.MeshBasicMaterial({color:0x38e1ff, wireframe:true, transparent:true, opacity:.10});
    const shell = (geo, pos, sc) => { const m = new THREE.Mesh(geo, ghost); m.position.set(pos[0],pos[1],pos[2]); if(sc) m.scale.set(sc[0],sc[1],sc[2]); figure.add(m); };
    shell(new THREE.SphereGeometry(.4,16,12), [0,4.1,0], [1,1.15,1]);            // head
    shell(new THREE.CylinderGeometry(.14,.16,.3,10), [0,3.6,0]);                  // neck
    shell(new THREE.CapsuleGeometry(.48,1.0,6,14), [0,2.55,0], [1,1,.65]);        // torso

    /* brain + eyes */
    add('brain', new THREE.SphereGeometry(.3,20,16), [0,4.2,-.02], {scale:[1,.85,1.05]});
    add('eyes',  new THREE.SphereGeometry(.06,12,10), [-.15,4.08,.33]);
    add('eyes',  new THREE.SphereGeometry(.06,12,10), [ .15,4.08,.33]);

    /* lungs */
    add('lungs', new THREE.SphereGeometry(.3,20,16), [-.27,2.85,-.02], {scale:[.7,1.4,.7]});
    add('lungs', new THREE.SphereGeometry(.3,20,16), [ .27,2.85,-.02], {scale:[.7,1.4,.7]});

    /* heart (extruded heart shape) */
    const hs = new THREE.Shape();
    hs.moveTo(0,-1);
    hs.bezierCurveTo(-1.2,-.1,-1.1,.9,-.5,.9);
    hs.bezierCurveTo(-.2,.9,0,.65,0,.4);
    hs.bezierCurveTo(0,.65,.2,.9,.5,.9);
    hs.bezierCurveTo(1.1,.9,1.2,-.1,0,-1);
    const hg = new THREE.ExtrudeGeometry(hs, {depth:.5, bevelEnabled:true, bevelSize:.15, bevelThickness:.15, bevelSegments:3});
    hg.center();
    add('heart', hg, [.09,2.85,.2], {scale:[.2,.2,.2], rot:[0,0,-.15]});

    /* metabolism / immune (gut) */
    add('gut', new THREE.SphereGeometry(.3,20,16), [0,1.95,.02], {scale:[1,1.3,.8]});

    /* bones: spine, ribs, pelvis, arm and leg bones */
    add('bones', new THREE.CylinderGeometry(.05,.05,2.0,8), [0,2.55,-.2]);
    [[3.3,.36],[3.1,.4],[2.9,.42],[2.7,.42],[2.5,.4]].forEach(r=>
      add('bones', new THREE.TorusGeometry(r[1],.03,6,28), [0,r[0],0], {rot:[Math.PI/2,0,0], scale:[1,.65,1]}));
    add('bones', new THREE.TorusGeometry(.32,.06,8,24), [0,1.7,0], {rot:[Math.PI/2,0,0], scale:[1,.7,1]});
    [-1,1].forEach(s=>{
      add('bones', new THREE.CylinderGeometry(.06,.06,1.7,8), [s*.3,.6,0]);
      add('bones', new THREE.CylinderGeometry(.045,.045,1.2,8), [s*.72,2.75,0], {rot:[0,0,s*.1]});
    });

    /* muscles: arms and legs */
    [-1,1].forEach(s=>{
      add('muscle', new THREE.CapsuleGeometry(.15,1.1,6,12), [s*.72,2.7,0], {rot:[0,0,s*.1]});
      add('muscle', new THREE.CapsuleGeometry(.2,1.5,6,12), [s*.3,.55,0]);
    });

    /* platform rings + scanner ring */
    const ringMat = (o) => new THREE.MeshBasicMaterial({color:0x38e1ff, transparent:true, opacity:o, side:THREE.DoubleSide});
    const plat1 = new THREE.Mesh(new THREE.RingGeometry(1.1,1.25,48), ringMat(.35));
    const plat2 = new THREE.Mesh(new THREE.RingGeometry(1.6,1.64,64), ringMat(.15));
    [plat1,plat2].forEach(m=>{ m.rotation.x = -Math.PI/2; m.position.y = -.45; scene.add(m); });
    const scan = new THREE.Mesh(new THREE.TorusGeometry(.95,.012,8,64), ringMat(.5));
    scan.rotation.x = Math.PI/2; scene.add(scan);

    Object.assign(B3, {renderer, scene, camera, figure, scan, ray:new THREE.Raycaster(), mouse:new THREE.Vector2(),
                       reduce:window.matchMedia('(prefers-reduced-motion: reduce)').matches});

    /* sizing (the view is hidden at start, so size when it becomes visible) */
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight; if(!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
    };
    if(window.ResizeObserver) new ResizeObserver(resize).observe(host);
    window.addEventListener('resize', resize);
    resize();

    /* interaction: drag = rotate, wheel/pinch = zoom, tap = select, hover = highlight */
    const el = renderer.domElement; el.style.touchAction = 'none';
    const pinchDist = () => { const p = [...B3.ptrs.values()]; return Math.hypot(p[0].x-p[1].x, p[0].y-p[1].y) || 1; };
    el.addEventListener('pointerdown', e=>{
      el.setPointerCapture(e.pointerId); B3.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
      B3.moved = 0; B3.lastTouch = performance.now(); el.style.cursor = 'grabbing';
      if(B3.ptrs.size === 2) B3.pinch = pinchDist();
    });
    el.addEventListener('pointermove', e=>{
      const p = B3.ptrs.get(e.pointerId);
      if(p){
        const dx = e.clientX-p.x, dy = e.clientY-p.y; p.x = e.clientX; p.y = e.clientY;
        B3.moved += Math.abs(dx)+Math.abs(dy); B3.lastTouch = performance.now();
        if(B3.ptrs.size === 1){ B3.rotY += dx*.01; B3.rotX = clamp(B3.rotX+dy*.006, -.6, .6); }
        else if(B3.ptrs.size === 2){ const d = pinchDist(); B3.dist = clamp(B3.dist*(B3.pinch/d), 5, 13); B3.pinch = d; }
      } else {
        const k = pick3D(e);
        if(k !== B3.hover){ B3.hover = k; el.style.cursor = k ? 'pointer' : 'grab'; updateLabel(); }
      }
    });
    const up = e => {
      const had = B3.ptrs.delete(e.pointerId);
      el.style.cursor = B3.hover ? 'pointer' : 'grab'; B3.lastTouch = performance.now();
      if(had && e.type === 'pointerup' && B3.moved < 6){
        const k = pick3D(e); if(k){ selectedPart = k; renderBody(); }
      }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', ()=>{ if(B3.hover){ B3.hover = null; updateLabel(); } });
    el.addEventListener('wheel', e=>{ e.preventDefault(); B3.dist = clamp(B3.dist*(1+e.deltaY*.001), 5, 13); }, {passive:false});

    B3.ready = true;
    update3D();
  }catch(err){
    console.warn('3D body map unavailable, using 2D fallback:', err);
    B3.failed = true;
    host.style.display = 'none';
    $('#body').style.display = 'block';
  }
}

function pick3D(ev){
  const r = B3.renderer.domElement.getBoundingClientRect();
  B3.mouse.set(((ev.clientX-r.left)/r.width)*2-1, -((ev.clientY-r.top)/r.height)*2+1);
  B3.ray.setFromCamera(B3.mouse, B3.camera);
  const hits = B3.ray.intersectObjects(B3.pickables, false);
  if(!hits.length) return null;
  /* muscles wrap the limb bones, so prefer any non-muscle region the ray passes through */
  const h = hits.find(x=>x.object.userData.part !== 'muscle') || hits[0];
  return h.object.userData.part;
}

function updateLabel(){
  const lab = $('#label3d'); if(!lab) return;
  const k = B3.hover || selectedPart, lv = partLevel(k);
  lab.innerHTML = '<b>'+BODY[k].name+'</b> <span class="pill st-'+lv+'">'+LEVEL_LABEL[lv]+'</span>';
}

/* push current status colours into the 3D materials */
function update3D(){
  if(!B3.ready) return;
  Object.keys(B3.parts).forEach(k=>{
    const p = B3.parts[k], lv = partLevel(k), col = LEVEL_COLOR[lv];
    p.level = lv; p.mat.color.set(col); p.mat.emissive.set(col);
  });
  updateLabel();
}

function start3D(){
  if(!B3.ready || B3.running) return;
  B3.running = true; B3.last = 0; requestAnimationFrame(loop3D);
}
function stop3D(){ B3.running = false; }

function loop3D(t){
  if(!B3.running) return;
  requestAnimationFrame(loop3D);
  const time = t/1000, dt = B3.last ? Math.min(.05,(t-B3.last)/1000) : 0; B3.last = t;

  if(!B3.reduce && performance.now()-B3.lastTouch > 2500) B3.rotY += dt*.3;   // slow auto-rotate
  B3.figure.rotation.y = B3.rotY; B3.figure.rotation.x = B3.rotX;
  B3.camera.position.set(0, 2.3, B3.dist); B3.camera.lookAt(0, 2.1, 0);

  const hr = (latest() && latest().hr) || 70;
  const beat = Math.pow(Math.max(0, Math.sin(time*hr/60*Math.PI*2)), 10);       // heart beats at your logged HR
  Object.keys(B3.parts).forEach(k=>{
    const p = B3.parts[k], sel = k === selectedPart, hov = k === B3.hover;
    let e = .3;
    if(p.level === 'warn') e = .45 + .15*Math.sin(time*3);
    if(p.level === 'crit') e = .6 + .4*Math.sin(time*6);
    if(hov) e += .25;
    if(sel) e = Math.max(e,.9) + .2*Math.sin(time*4);
    p.mat.emissiveIntensity = e;
    const s = 1 + (sel ? .06 : 0) + (k==='heart' ? .14*beat : 0);
    p.meshes.forEach(m=> m.scale.copy(m.userData.base).multiplyScalar(s));
  });

  B3.scan.position.y = -.4 + ((time*.6) % 1)*5;
  B3.renderer.render(B3.scene, B3.camera);
}

/* ---- drifting starfield: slow parallax, like looking out of a station window ---- */
function initStarfield(){
  const c = document.getElementById('stars'); if(!c) return;
  const ctx = c.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 1;   // raise for faster drift
  let w, h, stars = [], last = performance.now();

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    c.width = w*dpr; c.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.round(w*h/5500);
    stars = Array.from({length:n}, ()=>{
      const z = Math.random();                       // depth: 0 = far, 1 = near
      return {x:Math.random()*w, y:Math.random()*h, z, r:.4+z*1.3, a:.3+z*.7,
              tw:Math.random()*6.28, ts:.5+Math.random()*1.5,
              col:Math.random()<.2 ? '159,216,255' : '255,255,255'};
    });
  }

  function frame(t){
    const dt = Math.min(.05, (t-last)/1000); last = t;
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      if(!reduce){
        s.x += (6+s.z*26)*SPEED*dt;                  // near stars move faster (parallax)
        s.y += (1.5+s.z*7)*SPEED*dt;
        if(s.x > w+2) s.x = -2;
        if(s.y > h+2) s.y = -2;
      }
      const tw = reduce ? 1 : .75 + .25*Math.sin(t/1000*s.ts + s.tw);
      ctx.fillStyle = 'rgba('+s.col+','+(s.a*tw).toFixed(3)+')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if(!reduce) requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', ()=>{ resize(); if(reduce) frame(performance.now()); });
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', ()=>{
  initStarfield();
  $('#nav').addEventListener('click', e=>{ const b = e.target.closest('button'); if(b) showView(b.dataset.view); });
  $('#env').addEventListener('change', e=>{ state.env = e.target.value; persist(); renderAll(); });
  $('#body').addEventListener('click', e=>{ const p = e.target.closest('.part'); if(p){ selectedPart = p.dataset.part; renderBody(); } });
  $('#partlist').addEventListener('click', e=>{ const b = e.target.closest('button'); if(b){ selectedPart = b.dataset.part; renderBody(); } });
  $('#tmetric').innerHTML = Object.entries(METRICS).map(([k,m])=>'<option value="'+k+'">'+m.label+'</option>').join('');
  $('#tmetric').addEventListener('change', renderTrends);
  $('#trange').addEventListener('change', renderTrends);
  initForm();
  renderAll();
});