/* ============================================================
   Flowdeck — single-file work planner & customizable dashboard
   Data is stored in localStorage. No dependencies.
   ============================================================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)};
const today=()=>iso(new Date());
const D=s=>new Date(s+'T00:00:00');
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const diffDays=(a,b)=>Math.round((D(a)-D(b))/864e5);
const weekStart=s=>{const d=D(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)};
const DOW=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const fmt=(s,o={month:'short',day:'numeric'})=>D(s).toLocaleDateString(undefined,o);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const ICONS={
 dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 board:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
 week:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 14v3M14 14v3"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="15" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>',
 timeline:'<path d="M4 6h9M8 12h12M4 18h7"/><circle cx="16" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="14" cy="18" r="1.5"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>', edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 check:'<path d="m5 12 5 5L20 7"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 stats:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>', list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>', pie:'<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M21 12A9 9 0 0 0 12 3"/>',
 bar:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
 flag:'<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>', grid4:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
 fire:'<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z"/>', target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 note:'<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>', bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', hourglass:'<path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 12v8M17 2c0 6-10 6-10 12v8"/>',
 link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>', heat:'<rect x="3" y="3" width="5" height="5"/><rect x="10" y="3" width="5" height="5"/><rect x="17" y="3" width="4" height="5"/><rect x="3" y="10" width="5" height="5"/><rect x="10" y="10" width="5" height="5"/><rect x="3" y="17" width="5" height="4"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>', copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 grip:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
 left:'<path d="m15 18-6-6 6-6"/>', right:'<path d="m9 18 6-6-6-6"/>', download:'<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>', upload:'<path d="M12 21V9m0 0-4 4m4-4 4 4M4 3h16"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', keyboard:'<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>', cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><rect x="9.5" y="9.5" width="5" height="5"/>', wand:'<path d="m15 4 5 5L8 21l-5-5z"/><path d="M14 5 19 10"/><path d="M4 2v4M2 4h4M20 15v4M18 17h4"/>', moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
};
const ic=(n,extra='')=>`<svg class="svg" ${extra} viewBox="0 0 24 24">${ICONS[n]||''}</svg>`;

const STATUSES=[{id:'backlog',name:'Backlog',c:'#8a92a6'},{id:'todo',name:'To do',c:'#4dabf7'},{id:'doing',name:'In progress',c:'#ff9f43'},{id:'review',name:'Review',c:'#b67cff'},{id:'done',name:'Done',c:'#2fd38a'}];
const PRI={1:{n:'Urgent',c:'#ff5c7a'},2:{n:'High',c:'#ff9f43'},3:{n:'Medium',c:'#4dabf7'},4:{n:'Low',c:'#8a92a6'}};
const ACCENTS=['#7c5cff','#4dabf7','#2fd38a','#ff9f43','#ff5c7a','#f06bd8','#14b8a6','#eab308'];
const PCOLORS=['#7c5cff','#4dabf7','#2fd38a','#ff9f43','#ff5c7a','#f06bd8','#14b8a6','#eab308','#64748b'];

/* ---------------- State ---------------- */
const KEY='flowdeck.v1';
let S;
function seed(){
  const t=today(), P=[
    {id:'p1',name:'Website redesign',color:'#7c5cff'},
    {id:'p2',name:'Q4 marketing',color:'#ff9f43'},
    {id:'p3',name:'Mobile app',color:'#2fd38a'},
    {id:'p4',name:'Operations',color:'#4dabf7'}];
  const mk=(title,project,status,pri,dueOff,est,startOff,tags=[],subs=[])=>({id:uid(),title,desc:'',project,status,priority:pri,due:dueOff==null?'':addDays(t,dueOff),start:startOff==null?'':addDays(t,startOff),est,tags,subtasks:subs.map(s=>({id:uid(),t:s,d:false})),created:Date.now(),completedAt:status==='done'?addDays(t,-Math.floor(Math.random()*5)):null});
  const tasks=[
    mk('Finalize homepage hero copy','p1','doing',1,0,2,-3,['copy'],['Draft 3 options','Review with team','Pick final']),
    mk('Design pricing page','p1','todo',2,2,4,0,['design']),
    mk('Set up analytics events','p1','review',2,1,3,-2,['dev']),
    mk('Accessibility audit','p1','backlog',3,9,5,5,['qa']),
    mk('Migrate blog to new CMS','p1','todo',3,6,6,2,['dev']),
    mk('Launch newsletter campaign','p2','doing',1,1,3,-4,['email'],['Write copy','Segment list','Schedule send']),
    mk('Record product demo video','p2','todo',2,4,4,1,['video']),
    mk('Plan webinar agenda','p2','backlog',3,12,2,8),
    mk('Social media calendar Dec','p2','todo',3,3,2,0,['social']),
    mk('Fix login crash on Android','p3','doing',1,-1,3,-3,['bug']),
    mk('Push notifications v2','p3','todo',2,5,8,1,['dev']),
    mk('App Store screenshots','p3','backlog',4,14,3,10,['design']),
    mk('Beta tester feedback review','p3','review',3,2,2,-1),
    mk('Monthly invoices','p4','todo',2,0,1,0,['admin']),
    mk('Renew software licenses','p4','backlog',3,8,1,6),
    mk('Team 1:1s','p4','todo',3,1,3,1,['people']),
    mk('Kick-off meeting notes','p1','done',3,-2,1,-3),
    mk('Competitor research','p2','done',2,-1,3,-5),
    mk('Wireframes v1','p1','done',2,-4,5,-8),
    mk('Update roadmap doc','p4','done',3,-1,1,-2)];
  const log={};for(let i=0;i<126;i++){const r=Math.random();log[addDays(t,-i)]=r<.25?0:Math.floor(r*7)}
  const hdone=n=>{const o={};for(let i=0;i<14;i++)if(Math.random()<n)o[addDays(t,-i)]=1;return o};
  return {
    v:1, tasks, projects:P, log,
    habits:[{id:uid(),name:'Deep work 2h',color:'#7c5cff',days:hdone(.7)},{id:uid(),name:'Inbox zero',color:'#4dabf7',days:hdone(.5)},{id:uid(),name:'Exercise',color:'#2fd38a',days:hdone(.6)}],
    goals:[{id:uid(),name:'Ship website v2',p:65,color:'#7c5cff'},{id:uid(),name:'1,000 newsletter subs',p:42,color:'#ff9f43'},{id:uid(),name:'App rating ≥ 4.6',p:80,color:'#2fd38a'}],
    notes:'• Ask design for pricing variants\n• Follow up with legal on T&Cs\n• Book team offsite venue',
    links:[{id:uid(),name:'Gmail',url:'https://mail.google.com'},{id:uid(),name:'GitHub',url:'https://github.com'},{id:uid(),name:'Calendar',url:'https://calendar.google.com'},{id:uid(),name:'Drive',url:'https://drive.google.com'}],
    focus:{},
    dashboards:defaultDashboards(), activeDash:'d1',
    settings:{name:'there',theme:'dark',accent:'#7c5cff',density:'cozy',capacity:8,work:25,brk:5,weekStartsMon:true},
    ui:{view:'dashboard',weekOf:weekStart(t),month:t.slice(0,7),tlStart:addDays(weekStart(t),-7),filter:{q:'',project:'',priority:''}}
  };
}
function W(type,w,h,cfg={}){return {id:uid(),type,w,h,cfg}}
function defaultDashboards(){
  return {
    d1:{name:'Overview',widgets:[W('greeting',8,2),W('kpis',4,2),W('today',4,4),W('workload',5,4),W('progress',3,4),W('matrix',6,5),W('deadlines',3,5),W('pomodoro',3,5),W('insights',6,4),W('trend',6,4),W('projects',6,4),W('heatmap',6,4)]},
    d2:{name:'Focus',widgets:[W('greeting',12,2),W('pomodoro',4,5),W('today',5,5),W('notes',3,5),W('habits',6,4),W('goals',6,4)]},
    d3:{name:'Personal',widgets:[W('countdown',4,2,{label:'Year end',date:new Date().getFullYear()+'-12-31'}),W('quickadd',8,2),W('links',6,3),W('habits',6,3),W('goals',6,4),W('notes',6,4)]}
  };
}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v)return s}catch(e){}return null}
let saveT;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},120)}
S=load()||seed();
S.ui=Object.assign({view:'dashboard',weekOf:weekStart(today()),month:today().slice(0,7),tlStart:addDays(weekStart(today()),-7),filter:{q:'',project:'',priority:''}},S.ui||{});
S.settings.weekends=S.settings.weekends||'no';
let editing=false;

/* ---------------- Helpers ---------------- */
const proj=id=>S.projects.find(p=>p.id===id);
const pcol=t=>proj(t.project)?.color||'#64748b';
const open=()=>S.tasks.filter(t=>t.status!=='done');
const isOver=t=>t.due&&t.status!=='done'&&t.due<today();
function dueChip(t){
  if(!t.due)return '';const d=diffDays(t.due,today());
  if(t.status==='done')return `<span class="chip">${fmt(t.due)}</span>`;
  if(d<0)return `<span class="chip red">${-d}d overdue</span>`;
  if(d===0)return `<span class="chip orange">Today</span>`;
  if(d===1)return `<span class="chip accent">Tomorrow</span>`;
  return `<span class="chip">${d<7?D(t.due).toLocaleDateString(undefined,{weekday:'short'}):fmt(t.due)}</span>`;
}
function setDone(t,on){
  const was=t.status==='done';if(was===on)return;
  t.status=on?'done':'todo';t.completedAt=on?today():null;
  const k=today();S.log[k]=Math.max(0,(S.log[k]||0)+(on?1:-1));
  save();if(on){toast('Task completed 🎉',()=>{setDone(t,false);render()});confetti()}
}
function toast(msg,undo){
  const el=document.createElement('div');el.className='toast';el.innerHTML=`<span>${esc(msg)}</span>${undo?'<button>Undo</button>':''}`;
  if(undo)el.querySelector('button').onclick=()=>{undo();el.remove()};
  $('#toasts').append(el);setTimeout(()=>el.remove(),4200);
}
function confetti(){
  const cols=[S.settings.accent,'#2fd38a','#ff9f43','#4dabf7','#f06bd8'];
  for(let i=0;i<28;i++){const c=document.createElement('div');c.className='confetti';c.style.background=cols[i%5];
    const x=innerWidth/2,y=innerHeight-80;c.style.left=x+'px';c.style.top=y+'px';document.body.append(c);
    const a=Math.random()*Math.PI-Math.PI,v=250+Math.random()*300;
    c.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*v}px,${Math.sin(a)*v+200}px) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:1100+Math.random()*500,easing:'cubic-bezier(.2,.6,.4,1)'}).onfinish=()=>c.remove()}
}
function applyTheme(){
  const r=document.documentElement;r.dataset.theme=S.settings.theme;r.dataset.density=S.settings.density;
  r.style.setProperty('--accent',S.settings.accent);
}

/* Quick-add natural language parser:  "Call Anna tomorrow !1 #web 2h +sales" */
function parseQuick(str){
  let t=' '+str+' ',due='',pri=3,project='',est=0,tags=[];const now=today();
  t=t.replace(/\s!([1-4])(?=\s)/,(m,p)=>{pri=+p;return ' '});
  t=t.replace(/\s(\d+(?:\.\d+)?)h(?=\s)/i,(m,h)=>{est=+h;return ' '});
  t=t.replace(/\s#(\S+)/g,(m,n)=>{const p=S.projects.find(p=>p.name.toLowerCase().replace(/\s+/g,'').startsWith(n.toLowerCase()));if(p&&!project){project=p.id;return ' '}tags.push(n);return ' '});
  t=t.replace(/\s\+(\S+)/g,(m,n)=>{tags.push(n);return ' '});
  t=t.replace(/\s(\d{4}-\d{2}-\d{2})(?=\s)/,(m,d)=>{due=d;return ' '});
  t=t.replace(/\s(today|tod)(?=\s)/i,()=>{due=now;return ' '});
  t=t.replace(/\s(tomorrow|tmr|tmrw)(?=\s)/i,()=>{due=addDays(now,1);return ' '});
  t=t.replace(/\snext week(?=\s)/i,()=>{due=addDays(weekStart(now),7);return ' '});
  t=t.replace(/\sin (\d+) ?d(?:ays?)?(?=\s)/i,(m,n)=>{due=addDays(now,+n);return ' '});
  t=t.replace(/\s(mon|tue|wed|thu|fri|sat|sun)[a-z]*(?=\s)/i,(m,d)=>{const idx=['sun','mon','tue','wed','thu','fri','sat'].indexOf(d.toLowerCase());let n=(idx-D(now).getDay()+7)%7||7;due=addDays(now,n);return ' '});
  return {title:t.replace(/\s+/g,' ').trim(),due,priority:pri,project,est,tags};
}
function addQuick(str,extra={}){
  const p=parseQuick(str);if(!p.title)return null;
  const t={id:uid(),title:p.title,desc:'',project:p.project||S.projects[0]?.id||'',status:'todo',priority:p.priority,due:p.due,start:p.due?'':'',est:p.est,tags:p.tags,subtasks:[],created:Date.now(),completedAt:null,...extra};
  S.tasks.push(t);save();toast('Added “'+t.title+'”'+(t.due?' · due '+fmt(t.due):''));return t;
}

/* ---------------- Widgets ---------------- */
const WIDGETS={
  greeting:{name:'Greeting & clock',icon:'sun',desc:'Live clock and summary of your day',w:8,h:2,noHead:true,render(){
    const h=new Date().getHours(),g=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
    const dueT=open().filter(t=>t.due===today()).length,ov=open().filter(isOver).length;
    return `<div class="greet"><div><h2>${g}, ${esc(S.settings.name)} 👋</h2><div class="muted">${new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})} · ${dueT} due today${ov?` · <span style="color:var(--red)">${ov} overdue</span>`:''}</div></div><div class="clock" data-clock></div></div>`}},
  kpis:{name:'Key stats',icon:'stats',desc:'Open, due today, overdue, done this week',w:4,h:2,render(){
    const ws=weekStart(today()),done=S.tasks.filter(t=>t.status==='done'&&t.completedAt>=ws).length;
    const ov=open().filter(isOver).length;
    return `<div class="kpis"><div class="kpi"><b>${open().length}</b><span>Open tasks</span></div><div class="kpi ${ov?'warn':''}"><b>${ov}</b><span>Overdue</span></div><div class="kpi"><b>${done}</b><span>Done this week</span></div><div class="kpi"><b>${S.focus[today()]||0}</b><span>Focus sessions</span></div></div>`}},
  today:{name:"Today's focus",icon:'list',desc:'Tasks due today and overdue, by priority',w:4,h:4,render(w){
    const L=open().filter(t=>t.due&&t.due<=today()).sort((a,b)=>a.priority-b.priority||a.due.localeCompare(b.due));
    return `${L.length?`<div class="list">${L.map(t=>taskLi(t)).join('')}</div>`:'<div class="empty">Nothing due — enjoy the calm ✨</div>'}
      <form class="inline-add" data-form="quick" data-extra='{"due":"${today()}"}'><input placeholder="Add for today… (!1 #project 2h)"></form>`}},
  pomodoro:{name:'Focus timer',icon:'timer',desc:'Pomodoro with session tracking',w:3,h:4,render(){
    return `<div class="pomo"><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="var(--panel2)" stroke-width="7" fill="none"/><circle data-pomo-ring cx="50" cy="50" r="44" stroke="var(--tint,var(--accent))" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><div class="time" data-pomo-time>25:00</div><div class="mode" data-pomo-mode>Focus</div></div>
      <div style="display:flex;gap:6px"><button class="btn sm primary" data-act="pomoToggle" data-pomo-btn>Start</button><button class="btn sm" data-act="pomoReset">Reset</button><button class="btn sm ghost" data-act="pomoSkip">Skip</button></div>
      <div class="small muted">${S.focus[today()]||0} sessions today · ${(S.focus[today()]||0)*S.settings.work} min</div></div>`},after(){pomoPaint()}},
  progress:{name:'Status breakdown',icon:'pie',desc:'Donut chart of tasks by status',w:3,h:4,render(){
    const tot=S.tasks.length||1;let off=0;const C=2*Math.PI*38;
    const segs=STATUSES.map(s=>{const n=S.tasks.filter(t=>t.status===s.id).length;const len=n/tot*C;const r=`<circle cx="50" cy="50" r="38" fill="none" stroke="${s.c}" stroke-width="13" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"/>`;off+=len;return n?r:''}).join('');
    const pct=Math.round(S.tasks.filter(t=>t.status==='done').length/tot*100);
    return `<div class="donut-wrap"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="var(--panel2)" stroke-width="13"/>${segs}<text x="50" y="49" text-anchor="middle" fill="var(--text)" font-size="17" font-weight="700">${pct}%</text><text x="50" y="62" text-anchor="middle" fill="var(--muted)" font-size="8">complete</text></svg>
      <div class="legend">${STATUSES.map(s=>`<div><i class="dot" style="background:${s.c}"></i>${s.name}<b>${S.tasks.filter(t=>t.status===s.id).length}</b></div>`).join('')}</div></div>`}},
  workload:{name:'Weekly workload',icon:'bar',desc:'Estimated hours per day vs. your capacity',w:5,h:4,render(){
    const days=[...Array(7)].map((_,i)=>addDays(today(),i));const cap=S.settings.capacity;
    const hrs=days.map(d=>open().filter(t=>t.due===d).reduce((a,t)=>a+(+t.est||0),0));
    const max=Math.max(cap*1.25,...hrs,1);
    return `<div class="bars"><div class="cap-line" style="bottom:calc(${cap/max*72}% + 23px)"><span>${cap}h capacity</span></div>${days.map((d,i)=>`<div class="col"><div class="b ${hrs[i]>cap?'over':''}" style="height:${hrs[i]/max*74}%"><span>${hrs[i]}h</span></div><div class="lbl ${i===0?'today':''}">${i===0?'Today':D(d).toLocaleDateString(undefined,{weekday:'short'})}</div></div>`).join('')}</div>`}},
  trend:{name:'Completion trend',icon:'trend',desc:'Tasks completed over the last 14 days',w:6,h:4,render(){
    const N=14,days=[...Array(N)].map((_,i)=>addDays(today(),i-N+1)),v=days.map(d=>S.log[d]||0),max=Math.max(...v,4);
    const pts=v.map((y,i)=>[i/(N-1)*300,95-y/max*85]);const line=pts.map(p=>p.join(',')).join(' ');
    const tot=v.reduce((a,b)=>a+b,0);
    return `<div style="display:flex;justify-content:space-between;align-items:baseline"><div><b style="font-size:22px">${tot}</b> <span class="muted small">tasks in 14 days</span></div><span class="chip accent">avg ${(tot/N).toFixed(1)}/day</span></div>
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" style="width:100%;height:calc(100% - 50px);overflow:visible;margin-top:6px"><defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--tint,var(--accent))" stop-opacity=".35"/><stop offset="1" stop-color="var(--tint,var(--accent))" stop-opacity="0"/></linearGradient></defs>
      <polygon points="0,100 ${line} 300,100" fill="url(#tg)"/><polyline points="${line}" fill="none" stroke="var(--tint,var(--accent))" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
      <div style="display:flex;justify-content:space-between" class="small muted"><span>${fmt(days[0])}</span><span>Today</span></div>`}},
  deadlines:{name:'Upcoming deadlines',icon:'flag',desc:'What is due in the next days',w:3,h:5,cfgFields:[{k:'days',label:'Days ahead',type:'number',def:14}],render(w){
    const n=+(w.cfg.days||14),L=open().filter(t=>t.due&&t.due>=today()&&t.due<=addDays(today(),n)).sort((a,b)=>a.due.localeCompare(b.due));
    return L.length?`<div class="list">${L.map(t=>`<div class="li"><i class="dot" style="background:${pcol(t)}"></i><span class="grow" data-act="openTask" data-id="${t.id}">${esc(t.title)}</span>${dueChip(t)}</div>`).join('')}</div>`:`<div class="empty">No deadlines in the next ${n} days</div>`}},
  projects:{name:'Project progress',icon:'folder',desc:'Completion per project',w:6,h:4,render(){
    return `<div class="list" style="gap:12px;padding-top:4px">${S.projects.map(p=>{const T=S.tasks.filter(t=>t.project===p.id),d=T.filter(t=>t.status==='done').length,pc=T.length?Math.round(d/T.length*100):0;
      return `<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span style="display:flex;gap:8px;align-items:center;cursor:pointer" data-act="filterProject" data-id="${p.id}"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}</span><span class="muted">${d}/${T.length} · <b style="color:var(--text)">${pc}%</b></span></div><div class="bar"><i style="width:${pc}%;background:${p.color}"></i></div></div>`}).join('')||'<div class="empty">No projects yet</div>'}</div>`}},
  matrix:{name:'Priority matrix',icon:'grid4',desc:'Eisenhower: urgent × important',w:6,h:5,render(){
    const soon=addDays(today(),2),Q=[[],[],[],[]];
    open().forEach(t=>{const imp=t.priority<=2,urg=t.due&&t.due<=soon;Q[imp&&urg?0:imp?1:urg?2:3].push(t)});
    const names=[['Do first','var(--red)'],['Schedule','var(--accent)'],['Delegate','var(--orange)'],['Later','var(--muted)']];
    return `<div class="matrix">${Q.map((q,i)=>`<div class="quad"><h4><span style="color:${names[i][1]}">${names[i][0]}</span><span class="chip">${q.length}</span></h4>${q.map(t=>`<div class="q-item" data-act="openTask" data-id="${t.id}"><i class="dot" style="background:${pcol(t)};margin-right:6px"></i>${esc(t.title)}</div>`).join('')}</div>`).join('')}</div>`}},
  heatmap:{name:'Activity heatmap',icon:'heat',desc:'Completed tasks per day, last 18 weeks',w:12,h:3,render(){
    const weeks=18,start=addDays(weekStart(today()),-(weeks-1)*7);let cells='',tot=0;const max=Math.max(...Object.values(S.log),1);
    for(let i=0;i<weeks*7;i++){const d=addDays(start,i);const v=d>today()?-1:(S.log[d]||0);tot+=Math.max(v,0);
      cells+=`<i title="${fmt(d)}: ${Math.max(v,0)} done" style="${v>0?`background:color-mix(in srgb,var(--tint,var(--accent)) ${20+v/max*80}%,var(--panel2))`:v<0?'opacity:.25':''}"></i>`}
    return `<div class="small muted" style="margin-bottom:6px">${tot} tasks completed in the last ${weeks} weeks</div><div class="heat">${cells}</div>`}},
  habits:{name:'Habit tracker',icon:'fire',desc:'Daily habits with streaks',w:4,h:4,render(){
    const days=[...Array(7)].map((_,i)=>addDays(today(),i-6));
    const streak=h=>{let s=0,d=today();if(!h.days[d])d=addDays(d,-1);while(h.days[d]){s++;d=addDays(d,-1)}return s};
    return `<div class="habit-row" style="padding-top:0"><span></span>${days.map(d=>`<span class="hd">${D(d).toLocaleDateString(undefined,{weekday:'narrow'})}</span>`).join('')}<span class="hd">🔥</span></div>
      ${S.habits.map(h=>`<div class="habit-row" style="--hcol:${h.color}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="Double-click to delete" data-dbl="delHabit" data-id="${h.id}">${esc(h.name)}</span>${days.map(d=>`<button class="hc ${h.days[d]?'on':''}" data-act="habit" data-id="${h.id}" data-d="${d}"></button>`).join('')}<b class="small" style="text-align:center">${streak(h)}</b></div>`).join('')}
      <form class="inline-add" data-form="habit"><input placeholder="New habit…"></form>`}},
  goals:{name:'Goals',icon:'target',desc:'Track progress toward goals',w:4,h:4,render(){
    return `${S.goals.map(g=>`<div class="goal"><div class="gh"><span>${esc(g.name)}</span><span class="gb"><button class="chip" data-act="goal" data-id="${g.id}" data-d="-10">−</button><b>${g.p}%</b><button class="chip" data-act="goal" data-id="${g.id}" data-d="10">+</button><button class="chip" data-act="delGoal" data-id="${g.id}" title="Remove">×</button></span></div><div class="bar"><i style="width:${g.p}%;background:${g.color}"></i></div></div>`).join('')}
      <form class="inline-add" data-form="goal"><input placeholder="New goal…"></form>`}},
  notes:{name:'Quick notes',icon:'note',desc:'Scratchpad, autosaved',w:4,h:4,render(){return `<textarea class="notes-area" data-notes placeholder="Write anything…">${esc(S.notes)}</textarea>`}},
  quickadd:{name:'Quick add',icon:'bolt',desc:'Natural-language task entry',w:6,h:2,render(){
    return `<form class="inline-add" data-form="quick" style="margin:0"><input placeholder="e.g. Send report to Anna fri !1 #web 2h +finance"><button class="btn primary">Add</button></form><div class="qa-hint"><code>today</code> <code>tmr</code> <code>fri</code> <code>in 3d</code> dates · <code>!1</code>–<code>!4</code> priority · <code>#project</code> · <code>2h</code> estimate · <code>+tag</code></div>`}},
  countdown:{name:'Countdown',icon:'hourglass',desc:'Days left until a date',w:4,h:2,cfgFields:[{k:'label',label:'Label',type:'text',def:'Launch day'},{k:'date',label:'Date',type:'date',def:''}],render(w){
    const d=w.cfg.date||addDays(today(),30),n=diffDays(d,today());
    return `<div class="countdown"><div><div style="font-weight:650">${esc(w.cfg.label||'Launch day')}</div><div class="small muted">${D(d).toLocaleDateString(undefined,{weekday:'short',month:'long',day:'numeric',year:'numeric'})}</div></div><div style="text-align:right"><div class="n">${Math.abs(n)}</div><div class="small muted">${n>=0?'days left':'days ago'}</div></div></div>`}},
  insights:{name:'Smart insights',icon:'cpu',desc:'Momentum, streaks & finish forecast (C++ engine)',w:6,h:4,render(){
    const N=60,hist=[...Array(N)].map((_,i)=>S.log[addDays(today(),i-N+1)]||0),o=open().length,r=Engine.insights(hist,o);
    const fd=Math.ceil(r.forecastDays),m=Math.round(r.momentum),mc=m>=66?'var(--green)':m>=40?'var(--orange)':'var(--red)';
    const arrow=r.slope>0.01?'↗ improving':r.slope<-0.01?'↘ slowing':'→ steady';
    return `<div style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;height:100%">
      <div style="position:relative;width:110px;height:110px"><svg viewBox="0 0 100 100" style="transform:rotate(-90deg);width:100%;height:100%"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--panel2)" stroke-width="9"/><circle cx="50" cy="50" r="42" fill="none" stroke="${mc}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${2.639*m} 264"/></svg><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><b style="font-size:26px">${m}</b><div class="small muted">momentum</div></div></div></div>
      <div class="kpis" style="grid-template-columns:1fr 1fr;height:auto">
        <div class="kpi"><b>${r.last7.toFixed(1)}</b><span>tasks/day (7d) ${arrow}</span></div>
        <div class="kpi"><b>${r.streak}🔥</b><span>day streak · best ${r.bestStreak}</span></div>
        <div class="kpi"><b>${o?fd+'d':'—'}</b><span>${o?'to clear backlog · '+fmt(addDays(today(),fd)):'backlog clear'}</span></div>
        <div class="kpi"><b>${Math.round(r.consistency*100)}%</b><span>active days (60d)</span></div>
      </div></div>`}},
  links:{name:'Quick links',icon:'link',desc:'Your bookmarks in one place',w:6,h:3,render(){
    return `<div class="links">${S.links.map(l=>`<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener"><span class="fav">${esc(l.name[0]||'?').toUpperCase()}</span><span>${esc(l.name)}</span><button class="x" data-act="delLink" data-id="${l.id}">✕</button></a>`).join('')}</div>
      <form class="inline-add" data-form="link"><input placeholder="Name" style="max-width:120px"><input placeholder="https://…"><button class="btn sm">Add</button></form>`}},
};
function taskLi(t){return `<div class="li"><button class="chk ${t.status==='done'?'on':''}" data-act="toggle" data-id="${t.id}" aria-label="Complete"></button><i class="dot" style="background:${PRI[t.priority].c}" title="${PRI[t.priority].n}"></i><span class="grow" data-act="openTask" data-id="${t.id}">${esc(t.title)}</span>${dueChip(t)}</div>`}

/* ---------------- Views ---------------- */
const VIEWS={dashboard:{t:'Dashboard',i:'dash',k:'1'},board:{t:'Board',i:'board',k:'2'},week:{t:'Week planner',i:'week',k:'3'},calendar:{t:'Calendar',i:'cal',k:'4'},timeline:{t:'Timeline',i:'timeline',k:'5'},projects:{t:'Projects',i:'folder',k:'6'},settings:{t:'Settings',i:'cog',k:'7'}};
function renderSide(){
  const n=open().length,ov=open().filter(isOver).length;
  $('#side').innerHTML=`<div class="brand"><div class="logo">${ic('bolt','style="color:#fff;width:17px;height:17px"')}</div>Flowdeck</div>
   ${Object.entries(VIEWS).map(([k,v])=>`<button class="nav ${S.ui.view===k?'active':''}" data-act="go" data-v="${k}">${ic(v.i)}${v.t}${k==='board'?`<span class="count">${n}</span>`:k==='dashboard'&&ov?`<span class="count" style="color:var(--red)">${ov}</span>`:`<span class="kbd" style="margin-left:auto;opacity:.6">${v.k}</span>`}</button>`).join('')}
   <div class="nav-label">Projects</div>
   ${S.projects.map(p=>`<button class="proj-link" data-act="filterProject" data-id="${p.id}"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}<span class="muted small" style="margin-left:auto">${S.tasks.filter(t=>t.project===p.id&&t.status!=='done').length}</span></button>`).join('')}
   <button class="proj-link" data-act="editProject">${ic('plus','style="width:14px;height:14px"')} New project</button>
   <div class="side-foot">Press <span class="kbd">?</span> for shortcuts<br>Data saved in this browser<br><span class="chip accent" style="margin-top:8px" title="Planning engine backend">${ic('cpu','style="width:12px;height:12px"')} Engine: ${Engine.backend==='wasm'?'C++ · WebAssembly':'JavaScript'}</span></div>`;
}
function render(){
  applyTheme();renderSide();
  const v=S.ui.view,c=$('#content');$('#vtitle').textContent=VIEWS[v].t;
  const subs={dashboard:'Your customizable command center',board:'Drag cards between columns',week:'Drag tasks onto days to schedule',calendar:'Click a day to add · drag to reschedule',timeline:'Project schedule at a glance',projects:'Organize work into projects',settings:'Make it yours'};
  $('#vsub').textContent=subs[v];
  c.innerHTML=({dashboard:vDash,board:vBoard,week:vWeek,calendar:vCal,timeline:vTimeline,projects:vProjects,settings:vSettings}[v])();
  if(v==='dashboard')afterDash();
  bindDnD();tickClock();
}
/* Dashboard */
function curDash(){if(!S.dashboards[S.activeDash])S.activeDash=Object.keys(S.dashboards)[0];return S.dashboards[S.activeDash]}
function vDash(){
  const d=curDash();
  return `<div class="dash-bar"><div class="tabs">${Object.entries(S.dashboards).map(([id,x])=>`<button class="tab ${id===S.activeDash?'active':''}" data-act="dashTab" data-id="${id}" ${editing?`data-dbl="renameDash"`:''}>${esc(x.name)}</button>`).join('')}<button class="tab" data-act="newDash" title="New dashboard">${ic('plus','style="width:15px;height:15px;vertical-align:-3px"')}</button></div>
   <div class="spacer"></div>
   ${editing?`<button class="btn sm" data-act="renameDash">${ic('edit','style="width:14px"')} Rename</button><button class="btn sm" data-act="dupDash">${ic('copy','style="width:14px"')} Duplicate</button><button class="btn sm danger" data-act="delDash">${ic('trash','style="width:14px"')} Delete</button><button class="btn sm" data-act="resetDash">Reset</button>`:''}
   <button class="btn sm" data-act="addWidget">${ic('plus','style="width:14px"')} Add widget</button>
   <button class="btn sm ${editing?'primary':''}" data-act="toggleEdit">${editing?ic('check','style="width:14px"')+' Done':ic('edit','style="width:14px"')+' Customize'}</button></div>
   <div class="${editing?'editing-on':''}"><div class="edit-banner">${ic('grip')}<span><b>Customize mode</b> — drag widgets to reorder, pull the corner to resize, ${ic('cog','style="width:13px;vertical-align:-2px"')} to configure, ✕ to remove. Double-click a tab to rename.</span></div></div>
   <div class="grid ${editing?'editing':''}" id="grid">${d.widgets.map(widgetHTML).join('')||`<div class="empty-dash"><div>${ic('dash','style="width:34px;height:34px"')}<p>This dashboard is empty.</p><button class="btn primary" data-act="addWidget">Add your first widget</button></div></div>`}</div>`;
}
function widgetHTML(w){
  const def=WIDGETS[w.type];if(!def)return '';
  const tint=w.cfg.tint?`--tint:${w.cfg.tint};`:'';
  return `<section class="widget" data-wid="${w.id}" draggable="${editing}" style="grid-column:span ${w.w};grid-row:span ${w.h};--w:${w.w};${tint}">
    ${(!def.noHead||editing)?`<header class="w-head"><span class="t">${ic(def.icon)}${esc(w.cfg.title||def.name)}</span><span class="w-tools">${editing?`<button class="icon-btn" data-act="cfgWidget" data-id="${w.id}" title="Settings">${ic('cog','style="width:15px"')}</button><button class="icon-btn" data-act="rmWidget" data-id="${w.id}" title="Remove">${ic('x','style="width:15px"')}</button>`:''}</span></header>`:''}
    <div class="w-body">${def.render(w)}</div><span class="size-badge">${w.w}×${w.h}</span><div class="rz" data-rz="${w.id}"></div></section>`;
}
function afterDash(){curDash().widgets.forEach(w=>WIDGETS[w.type]?.after?.(w))}
function refreshWidgets(){ if(S.ui.view==='dashboard'&&!editing){const d=curDash();d.widgets.forEach(w=>{const el=$(`[data-wid="${w.id}"] .w-body`);if(el&&!el.contains(document.activeElement))el.innerHTML=WIDGETS[w.type].render(w)});afterDash();tickClock()} }

/* Board */
function filtered(){const f=S.ui.filter,q=f.q.toLowerCase();return S.tasks.filter(t=>(!q||t.title.toLowerCase().includes(q)||t.tags.join(' ').toLowerCase().includes(q))&&(!f.project||t.project===f.project)&&(!f.priority||t.priority==f.priority))}
function filterBar(){const f=S.ui.filter;return `<div class="toolbar"><input class="input" id="fq" placeholder="Filter tasks…" value="${esc(f.q)}" style="min-width:220px">
  <select class="input" id="fp"><option value="">All projects</option>${S.projects.map(p=>`<option value="${p.id}" ${f.project===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
  <select class="input" id="fpr"><option value="">Any priority</option>${[1,2,3,4].map(i=>`<option value="${i}" ${f.priority==i?'selected':''}>${PRI[i].n}</option>`).join('')}</select>
  ${f.q||f.project||f.priority?`<button class="btn sm ghost" data-act="clearFilter">Clear</button>`:''}</div>`}
function card(t){const sd=t.subtasks.filter(s=>s.d).length;
  return `<div class="card ${t.status==='done'?'done':''}" draggable="true" data-task="${t.id}" data-act="openTask" data-id="${t.id}" style="--pc:${PRI[t.priority].c}">
   <div class="ttl">${esc(t.title)}</div>
   <div class="meta"><span class="chip"><i class="dot" style="background:${pcol(t)}"></i>${esc(proj(t.project)?.name||'No project')}</span>${dueChip(t)}${t.est?`<span class="chip">${ic('clock','style="width:11px;height:11px"')}${t.est}h</span>`:''}${t.subtasks.length?`<span class="chip ${sd===t.subtasks.length?'green':''}">${ic('check','style="width:11px;height:11px"')}${sd}/${t.subtasks.length}</span>`:''}${t.tags.map(g=>`<span class="chip accent">#${esc(g)}</span>`).join('')}</div></div>`}
function vBoard(){const T=filtered();
  return filterBar()+`<div class="board">${STATUSES.map(s=>{const L=T.filter(t=>t.status===s.id).sort((a,b)=>a.priority-b.priority||(a.due||'9').localeCompare(b.due||'9'));
    return `<div class="column" data-drop-status="${s.id}"><div class="col-head"><i class="dot" style="background:${s.c}"></i>${s.name}<span class="n">${L.length}</span><span class="h">${L.reduce((a,t)=>a+(+t.est||0),0)}h</span></div>${L.map(card).join('')}<button class="add-card" data-act="newTask" data-status="${s.id}">+ Add task</button></div>`}).join('')}</div>`}
/* Week */
function vWeek(){const ws=S.ui.weekOf,cap=S.settings.capacity;
  const days=[...Array(7)].map((_,i)=>addDays(ws,i));
  const un=open().filter(t=>!t.due);
  return `<div class="toolbar"><button class="btn sm" data-act="weekNav" data-d="-7">${ic('left','style="width:14px"')}</button><button class="btn sm" data-act="weekNav" data-d="0">This week</button><button class="btn sm" data-act="weekNav" data-d="7">${ic('right','style="width:14px"')}</button><b style="margin-left:8px">${fmt(days[0])} – ${fmt(days[6],{month:'short',day:'numeric',year:'numeric'})}</b><span class="spacer"></span><span class="muted small">Capacity ${cap}h/day</span><button class="btn sm primary" data-act="autoPlan">${ic('wand','style="width:14px"')} Auto-plan</button></div>
  <div class="week">${days.map((d,i)=>{const L=S.tasks.filter(t=>t.due===d).sort((a,b)=>(a.status==='done')-(b.status==='done')||a.priority-b.priority),h=L.filter(t=>t.status!=='done').reduce((a,t)=>a+(+t.est||0),0);
    return `<div class="day ${d===today()?'today':''}" data-drop-day="${d}"><div class="day-h"><span class="muted">${DOW[i]}</span><b>${D(d).getDate()}</b></div>
     <div class="load"><span>${h}h / ${cap}h planned</span><div class="bar"><i style="width:${Math.min(100,h/cap*100)}%;${h>cap?'background:var(--red)':''}"></i></div></div>
     ${L.map(t=>`<div class="mini ${t.status==='done'?'done':''}" draggable="true" data-task="${t.id}" data-act="openTask" data-id="${t.id}" style="--pc:${pcol(t)}"><span>${esc(t.title)}</span><span class="muted small">${PRI[t.priority].n}${t.est?' · '+t.est+'h':''}</span></div>`).join('')}
     <button class="add-card" data-act="newTask" data-due="${d}">+ Add</button></div>`}).join('')}</div>
  <h3 style="margin:22px 0 0;font-size:14px">Unscheduled <span class="muted">(${un.length}) — drag onto a day</span></h3>
  <div class="tray" data-drop-day="">${un.map(t=>`<div class="mini" draggable="true" data-task="${t.id}" data-act="openTask" data-id="${t.id}" style="--pc:${pcol(t)}">${esc(t.title)}</div>`).join('')||'<span class="muted small">All tasks have a date 🎯</span>'}</div>`}
/* Calendar */
function vCal(){const [y,m]=S.ui.month.split('-').map(Number);const first=`${S.ui.month}-01`,start=weekStart(first);
  const cells=[...Array(42)].map((_,i)=>addDays(start,i));
  return `<div class="toolbar"><button class="btn sm" data-act="monNav" data-d="-1">${ic('left','style="width:14px"')}</button><button class="btn sm" data-act="monNav" data-d="0">Today</button><button class="btn sm" data-act="monNav" data-d="1">${ic('right','style="width:14px"')}</button><b style="margin-left:8px;font-size:16px">${new Date(y,m-1).toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b></div>
  <div class="cal">${DOW.map(d=>`<div class="dh">${d}</div>`).join('')}${cells.map(d=>{const L=S.tasks.filter(t=>t.due===d);
   return `<div class="cell ${d.slice(0,7)!==S.ui.month?'other':''} ${d===today()?'today':''}" data-act="newTask" data-due="${d}" data-drop-day="${d}"><span class="dn">${D(d).getDate()}</span>${L.slice(0,4).map(t=>`<div class="ev ${t.status==='done'?'done':''}" draggable="true" data-task="${t.id}" data-act="openTask" data-id="${t.id}" style="--pc:${pcol(t)}">${esc(t.title)}</div>`).join('')}${L.length>4?`<span class="small muted">+${L.length-4} more</span>`:''}</div>`}).join('')}</div>`}
/* Timeline */
function vTimeline(){const N=35,st=S.ui.tlStart,days=[...Array(N)].map((_,i)=>addDays(st,i)),end=days[N-1];
  const cols=`220px repeat(${N},minmax(26px,1fr))`;
  const bg=`<div class="tl-days" style="grid-template-columns:repeat(${N},1fr)">${days.map(d=>`<i class="${d===today()?'td':[0,6].includes(D(d).getDay())?'we':''}"></i>`).join('')}</div>`;
  let rows='';
  S.projects.forEach(p=>{const T=S.tasks.filter(t=>t.project===p.id&&(t.due||t.start)).filter(t=>{const s=t.start||t.due,e=t.due||t.start;return e>=st&&s<=end}).sort((a,b)=>(a.start||a.due).localeCompare(b.start||b.due));
    rows+=`<div class="tl-name grp"><i class="dot" style="background:${p.color}"></i>${esc(p.name)}</div><div class="tl-track grp" style="grid-column:span ${N};height:32px">${bg}</div>`;
    T.forEach(t=>{let s=t.start||t.due,e=t.due||t.start;if(e<s)[s,e]=[e,s];const a=Math.max(0,diffDays(s,st)),b=Math.min(N-1,diffDays(e,st));
      rows+=`<div class="tl-name" data-act="openTask" data-id="${t.id}" style="cursor:pointer;padding-left:28px">${esc(t.title)}</div><div class="tl-track" style="grid-column:span ${N}">${bg}<div class="tl-bar ${t.status==='done'?'done':''}" data-act="openTask" data-id="${t.id}" style="--pc:${p.color};left:calc(${a/N*100}% + 2px);width:calc(${(b-a+1)/N*100}% - 4px)" title="${esc(t.title)}">${esc(t.title)}</div></div>`})});
  return `<div class="toolbar"><button class="btn sm" data-act="tlNav" data-d="-7">${ic('left','style="width:14px"')}</button><button class="btn sm" data-act="tlNav" data-d="0">Today</button><button class="btn sm" data-act="tlNav" data-d="7">${ic('right','style="width:14px"')}</button><b style="margin-left:8px">${fmt(st)} – ${fmt(end,{month:'short',day:'numeric',year:'numeric'})}</b><span class="spacer"></span><span class="muted small">Bars span start → due date. Set a start date in the task.</span></div>
   <div class="tl"><div class="tl-grid" style="grid-template-columns:${cols}"><div class="tl-head" style="position:sticky;left:0;z-index:2;text-align:left;padding-left:12px">Task</div>${days.map(d=>`<div class="tl-head ${d===today()?'td':''}">${D(d).getDate()===1||d===st?D(d).toLocaleDateString(undefined,{month:'short'})+' ':''}${D(d).getDate()}</div>`).join('')}${rows}</div></div>`}
/* Projects */
function vProjects(){return `<div class="toolbar"><button class="btn primary sm" data-act="editProject">${ic('plus','style="width:14px"')} New project</button></div><div class="pgrid">${S.projects.map(p=>{const T=S.tasks.filter(t=>t.project===p.id),d=T.filter(t=>t.status==='done').length,pc=T.length?Math.round(d/T.length*100):0,ov=T.filter(isOver).length,h=T.filter(t=>t.status!=='done').reduce((a,t)=>a+(+t.est||0),0);
  return `<div class="pcard" style="--pc:${p.color}"><h3><i class="dot" style="background:${p.color}"></i>${esc(p.name)}<span class="spacer"></span><button class="icon-btn" data-act="editProject" data-id="${p.id}">${ic('edit','style="width:15px"')}</button></h3>
   <div class="stat-row"><div><b>${T.length-d}</b>open</div><div><b>${d}</b>done</div><div><b style="${ov?'color:var(--red)':''}">${ov}</b>overdue</div><div><b>${h}h</b>remaining</div></div>
   <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px" class="muted"><span>Progress</span><b style="color:var(--text)">${pc}%</b></div><div class="bar"><i style="width:${pc}%;background:${p.color}"></i></div></div>
   <div style="display:flex;gap:6px"><button class="btn sm" data-act="filterProject" data-id="${p.id}">Open board</button><button class="btn sm ghost" data-act="newTask" data-project="${p.id}">+ Task</button></div></div>`}).join('')}</div>`}
/* Settings */
function vSettings(){const s=S.settings;const seg=(k,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${s[k]==v?'on':''}" data-act="setVal" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return `<div class="set-wrap">
  <div class="set"><h3>Profile</h3><div class="set-row"><div class="lab">Your name<small>Used in the greeting</small></div><input class="input" style="max-width:220px" data-set="name" value="${esc(s.name)}"></div></div>
  <div class="set"><h3>Appearance</h3>
   <div class="set-row"><div class="lab">Theme</div>${seg('theme',[['dark','Dark'],['light','Light']])}</div>
   <div class="set-row"><div class="lab">Accent color</div><div class="swatches">${ACCENTS.map(c=>`<button class="sw ${s.accent===c?'on':''}" style="background:${c}" data-act="setVal" data-k="accent" data-v="${c}"></button>`).join('')}<input type="color" value="${s.accent}" data-set="accent" style="width:30px;height:30px;border:0;background:none;padding:0"></div></div>
   <div class="set-row"><div class="lab">Density<small>Widget row height on the dashboard</small></div>${seg('density',[['cozy','Cozy'],['compact','Compact']])}</div></div>
  <div class="set"><h3>Planning</h3>
   <div class="set-row"><div class="lab">Daily capacity<small>Hours you can work per day — used for workload warnings</small></div><input type="number" class="input" style="max-width:90px" min="1" max="24" data-set="capacity" value="${s.capacity}"></div>
   <div class="set-row"><div class="lab">Focus length (min)</div><input type="number" class="input" style="max-width:90px" min="1" max="120" data-set="work" value="${s.work}"></div>
   <div class="set-row"><div class="lab">Break length (min)</div><input type="number" class="input" style="max-width:90px" min="1" max="60" data-set="brk" value="${s.brk}"></div>
   <div class="set-row"><div class="lab">Auto-plan on weekends<small>Let the C++ auto-planner put tasks on Saturday and Sunday</small></div>${seg('weekends',[['no','Skip'],['yes','Allow']])}</div></div>
  <div class="set"><h3>Data</h3><p class="muted small" style="margin-top:-6px">Everything is stored locally in this browser. Export a backup to move it to another device.</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="export">${ic('download','style="width:15px"')} Export JSON</button><button class="btn" data-act="import">${ic('upload','style="width:15px"')} Import JSON</button><button class="btn" data-act="exportCSV">${ic('download','style="width:15px"')} Tasks as CSV</button><button class="btn" data-act="demo">Load demo data</button><button class="btn danger" data-act="wipe">${ic('trash','style="width:15px"')} Start empty</button></div></div>
  </div>`}

/* ---------------- Modals ---------------- */
function modal(html,cls=''){const o=$('#overlay');o.innerHTML=`<div class="modal ${cls}">${html}</div>`;o.classList.add('show');setTimeout(()=>o.querySelector('[autofocus]')?.focus(),30);return o}
function closeModal(){$('#overlay').classList.remove('show');$('#overlay').innerHTML=''}
let draft=null;
function openTask(id,preset={}){
  const t=id?S.tasks.find(x=>x.id===id):{id:null,title:'',desc:'',project:S.ui.filter.project||S.projects[0]?.id||'',status:'todo',priority:3,due:'',start:'',est:'',tags:[],subtasks:[],...preset};
  if(!t)return;draft=JSON.parse(JSON.stringify(t));
  modal(`<div class="m-head"><button class="chk ${draft.status==='done'?'on':''}" id="mDone" title="Mark done"></button><input class="title-input" id="mTitle" placeholder="Task title" value="${esc(draft.title)}" autofocus><button class="icon-btn" data-act="close">${ic('x')}</button></div>
   <div class="m-body">
    <div class="row3"><div class="field"><label>Status</label><select class="input" id="mStatus">${STATUSES.map(s=>`<option value="${s.id}" ${draft.status===s.id?'selected':''}>${s.name}</option>`).join('')}</select></div>
     <div class="field"><label>Priority</label><select class="input" id="mPri">${[1,2,3,4].map(i=>`<option value="${i}" ${draft.priority==i?'selected':''}>${PRI[i].n}</option>`).join('')}</select></div>
     <div class="field"><label>Project</label><select class="input" id="mProj"><option value="">None</option>${S.projects.map(p=>`<option value="${p.id}" ${draft.project===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
    <div class="row3"><div class="field"><label>Start date</label><input type="date" class="input" id="mStart" value="${draft.start||''}"></div>
     <div class="field"><label>Due date</label><input type="date" class="input" id="mDue" value="${draft.due||''}"></div>
     <div class="field"><label>Estimate (hours)</label><input type="number" min="0" step=".5" class="input" id="mEst" value="${draft.est||''}"></div></div>
    <div class="field"><label>Tags (comma separated)</label><input class="input" id="mTags" value="${esc(draft.tags.join(', '))}" placeholder="design, urgent"></div>
    <div class="field"><label>Description</label><textarea class="input" id="mDesc" placeholder="Details, links, context…">${esc(draft.desc)}</textarea></div>
    <div class="field"><label>Subtasks <span id="subCount"></span></label><div id="subs"></div><form class="inline-add" id="subForm"><input placeholder="Add a subtask and press Enter"></form></div>
   </div>
   <div class="m-foot">${id?`<button class="btn danger sm" data-act="delTask">${ic('trash','style="width:14px"')} Delete</button><button class="btn sm ghost" data-act="dupTask">${ic('copy','style="width:14px"')} Duplicate</button>`:''}<span class="spacer"></span><span class="muted small hide-sm">Ctrl+Enter to save</span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveTask">${id?'Save':'Create task'}</button></div>`);
  renderSubs();
  $('#mDone').onclick=e=>{draft.status=draft.status==='done'?'todo':'done';e.currentTarget.classList.toggle('on');$('#mStatus').value=draft.status};
  $('#subForm').onsubmit=e=>{e.preventDefault();const i=e.target.querySelector('input');if(i.value.trim()){draft.subtasks.push({id:uid(),t:i.value.trim(),d:false});i.value='';renderSubs()}};
}
function renderSubs(){const box=$('#subs');if(!box)return;
  box.innerHTML=draft.subtasks.map(s=>`<div class="sub-item ${s.d?'on':''}"><button class="chk ${s.d?'on':''}" data-sub="${s.id}"></button><input type="text" value="${esc(s.t)}" data-subt="${s.id}"><button class="icon-btn" data-subdel="${s.id}" style="width:26px;height:26px">${ic('x','style="width:13px"')}</button></div>`).join('');
  $('#subCount').textContent=draft.subtasks.length?`(${draft.subtasks.filter(s=>s.d).length}/${draft.subtasks.length})`:'';
  box.onclick=e=>{const a=e.target.closest('[data-sub]'),b=e.target.closest('[data-subdel]');if(a){const s=draft.subtasks.find(x=>x.id===a.dataset.sub);s.d=!s.d;renderSubs()}if(b){draft.subtasks=draft.subtasks.filter(x=>x.id!==b.dataset.subdel);renderSubs()}};
  box.oninput=e=>{const s=draft.subtasks.find(x=>x.id===e.target.dataset.subt);if(s)s.t=e.target.value};
}
function saveTask(){
  const title=$('#mTitle').value.trim();if(!title){$('#mTitle').focus();$('#mTitle').placeholder='Please enter a title';return}
  Object.assign(draft,{title,status:$('#mStatus').value,priority:+$('#mPri').value,project:$('#mProj').value,start:$('#mStart').value,due:$('#mDue').value,est:+$('#mEst').value||0,tags:$('#mTags').value.split(',').map(s=>s.trim().replace(/^#/,'')).filter(Boolean),desc:$('#mDesc').value});
  if(draft.id){const t=S.tasks.find(x=>x.id===draft.id);const wasDone=t.status==='done',isDone=draft.status==='done';Object.assign(t,draft);if(wasDone!==isDone){t.status=wasDone?'done':'todo';setDone(t,isDone);t.status=draft.status}}
  else{draft.id=uid();draft.created=Date.now();draft.completedAt=draft.status==='done'?today():null;S.tasks.push(draft);toast('Task created')}
  save();closeModal();render();
}
function editProject(id){const p=id?proj(id):{name:'',color:PCOLORS[S.projects.length%PCOLORS.length]};let col=p.color;
  modal(`<div class="m-head"><h2>${id?'Edit project':'New project'}</h2><span class="spacer"></span><button class="icon-btn" data-act="close">${ic('x')}</button></div>
   <div class="m-body"><div class="field"><label>Name</label><input class="input" id="pName" value="${esc(p.name)}" autofocus placeholder="e.g. Website redesign"></div>
   <div class="field"><label>Color</label><div class="swatches" id="pCols">${PCOLORS.map(c=>`<button class="sw ${c===col?'on':''}" style="background:${c}" data-c="${c}"></button>`).join('')}</div></div></div>
   <div class="m-foot">${id?`<button class="btn danger sm" id="pDel">${ic('trash','style="width:14px"')} Delete</button>`:''}<span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="pSave">Save</button></div>`);
  $('#pCols').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;col=b.dataset.c;$$('#pCols .sw').forEach(x=>x.classList.toggle('on',x===b))};
  $('#pSave').onclick=()=>{const n=$('#pName').value.trim();if(!n)return $('#pName').focus();if(id){p.name=n;p.color=col}else S.projects.push({id:uid(),name:n,color:col});save();closeModal();render()};
  if(id)$('#pDel').onclick=()=>{if(!confirm(`Delete project “${p.name}”? Its tasks will be kept without a project.`))return;S.projects=S.projects.filter(x=>x.id!==id);S.tasks.forEach(t=>{if(t.project===id)t.project=''});save();closeModal();render()};
  $('#pName').onkeydown=e=>{if(e.key==='Enter')$('#pSave').click()};
}
function addWidgetModal(){
  modal(`<div class="m-head"><h2>Add a widget</h2><span class="muted small">to “${esc(curDash().name)}”</span><span class="spacer"></span><button class="icon-btn" data-act="close">${ic('x')}</button></div>
   <div class="m-body"><div class="gallery">${Object.entries(WIDGETS).map(([k,w])=>`<button class="gitem" data-act="pickWidget" data-t="${k}">${ic(w.icon)}<b>${w.name}</b><span>${w.desc}</span><span class="chip" style="align-self:flex-start">${w.w}×${w.h}</span></button>`).join('')}</div></div>`,'wide');
}
function cfgWidget(id){const w=curDash().widgets.find(x=>x.id===id),def=WIDGETS[w.type];
  const extra=(def.cfgFields||[]).map(f=>`<div class="field"><label>${f.label}</label><input class="input" type="${f.type}" data-cf="${f.k}" value="${esc(w.cfg[f.k]??f.def)}"></div>`).join('');
  modal(`<div class="m-head"><h2>Widget settings</h2><span class="muted small">${def.name}</span><span class="spacer"></span><button class="icon-btn" data-act="close">${ic('x')}</button></div>
   <div class="m-body"><div class="field"><label>Title</label><input class="input" id="wTitle" value="${esc(w.cfg.title||'')}" placeholder="${esc(def.name)}" autofocus></div>
   <div class="row2"><div class="field"><label>Width (1–12 columns)</label><input class="input" type="range" min="2" max="12" id="wW" value="${w.w}"><span class="small muted" id="wWv">${w.w} cols</span></div>
    <div class="field"><label>Height (rows)</label><input class="input" type="range" min="1" max="8" id="wH" value="${w.h}"><span class="small muted" id="wHv">${w.h} rows</span></div></div>
   <div class="field"><label>Accent</label><div class="swatches" id="wTint"><button class="sw ${!w.cfg.tint?'on':''}" style="background:conic-gradient(var(--panel2) 0 50%,var(--line) 0)" data-c="" title="Default"></button>${PCOLORS.map(c=>`<button class="sw ${w.cfg.tint===c?'on':''}" style="background:${c}" data-c="${c}"></button>`).join('')}</div></div>${extra}</div>
   <div class="m-foot"><button class="btn sm danger" data-act="rmWidget" data-id="${id}">Remove widget</button><span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="wSave">Apply</button></div>`);
  let tint=w.cfg.tint||'';
  $('#wTint').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;tint=b.dataset.c;$$('#wTint .sw').forEach(x=>x.classList.toggle('on',x===b))};
  $('#wW').oninput=e=>$('#wWv').textContent=e.target.value+' cols';$('#wH').oninput=e=>$('#wHv').textContent=e.target.value+' rows';
  $('#wSave').onclick=()=>{w.cfg.title=$('#wTitle').value.trim();w.cfg.tint=tint;w.w=+$('#wW').value;w.h=+$('#wH').value;$$('[data-cf]').forEach(i=>w.cfg[i.dataset.cf]=i.value);save();closeModal();render()};
}
function helpModal(){modal(`<div class="m-head"><h2>Keyboard shortcuts</h2><span class="spacer"></span><button class="icon-btn" data-act="close">${ic('x')}</button></div><div class="m-body"><div class="help-grid">
  ${[['Command palette / search','Ctrl K'],['New task','N'],['Go to view','1 – 7'],['Customize dashboard','E'],['Toggle theme','T'],['Start / pause focus timer','P'],['Save task','Ctrl Enter'],['Close dialog','Esc'],['This help','?']].map(([a,b])=>`<span>${a}</span><span class="kbd">${b}</span>`).join('')}</div>
  <p class="muted small" style="margin:6px 0 0">Quick-add syntax: <code>Write report fri !1 #web 2h +finance</code> → due Friday, urgent, project “Web…”, 2h estimate, tag finance.</p></div>`)}

/* Command palette */
let palSel=0,palItems=[];
function openPalette(){
  const o=modal(`<input id="palIn" placeholder="Search tasks, jump to a view, or type a new task…" autofocus><div class="p-list" id="palList"></div>`);
  o.querySelector('.modal').className='palette';palQuery('');
  $('#palIn').oninput=e=>palQuery(e.target.value);
  $('#palIn').onkeydown=e=>{if(e.key==='ArrowDown'){palSel=Math.min(palSel+1,palItems.length-1);palPaint();e.preventDefault()}else if(e.key==='ArrowUp'){palSel=Math.max(palSel-1,0);palPaint();e.preventDefault()}else if(e.key==='Enter'){palItems[palSel]?.run();e.preventDefault()}};
}
function palQuery(q){const raw=q.trim();q=raw.toLowerCase();
  const cmds=[...Object.entries(VIEWS).map(([k,v])=>({g:'Go to',l:v.t,i:v.i,k:v.k,run:()=>{closeModal();go(k)}})),
   {g:'Actions',l:'New task',i:'plus',k:'N',run:()=>{closeModal();openTask()}},{g:'Actions',l:'New project',i:'folder',run:()=>{closeModal();editProject()}},
   {g:'Actions',l:'Customize dashboard',i:'edit',k:'E',run:()=>{closeModal();go('dashboard');editing=true;render()}},{g:'Actions',l:'Add widget',i:'dash',run:()=>{go('dashboard');addWidgetModal()}},
   {g:'Actions',l:'Toggle dark / light',i:'moon',k:'T',run:()=>{closeModal();toggleTheme()}},{g:'Actions',l:'Start / pause focus timer',i:'timer',k:'P',run:()=>{closeModal();pomoToggle()}},
   {g:'Actions',l:'Auto-plan my next 2 weeks',i:'wand',run:()=>{closeModal();autoPlan()}},{g:'Actions',l:'Export data',i:'download',run:()=>{closeModal();exportJSON()}},{g:'Actions',l:'Keyboard shortcuts',i:'keyboard',k:'?',run:()=>helpModal()},
   ...Object.entries(S.dashboards).map(([id,d])=>({g:'Dashboards',l:d.name,i:'dash',run:()=>{closeModal();S.activeDash=id;go('dashboard')}}))];
  let res=cmds.filter(c=>!q||c.l.toLowerCase().includes(q));
  const tasks=S.tasks.filter(t=>q&&(t.title.toLowerCase().includes(q)||t.tags.some(g=>g.toLowerCase().includes(q)))).slice(0,8).map(t=>({g:'Tasks',l:t.title,i:t.status==='done'?'check':'list',k:proj(t.project)?.name||'',run:()=>openTask(t.id)}));
  res=[...tasks,...res];
  if(q)res.push({g:'Create',l:`Create task “${raw}”`,i:'plus',run:()=>{closeModal();addQuick(raw);render()}});
  palItems=res;palSel=0;palPaint();
}
function palPaint(){let g='';$('#palList').innerHTML=palItems.map((it,i)=>{const h=it.g!==g?`<div class="p-group">${g=it.g}</div>`:'';return h+`<div class="p-item ${i===palSel?'sel':''}" data-pi="${i}">${ic(it.i)}<span>${esc(it.l)}</span>${it.k?`<span class="k">${esc(it.k)}</span>`:''}</div>`}).join('')||'<div class="empty">No results</div>';
  $('#palList').onclick=e=>{const p=e.target.closest('[data-pi]');if(p)palItems[+p.dataset.pi].run()};
  $('.p-item.sel')?.scrollIntoView({block:'nearest'})}

/* ---------------- Pomodoro ---------------- */
const P={mode:'work',left:null,run:false,iv:null};
function pomoTotal(){return (P.mode==='work'?S.settings.work:S.settings.brk)*60}
function pomoPaint(){if(P.left==null)P.left=pomoTotal();const m=String(Math.floor(P.left/60)).padStart(2,'0'),s=String(P.left%60).padStart(2,'0');
  $$('[data-pomo-time]').forEach(e=>e.textContent=`${m}:${s}`);$$('[data-pomo-mode]').forEach(e=>e.textContent=P.mode==='work'?'Focus':'Break');
  $$('[data-pomo-ring]').forEach(e=>e.setAttribute('stroke-dashoffset',276.5*(1-P.left/pomoTotal())));$$('[data-pomo-btn]').forEach(e=>e.textContent=P.run?'Pause':'Start');
  document.title=P.run?`${m}:${s} · ${P.mode==='work'?'Focus':'Break'} — Flowdeck`:'Flowdeck — Work Planner & Custom Dashboard'}
function pomoToggle(){P.run=!P.run;if(P.run){P.iv=setInterval(()=>{P.left--;if(P.left<=0)pomoDone();pomoPaint()},1000)}else clearInterval(P.iv);pomoPaint()}
function pomoDone(){beep();if(P.mode==='work'){S.focus[today()]=(S.focus[today()]||0)+1;save();toast('Focus session complete — take a break ☕')}else toast('Break over — back to it 💪');
  P.mode=P.mode==='work'?'break':'work';P.left=pomoTotal();refreshWidgets()}
function beep(){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.8);o.start();o.stop(a.currentTime+.8)}catch(e){}}
function tickClock(){const t=new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});$$('[data-clock]').forEach(e=>e.textContent=t)}
setInterval(tickClock,1000*15);

/* ---------------- Auto-plan (C++ engine) ---------------- */
function autoPlan(){
  const H=14,t0=today(),cap=+S.settings.capacity||8;
  const fixed=open().filter(t=>t.due&&t.due>=t0),load=new Array(H).fill(0);
  fixed.forEach(t=>{const d=diffDays(t.due,t0);if(d<H)load[d]+=+t.est||1});
  const todo=open().filter(t=>t.status!=='backlog'&&(!t.due||t.due<t0));
  if(!todo.length)return toast('Nothing to plan — every open task already has a future date ✅');
  const t1=performance.now();
  const r=Engine.schedule(todo.map(t=>({priority:t.priority,dueOffset:t.due?0:null,est:+t.est||0})),load,{capacity:cap,todayDow:(D(t0).getDay()+6)%7,skipWeekends:S.settings.weekends!=='yes'});
  const ms=(performance.now()-t1).toFixed(2);
  const plan=todo.map((t,i)=>({t,day:addDays(t0,r.days[i])})).sort((a,b)=>a.day.localeCompare(b.day)||a.t.priority-b.t.priority);
  modal(`<div class="m-head">${ic('wand')}<h2>Auto-plan</h2><span class="chip accent">${Engine.backend==='wasm'?'C++ · WebAssembly':'JS'} · ${ms} ms</span><span class="spacer"></span><button class="icon-btn" data-act="close">${ic('x')}</button></div>
   <div class="m-body"><p class="muted" style="margin:0">Scheduled <b style="color:var(--text)">${todo.length}</b> unscheduled or overdue task${todo.length>1?'s':''} into the next ${H} days by priority and deadline, keeping each day under ${cap}h${S.settings.weekends!=='yes'?' and skipping weekends':''}.${r.overloaded?` <span style="color:var(--red)">${r.overloaded} couldn't fit without overloading a day.</span>`:''}</p>
   <div class="bars" style="height:120px">${r.load.slice(0,H).map((h,i)=>`<div class="col"><div class="b ${h>cap?'over':''}" style="height:${Math.min(h/(cap*1.3),1)*70}%"><span>${Math.round(h*10)/10||''}</span></div><div class="lbl ${i===0?'today':''}">${D(addDays(t0,i)).toLocaleDateString(undefined,{weekday:'narrow'})}${D(addDays(t0,i)).getDate()}</div></div>`).join('')}</div>
   <div class="list" style="max-height:300px;overflow:auto">${plan.map(p=>`<div class="li"><i class="dot" style="background:${PRI[p.t.priority].c}"></i><span class="grow">${esc(p.t.title)}</span>${p.t.due?`<span class="chip red">was ${fmt(p.t.due)}</span>`:''}<span class="chip accent">→ ${D(p.day).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</span></div>`).join('')}</div></div>
   <div class="m-foot"><span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="apApply">${ic('check','style="width:15px"')} Apply plan</button></div>`,'wide');
  $('#apApply').onclick=()=>{const undo=plan.map(p=>[p.t,p.t.due]);plan.forEach(p=>{p.t.due=p.day;if(p.t.start&&p.t.start>p.day)p.t.start=''});save();closeModal();S.ui.weekOf=weekStart(t0);render();toast(`Planned ${plan.length} tasks`,()=>{undo.forEach(([t,d])=>t.due=d);save();render()})};
}

/* ---------------- Actions ---------------- */
function go(v){S.ui.view=v;save();closeModal();$('#side').classList.remove('open');render();$('#content').scrollTop=0}
function toggleTheme(){S.settings.theme=S.settings.theme==='dark'?'light':'dark';save();render()}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportJSON(){download(`flowdeck-backup-${today()}.json`,JSON.stringify(S,null,2),'application/json');toast('Backup downloaded')}
const A={
  go:el=>go(el.dataset.v), menu:()=>$('#side').classList.toggle('open'), palette:openPalette, theme:toggleTheme, close:closeModal,
  newTask:el=>{const p={};if(el.dataset.status)p.status=el.dataset.status;if(el.dataset.due)p.due=el.dataset.due;if(el.dataset.project)p.project=el.dataset.project;openTask(null,p)},
  openTask:el=>openTask(el.dataset.id), saveTask,
  delTask:()=>{const t=S.tasks.find(x=>x.id===draft.id),i=S.tasks.indexOf(t);S.tasks.splice(i,1);save();closeModal();render();toast('Task deleted',()=>{S.tasks.splice(i,0,t);save();render()})},
  dupTask:()=>{const c=JSON.parse(JSON.stringify(S.tasks.find(x=>x.id===draft.id)));c.id=uid();c.title+=' (copy)';c.status=c.status==='done'?'todo':c.status;c.completedAt=null;S.tasks.push(c);save();openTask(c.id);render()},
  toggle:el=>{const t=S.tasks.find(x=>x.id===el.dataset.id);setDone(t,t.status!=='done');render()},
  filterProject:el=>{S.ui.filter={q:'',priority:'',project:el.dataset.id};go('board')},
  clearFilter:()=>{S.ui.filter={q:'',project:'',priority:''};save();render()},
  editProject:el=>editProject(el.dataset.id),
  dashTab:el=>{S.activeDash=el.dataset.id;save();render()},
  newDash:()=>{const n=prompt('Dashboard name','My dashboard');if(!n)return;const id='d'+uid();S.dashboards[id]={name:n,widgets:[W('greeting',12,2)]};S.activeDash=id;editing=true;save();render();addWidgetModal()},
  renameDash:()=>{const d=curDash(),n=prompt('Rename dashboard',d.name);if(n){d.name=n;save();render()}},
  dupDash:()=>{const d=curDash(),id='d'+uid();S.dashboards[id]={name:d.name+' copy',widgets:d.widgets.map(w=>({...w,id:uid(),cfg:{...w.cfg}}))};S.activeDash=id;save();render()},
  delDash:()=>{if(Object.keys(S.dashboards).length<2)return toast('You need at least one dashboard');if(!confirm(`Delete dashboard “${curDash().name}”?`))return;delete S.dashboards[S.activeDash];S.activeDash=Object.keys(S.dashboards)[0];save();render()},
  resetDash:()=>{if(!confirm('Reset all dashboards to the default layouts?'))return;S.dashboards=defaultDashboards();S.activeDash='d1';save();render()},
  toggleEdit:()=>{editing=!editing;render()},
  addWidget:addWidgetModal,
  pickWidget:el=>{const d=WIDGETS[el.dataset.t];const w=W(el.dataset.t,d.w,d.h);(d.cfgFields||[]).forEach(f=>w.cfg[f.k]=f.def||'');curDash().widgets.push(w);save();closeModal();render();toast(d.name+' added');setTimeout(()=>$(`[data-wid="${w.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),50)},
  rmWidget:el=>{const d=curDash(),i=d.widgets.findIndex(w=>w.id===el.dataset.id),w=d.widgets[i];d.widgets.splice(i,1);save();closeModal();render();toast('Widget removed',()=>{d.widgets.splice(i,0,w);save();render()})},
  cfgWidget:el=>cfgWidget(el.dataset.id),
  pomoToggle, pomoReset:()=>{P.left=pomoTotal();if(P.run)pomoToggle();pomoPaint()}, pomoSkip:()=>{P.left=1},
  habit:el=>{const h=S.habits.find(x=>x.id===el.dataset.id),d=el.dataset.d;h.days[d]?delete h.days[d]:h.days[d]=1;save();refreshWidgets()},
  goal:el=>{const g=S.goals.find(x=>x.id===el.dataset.id);g.p=clamp(g.p+(+el.dataset.d),0,100);if(g.p===100)confetti();save();refreshWidgets()},
  delGoal:el=>{S.goals=S.goals.filter(g=>g.id!==el.dataset.id);save();refreshWidgets()},
  delLink:(el,e)=>{e.preventDefault();S.links=S.links.filter(l=>l.id!==el.dataset.id);save();refreshWidgets()},
  autoPlan:()=>autoPlan(),
  weekNav:el=>{S.ui.weekOf=+el.dataset.d?addDays(S.ui.weekOf,+el.dataset.d):weekStart(today());save();render()},
  monNav:el=>{const d=+el.dataset.d;if(!d)S.ui.month=today().slice(0,7);else{const [y,m]=S.ui.month.split('-').map(Number);const n=new Date(y,m-1+d,1);S.ui.month=iso(n).slice(0,7)}save();render()},
  tlNav:el=>{S.ui.tlStart=+el.dataset.d?addDays(S.ui.tlStart,+el.dataset.d):addDays(weekStart(today()),-7);save();render()},
  setVal:el=>{S.settings[el.dataset.k]=el.dataset.v;save();render()},
  export:exportJSON,
  exportCSV:()=>{const rows=[['Title','Project','Status','Priority','Start','Due','Estimate (h)','Tags','Completed']].concat(S.tasks.map(t=>[t.title,proj(t.project)?.name||'',STATUSES.find(s=>s.id===t.status)?.name,PRI[t.priority].n,t.start,t.due,t.est,t.tags.join(' '),t.completedAt||'']));
    download(`flowdeck-tasks-${today()}.csv`,rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n'),'text/csv');toast('CSV downloaded')},
  import:()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{const d=JSON.parse(await i.files[0].text());if(!d.tasks||!d.dashboards)throw 0;S=d;save();render();toast('Data imported')}catch(e){toast('That file is not a Flowdeck backup')}};i.click()},
  demo:()=>{if(!confirm('Replace your data with demo data?'))return;S=seed();save();render()},
  wipe:()=>{if(!confirm('Delete all tasks, projects, habits and goals and start empty? Export a backup first if you need it.'))return;const s=S.settings;S=seed();Object.assign(S,{tasks:[],projects:[{id:uid(),name:'General',color:'#7c5cff'}],log:{},habits:[],goals:[],notes:'',focus:{}});S.settings=s;save();render();toast('Fresh start ✨')},
};
const DBL={renameDash:()=>A.renameDash(),delHabit:el=>{if(confirm('Delete this habit?')){S.habits=S.habits.filter(h=>h.id!==el.dataset.id);save();refreshWidgets()}}};

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');
  if(e.target.id==='overlay'){closeModal();return}
  if(!el)return;
  if(el.dataset.act==='openTask'&&e.target.closest('.chk,button:not([data-act=openTask])')&&e.target.closest('[data-act]')!==el)return;
  if(el.dataset.act==='newTask'&&el.classList.contains('cell')&&e.target.closest('.ev'))return;
  e.stopPropagation();A[el.dataset.act]?.(el,e);
});
document.addEventListener('dblclick',e=>{const el=e.target.closest('[data-dbl]');if(el)DBL[el.dataset.dbl]?.(el)});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const ins=$$('input',f),v=ins[0].value.trim();
  const kind=f.dataset.form;
  if(kind==='quick'&&v){addQuick(v,f.dataset.extra?JSON.parse(f.dataset.extra):{});}
  if(kind==='habit'&&v)S.habits.push({id:uid(),name:v,color:PCOLORS[S.habits.length%PCOLORS.length],days:{}});
  if(kind==='goal'&&v)S.goals.push({id:uid(),name:v,p:0,color:PCOLORS[S.goals.length%PCOLORS.length]});
  if(kind==='link'){let u=ins[1].value.trim();if(!u)return ins[1].focus();if(!/^https?:\/\//.test(u))u='https://'+u;S.links.push({id:uid(),name:v||new URL(u).hostname,url:u})}
  save();ins.forEach(i=>i.value='');
  // keep focus in the same widget after refresh
  const wid=f.closest('[data-wid]')?.dataset.wid;render();if(wid)$(`[data-wid="${wid}"] form input`)?.focus();
});
let notesT;
document.addEventListener('input',e=>{
  if(e.target.matches('[data-notes]')){S.notes=e.target.value;clearTimeout(notesT);notesT=setTimeout(save,300)}
  if(e.target.matches('[data-set]')){const k=e.target.dataset.set,v=e.target.type==='number'?+e.target.value:e.target.value;S.settings[k]=v;if(k==='work'||k==='brk'){if(!P.run)P.left=null}save();if(k==='accent')applyTheme();if(k==='name')renderSide()}
  if(e.target.id==='fq'){S.ui.filter.q=e.target.value;save();const pos=e.target.selectionStart;render();const i=$('#fq');i.focus();i.setSelectionRange(pos,pos)}
});
document.addEventListener('change',e=>{if(e.target.id==='fp'){S.ui.filter.project=e.target.value;save();render()}if(e.target.id==='fpr'){S.ui.filter.priority=e.target.value;save();render()}});
document.addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName),modalOpen=$('#overlay').classList.contains('show');
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();modalOpen?closeModal():openPalette();return}
  if(e.key==='Escape'){if(modalOpen)closeModal();else if(editing){editing=false;render()}return}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&$('#mTitle')){saveTask();return}
  if(e.key==='Enter'&&e.target.id==='mTitle'){e.preventDefault();saveTask();return}
  if(typing||modalOpen||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(k==='n'){e.preventDefault();openTask()}
  else if(k==='t')toggleTheme();
  else if(k==='e'){if(S.ui.view!=='dashboard')go('dashboard');editing=!editing;render()}
  else if(k==='p')pomoToggle();
  else if(k==='?'||k==='/'&&e.shiftKey)helpModal();
  else{const v=Object.entries(VIEWS).find(([,x])=>x.k===e.key);if(v)go(v[0])}
});

/* ---------------- Drag & drop ---------------- */
let dragTask=null,dragWid=null;
function bindDnD(){
  // tasks
  $$('[data-task]').forEach(el=>{el.ondragstart=e=>{dragTask=el.dataset.task;el.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragTask)};el.ondragend=()=>{el.classList.remove('dragging');dragTask=null}});
  $$('[data-drop-status],[data-drop-day]').forEach(z=>{
    z.ondragover=e=>{if(!dragTask)return;e.preventDefault();z.classList.add('drop')};
    z.ondragleave=e=>{if(!z.contains(e.relatedTarget))z.classList.remove('drop')};
    z.ondrop=e=>{e.preventDefault();z.classList.remove('drop');const t=S.tasks.find(x=>x.id===dragTask);if(!t)return;
      if(z.dataset.dropStatus!=null){const ns=z.dataset.dropStatus;if(ns==='done'&&t.status!=='done')setDone(t,true);else if(ns!=='done'&&t.status==='done'){setDone(t,false);t.status=ns}else t.status=ns}
      if(z.dataset.dropDay!=null){t.due=z.dataset.dropDay;if(t.start&&t.due&&t.start>t.due)t.start=t.due}
      save();render()}});
  // widgets
  if(S.ui.view!=='dashboard'||!editing)return;
  $$('.widget').forEach(el=>{
    el.ondragstart=e=>{if(e.target.closest('.rz'))return e.preventDefault();dragWid=el.dataset.wid;el.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragWid)};
    el.ondragend=()=>{el.classList.remove('dragging');$$('.drag-over').forEach(x=>x.classList.remove('drag-over'));dragWid=null};
    el.ondragover=e=>{if(!dragWid||dragWid===el.dataset.wid)return;e.preventDefault();$$('.drag-over').forEach(x=>x!==el&&x.classList.remove('drag-over'));el.classList.add('drag-over')};
    el.ondrop=e=>{e.preventDefault();if(!dragWid)return;const L=curDash().widgets,from=L.findIndex(w=>w.id===dragWid);let to=L.findIndex(w=>w.id===el.dataset.wid);
      const r=el.getBoundingClientRect(),after=(e.clientX-r.left)>r.width/2;const [m]=L.splice(from,1);to=L.findIndex(w=>w.id===el.dataset.wid);L.splice(after?to+1:to,0,m);save();render()};
  });
  $$('.rz').forEach(h=>h.onpointerdown=e=>{
    e.preventDefault();e.stopPropagation();const id=h.dataset.rz,w=curDash().widgets.find(x=>x.id===id),el=h.closest('.widget'),grid=$('#grid');
    const cs=getComputedStyle(grid),gap=parseFloat(cs.columnGap),cols=cs.gridTemplateColumns.split(' ').length,colW=(grid.clientWidth-gap*(cols-1))/cols+gap,rowH=parseFloat(cs.gridAutoRows)+gap;
    const x0=e.clientX,y0=e.clientY,w0=w.w,h0=w.h;el.setAttribute('draggable','false');h.setPointerCapture(e.pointerId);
    h.onpointermove=ev=>{w.w=clamp(Math.round(w0+(ev.clientX-x0)/colW),2,12);w.h=clamp(Math.round(h0+(ev.clientY-y0)/rowH),1,8);el.style.gridColumn=`span ${w.w}`;el.style.gridRow=`span ${w.h}`;el.querySelector('.size-badge').textContent=`${w.w}×${w.h}`};
    h.onpointerup=()=>{h.onpointermove=null;h.onpointerup=null;save();render()};
  });
}

/* ---------------- Boot ---------------- */
render();pomoPaint();
// refresh live widgets every minute (due states, greeting)
setInterval(()=>{if(!$('#overlay').classList.contains('show'))refreshWidgets()},60000);
if(!localStorage.getItem('flowdeck.welcomed')){setTimeout(()=>toast('Welcome! Press Ctrl+K for commands or ? for shortcuts'),600);try{localStorage.setItem('flowdeck.welcomed','1')}catch(e){}}
