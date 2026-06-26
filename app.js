
let loginRole='admin', resolveId=null, ovCI=null, chatHistory=[], isBotTyping=false;
let lastEmployeeSheetModifiedAt=0, employeeSheetSyncing=false;
let pidNext=6;
const COMPANY={
  companyName:'Vayana Network',
  portalName:'HRPulse',
  portalSubtitle:'Internal HR Portal',
  supportEmail:'hr@vayana.com',
  securityNotice:'Authorized employees only. Activity may be reviewed for HR governance.',
  showDemoCredentials:true,
  ...(window.HRPULSE_COMPANY||{})
};

const CREDS={admin:{e:'admin@company.com',p:'admin123'},employee:{e:'priya@company.com',p:'emp123'}};

let policies=[
  {id:1,name:'Annual Leave Policy',cat:'Leave',status:'Active',date:'2024-01-01',desc:'Employees get 18 days of paid annual leave per year, accruing at 1.5 days per month. Up to 5 unused days can be carried forward to the next year.'},
  {id:2,name:'Sick Leave Policy',cat:'Leave',status:'Active',date:'2024-01-01',desc:'Up to 8 days paid sick leave per year. A medical certificate is required for absences of 3 or more consecutive days.'},
  {id:3,name:'Work from Home Policy',cat:'Remote Work',status:'Active',date:'2024-03-01',desc:'Employees may WFH up to 3 days per week with manager approval. Not available during the first 3 months of employment (probation). A stable internet connection and distraction-free workspace are required.'},
  {id:4,name:'Maternity & Paternity Leave',cat:'Benefits',status:'Draft',date:'2025-01-01',desc:'26 weeks maternity leave and 2 weeks paternity leave per statutory norms. Applicable after 6 months of continuous employment.'},
  {id:5,name:'2022 Attendance Policy',cat:'Attendance',status:'Archived',date:'2022-01-01',desc:'Legacy guidelines superseded by the 2024 policy.'},
];

let queries=[
  {id:1,emp:'Priya K.',subject:'Comp-off encashment',msg:'Can unused comp-off be encashed at year end?',status:'open',response:null,createdAt:'2026-06-18T09:10:00+05:30'},
  {id:2,emp:'Rajan M.',subject:'WFH during probation',msg:'Am I eligible for WFH during probation period?',status:'open',response:null,createdAt:'2026-06-18T09:35:00+05:30'},
  {id:3,emp:'Ananya T.',subject:'Sick leave certificate',msg:'Is a medical cert needed for a 2-day absence?',status:'pending',response:null,createdAt:'2026-06-18T10:05:00+05:30'},
  {id:4,emp:'Dev K.',subject:'Carry forward limit',msg:'How many leaves can I carry to next year?',status:'resolved',response:'Up to 5 days per Annual Leave Policy (Section 4).',createdAt:'2026-06-17T16:20:00+05:30'},
];

let lv={annual:{u:8,t:18},sick:{u:2,t:8},wfh:{u:5,t:12},comp:{u:1,t:3}};

function selRole(r){
  loginRole=r;
  document.getElementById('rt-admin').classList.toggle('sel',r==='admin');
  document.getElementById('rt-emp').classList.toggle('sel',r==='employee');
  const c=CREDS[r];
  document.getElementById('lEmail').value=c.e;
  document.getElementById('lPass').value=c.p;
}

function doLogin(){
  const e=document.getElementById('lEmail').value.trim();
  const p=document.getElementById('lPass').value;0
  const c=CREDS[loginRole];
  if(e===c.e&&p===c.p){
    document.getElementById('lErr').style.display='none';
    document.getElementById('s-login').classList.remove('active');
    const s=loginRole==='admin'?'s-admin':'s-employee';
    document.getElementById(s).classList.add('active');
    if(loginRole==='admin') renderPolicies();
    else initChat();
  } else {
    document.getElementById('lErr').style.display='block';
  }
}

function logout(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-login').classList.add('active');
}

function aPage(pg,el){
  document.querySelectorAll('#s-admin .pg').forEach(p=>p.classList.remove('act'));
  document.querySelectorAll('#aSidebar .ni').forEach(n=>n.classList.remove('act'));
  document.getElementById('pg-'+pg).classList.add('act');
  el.classList.add('act');
  if(pg==='policies') renderPolicies();
  if(pg==='queries') renderQueries();
  if(pg==='employees') renderEmpTable();
  if(pg==='adminOnboarding') renderAdminBvg();
  if(pg==='documents') renderAdminDocuments();
  if(pg==='announcements') renderAnnouncements();
  if(pg==='overview') renderOverview();
}

function ePage(pg,el){
  document.querySelectorAll('#s-employee .pg').forEach(p=>p.classList.remove('act'));
  document.querySelectorAll('#eSidebar .ni').forEach(n=>n.classList.remove('act'));
  document.getElementById('pg-'+pg).classList.add('act');
  el.classList.add('act');
  if(pg==='home') renderEmployeeHome();
  if(pg==='ePolicies') renderEPolicies();
  if(pg==='eDocuments') renderEmployeeDocuments();
  if(pg==='raiseQuery') renderMyQueries();
  if(pg==='news') renderNewsPortal();
  if(pg==='engage') renderEngage();
  if(pg==='games') renderGameTab();
}

function renderPolicies(){
  const l=document.getElementById('polList');
  l.innerHTML='';
  policies.forEach(p=>{
    const d=document.createElement('div');
    d.className='row-item';
    d.innerHTML=`<div><div class="ri-name">${p.name}</div><div class="ri-meta">${p.cat} · ${p.date}</div></div><div class="ri-right"><span class="badge b-${p.status.toLowerCase()}">${p.status}</span><button class="btn sm" title="Cycle status" onclick="cycleStatus(${p.id})"><i class="ti ti-refresh" aria-hidden="true"></i></button><button class="btn sm danger" title="Delete" onclick="delPol(${p.id})"><i class="ti ti-trash" aria-hidden="true"></i></button></div>`;
    l.appendChild(d);
  });
  document.getElementById('sTot').textContent=policies.length;
  document.getElementById('sAct').textContent=policies.filter(p=>p.status==='Active').length;
  document.getElementById('sDraft').textContent=policies.filter(p=>p.status==='Draft').length;
  document.getElementById('sArch').textContent=policies.filter(p=>p.status==='Archived').length;
}

function renderQueries(){
  const l=document.getElementById('aQList');
  l.innerHTML='';
  queries.forEach(q=>{
    const d=document.createElement('div');
    d.className='row-item';
    d.style.cssText='flex-direction:column;align-items:flex-start;gap:6px';
    d.innerHTML=`<div style="display:flex;justify-content:space-between;width:100%;align-items:center"><div><div class="ri-name">${q.subject}</div><div class="ri-meta">${q.emp} · ${q.msg.slice(0,55)}${q.msg.length>55?'…':''}</div></div><span class="badge b-${q.status}">${q.status}</span></div>${q.response?`<div style="font-size:11px;color:var(--color-text-success);background:var(--color-background-success);padding:5px 8px;border-radius:4px;width:100%"><i class="ti ti-check" aria-hidden="true"></i> ${q.response}</div>`:q.status!=='resolved'?`<button class="btn sm" onclick="openResolve(${q.id})">Respond &amp; resolve</button>`:''}`;
    l.appendChild(d);
  });
  const open=queries.filter(q=>q.status!=='resolved').length;
  document.getElementById('qBadge').textContent=open;
  if(document.getElementById('ovQ')) document.getElementById('ovQ').textContent=open;
}

function renderEmpTable(){
  const emps=[
    {name:'Priya K.',dept:'Engineering',au:8,at:18,su:2,wu:5},
    {name:'Rajan M.',dept:'Finance',au:5,at:18,su:0,wu:3},
    {name:'Ananya T.',dept:'Design',au:12,at:18,su:3,wu:7},
    {name:'Dev K.',dept:'Marketing',au:2,at:18,su:1,wu:4},
  ];
  document.getElementById('eTable').innerHTML=`<thead><tr><th>Name</th><th>Dept</th><th>Annual used</th><th>Annual left</th><th>Sick used</th><th>WFH used</th></tr></thead><tbody>${emps.map(e=>{const al=e.at-e.au;return `<tr><td style="font-weight:500">${e.name}</td><td style="color:var(--color-text-secondary)">${e.dept}</td><td>${e.au}</td><td style="color:${al<5?'#A32D2D':'#3B6D11'}">${al}</td><td>${e.su}</td><td>${e.wu}</td></tr>`;}).join('')}</tbody>`;
}

function renderOverview(){
  if(document.getElementById('ovAct')) document.getElementById('ovAct').textContent=policies.filter(p=>p.status==='Active').length;
  const engagement=document.getElementById('engagementAdminStats');
  if(engagement&&store){
    const moodCount=(store.moodPulse||[]).length;
    const wallCount=(store.teamWall||[]).length;
    const completions=store.employees.reduce((sum,e)=>sum+(e.learningCompletions||[]).length,0);
    const acknowledged=store.employees.reduce((sum,e)=>sum+(e.documents||[]).filter(d=>d.acknowledgedAt).length,0);
    engagement.innerHTML=`<div class="engage-stats"><div><span>Mood check-ins</span><strong>${moodCount}</strong></div><div><span>Wall posts</span><strong>${wallCount}</strong></div><div><span>Lessons done</span><strong>${completions}</strong></div><div><span>Docs acknowledged</span><strong>${acknowledged}</strong></div></div>`;
  }
  const ctx=document.getElementById('ovChart');
  if(!ctx) return;
  if(ovCI) ovCI.destroy();
  ovCI=new Chart(ctx,{type:'bar',data:{labels:['Priya','Rajan','Ananya','Dev'],datasets:[{label:'Annual',data:[8,5,12,2],backgroundColor:'#7F77DD'},{label:'Sick',data:[2,0,3,1],backgroundColor:'#1D9E75'},{label:'WFH',data:[5,3,7,4],backgroundColor:'#EF9F27'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{stepSize:5}}}}});
}

function renderEPolicies(){
  const el=document.getElementById('ePList');
  el.innerHTML='';
  policies.filter(p=>p.status==='Active').forEach(p=>{
    const d=document.createElement('div');
    d.className='card';
    d.innerHTML=`<div class="card-hd"><div class="card-title"><i class="ti ti-file-text" aria-hidden="true"></i> ${p.name}</div><span class="badge b-active">${p.cat}</span></div><div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6">${p.desc}</div><div style="font-size:11px;color:var(--color-text-tertiary);margin-top:8px">Effective ${p.date}</div>`;
    el.appendChild(d);
  });
}

function openM(id){document.getElementById(id).classList.add('open')}
function closeM(id){document.getElementById(id).classList.remove('open')}

function addPolicy(){
  if(typeof window.importPolicies==='function'){
    window.importPolicies();
    return;
  }
  toast('Policy importer is still loading. Please refresh and try again.');
}

function delPol(id){policies=policies.filter(p=>p.id!==id);renderPolicies();toast('Policy removed')}

function cycleStatus(id){
  const p=policies.find(x=>x.id===id);
  if(!p) return;
  p.status=p.status==='Active'?'Draft':p.status==='Draft'?'Archived':'Active';
  renderPolicies();toast(`Status → ${p.status}`);
}

function openResolve(id){
  resolveId=id;
  const q=queries.find(x=>x.id===id);
  document.getElementById('resDetail').innerHTML=`<strong>${q.subject}</strong><br><span style="color:var(--color-text-tertiary)">${q.emp}</span><br>${q.msg}`;
  document.getElementById('hrR').value='';
  openM('mRes');
}

function resolveQ(){
  const r=document.getElementById('hrR').value.trim();
  if(!r){toast('Enter a response');return;}
  const q=queries.find(x=>x.id===resolveId);
  if(q){q.status='resolved';q.response=r;}
  closeM('mRes');renderQueries();toast('Query resolved');
}

function applyLeave(){
  const type=document.getElementById('lvT').value;
  const days=parseInt(document.getElementById('lvD').value)||1;
  const key=type==='Annual'?'annual':type==='Sick'?'sick':type==='WFH'?'wfh':'comp';
  const b=lv[key];
  if(b.u+days>b.t){toast(`Not enough ${type} balance`);return;}
  b.u+=days;
  updateBars();
  document.getElementById('lvR').value='';
  queries.push({id:Date.now(),emp:'Priya K.',subject:`${type} leave — ${days} day(s)`,msg:`Applied for ${days} day(s) of ${type} leave.`,status:'pending',response:null});
  document.getElementById('qBadge').textContent=queries.filter(q=>q.status!=='resolved').length;
  toast(`${days} day(s) of ${type} leave submitted`);
}

function updateBars(){
  const a=lv.annual,s=lv.sick,w=lv.wfh,c=lv.comp;
  document.getElementById('eAL').textContent=a.t-a.u;
  document.getElementById('eSL').textContent=s.t-s.u;
  document.getElementById('eWL').textContent=w.t-w.u;
  document.getElementById('eCL').textContent=c.t-c.u;
  document.getElementById('aBar').style.width=Math.round(a.u/a.t*100)+'%';
  document.getElementById('skBar').style.width=Math.round(s.u/s.t*100)+'%';
  document.getElementById('wBar').style.width=Math.round(w.u/w.t*100)+'%';
  document.getElementById('cBar').style.width=Math.round(c.u/c.t*100)+'%';
  document.getElementById('aTxt').textContent=`${a.u} used · ${a.t-a.u} remaining of ${a.t}`;
  document.getElementById('skTxt').textContent=`${s.u} used · ${s.t-s.u} remaining of ${s.t}`;
  document.getElementById('wTxt').textContent=`${w.u} used · ${w.t-w.u} remaining of ${w.t}`;
  document.getElementById('cTxt').textContent=`${c.u} used · ${c.t-c.u} remaining of ${c.t}`;
}

function initChat(){
  chatHistory=[];
  document.getElementById('chatMsgs').innerHTML='';
  document.getElementById('chatErr').style.display='none';
  addBot("Hi Priya! I'm your HR assistant, powered by Claude. I know your leave balances and all active company policies. What would you like to know?");
}

function addBot(text){
  const el=document.createElement('div');
  el.className='msg bot';
  el.textContent=text;
  document.getElementById('chatMsgs').appendChild(el);
  scrollC();
}

function addUser(text){
  const el=document.createElement('div');
  el.className='msg user';
  el.textContent=text;
  document.getElementById('chatMsgs').appendChild(el);
  scrollC();
}

function showTyping(){
  const el=document.createElement('div');
  el.className='msg typing';el.id='typEl';
  el.innerHTML='<div class="dots"><span></span><span></span><span></span></div>';
  document.getElementById('chatMsgs').appendChild(el);scrollC();
}

function hideTyping(){const el=document.getElementById('typEl');if(el)el.remove();}
function scrollC(){const c=document.getElementById('chatMsgs');c.scrollTop=c.scrollHeight;}

function chipQ(q){document.getElementById('chatIn').value=q;sendChat();}

async function sendChat(){
const res = await fetch("/api/hr-policy-ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: msg,
    policies: store.policies.filter(p => p.status === "Active")
  })
});

const data = await res.json();
addBot(data.answer);

  const a=lv.annual,s=lv.sick,w=lv.wfh,c=lv.comp;
  const polCtx=policies.filter(p=>p.status==='Active').map(p=>`• ${p.name}: ${p.desc}`).join('\n');
  const sys=`You are a friendly HR assistant chatbot for HRPulse. You are chatting with Priya K., an employee.

PRIYA'S LIVE LEAVE BALANCES:
• Annual leave: ${a.u} used, ${a.t-a.u} remaining (total ${a.t})
• Sick leave: ${s.u} used, ${s.t-s.u} remaining (total ${s.t})
• Work from home: ${w.u} used, ${w.t-w.u} remaining (total ${w.t})
• Comp-off: ${c.u} used, ${c.t-c.u} remaining (total ${c.t})

ACTIVE COMPANY POLICIES:
${polCtx}

Rules:
- Be warm, concise, and helpful (2–4 sentences).
- Always cite real balances and policy details when relevant.
- If someone wants to apply for leave, tell them to use the "My leaves" tab.
- Never invent policies not listed above.`;

  try {
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:500,system:sys,messages:chatHistory})
    });
    if(!res.ok) throw new Error('API error '+res.status);
    const data=await res.json();
    hideTyping();
    isBotTyping=false;
    const reply=data.content?.map(b=>b.type==='text'?b.text:'').join('')||'Sorry, I could not get a response.';
    chatHistory.push({role:'assistant',content:reply});
    addBot(reply);
  } catch(err){
    hideTyping();
    isBotTyping=false;
    document.getElementById('chatErr').style.display='block';
  }
}

function toast(msg){
  const n=document.getElementById('notif');
  n.textContent=msg;n.classList.add('show');
  setTimeout(()=>n.classList.remove('show'),2200);
}

document.querySelectorAll('.modal-bg').forEach(bg=>bg.addEventListener('click',e=>{if(e.target===bg)bg.classList.remove('open')}));
document.getElementById('pDt').valueAsDate=new Date();



/* Live multi-user portal layer: localStorage keeps this frontend-only demo persistent. */
const HRP_KEY='hrpulse_live_portals_v1';
const HRP_GAME_KEY='hrpulse_word_wonders_progress_v1';
let liveRole='hr', currentUser=null, liveResolveId=null, liveChart=null, botBusy=false;
let profileCropState={src:'',x:0,y:0,zoom:1,rotation:0,cropped:''};
const DOCUMENT_TYPES=[
  {key:'offer',label:'Offer Letter',icon:'ti-file-certificate'},
  {key:'appointment',label:'Appointment Letter',icon:'ti-briefcase'},
  {key:'payslip',label:'Payslips',icon:'ti-receipt-2'},
  {key:'tax',label:'Tax Documents',icon:'ti-file-dollar'}
];
const BVG_DOCUMENTS=[
  {key:'identity',label:'Government ID proof',hint:'Aadhaar, passport, PAN, or driving licence'},
  {key:'address',label:'Address proof',hint:'Utility bill, bank statement, rent agreement, or Aadhaar'},
  {key:'education',label:'Education certificate',hint:'Highest qualification marksheet or degree certificate'},
  {key:'experience',label:'Previous employment proof',hint:'Experience letter, relieving letter, or latest payslip'},
  {key:'photo',label:'Passport-size photo',hint:'Clear recent photograph'}
];
const ENGAGE_QUIZ=[
  {id:'policy-basics',title:'Policy basics',question:'Where should you check the latest active HR rules?',options:['Company policies tab','Old chat screenshots','Ask a friend only'],answer:0},
  {id:'leave-ready',title:'Leave readiness',question:'What is the best first step before taking planned leave?',options:['Apply with reason in the portal','Disappear for a day','Tell HR after returning'],answer:0},
  {id:'doc-care',title:'Document care',question:'What should you do after HR uploads an important document?',options:['Download and acknowledge it','Ignore it','Forward it publicly'],answer:0}
];

const seedData={
  hrs:[
    {id:'hr-1',name:'Meera Shah',email:'admin@company.com',password:'admin123',title:'HR Admin'},
    {id:'hr-2',name:'Nikhil Rao',email:'nikhil.hr@company.com',password:'hr123',title:'People Partner'}
  ],
  employees:[
    {id:'emp-1',name:'Priya K.',email:'priya@company.com',password:'emp123',mustChangePassword:false,dept:'Engineering',role:'Frontend Engineer',status:'Active',manager:'Amit S.',profile:{dob:'1998-05-12',hobbies:'Reading, badminton',photo:''},leave:{annual:{u:8,t:18},sick:{u:2,t:8},wfh:{u:5,t:12},comp:{u:1,t:3}}},
    {id:'emp-2',name:'Rajan M.',email:'rajan@company.com',password:'emp123',mustChangePassword:false,dept:'Finance',role:'Analyst',status:'Active',manager:'Meera Shah',profile:{dob:'1994-06-22',hobbies:'Cricket, finance podcasts',photo:''},leave:{annual:{u:5,t:18},sick:{u:0,t:8},wfh:{u:3,t:12},comp:{u:0,t:3}}},
    {id:'emp-3',name:'Ananya T.',email:'ananya@company.com',password:'emp123',mustChangePassword:false,dept:'Design',role:'Product Designer',status:'Active',manager:'Amit S.',profile:{dob:'1996-06-25',hobbies:'Sketching, travel',photo:''},leave:{annual:{u:12,t:18},sick:{u:3,t:8},wfh:{u:7,t:12},comp:{u:0,t:3}}},
    {id:'emp-4',name:'Dev K.',email:'dev@company.com',password:'emp123',mustChangePassword:false,dept:'Marketing',role:'Growth Lead',status:'Active',manager:'Nikhil Rao',profile:{dob:'1993-07-04',hobbies:'Music, football',photo:''},leave:{annual:{u:2,t:18},sick:{u:1,t:8},wfh:{u:4,t:12},comp:{u:0,t:3}}}
  ],
  policies:[
    {id:1,name:'Annual Leave Policy',cat:'Leave',status:'Active',date:'2024-01-01',desc:'Employees get 18 days of paid annual leave per year, accruing at 1.5 days per month. Up to 5 unused days can be carried forward to the next year.'},
    {id:2,name:'Sick Leave Policy',cat:'Leave',status:'Active',date:'2024-01-01',desc:'Up to 8 days paid sick leave per year. A medical certificate is required for absences of 3 or more consecutive days.'},
    {id:3,name:'Work from Home Policy',cat:'Remote Work',status:'Active',date:'2024-03-01',desc:'Employees may WFH up to 3 days per week with manager approval. Not available during the first 3 months of employment.'},
    {id:4,name:'Maternity & Paternity Leave',cat:'Benefits',status:'Draft',date:'2025-01-01',desc:'26 weeks maternity leave and 2 weeks paternity leave per statutory norms. Applicable after 6 months of continuous employment.'},
    {id:5,name:'2022 Attendance Policy',cat:'Attendance',status:'Archived',date:'2022-01-01',desc:'Legacy guidelines superseded by the 2024 policy.'}
  ],
  queries:[
    {id:1,empId:'emp-1',emp:'Priya K.',category:'Benefits',subject:'Comp-off encashment',msg:'Can unused comp-off be encashed at year end?',status:'open',response:null,createdAt:'2026-06-18T09:10:00+05:30'},
    {id:2,empId:'emp-2',emp:'Rajan M.',category:'Policy',subject:'WFH during probation',msg:'Am I eligible for WFH during probation period?',status:'open',response:null,createdAt:'2026-06-18T09:35:00+05:30'},
    {id:3,empId:'emp-3',emp:'Ananya T.',category:'Leave',subject:'Sick leave certificate',msg:'Is a medical cert needed for a 2-day absence?',status:'pending',response:null,createdAt:'2026-06-18T10:05:00+05:30'},
    {id:4,empId:'emp-4',emp:'Dev K.',category:'Leave',subject:'Carry forward limit',msg:'How many leaves can I carry to next year?',status:'resolved',response:'Up to 5 days per Annual Leave Policy.',createdAt:'2026-06-17T16:20:00+05:30'}
  ],
  events:[
    {id:'evt-1',title:'Quarterly Town Hall',date:'2026-06-24',time:'4:00 PM',location:'Main Auditorium',desc:'Leadership updates, employee recognitions, and open Q&A.'},
    {id:'evt-2',title:'Wellness Week',date:'2026-06-27',time:'All day',location:'Campus and online',desc:'Health sessions, yoga, preventive checkups, and wellness consultations.'},
    {id:'evt-3',title:'Learning Friday',date:'2026-07-03',time:'2:30 PM',location:'Training Room 2',desc:'Skill-sharing session hosted by Engineering and HR.'}
  ],
  news:[
    {id:'news-1',title:'New hybrid work guideline published',date:'2026-06-18',tag:'Policy',body:'Employees can review the latest WFH guidance in the Policies section.'},
    {id:'news-2',title:'Employee referral drive opens next week',date:'2026-06-19',tag:'Hiring',body:'Refer candidates for open roles and track referral rewards through HR.'},
    {id:'news-3',title:'Benefits helpdesk hours extended',date:'2026-06-20',tag:'Benefits',body:'HR support will be available until 7 PM through the end of the month.'}
  ],
  teamWall:[
    {id:'wall-1',empId:'emp-1',emp:'Priya K.',tag:'Shoutout',msg:'Huge thanks to Design for the quick policy poster refresh.',createdAt:'2026-06-18T11:20:00+05:30',likes:['emp-3']}
  ],
  moodPulse:[],
  nextPolicyId:6,
  nextQueryId:5,
  nextEmployeeId:5
};

let store=loadStore();

function loadStore(){
  try{
    const raw=localStorage.getItem(HRP_KEY);
    return normalizeStore(raw?JSON.parse(raw):structuredClone(seedData));
  }catch(err){
    return normalizeStore(JSON.parse(JSON.stringify(seedData)));
  }
}
function saveStore(){localStorage.setItem(HRP_KEY,JSON.stringify(store));}
function normalizeStore(data){
  const base=JSON.parse(JSON.stringify(seedData));
  const merged={...base,...data};
  merged.hrs=Array.isArray(data.hrs)?data.hrs:base.hrs;
  merged.employees=Array.isArray(data.employees)?data.employees:base.employees;
  merged.policies=Array.isArray(data.policies)?data.policies:base.policies;
  merged.policySources=Array.isArray(data.policySources)?data.policySources:[];
  merged.queries=Array.isArray(data.queries)?data.queries:base.queries;
  merged.events=Array.isArray(data.events)?data.events:base.events;
  merged.news=Array.isArray(data.news)?data.news:base.news;
  merged.teamWall=Array.isArray(data.teamWall)?data.teamWall:base.teamWall;
  merged.moodPulse=Array.isArray(data.moodPulse)?data.moodPulse:base.moodPulse;
  merged.news.forEach(n=>{n.reactions=n.reactions||{};});
  merged.policies.forEach(p=>{
    p.format=p.format||'text';
    p.updatedAt=p.updatedAt||p.date||new Date().toISOString();
  });
  merged.queries.forEach((q,i)=>{
    q.id=q.id||i+1;
    q.status=q.status||'open';
    q.category=q.category||'General';
    q.createdAt=q.createdAt||new Date().toISOString();
  });
  merged.employees.forEach((e,i)=>{
    e.id=e.id||`emp-${i+1}`;
    e.status=e.status||'Active';
    e.password=e.password||'emp123';
    e.mustChangePassword=Boolean(e.mustChangePassword);
    e.profile=e.profile||{};
    e.profile.dob=e.profile.dob||'';
    e.profile.hobbies=e.profile.hobbies||'';
    e.profile.photo=e.profile.photo||'';
    const seedEmployee=base.employees.find(emp=>emp.id===e.id);
    if(seedEmployee?.profile){
      e.profile.dob=e.profile.dob||seedEmployee.profile.dob||'';
      e.profile.hobbies=e.profile.hobbies||seedEmployee.profile.hobbies||'';
    }
    e.leave=e.leave||JSON.parse(JSON.stringify(base.employees[0].leave));
    ['annual','sick','wfh','comp'].forEach(k=>{e.leave[k]=e.leave[k]||{u:0,t:k==='annual'?18:k==='sick'?8:k==='wfh'?12:3};});
    e.policyReads=e.policyReads||{};
    e.learningCompletions=Array.isArray(e.learningCompletions)?e.learningCompletions:[];
    e.dismissedNotifications=Array.isArray(e.dismissedNotifications)?e.dismissedNotifications:[];
    e.documents=Array.isArray(e.documents)?e.documents:[];
    e.documents.forEach(doc=>{doc.acknowledgedAt=doc.acknowledgedAt||'';});
    e.gameProgress=e.gameProgress||null;
    e.bvg=e.bvg||{};
    e.bvg.status=e.bvg.status||'approved';
    e.bvg.docs=e.bvg.docs||{};
    e.bvg.note=e.bvg.note||'';
    e.bvg.submittedAt=e.bvg.submittedAt||'';
    e.bvg.reviewedAt=e.bvg.reviewedAt||'';
    e.bvg.reviewedBy=e.bvg.reviewedBy||'';
  });
  merged.nextPolicyId=merged.nextPolicyId||Math.max(0,...merged.policies.map(p=>Number(p.id)||0))+1;
  merged.nextQueryId=merged.nextQueryId||Math.max(0,...merged.queries.map(q=>Number(q.id)||0))+1;
  merged.nextEmployeeId=merged.nextEmployeeId||Math.max(0,...merged.employees.map(e=>Number(String(e.id).replace(/\D/g,''))||0))+1;
  return merged;
}
function initials(name){return name.split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase();}
function employeeById(id){return store.employees.find(e=>e.id===id);}
function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function docTypeLabel(type){return DOCUMENT_TYPES.find(d=>d.key===type)?.label||'Document';}
function docTypeIcon(type){return DOCUMENT_TYPES.find(d=>d.key===type)?.icon||'ti-file';}
function avatarHtml(employee, cls='av av-e'){
  return employee?.profile?.photo
    ? `<img class="${cls} avatar-img" src="${employee.profile.photo}" alt="${employee.name} profile picture">`
    : `<div class="${cls}">${initials(employee?.name||'Employee')}</div>`;
}
function formatDob(value){
  if(!value) return 'Not added';
  const dt=new Date(`${value}T00:00:00`);
  if(Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function formatQueryTime(value){
  const dt=new Date(value||Date.now());
  if(Number.isNaN(dt.getTime())) return 'Time unavailable';
  return dt.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function policyUpdatedTime(policy){
  const dt=new Date(policy?.updatedAt||policy?.date||Date.now());
  return Number.isNaN(dt.getTime())?0:dt.getTime();
}
function policyReadValue(employee,policyId){
  return employee?.policyReads?.[policyId];
}
function policyReadTime(employee,policyId){
  const value=policyReadValue(employee,policyId);
  const raw=typeof value==='string'?value:value?.acknowledgedAt;
  const dt=new Date(raw||0);
  return Number.isNaN(dt.getTime())?0:dt.getTime();
}
function isPolicyAcknowledgedCurrent(employee,policy){
  const readTime=policyReadTime(employee,policy.id);
  return Boolean(readTime&&readTime>=policyUpdatedTime(policy));
}
function policyReadStats(employee){
  const active=store.policies.filter(p=>p.status==='Active');
  const read=active.filter(p=>isPolicyAcknowledgedCurrent(employee,p)).length;
  return {read,total:active.length};
}
function policyReadDetails(employee){
  const active=store.policies.filter(p=>p.status==='Active');
  if(!active.length) return '<div class="ri-meta">No active policies assigned</div>';
  return `<div class="policy-read-list">${active.map(p=>{
    const readAt=policyReadValue(employee,p.id);
    const current=isPolicyAcknowledgedCurrent(employee,p);
    return `<span class="policy-read-chip ${current?'done':'todo'}"><i class="ti ${current?'ti-check':'ti-clock'}" aria-hidden="true"></i> ${p.name}${current?` - ${formatQueryTime(typeof readAt==='string'?readAt:readAt?.acknowledgedAt)}`:readAt?' - updated, reread needed':' - not read'}</span>`;
  }).join('')}</div>`;
}
function portalBrand(role){
  const name=COMPANY.portalName||'HRPulse';
  const split=name.length>2?`<span>${name.slice(0,2)}</span>${name.slice(2)}`:name;
  return `${split} <span style="font-size:11px;color:var(--color-text-tertiary);font-weight:400;margin-left:4px">${role}</span>`;
}
function applyCompanyBranding(){
  document.title=`${COMPANY.portalName} - ${COMPANY.companyName} HR portal`;
  document.querySelector('.sr-only').textContent=`${COMPANY.portalName} - ${COMPANY.companyName} HR portal`;
  const loginBrand=document.querySelector('.login-brand');
  if(loginBrand) loginBrand.innerHTML=portalBrand('').replace(/ <span[^>]*><\/span>$/,'');
  const loginSub=document.querySelector('.login-sub');
  if(loginSub) loginSub.textContent=`Sign in to ${COMPANY.companyName} HR workspace`;
  const loginTag=document.querySelector('.login-tagline');
  if(loginTag) loginTag.textContent=`${COMPANY.portalSubtitle}`;
  const notice=document.getElementById('securityNotice');
  if(notice) notice.textContent=COMPANY.securityNotice;
  const hint=document.getElementById('loginHint');
  if(hint) hint.style.display=COMPANY.showDemoCredentials?'block':'none';
  const adminBrand=document.querySelector('#s-admin .brand');
  if(adminBrand) adminBrand.innerHTML=portalBrand('Admin');
  const empBrand=document.querySelector('#s-employee .brand');
  if(empBrand) empBrand.innerHTML=portalBrand('Employee');
  document.querySelectorAll('.portal-footer').forEach(el=>el.remove());
  document.querySelectorAll('#s-admin .main,#s-employee .main').forEach(main=>{
    main.insertAdjacentHTML('beforeend',`<div class="portal-footer">${COMPANY.companyName} ${COMPANY.portalSubtitle} - Support: ${COMPANY.supportEmail}</div>`);
  });
}
function policySummary(p){
  return p.desc||'No description added yet.';
}
function policyAttachmentLink(p){
  const source=p.sourceId?(store.policySources||[]).find(s=>s.id===p.sourceId):null;
  const fileData=p.fileData||p.sourceFileData||source?.fileData;
  if(!fileData) return '';
  const fileName=p.fileName||p.sourceFileName||source?.fileName||`${p.name}.pdf`;
  return `<a class="policy-file-link" href="${fileData}" target="_blank" rel="noopener" download="${fileName}"><i class="ti ti-file" aria-hidden="true"></i> Source: ${fileName}</a>`;
}
function policyFormatLabel(p){
  if(p.format==='master-document') return 'Imported';
  return (p.format||'text').toUpperCase();
}
function activePolicies(){return store.policies.filter(p=>p.status==='Active');}
function employeeQueries(employee){return store.queries.filter(q=>q.empId===employee?.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));}
function unreadPolicies(employee){return activePolicies().filter(p=>!isPolicyAcknowledgedCurrent(employee,p));}
function formatDateOnly(value){
  const dt=new Date(`${value}T00:00:00`);
  if(Number.isNaN(dt.getTime())) return value||'Date pending';
  return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function sortedEvents(){
  return (store.events||[]).slice().sort((a,b)=>new Date(`${a.date}T00:00:00`)-new Date(`${b.date}T00:00:00`));
}
function upcomingEvents(){
  const today=new Date();
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  return sortedEvents().filter(ev=>{
    const dt=new Date(`${ev.date}T00:00:00`);
    return !Number.isNaN(dt.getTime())&&dt>=start;
  });
}
function latestNews(){
  return (store.news||[]).slice().sort((a,b)=>new Date(`${b.date}T00:00:00`)-new Date(`${a.date}T00:00:00`));
}
function nextBirthdayDate(dob){
  if(!dob) return null;
  const parts=dob.split('-').map(Number);
  if(parts.length<3||!parts[1]||!parts[2]) return null;
  const today=new Date();
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  let next=new Date(today.getFullYear(),parts[1]-1,parts[2]);
  if(next<start) next=new Date(today.getFullYear()+1,parts[1]-1,parts[2]);
  return next;
}
function upcomingBirthdays(employee){
  return store.employees
    .filter(emp=>emp.status==='Active'&&emp.id!==employee?.id&&emp.profile?.dob)
    .map(emp=>({employee:emp,date:nextBirthdayDate(emp.profile.dob)}))
    .filter(item=>item.date&&!Number.isNaN(item.date.getTime()))
    .sort((a,b)=>a.date-b.date);
}
function shortDateFromDate(date){
  return date.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
}
function leaveTotals(employee){
  const l=employee.leave;
  const keys=['annual','sick','wfh','comp'];
  return keys.reduce((acc,k)=>{acc.total+=l[k].t; acc.used+=l[k].u; acc.left+=l[k].t-l[k].u; return acc;},{total:0,used:0,left:0});
}
function profileCompletion(employee){
  const checks=[employee.profile?.photo,employee.profile?.dob,employee.profile?.hobbies,employee.role,employee.manager];
  return Math.round((checks.filter(Boolean).length/checks.length)*100);
}
function employeeBadges(employee){
  const pr=policyReadStats(employee);
  const docs=(employee.documents||[]);
  const gamePoints=Number(employee.gameProgress?.points)||0;
  const wallPosts=(store.teamWall||[]).filter(p=>p.empId===employee.id).length;
  return [
    {title:'Policy Champion',icon:'ti-shield-check',earned:pr.total>0&&pr.read===pr.total,meta:`${pr.read}/${pr.total} policies`},
    {title:'Profile Pro',icon:'ti-user-check',earned:profileCompletion(employee)>=80,meta:`${profileCompletion(employee)}% complete`},
    {title:'Document Ready',icon:'ti-folder-check',earned:docs.length>0&&docs.every(d=>d.acknowledgedAt),meta:`${docs.filter(d=>d.acknowledgedAt).length}/${docs.length||0} acknowledged`},
    {title:'Word Wizard',icon:'ti-trophy',earned:gamePoints>=100,meta:`${gamePoints} game points`},
    {title:'Team Voice',icon:'ti-speakerphone',earned:wallPosts>0,meta:`${wallPosts} wall post${wallPosts===1?'':'s'}`}
  ];
}
function currentMood(employee){
  const week=new Date().toISOString().slice(0,10);
  return (store.moodPulse||[]).find(m=>m.empId===employee.id&&m.week===week);
}
function leavePlannerSuggestion(employee){
  const annualLeft=(employee.leave?.annual?.t||0)-(employee.leave?.annual?.u||0);
  if(annualLeft>=5) return 'You can plan a full week off or split it into two long weekends.';
  if(annualLeft>=2) return 'A short recharge break is available. Consider pairing with a weekend.';
  return 'Annual leave is low. Use WFH or comp-off if applicable.';
}
function openEmployeePage(pg){
  const item=[...document.querySelectorAll('#eSidebar .ni')].find(n=>n.getAttribute('onclick')?.includes(`'${pg}'`));
  if(item) ePage(pg,item);
}
function renderEmployeeHome(){
  const e=employeeById(currentUser?.id)||store.employees[0];
  if(!e||!document.getElementById('pg-home')) return;
  const pr=policyReadStats(e);
  const totals=leaveTotals(e);
  const mine=employeeQueries(e);
  const openQ=mine.filter(q=>q.status!=='resolved').length;
  const replies=mine.filter(q=>q.response).length;
  const unread=unreadPolicies(e);
  const score=Math.round(((pr.total?pr.read/pr.total:1)*40)+((openQ===0?1:0)*25)+((totals.left>0?1:0)*20)+((replies>0?1:0)*15));
  document.getElementById('homeTitle').textContent=`Welcome, ${e.name.split(' ')[0]}`;
  document.getElementById('homeSub').textContent=`${e.role||'Employee'} - ${e.dept||'General'}`;
  document.getElementById('homeScore').textContent=`${score}%`;
  const profileCard=document.getElementById('profileCard');
  if(profileCard) profileCard.innerHTML=`<div class="profile-top">${avatarHtml(e,'av av-e profile-photo')}<div><div class="ri-name">${e.name}</div><div class="ri-meta">${e.email}</div></div></div><div class="profile-grid"><div><span>Department</span><strong>${e.dept}</strong></div><div><span>Role</span><strong>${e.role||'Employee'}</strong></div><div><span>Manager</span><strong>${e.manager||'HR'}</strong></div><div><span>Status</span><strong>${e.status}</strong></div><div><span>Date of birth</span><strong>${formatDob(e.profile?.dob)}</strong></div><div><span>Hobbies</span><strong>${e.profile?.hobbies||'Not added'}</strong></div></div><button class="btn sm profile-edit-btn" onclick="openEmployeeProfileEditor()"><i class="ti ti-pencil" aria-hidden="true"></i> Edit profile</button>`;
  const homeStats=document.getElementById('homeStats');
  if(homeStats) homeStats.innerHTML=`<div class="stat"><div class="stat-l">Leave balance</div><div class="stat-v">${totals.left}</div></div><div class="stat"><div class="stat-l">Policies read</div><div class="stat-v">${pr.read}/${pr.total}</div></div><div class="stat"><div class="stat-l">Open queries</div><div class="stat-v">${openQ}</div></div><div class="stat"><div class="stat-l">HR replies</div><div class="stat-v">${replies}</div></div>`;
  const eventNotes=upcomingEvents().slice(0,2).map(ev=>({id:`event-${ev.id}`,icon:'ti-calendar-event',title:`Event: ${ev.title}`,meta:`${formatDateOnly(ev.date)} - ${ev.time||'Time pending'}`}));
  const birthdayNotes=upcomingBirthdays(e).slice(0,2).map(item=>({id:`birthday-${item.employee.id}-${shortDateFromDate(item.date)}`,icon:'ti-cake',title:`Birthday: ${item.employee.name}`,meta:`${shortDateFromDate(item.date)} - ${item.employee.dept||'Team'}`}));
  const newsNotes=latestNews().slice(0,2).map(item=>({id:`news-${item.id}`,icon:'ti-news',title:item.title,meta:`${item.tag||'News'} - ${formatDateOnly(item.date)}`}));
  const allNotifications=[
    ...newsNotes,
    ...eventNotes,
    ...birthdayNotes,
    ...mine.filter(q=>q.response).slice(0,2).map(q=>({id:`reply-${q.id}-${q.resolvedAt||q.createdAt}`,icon:'ti-message-check',title:`HR replied: ${q.subject}`,meta:formatQueryTime(q.resolvedAt||q.createdAt)})),
    ...unread.slice(0,3).map(p=>({id:`policy-${p.id}`,icon:'ti-file-alert',title:`Unread policy: ${p.name}`,meta:p.cat})),
    ...mine.filter(q=>q.status!=='resolved').slice(0,2).map(q=>({id:`query-${q.id}-${q.status}`,icon:'ti-clock',title:`Query pending: ${q.subject}`,meta:formatQueryTime(q.createdAt)}))
  ];
  const notifications=allNotifications.filter(n=>!e.dismissedNotifications.includes(n.id)).slice(0,8);
  window.visibleNotificationIds=notifications.map(n=>n.id);
  window.allNotificationIds=allNotifications.map(n=>n.id);
  const clearBtn=document.getElementById('clearNotifBtn');
  if(clearBtn) clearBtn.disabled=!notifications.length;
  document.getElementById('notificationList').innerHTML=notifications.length?notifications.map(n=>`<div class="notify-item"><i class="ti ${n.icon}"></i><div><div>${n.title}</div><span>${n.meta}</span></div></div>`).join(''):'<div class="empty-state">No pending notifications.</div>';
  const homeNews=document.getElementById('homeNewsList');
  if(homeNews){
    const posts=latestNews().slice(0,3);
    homeNews.innerHTML=posts.length?posts.map(item=>`<div class="news-post"><div class="news-post-top"><span class="news-tag">${item.tag||'News'}</span><span>${formatDateOnly(item.date)}</span></div><h3>${item.title}</h3><p>${item.body||''}</p></div>`).join(''):'<div class="empty-state">No company news has been posted yet.</div>';
  }
  const achievements=[
    {done:pr.total&&pr.read===pr.total,title:'All policies acknowledged',meta:'Compliance ready'},
    {done:openQ===0,title:'No pending HR queries',meta:'Inbox clear'},
    {done:totals.left>0,title:'Leave plan updated',meta:`${totals.left} days available`},
    {done:profileCompletion(e)>=80,title:'Profile completion',meta:`${profileCompletion(e)}% ready`}
  ];
  const achievementList=document.getElementById('achievementList');
  if(achievementList) achievementList.innerHTML=achievements.map(a=>`<div class="achievement ${a.done?'done':''}"><i class="ti ${a.done?'ti-circle-check':'ti-circle'}"></i><div><div>${a.title}</div><span>${a.meta}</span></div></div>`).join('');
  const homeTimeline=document.getElementById('homeTimeline');
  if(homeTimeline) homeTimeline.innerHTML=mine.length?mine.slice(0,4).map(q=>`<div class="timeline-item"><span class="timeline-dot ${q.status==='resolved'?'done':''}"></span><div><div class="ri-name">${q.subject}</div><div class="ri-meta">${q.status==='resolved'?'Resolved':'Raised'} - ${formatQueryTime(q.resolvedAt||q.createdAt)}</div><div class="query-msg">${q.response||q.msg}</div></div></div>`).join(''):'<div class="empty-state">No queries yet.</div>';
  renderLeaveCalendar(e);
}
window.clearNotifications=function(){
  const e=employeeById(currentUser?.id);
  if(!e){toast('Please sign in again');return;}
  const ids=Array.isArray(window.allNotificationIds)?window.allNotificationIds:[];
  if(!ids.length){toast('No notifications to clear');return;}
  e.dismissedNotifications=[...new Set([...(e.dismissedNotifications||[]),...ids])];
  saveStore();
  renderEmployeeHome();
  toast('Notifications cleared');
};
window.renderNewsPortal=function(){
  const e=employeeById(currentUser?.id)||store.employees[0];
  const eventList=document.getElementById('eventList');
  const birthdayList=document.getElementById('birthdayList');
  const newsList=document.getElementById('companyNewsList');
  if(eventList){
    const events=upcomingEvents();
    eventList.innerHTML=events.length?events.map(ev=>`<div class="news-item event-item"><div class="event-date"><strong>${formatDateOnly(ev.date).slice(0,2)}</strong><span>${formatDateOnly(ev.date).slice(3,6)}</span></div><div><div class="ri-name">${ev.title}</div><div class="news-meta"><i class="ti ti-clock" aria-hidden="true"></i> ${ev.time||'Time pending'} <i class="ti ti-map-pin" aria-hidden="true"></i> ${ev.location||'Location pending'}</div><p>${ev.desc||'Details will be shared soon.'}</p></div></div>`).join(''):'<div class="empty-state">No special events announced yet.</div>';
  }
  if(birthdayList){
    const birthdays=upcomingBirthdays(e);
    birthdayList.innerHTML=birthdays.length?birthdays.map(item=>`<div class="news-item birthday-item">${avatarHtml(item.employee,'av av-e')}<div><div class="ri-name">${item.employee.name}</div><div class="news-meta">${item.employee.dept||'Team'} - ${shortDateFromDate(item.date)}</div><p>Wish ${item.employee.name.split(' ')[0]} on their birthday.</p></div></div>`).join(''):'<div class="empty-state">No colleague birthdays available. Employees can add DOB from Edit profile.</div>';
  }
  if(newsList){
    const posts=latestNews();
    newsList.innerHTML=posts.length?posts.map(item=>`<div class="news-post"><div class="news-post-top"><span class="news-tag">${item.tag||'News'}</span><span>${formatDateOnly(item.date)}</span></div><h3>${item.title}</h3><p>${item.body||''}</p><div class="reaction-row"><button class="btn sm" onclick="reactNews('${item.id}','like')"><i class="ti ti-thumb-up" aria-hidden="true"></i> ${(item.reactions?.like||[]).length}</button><button class="btn sm" onclick="reactNews('${item.id}','love')"><i class="ti ti-heart" aria-hidden="true"></i> ${(item.reactions?.love||[]).length}</button><button class="btn sm" onclick="reactNews('${item.id}','seen')"><i class="ti ti-check" aria-hidden="true"></i> ${(item.reactions?.seen||[]).length}</button></div></div>`).join(''):'<div class="empty-state">No company news has been posted yet.</div>';
  }
};
window.reactNews=function(newsId,type){
  const item=store.news.find(n=>n.id===newsId);
  const empId=currentUser?.id;
  if(!item||!empId) return;
  item.reactions=item.reactions||{};
  item.reactions[type]=item.reactions[type]||[];
  if(item.reactions[type].includes(empId)) item.reactions[type]=item.reactions[type].filter(id=>id!==empId);
  else item.reactions[type].push(empId);
  saveStore();
  renderNewsPortal();
  renderEmployeeHome();
};
window.renderAdminDocuments=function(){
  const empSelect=document.getElementById('docEmp');
  const list=document.getElementById('adminDocList');
  if(!empSelect||!list) return;
  empSelect.innerHTML=store.employees.map(e=>`<option value="${e.id}">${e.name} - ${e.dept||'General'}</option>`).join('');
  const rows=store.employees.flatMap(e=>(e.documents||[]).map(doc=>({...doc,employee:e}))).sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
  list.innerHTML=rows.length?rows.map(doc=>`<div class="document-row"><div class="document-icon"><i class="ti ${docTypeIcon(doc.type)}" aria-hidden="true"></i></div><div><div class="ri-name">${doc.title}</div><div class="ri-meta">${doc.employee.name} - ${docTypeLabel(doc.type)} - ${formatQueryTime(doc.uploadedAt)}</div><div class="ri-meta">${doc.fileName||'Attached document'} - ${doc.acknowledgedAt?`Acknowledged ${formatQueryTime(doc.acknowledgedAt)}`:'Not acknowledged'}</div></div><div class="ri-right"><a class="btn sm" href="${doc.fileData}" download="${doc.fileName||doc.title}" target="_blank" rel="noopener"><i class="ti ti-download" aria-hidden="true"></i> Download</a><button class="btn sm danger" onclick="deleteEmployeeDocument('${doc.employee.id}','${doc.id}')"><i class="ti ti-trash" aria-hidden="true"></i></button></div></div>`).join(''):'<div class="empty-state">No employee documents uploaded yet.</div>';
};
window.addEmployeeDocument=async function(){
  const empId=document.getElementById('docEmp')?.value;
  const employee=employeeById(empId);
  const type=document.getElementById('docType')?.value||'offer';
  const title=document.getElementById('docTitle')?.value.trim()||docTypeLabel(type);
  const file=document.getElementById('docFile')?.files[0];
  if(!employee){toast('Select an employee');return;}
  if(!file){toast('Upload a document file');return;}
  if(file.size>3*1024*1024){toast('Document must be under 3 MB');return;}
  const fileData=await fileToDataUrl(file);
  employee.documents=employee.documents||[];
  employee.documents.push({id:`doc-${Date.now()}`,type,title,fileName:file.name,fileData,uploadedAt:new Date().toISOString(),uploadedBy:currentUser?.name||'HR'});
  document.getElementById('docTitle').value='';
  document.getElementById('docFile').value='';
  saveStore();
  renderAdminDocuments();
  toast('Document added');
};
window.deleteEmployeeDocument=function(empId,docId){
  const employee=employeeById(empId);
  if(!employee) return;
  employee.documents=(employee.documents||[]).filter(doc=>doc.id!==docId);
  saveStore();
  renderAdminDocuments();
  toast('Document removed');
};
window.renderEmployeeDocuments=function(){
  const employee=employeeById(currentUser?.id)||store.employees[0];
  const list=document.getElementById('employeeDocList');
  if(!employee||!list) return;
  employee.documents=employee.documents||[];
  list.innerHTML=DOCUMENT_TYPES.map(type=>{
    const docs=employee.documents.filter(doc=>doc.type===type.key).sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
    return `<div class="card document-card"><div class="card-title" style="margin-bottom:.8rem"><i class="ti ${type.icon}" aria-hidden="true"></i> ${type.label}</div>${docs.length?docs.map(doc=>`<div class="document-row compact"><div><div class="ri-name">${doc.title}</div><div class="ri-meta">${doc.fileName||'Attached document'} - ${formatQueryTime(doc.uploadedAt)}</div><div class="ri-meta">${doc.acknowledgedAt?`Acknowledged ${formatQueryTime(doc.acknowledgedAt)}`:'Awaiting acknowledgement'}</div></div><div class="table-actions"><a class="btn sm" href="${doc.fileData}" download="${doc.fileName||doc.title}" target="_blank" rel="noopener"><i class="ti ti-download" aria-hidden="true"></i> Download</a><button class="btn sm ${doc.acknowledgedAt?'':'pri'}" onclick="acknowledgeDocument('${doc.id}')"><i class="ti ti-check" aria-hidden="true"></i> ${doc.acknowledgedAt?'Acknowledged':'Acknowledge'}</button></div></div>`).join(''):'<div class="empty-state">No documents uploaded yet.</div>'}</div>`;
  }).join('');
};
window.acknowledgeDocument=function(docId){
  const employee=employeeById(currentUser?.id);
  const doc=employee?.documents?.find(d=>d.id===docId);
  if(!doc) return;
  doc.acknowledgedAt=doc.acknowledgedAt||new Date().toISOString();
  saveStore();
  renderEmployeeDocuments();
  renderEmployeeHome();
  toast('Document acknowledged');
};
window.renderEngage=function(){
  const employee=employeeById(currentUser?.id)||store.employees[0];
  if(!employee) return;
  const badges=employeeBadges(employee);
  const badgeList=document.getElementById('badgeList');
  if(badgeList) badgeList.innerHTML=`<div class="badge-grid">${badges.map(b=>`<div class="engage-badge ${b.earned?'earned':''}"><i class="ti ${b.icon}" aria-hidden="true"></i><strong>${b.title}</strong><span>${b.meta}</span></div>`).join('')}</div>`;
  const mood=currentMood(employee);
  const moodBox=document.getElementById('moodPulseBox');
  if(moodBox) moodBox.innerHTML=`<div class="mood-buttons">${['Great','Good','Okay','Stressed'].map(m=>`<button class="btn sm ${mood?.mood===m?'pri':''}" onclick="submitMood('${m}')">${m}</button>`).join('')}</div><div class="ri-meta" style="margin-top:8px">${mood?`You checked in as ${mood.mood} on ${formatQueryTime(mood.createdAt)}`:'Choose how you feel this week.'}</div>`;
  const quizBox=document.getElementById('learningQuizBox');
  const done=new Set(employee.learningCompletions||[]);
  const quiz=ENGAGE_QUIZ.find(q=>!done.has(q.id))||ENGAGE_QUIZ[0];
  if(quizBox) quizBox.innerHTML=`<div class="ri-name">${quiz.title}</div><p class="query-msg">${quiz.question}</p><div class="quiz-options">${quiz.options.map((opt,i)=>`<button class="btn sm" onclick="answerQuiz('${quiz.id}',${i})">${opt}</button>`).join('')}</div><div class="ri-meta" style="margin-top:8px">${done.size}/${ENGAGE_QUIZ.length} lessons completed</div>`;
  const planner=document.getElementById('leavePlannerBox');
  if(planner) planner.innerHTML=`<div class="planner-box"><strong>${leavePlannerSuggestion(employee)}</strong><span>Annual left: ${(employee.leave.annual.t-employee.leave.annual.u)} days</span><button class="btn sm" onclick="openEmployeePage('myLeaves')"><i class="ti ti-calendar-plus" aria-hidden="true"></i> Apply leave</button></div>`;
  renderTeamWall();
};
window.submitMood=function(mood){
  const employee=employeeById(currentUser?.id);
  if(!employee) return;
  const week=new Date().toISOString().slice(0,10);
  store.moodPulse=store.moodPulse||[];
  const existing=store.moodPulse.find(m=>m.empId===employee.id&&m.week===week);
  if(existing){existing.mood=mood;existing.createdAt=new Date().toISOString();}
  else store.moodPulse.push({id:`mood-${Date.now()}`,empId:employee.id,emp:employee.name,week,mood,createdAt:new Date().toISOString()});
  saveStore();
  renderEngage();
  toast('Mood pulse saved');
};
window.answerQuiz=function(quizId,choice){
  const employee=employeeById(currentUser?.id);
  const quiz=ENGAGE_QUIZ.find(q=>q.id===quizId);
  if(!employee||!quiz) return;
  if(choice!==quiz.answer){toast('Try again. Read the option carefully.');return;}
  employee.learningCompletions=[...new Set([...(employee.learningCompletions||[]),quizId])];
  saveStore();
  renderEngage();
  renderEmployeeHome();
  toast('Lesson completed');
};
window.addWallPost=function(){
  const employee=employeeById(currentUser?.id);
  const input=document.getElementById('wallMsg');
  const msg=input?.value.trim();
  if(!employee||!msg){toast('Write a team wall message');return;}
  store.teamWall=store.teamWall||[];
  store.teamWall.unshift({id:`wall-${Date.now()}`,empId:employee.id,emp:employee.name,tag:document.getElementById('wallTag')?.value||'Shoutout',msg,createdAt:new Date().toISOString(),likes:[]});
  input.value='';
  saveStore();
  renderEngage();
  toast('Posted on team wall');
};
window.likeWallPost=function(id){
  const post=(store.teamWall||[]).find(p=>p.id===id);
  const empId=currentUser?.id;
  if(!post||!empId) return;
  post.likes=post.likes||[];
  post.likes=post.likes.includes(empId)?post.likes.filter(x=>x!==empId):[...post.likes,empId];
  saveStore();
  renderTeamWall();
};
function renderTeamWall(){
  const list=document.getElementById('teamWallList');
  if(!list) return;
  const posts=(store.teamWall||[]).slice(0,8);
  list.innerHTML=posts.length?posts.map(p=>`<div class="wall-post"><div><span class="news-tag">${p.tag}</span><strong>${p.emp}</strong><span>${formatQueryTime(p.createdAt)}</span></div><p>${p.msg}</p><button class="btn sm" onclick="likeWallPost('${p.id}')"><i class="ti ti-heart" aria-hidden="true"></i> ${(p.likes||[]).length}</button></div>`).join(''):'<div class="empty-state">No team wall posts yet.</div>';
}
window.renderAnnouncements=function(){
  const eventList=document.getElementById('adminEventList');
  const newsList=document.getElementById('adminNewsList');
  if(eventList){
    const events=sortedEvents();
    eventList.innerHTML=events.length?events.map(ev=>`<div class="row-item policy-row"><div><div class="ri-name">${ev.title}</div><div class="ri-meta">${formatDateOnly(ev.date)} - ${ev.time||'Time pending'} - ${ev.location||'Location pending'}</div><div class="query-msg">${ev.desc||'No description added.'}</div></div><button class="btn sm danger" title="Delete event" onclick="deleteCompanyEvent('${ev.id}')"><i class="ti ti-trash" aria-hidden="true"></i></button></div>`).join(''):'<div class="empty-state">No special events published yet.</div>';
  }
  if(newsList){
    const posts=latestNews();
    newsList.innerHTML=posts.length?posts.map(item=>`<div class="row-item policy-row"><div><div class="ri-name">${item.title}</div><div class="ri-meta">${item.tag||'News'} - ${formatDateOnly(item.date)} - Likes ${(item.reactions?.like||[]).length}, Loves ${(item.reactions?.love||[]).length}, Seen ${(item.reactions?.seen||[]).length}</div><div class="query-msg">${item.body||'No post text added.'}</div></div><button class="btn sm danger" title="Delete news" onclick="deleteCompanyNews('${item.id}')"><i class="ti ti-trash" aria-hidden="true"></i></button></div>`).join(''):'<div class="empty-state">No news posts published yet.</div>';
  }
};
window.addCompanyEvent=function(){
  const title=document.getElementById('eventTitle').value.trim();
  const date=document.getElementById('eventDate').value;
  if(!title||!date){toast('Enter event title and date');return;}
  store.events.push({
    id:`evt-${Date.now()}`,
    title,
    date,
    time:document.getElementById('eventTime').value.trim()||'Time pending',
    location:document.getElementById('eventLocation').value.trim()||'Location pending',
    desc:document.getElementById('eventDesc').value.trim()
  });
  ['eventTitle','eventDate','eventTime','eventLocation','eventDesc'].forEach(id=>document.getElementById(id).value='');
  saveStore();
  renderAnnouncements();
  if(document.getElementById('pg-news')?.classList.contains('act')) renderNewsPortal();
  toast('Event notification published');
};
window.addCompanyNews=function(){
  const title=document.getElementById('newsTitle').value.trim();
  const body=document.getElementById('newsBody').value.trim();
  if(!title||!body){toast('Enter news headline and post');return;}
  store.news.push({
    id:`news-${Date.now()}`,
    title,
    date:document.getElementById('newsDate').value||new Date().toISOString().slice(0,10),
    tag:document.getElementById('newsTag').value.trim()||'News',
    body
  });
  ['newsTitle','newsDate','newsTag','newsBody'].forEach(id=>document.getElementById(id).value='');
  saveStore();
  renderAnnouncements();
  if(document.getElementById('pg-news')?.classList.contains('act')) renderNewsPortal();
  toast('News post published');
};
window.deleteCompanyEvent=function(id){
  store.events=store.events.filter(ev=>ev.id!==id);
  saveStore();
  renderAnnouncements();
  toast('Event removed');
};
window.deleteCompanyNews=function(id){
  store.news=store.news.filter(item=>item.id!==id);
  saveStore();
  renderAnnouncements();
  toast('News removed');
};
function renderLeaveCalendar(e){
  const el=document.getElementById('leaveCalendar');
  if(!el) return;
  const l=e.leave;
  const cells=[
    ['Annual',l.annual.u,l.annual.t,'#534AB7'],
    ['Sick',l.sick.u,l.sick.t,'#1D9E75'],
    ['WFH',l.wfh.u,l.wfh.t,'#BA7517'],
    ['Comp-off',l.comp.u,l.comp.t,'#D4537E']
  ];
  el.innerHTML=`<div class="calendar-grid">${cells.map(([label,used,total,color])=>`<div class="calendar-cell"><span>${label}</span><strong style="color:${color}">${used}</strong><small>${total-used} left</small></div>`).join('')}</div><div class="calendar-note">Used leave days by category for the current year.</div>`;
}
window.togglePolicyFormat=function(){
  return;
};
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error||new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
function resetProfileCropEditor(){
  profileCropState={src:'',x:0,y:0,zoom:1,rotation:0,cropped:''};
  const editor=document.getElementById('profileCropEditor');
  const img=document.getElementById('profileCropImage');
  const zoom=document.getElementById('profileZoom');
  if(editor) editor.style.display='none';
  if(img) img.removeAttribute('src');
  if(zoom) zoom.value='1';
}
function updateProfileCropTransform(){
  const img=document.getElementById('profileCropImage');
  if(!img) return;
  img.style.transform=`translate(calc(-50% + ${profileCropState.x}px), calc(-50% + ${profileCropState.y}px)) scale(${profileCropState.zoom}) rotate(${profileCropState.rotation}deg)`;
}
window.loadProfileCrop=async function(event){
  const file=event.target.files[0];
  if(!file){resetProfileCropEditor();return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){
    toast('Use a PNG, JPG, or WEBP image');
    event.target.value='';
    resetProfileCropEditor();
    return;
  }
  if(file.size>1024*1024){
    toast('Profile picture must be under 1 MB');
    event.target.value='';
    resetProfileCropEditor();
    return;
  }
  const src=await fileToDataUrl(file);
  profileCropState={src,x:0,y:0,zoom:1,rotation:0,cropped:''};
  const img=document.getElementById('profileCropImage');
  document.getElementById('profileCropEditor').style.display='block';
  document.getElementById('profileZoom').value='1';
  img.src=src;
  updateProfileCropTransform();
  document.getElementById('profilePreview').innerHTML='<span>Adjust the photo, then click Apply crop.</span>';
};
window.setProfileZoom=function(value){
  profileCropState.zoom=Number(value)||1;
  profileCropState.cropped='';
  updateProfileCropTransform();
};
window.nudgeProfileCrop=function(dx,dy){
  profileCropState.x+=dx;
  profileCropState.y+=dy;
  profileCropState.cropped='';
  updateProfileCropTransform();
};
window.rotateProfileCrop=function(deg){
  profileCropState.rotation=(profileCropState.rotation+deg)%360;
  profileCropState.cropped='';
  updateProfileCropTransform();
};
function createProfileCropDataUrl(){
  const img=document.getElementById('profileCropImage');
  const frame=document.getElementById('profileCropFrame');
  if(!img?.src||!frame) return '';
  const out=512;
  const frameSize=frame.clientWidth||180;
  const canvas=document.createElement('canvas');
  canvas.width=out;
  canvas.height=out;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,out,out);
  const scaleToCover=Math.max(out/img.naturalWidth,out/img.naturalHeight)*profileCropState.zoom;
  const offsetScale=out/frameSize;
  ctx.translate(out/2+profileCropState.x*offsetScale,out/2+profileCropState.y*offsetScale);
  ctx.rotate(profileCropState.rotation*Math.PI/180);
  ctx.drawImage(img,-img.naturalWidth*scaleToCover/2,-img.naturalHeight*scaleToCover/2,img.naturalWidth*scaleToCover,img.naturalHeight*scaleToCover);
  return canvas.toDataURL('image/jpeg',0.9);
}
window.applyProfileCrop=function(){
  if(!profileCropState.src){toast('Choose a photo first');return;}
  profileCropState.cropped=createProfileCropDataUrl();
  if(!profileCropState.cropped){toast('Could not crop this image');return;}
  document.getElementById('profilePreview').innerHTML=`<img src="${profileCropState.cropped}" alt="Cropped profile picture"><span>Cropped photo ready.</span>`;
  toast('Crop applied');
};
function resetPolicyForm(){
  ['pN','pDs'].forEach(id=>document.getElementById(id).value='');
  const master=document.getElementById('pMasterDoc');
  if(master) master.value='';
  const preview=document.getElementById('policyTokenPreview');
  if(preview) preview.innerHTML='';
}

function cleanPolicyTitle(title,fallback='Company Policy'){
  const cleaned=String(title||'')
    .replace(/^#+\s*/,'')
    .replace(/^\d+[\).\-\s]+/,'')
    .replace(/^policy\s*[:\-]\s*/i,'')
    .trim();
  return cleaned||fallback;
}

function isPolicyHeading(line){
  const text=line.trim();
  if(!text||text.length>110) return false;
  if(/^[-*•]/.test(text)) return false;
  if(/^(section|chapter|part)?\s*\d+[\).\-\s]+.{3,}$/i.test(text)) return true;
  if(/\bpolicy\b/i.test(text)&&text.split(/\s+/).length<=12) return true;
  if(/^[A-Z0-9\s&/(),.-]{8,}$/.test(text)&&/[A-Z]/.test(text)) return true;
  return false;
}

function tokenizePolicyDocument(text,fallbackName='Company Policy'){
  const lines=String(text||'').replace(/\r/g,'').split('\n');
  const sections=[];
  let current=null;
  lines.forEach(raw=>{
    const line=raw.trim();
    if(isPolicyHeading(line)){
      if(current&&current.body.join('\n').trim()) sections.push(current);
      current={title:cleanPolicyTitle(line,fallbackName),body:[]};
      return;
    }
    if(!current) current={title:fallbackName,body:[]};
    current.body.push(raw);
  });
  if(current&&current.body.join('\n').trim()) sections.push(current);
  const unique=new Map();
  sections.forEach((section,index)=>{
    const title=cleanPolicyTitle(section.title,`${fallbackName} ${index+1}`);
    const desc=section.body.join('\n').replace(/\n{3,}/g,'\n\n').trim();
    if(!desc) return;
    const key=title.toLowerCase();
    const finalTitle=unique.has(key)?`${title} ${index+1}`:title;
    unique.set(finalTitle.toLowerCase(),{name:finalTitle,desc});
  });
  return [...unique.values()];
}

async function extractPolicyMasterText(file,fileData){
  if(/\.(txt|md|csv)$/i.test(file.name)||file.type.startsWith('text/')){
    return await file.text();
  }
  const res=await fetch('/api/extract-policy-document',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fileName:file.name,fileData})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'Could not extract text from policy document');
  return data.text||'';
}
window.openEmployeeProfileDetails=function(){
  const employee=employeeById(currentUser?.id);
  if(!employee){toast('Please sign in again');return;}
  const pr=policyReadStats(employee);
  const totals=leaveTotals(employee);
  const detail=document.getElementById('profileDetailBody');
  detail.innerHTML=`<div class="profile-detail-head">${avatarHtml(employee,'av av-e profile-detail-photo')}<div><div class="ri-name">${employee.name}</div><div class="ri-meta">${employee.email}</div></div></div>
    <div class="profile-detail-grid">
      <div><span>Department</span><strong>${employee.dept||'General'}</strong></div>
      <div><span>Role</span><strong>${employee.role||'Employee'}</strong></div>
      <div><span>Manager</span><strong>${employee.manager||'HR'}</strong></div>
      <div><span>Status</span><strong>${employee.status||'Active'}</strong></div>
      <div><span>Date of birth</span><strong>${formatDob(employee.profile?.dob)}</strong></div>
      <div><span>Hobbies</span><strong>${employee.profile?.hobbies||'Not added'}</strong></div>
      <div><span>Leave balance</span><strong>${totals.left} days left</strong></div>
      <div><span>Policies read</span><strong>${pr.read}/${pr.total}</strong></div>
    </div>
    <div class="hint-box profile-lock-note"><i class="ti ti-lock" aria-hidden="true"></i> HR-managed details are read-only. You can edit only date of birth, profile picture, and hobbies.</div>`;
  openM('mProfileView');
};
window.openProfileEditFromDetails=function(){
  closeM('mProfileView');
  openEmployeeProfileEditor();
};
window.openEmployeeProfileEditor=function(){
  const employee=employeeById(currentUser?.id);
  if(!employee){toast('Please sign in again');return;}
  document.getElementById('profileDob').value=employee.profile?.dob||'';
  document.getElementById('profileHobbies').value=employee.profile?.hobbies||'';
  document.getElementById('profilePic').value='';
  resetProfileCropEditor();
  document.getElementById('profilePreview').innerHTML=employee.profile?.photo?`<img src="${employee.profile.photo}" alt="Current profile picture">`:'No profile picture selected';
  openM('mProfile');
};
window.saveEmployeeProfile=async function(){
  const employee=employeeById(currentUser?.id);
  if(!employee){toast('Please sign in again');return;}
  employee.profile=employee.profile||{};
  employee.profile.dob=document.getElementById('profileDob').value;
  employee.profile.hobbies=document.getElementById('profileHobbies').value.trim();
  if(profileCropState.src){
    employee.profile.photo=profileCropState.cropped||createProfileCropDataUrl();
  }
  saveStore();
  currentUser={...employee,portal:'employee'};
  const avatar=document.getElementById('empAvatar');
  if(avatar){
    avatar.outerHTML=avatarHtml(employee,'av av-e');
    document.querySelector('#s-employee .topbar .av, #s-employee .topbar .avatar-img').id='empAvatar';
  }
  closeM('mProfile');
  renderEmployeeHome();
  toast('Profile updated');
};

function enhanceUI(){
  applyCompanyBranding();
  document.querySelector('#s-admin .brand span+span').textContent='HR Admin';
  document.querySelector('#pg-employees .pg-sub').textContent='Directory, login access, and leave balances across the team';
  const empPage=document.getElementById('pg-employees');
  empPage.innerHTML=`<div class="pg-title">Employees</div><div class="pg-sub">Directory, login access, and leave balances across the team</div>
    <div class="stats">
      <div class="stat"><div class="stat-l">Total employees</div><div class="stat-v" id="empTotal">0</div></div>
      <div class="stat"><div class="stat-l">Active</div><div class="stat-v" style="color:#3B6D11" id="empActive">0</div></div>
      <div class="stat"><div class="stat-l">HR admins</div><div class="stat-v" style="color:#534AB7" id="hrTotal">0</div></div>
      <div class="stat"><div class="stat-l">Open queries</div><div class="stat-v" style="color:#854F0B" id="empOpenQ">0</div></div>
    </div>
    <div class="card"><div class="card-hd"><div class="card-title"><i class="ti ti-address-book" aria-hidden="true"></i> Employee names</div><button class="btn pri" onclick="openM('mEmp')"><i class="ti ti-user-plus" aria-hidden="true"></i> Add employee</button></div><div id="employeeNames"></div></div>
    <div class="card">
      <div class="card-hd"><div class="card-title"><i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Bulk employee upload</div><div class="table-actions"><button class="btn sm" onclick="syncEmployeesFromBackendSheet(true)"><i class="ti ti-refresh" aria-hidden="true"></i> Sync Excel sheet</button><button class="btn sm" onclick="downloadEmployeeCsvTemplate()"><i class="ti ti-download" aria-hidden="true"></i> CSV template</button></div></div>
      <div class="fg2">
        <div class="fi"><label>Upload CSV or Excel</label><input id="empBulkFile" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>
        <div class="fi"><label>Default temporary password</label><input id="empBulkDefaultPass" value="emp123" placeholder="Used when file password is blank"></div>
      </div>
      <div class="hint-box" style="margin-top:0">CSV/Excel columns: name, email, department, role, tempPassword. Live Excel sync is on, so edits in employees.xlsx/employees.csv will automatically reflect here while this tab is open. Every newly created employee is sent their login ID and temporary password when email is configured.</div>
      <div class="modal-foot" style="justify-content:flex-start;padding-top:10px"><button class="btn pri" onclick="bulkUploadEmployees()"><i class="ti ti-upload" aria-hidden="true"></i> Upload employees & send emails</button></div>
      <div id="sheetSyncResult" class="bulk-result"></div>
      <div id="bulkEmpResult" class="bulk-result"></div>
    </div>
    <div class="card"><div class="card-hd"><div class="card-title"><i class="ti ti-users" aria-hidden="true"></i> Employee management</div></div><div style="overflow-x:auto"><table class="etable" id="eTable"></table></div></div>`;
  document.querySelector('#pg-overview .stats .stat:first-child .stat-v').id='ovEmp';
  document.querySelector('#s-employee .topbar .av').id='empAvatar';
  document.querySelector('#s-employee .topbar .uname').id='empTopName';
  document.querySelector('#s-admin .topbar .av').id='hrAvatar';
  document.querySelector('#s-admin .topbar .uname').id='hrTopName';
  document.querySelector('#pg-aiChat .pg-sub').textContent='Ask about policies, leaves, benefits, or any HR question';
  document.getElementById('mRes').insertAdjacentHTML('afterend',`
    <div class="modal-bg" id="mEmp">
      <div class="modal">
        <div class="modal-hd">Add employee <button class="btn sm" onclick="closeM('mEmp')" style="border:none"><i class="ti ti-x" aria-hidden="true"></i></button></div>
        <div class="fg2"><div class="fi"><label>Full name</label><input id="empName" placeholder="e.g. Neha S."></div><div class="fi"><label>Department</label><input id="empDept" placeholder="Engineering"></div></div>
        <div class="fi"><label>Company email</label><input id="empEmail" type="email" placeholder="name@yourcompany.com"></div>
        <div class="fg2"><div class="fi"><label>Role</label><input id="empRole" placeholder="Product Manager"></div><div class="fi"><label>Temporary password</label><input id="empPass" value="emp123"></div></div>
        <div class="hint-box" style="margin-top:0;margin-bottom:8px">The employee will use this temporary password once, then create a new private password on first login.</div>
        <div class="modal-foot"><button class="btn" onclick="closeM('mEmp')">Cancel</button><button class="btn pri" onclick="addEmployee()">Create login</button></div>
      </div>
    </div>
    <div class="modal-bg" id="mPwd">
      <div class="modal">
        <div class="modal-hd">Create new password</div>
        <div class="hint-box" style="margin-top:0;margin-bottom:12px">For safety, replace the temporary password from HR before entering the employee portal.</div>
        <div class="fi"><label>New password</label><input id="newPass1" type="password" minlength="6" placeholder="At least 6 characters"></div>
        <div class="fi"><label>Confirm password</label><input id="newPass2" type="password" minlength="6" onkeydown="if(event.key==='Enter')saveNewPassword()"></div>
        <div class="login-error" id="pwdErr">Passwords must match and be at least 6 characters.</div>
        <div class="modal-foot"><button class="btn pri" onclick="saveNewPassword()">Save and continue</button></div>
      </div>
    </div>
    <div class="modal-bg" id="mBvgPreview">
      <div class="modal modal-wide">
        <div class="modal-hd"><span id="bvgPreviewTitle">BVG document</span><button class="btn sm" onclick="closeM('mBvgPreview')" style="border:none"><i class="ti ti-x" aria-hidden="true"></i></button></div>
        <div id="bvgPreviewBody" class="bvg-preview-body"></div>
        <div class="modal-foot"><a class="btn pri" id="bvgPreviewDownload" href="#" download><i class="ti ti-download" aria-hidden="true"></i> Download</a><button class="btn" onclick="closeM('mBvgPreview')">Close</button></div>
      </div>
    </div>`);
  document.querySelectorAll('.modal-bg').forEach(bg=>bg.addEventListener('click',e=>{if(e.target===bg)bg.classList.remove('open')}));
  window.setInterval(()=>{
    const employeesPage=document.getElementById('pg-employees');
    if(currentUser?.portal==='hr'&&employeesPage?.classList.contains('act')){
      syncEmployeesFromBackendSheet(false);
    }
  },5000);
}

window.selRole=function(r){
  liveRole=r==='admin'?'hr':'employee';
  document.getElementById('rt-admin').classList.toggle('sel',liveRole==='hr');
  document.getElementById('rt-emp').classList.toggle('sel',liveRole==='employee');
  const demo=liveRole==='hr'?store.hrs[0]:store.employees[0];
  document.getElementById('lEmail').value=demo.email;
  document.getElementById('lPass').value=demo.password;
};

window.doLogin=function(){
  const email=document.getElementById('lEmail').value.trim().toLowerCase();
  const pass=document.getElementById('lPass').value;
  const list=liveRole==='hr'?store.hrs:store.employees;
  const user=list.find(u=>u.email.toLowerCase()===email&&u.password===pass&&u.status!=='Inactive');
  if(!user){document.getElementById('lErr').style.display='block';return;}
  currentUser={...user,portal:liveRole};
  document.getElementById('lErr').style.display='none';
  if(liveRole==='employee'&&user.mustChangePassword){
    document.getElementById('newPass1').value='';
    document.getElementById('newPass2').value='';
    document.getElementById('pwdErr').style.display='none';
    openM('mPwd');
    return;
  }
  enterPortal();
};

function enterPortal(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if(liveRole==='employee'){
    const employee=employeeById(currentUser?.id)||currentUser;
    if(employee?.bvg?.status!=='approved'){
      document.getElementById('s-preboarding').classList.add('active');
      renderPreboardingPortal();
      return;
    }
  }
  document.getElementById(liveRole==='hr'?'s-admin':'s-employee').classList.add('active');
  if(liveRole==='hr'){
    document.getElementById('hrAvatar').textContent=initials(currentUser.name);
    document.getElementById('hrTopName').textContent=currentUser.name;
    renderPolicies();renderQueries();renderAdminBvg();
  }else{
    document.getElementById('empAvatar').outerHTML=avatarHtml(employeeById(currentUser.id)||currentUser,'av av-e');
    document.querySelector('#s-employee .topbar .av, #s-employee .topbar .avatar-img').id='empAvatar';
    document.getElementById('empTopName').textContent=currentUser.name;
    updateBars();initChat();renderEmployeeHome();
  }
}

window.saveNewPassword=function(){
  const p1=document.getElementById('newPass1').value;
  const p2=document.getElementById('newPass2').value;
  const err=document.getElementById('pwdErr');
  if(p1.length<6||p1!==p2){
    err.style.display='block';
    return;
  }
  const emp=employeeById(currentUser?.id);
  if(!emp){toast('Please sign in again');closeM('mPwd');return;}
  emp.password=p1;
  emp.mustChangePassword=false;
  currentUser={...emp,portal:'employee'};
  saveStore();
  closeM('mPwd');
  toast('Password updated');
  enterPortal();
};

window.logout=function(){
  currentUser=null;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-login').classList.add('active');
};

window.renderPolicies=function(){
  const l=document.getElementById('polList');
  l.innerHTML='';
  store.policies.forEach(p=>{
    const d=document.createElement('div');
    d.className='row-item';
    d.innerHTML=`<div><div class="ri-name">${p.name}</div><div class="ri-meta">${p.cat} - ${p.date} - ${policyFormatLabel(p)}</div><div class="query-msg">${policySummary(p)}</div>${policyAttachmentLink(p)}</div><div class="ri-right"><span class="badge b-${p.status.toLowerCase()}">${p.status}</span><button class="btn sm" title="Cycle status" onclick="cycleStatus(${p.id})"><i class="ti ti-refresh" aria-hidden="true"></i></button><button class="btn sm danger" title="Delete" onclick="delPol(${p.id})"><i class="ti ti-trash" aria-hidden="true"></i></button></div>`;
    l.appendChild(d);
  });
  document.getElementById('sTot').textContent=store.policies.length;
  document.getElementById('sAct').textContent=store.policies.filter(p=>p.status==='Active').length;
  document.getElementById('sDraft').textContent=store.policies.filter(p=>p.status==='Draft').length;
  document.getElementById('sArch').textContent=store.policies.filter(p=>p.status==='Archived').length;
};

window.importPolicies=async function(){
  const button=document.getElementById('policyTokenizeBtn');
  const preview=document.getElementById('policyTokenPreview');
  const setPreview=(msg,type='info')=>{
    if(preview) preview.innerHTML=`<div class="token-message token-${type}">${msg}</div>`;
  };
  const previousButtonText=button?.innerHTML;
  if(button){
    button.disabled=true;
    button.innerHTML='<i class="ti ti-loader-2" aria-hidden="true"></i> Tokenizing...';
  }
  try{
    const fallbackName=document.getElementById('pN').value.trim()||'Company Policy';
    const file=document.getElementById('pMasterDoc')?.files?.[0];
    let text=document.getElementById('pDs').value.trim();
    let fileData='', fileName='', sourceId='';
    if(file){
      if(file.size>4*1024*1024){
        setPreview('This file is too large for browser storage. Please upload a file under 4 MB or paste the policy text.', 'error');
        toast('Policy document must be under 4 MB');
        return;
      }
      try{
        fileName=file.name;
        setPreview(`Reading ${fileName}...`);
        fileData=await fileToDataUrl(file);
        text=await extractPolicyMasterText(file,fileData);
      }catch(err){
        setPreview(err.message||'Could not read master policy document', 'error');
        toast(err.message||'Could not read master policy document');
        return;
      }
    }
    if(!text){
      setPreview('Upload a master policy document or paste policy text.', 'error');
      toast('Upload a master policy document or paste policy text');
      return;
    }
    const tokens=tokenizePolicyDocument(text,fallbackName);
    if(!tokens.length){
      setPreview('No policy sections were found. Add clear headings like "Annual Leave Policy" or paste each policy under a heading.', 'error');
      toast('No policy sections found');
      return;
    }
    setPreview(`Found ${tokens.length} policy section${tokens.length===1?'':'s'}: ${tokens.slice(0,5).map(t=>t.name).join(', ')}${tokens.length>5?'...':''}`);
    const cat=document.getElementById('pC').value;
    const status=document.getElementById('pSt').value;
    const date=document.getElementById('pDt').value||new Date().toISOString().slice(0,10);
    const now=new Date().toISOString();
    const beforePolicies=store.policies.slice();
    const beforeSources=(store.policySources||[]).slice();
    const beforeNextPolicyId=store.nextPolicyId;
    if(fileData){
      sourceId=`policy-source-${Date.now()}`;
      store.policySources=store.policySources||[];
      store.policySources.unshift({id:sourceId,fileName,fileData,uploadedAt:now});
    }
    const imported=tokens.map(token=>({
      id:store.nextPolicyId++,
      name:token.name,
      cat,
      status,
      date,
      format:file?'master-document':'text',
      desc:token.desc,
      sourceFileName:fileName,
      sourceId,
      updatedAt:now
    }));
    store.policies.push(...imported);
    try{
      saveStore();
    }catch(err){
      store.policies=beforePolicies;
      store.policySources=beforeSources;
      store.nextPolicyId=beforeNextPolicyId;
      setPreview('The policies were tokenized, but the browser could not save them. Try a smaller document or paste plain text.', 'error');
      toast('Could not save imported policies');
      return;
    }
    closeM('mPol');
    resetPolicyForm();
    renderPolicies();
    toast(`${imported.length} polic${imported.length===1?'y':'ies'} created from master document`);
  }finally{
    if(button){
      button.disabled=false;
      button.innerHTML=previousButtonText||'<i class="ti ti-wand" aria-hidden="true"></i> Tokenize & save policies';
    }
  }
};
window.addPolicy=window.importPolicies;
window.delPol=function(id){store.policies=store.policies.filter(p=>p.id!==id);saveStore();renderPolicies();toast('Policy removed');};
window.cycleStatus=function(id){
  const p=store.policies.find(x=>x.id===id);
  if(!p) return;
  p.status=p.status==='Active'?'Draft':p.status==='Draft'?'Archived':'Active';
  p.updatedAt=new Date().toISOString();
  saveStore();renderPolicies();toast(`Status changed to ${p.status}`);
};

window.renderQueries=function(){
  const l=document.getElementById('aQList');
  l.innerHTML='';
  [...store.queries].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach(q=>{
    const d=document.createElement('div');
    d.className='row-item';
    d.style.cssText='flex-direction:column;align-items:flex-start;gap:6px';
    d.innerHTML=`<div style="display:flex;justify-content:space-between;width:100%;align-items:center;gap:10px"><div><div class="ri-name">${q.subject}</div><div class="ri-meta">${q.emp} - ${q.category||'General'} - Raised ${formatQueryTime(q.createdAt)}</div><div class="query-msg">${q.msg}</div></div><span class="badge b-${q.status}">${q.status}</span></div>${q.response?`<div style="font-size:11px;color:#27500A;background:#EAF3DE;padding:5px 8px;border-radius:4px;width:100%"><i class="ti ti-check" aria-hidden="true"></i> ${q.response}</div>`:q.status!=='resolved'?`<button class="btn sm" onclick="openResolve(${q.id})">Respond &amp; resolve</button>`:''}`;
    l.appendChild(d);
  });
  const open=store.queries.filter(q=>q.status!=='resolved').length;
  document.getElementById('qBadge').textContent=open;
  const ov=document.getElementById('ovQ'); if(ov) ov.textContent=open;
};

window.openResolve=function(id){
  liveResolveId=id;
  const q=store.queries.find(x=>x.id===id);
  document.getElementById('resDetail').innerHTML=`<strong>${q.subject}</strong><br><span style="color:var(--color-text-tertiary)">${q.emp}</span><br>${q.msg}`;
  document.getElementById('hrR').value='';
  openM('mRes');
};
window.resolveQ=function(){
  const r=document.getElementById('hrR').value.trim();
  if(!r){toast('Enter a response');return;}
  const q=store.queries.find(x=>x.id===liveResolveId);
  if(q){q.status='resolved';q.response=r; q.resolvedAt=new Date().toISOString();}
  saveStore();closeM('mRes');renderQueries();
  if(document.getElementById('myQueryList')) renderMyQueries();
  toast('Query resolved');
};

function bvgStats(employee){
  const docs=employee?.bvg?.docs||{};
  const uploaded=BVG_DOCUMENTS.filter(doc=>docs[doc.key]?.fileData).length;
  return {uploaded,total:BVG_DOCUMENTS.length,complete:uploaded===BVG_DOCUMENTS.length};
}

function bvgStatusLabel(status){
  if(status==='approved') return 'Approved';
  if(status==='rejected') return 'Changes requested';
  if(status==='submitted') return 'Submitted to HR';
  return 'Pending upload';
}

function renderPreboardingPortal(){
  const employee=employeeById(currentUser?.id);
  const area=document.getElementById('preboardingPortal');
  if(!employee||!area) return;
  employee.bvg=employee.bvg||{status:'pending',docs:{}};
  employee.bvg.docs=employee.bvg.docs||{};
  const stats=bvgStats(employee);
  const status=document.getElementById('preboardingStatus');
  if(status){
    status.textContent=bvgStatusLabel(employee.bvg.status);
    status.className=`preboarding-status ${employee.bvg.status}`;
  }
  const avatar=document.getElementById('preAvatar');
  const name=document.getElementById('preName');
  if(avatar) avatar.textContent=initials(employee.name);
  if(name) name.textContent=employee.name;
  const locked=employee.bvg.status==='submitted';
  const rejected=employee.bvg.status==='rejected';
  area.innerHTML=`
    <div class="stats">
      <div class="stat"><div class="stat-l">Documents uploaded</div><div class="stat-v">${stats.uploaded}/${stats.total}</div></div>
      <div class="stat"><div class="stat-l">BVG status</div><div class="stat-v" style="font-size:18px">${bvgStatusLabel(employee.bvg.status)}</div></div>
      <div class="stat"><div class="stat-l">Portal access</div><div class="stat-v" style="font-size:18px">${employee.bvg.status==='approved'?'Unlocked':'Locked'}</div></div>
    </div>
    ${rejected&&employee.bvg.note?`<div class="hint-box danger-soft"><strong>HR requested changes:</strong><br>${employee.bvg.note}</div>`:''}
    <div class="bvg-grid">
      ${BVG_DOCUMENTS.map(doc=>{
        const uploaded=employee.bvg.docs[doc.key];
        return `<div class="bvg-card ${uploaded?'done':''}">
          <div class="bvg-icon"><i class="ti ${uploaded?'ti-check':'ti-upload'}" aria-hidden="true"></i></div>
          <div>
            <div class="ri-name">${doc.label}</div>
            <div class="ri-meta">${doc.hint}</div>
            ${uploaded?`<div class="ri-meta">Uploaded ${formatQueryTime(uploaded.uploadedAt)} - ${uploaded.fileName}</div>`:''}
          </div>
          <div class="bvg-actions">
            ${uploaded?`<a class="btn sm" href="${uploaded.fileData}" download="${uploaded.fileName}" target="_blank" rel="noopener"><i class="ti ti-download" aria-hidden="true"></i> View</a>`:''}
            <label class="btn sm ${locked?'disabled':''}"><i class="ti ti-file-upload" aria-hidden="true"></i> ${uploaded?'Replace':'Upload'}<input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" ${locked?'disabled':''} onchange="uploadBvgDocument('${doc.key}',this.files[0])" hidden></label>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="card-hd"><div class="card-title"><i class="ti ti-lock-check" aria-hidden="true"></i> Submit for HR approval</div></div>
      <div class="hint-box" style="margin-top:0">You can access the full employee portal only after HR approves all BVG documents.</div>
      <button class="btn pri" onclick="submitBvgForReview()" ${!stats.complete||locked?'disabled':''}><i class="ti ti-send" aria-hidden="true"></i> ${locked?'Submitted to HR':'Submit documents'}</button>
    </div>`;
}

window.uploadBvgDocument=async function(key,file){
  const employee=employeeById(currentUser?.id);
  if(!employee||!file) return;
  if(file.size>3*1024*1024){toast('Document must be under 3 MB');return;}
  employee.bvg=employee.bvg||{status:'pending',docs:{}};
  employee.bvg.docs=employee.bvg.docs||{};
  try{
    employee.bvg.docs[key]={fileName:file.name,fileData:await fileToDataUrl(file),uploadedAt:new Date().toISOString()};
    if(employee.bvg.status==='rejected'){
      employee.bvg.status='pending';
      employee.bvg.note='';
    }
    saveStore();
    renderPreboardingPortal();
    toast('Document uploaded');
  }catch(err){
    toast('Could not read document');
  }
};

window.submitBvgForReview=function(){
  const employee=employeeById(currentUser?.id);
  if(!employee) return;
  if(!bvgStats(employee).complete){toast('Upload all required BVG documents first');return;}
  employee.bvg.status='submitted';
  employee.bvg.submittedAt=new Date().toISOString();
  saveStore();
  renderPreboardingPortal();
  toast('Submitted to HR for approval');
};

function renderAdminBvg(){
  const area=document.getElementById('adminBvgList');
  if(!area) return;
  const employees=[...store.employees].sort((a,b)=>{
    const order={submitted:0,rejected:1,pending:2,approved:3};
    return (order[a.bvg?.status]??9)-(order[b.bvg?.status]??9)||a.name.localeCompare(b.name);
  });
  area.innerHTML=`
    <div class="stats">
      <div class="stat"><div class="stat-l">Submitted</div><div class="stat-v">${employees.filter(e=>e.bvg?.status==='submitted').length}</div></div>
      <div class="stat"><div class="stat-l">Pending</div><div class="stat-v">${employees.filter(e=>['pending','rejected'].includes(e.bvg?.status)).length}</div></div>
      <div class="stat"><div class="stat-l">Approved</div><div class="stat-v">${employees.filter(e=>e.bvg?.status==='approved').length}</div></div>
    </div>
    <div class="card">
      <div class="card-hd"><div class="card-title"><i class="ti ti-shield-check" aria-hidden="true"></i> Candidate BVG queue</div></div>
      ${employees.map(employee=>{
        const stats=bvgStats(employee);
        const docs=employee.bvg?.docs||{};
        return `<div class="row-item bvg-admin-row">
          <div>
            <div class="ri-name">${employee.name}</div>
            <div class="ri-meta">${employee.email} - ${employee.dept||'General'} - ${stats.uploaded}/${stats.total} documents</div>
            <div class="bvg-doc-links">${BVG_DOCUMENTS.map(doc=>{
              const uploaded=docs[doc.key];
              return uploaded?.fileData
                ? `<div class="bvg-doc-chip"><span><i class="ti ti-file" aria-hidden="true"></i> ${doc.label}</span><button type="button" onclick="viewBvgDocument('${employee.id}','${doc.key}')"><i class="ti ti-eye" aria-hidden="true"></i> View</button><a href="${uploaded.fileData}" download="${uploaded.fileName}"><i class="ti ti-download" aria-hidden="true"></i> Download</a></div>`
                : `<span>${doc.label}: missing</span>`;
            }).join('')}</div>
            ${employee.bvg?.note?`<div class="read-time warning">${employee.bvg.note}</div>`:''}
          </div>
          <div class="ri-right">
            <span class="badge ${employee.bvg?.status==='approved'?'b-active':employee.bvg?.status==='submitted'?'b-pending':'b-archived'}">${bvgStatusLabel(employee.bvg?.status)}</span>
            <button class="btn sm pri" onclick="approveBvg('${employee.id}')" ${employee.bvg?.status==='approved'||!stats.complete?'disabled':''}><i class="ti ti-check" aria-hidden="true"></i> Approve</button>
            <button class="btn sm danger" onclick="rejectBvg('${employee.id}')" ${employee.bvg?.status==='approved'?'disabled':''}><i class="ti ti-x" aria-hidden="true"></i> Request changes</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

window.viewBvgDocument=function(employeeId,docKey){
  const employee=employeeById(employeeId);
  const docMeta=BVG_DOCUMENTS.find(item=>item.key===docKey);
  const uploaded=employee?.bvg?.docs?.[docKey];
  if(!uploaded?.fileData){
    toast('Document is not available');
    return;
  }
  const title=document.getElementById('bvgPreviewTitle');
  const body=document.getElementById('bvgPreviewBody');
  const download=document.getElementById('bvgPreviewDownload');
  if(!title||!body||!download){
    window.open(uploaded.fileData,'_blank','noopener');
    return;
  }
  title.textContent=`${employee.name} - ${docMeta?.label||'BVG document'}`;
  download.href=uploaded.fileData;
  download.download=uploaded.fileName||`${docKey}-document`;
  const source=uploaded.fileData;
  const fileName=(uploaded.fileName||'').toLowerCase();
  const mime=(source.match(/^data:([^;]+);/)||[])[1]||'';
  if(mime.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(fileName)){
    body.innerHTML=`<img class="bvg-preview-img" src="${source}" alt="${docMeta?.label||'BVG document'} preview">`;
  }else if(mime==='application/pdf'||fileName.endsWith('.pdf')){
    body.innerHTML=`<iframe class="bvg-preview-frame" src="${source}" title="${docMeta?.label||'BVG document'} preview"></iframe>`;
  }else{
    body.innerHTML=`<div class="empty-state"><i class="ti ti-file-download" aria-hidden="true"></i><strong>Preview is not available for this file type.</strong><span>${uploaded.fileName||'Uploaded document'} can be downloaded and opened on your computer.</span></div>`;
  }
  openM('mBvgPreview');
};

window.approveBvg=function(id){
  const employee=employeeById(id);
  if(!employee) return;
  employee.bvg=employee.bvg||{docs:{}};
  if(!bvgStats(employee).complete){toast('All BVG documents are required before approval');return;}
  employee.bvg.status='approved';
  employee.bvg.reviewedAt=new Date().toISOString();
  employee.bvg.reviewedBy=currentUser?.name||'HR';
  employee.bvg.note='';
  saveStore();
  renderAdminBvg();
  renderEmpTable();
  toast(`${employee.name} can now access the employee portal`);
};

window.rejectBvg=function(id){
  const employee=employeeById(id);
  if(!employee) return;
  const note=prompt(`What should ${employee.name} correct or re-upload?`,'Please re-upload the unclear document.');
  if(note===null) return;
  employee.bvg=employee.bvg||{docs:{}};
  employee.bvg.status='rejected';
  employee.bvg.note=note.trim()||'Please review and re-upload the required BVG documents.';
  employee.bvg.reviewedAt=new Date().toISOString();
  employee.bvg.reviewedBy=currentUser?.name||'HR';
  saveStore();
  renderAdminBvg();
  toast('Changes requested');
};

window.renderEmpTable=function(){
  document.getElementById('empTotal').textContent=store.employees.length;
  document.getElementById('empActive').textContent=store.employees.filter(e=>e.status==='Active').length;
  document.getElementById('hrTotal').textContent=store.hrs.length;
  document.getElementById('empOpenQ').textContent=store.queries.filter(q=>q.status!=='resolved').length;
  document.getElementById('employeeNames').innerHTML=store.employees.map(e=>{const pr=policyReadStats(e);return `<div class="row-item policy-row"><div><div class="ri-name">${e.name}</div><div class="ri-meta">${e.email} - ${e.dept} - Policies acknowledged ${pr.read}/${pr.total}</div></div><div class="ri-right"><span class="badge ${pr.total&&pr.read===pr.total?'b-active':'b-pending'}">${pr.read}/${pr.total} read</span><span class="badge ${e.status==='Active'?'b-active':'b-archived'}">${e.status}</span><button class="btn sm danger" onclick="deleteEmployee('${e.id}')" title="Delete employee"><i class="ti ti-trash" aria-hidden="true"></i> Delete</button></div></div>`;}).join('');
  document.getElementById('eTable').innerHTML=`<thead><tr><th>Name</th><th>Company email</th><th>Dept</th><th>Role</th><th>Policy read</th><th>BVG</th><th>Annual left</th><th>Sick left</th><th>WFH left</th><th>Password</th><th>Status</th><th>Action</th></tr></thead><tbody>${store.employees.map(e=>{const l=e.leave, pr=policyReadStats(e);return `<tr><td style="font-weight:500">${e.name}</td><td>${e.email}</td><td style="color:var(--color-text-secondary)">${e.dept}</td><td>${e.role||'-'}</td><td><span class="badge ${pr.total&&pr.read===pr.total?'b-active':'b-pending'}">${pr.read}/${pr.total}</span></td><td><span class="badge ${e.bvg?.status==='approved'?'b-active':'b-pending'}">${bvgStatusLabel(e.bvg?.status)}</span></td><td>${l.annual.t-l.annual.u}</td><td>${l.sick.t-l.sick.u}</td><td>${l.wfh.t-l.wfh.u}</td><td><span class="badge ${e.mustChangePassword?'b-pending':'b-active'}">${e.mustChangePassword?'Reset required':'Private'}</span></td><td><span class="badge ${e.status==='Active'?'b-active':'b-archived'}">${e.status}</span></td><td><div class="table-actions"><button class="btn sm" onclick="toggleEmployee('${e.id}')">${e.status==='Active'?'Deactivate':'Activate'}</button><button class="btn sm danger" onclick="deleteEmployee('${e.id}')" title="Delete employee"><i class="ti ti-trash" aria-hidden="true"></i></button></div></td></tr>`;}).join('')}</tbody>`;
  if(currentUser?.portal==='hr'&&!employeeSheetSyncing) setTimeout(()=>syncEmployeesFromBackendSheet(false),0);
};

function tempPassword(){
  return `HRP${Math.random().toString(36).slice(2,8).toUpperCase()}${Math.floor(10+Math.random()*90)}`;
}

function createEmployeeRecord({name,email,dept,role,tempPass}){
  return {
    id:`emp-${store.nextEmployeeId++}`,
    name,
    email,
    password:tempPass,
    mustChangePassword:true,
    dept:dept||'General',
    role:role||'Employee',
    status:'Active',
    manager:currentUser?.name||'HR',
    policyReads:{},
    dismissedNotifications:[],
    documents:[],
    gameProgress:null,
    bvg:{status:'pending',docs:{},note:'',submittedAt:'',reviewedAt:'',reviewedBy:''},
    leave:{annual:{u:0,t:18},sick:{u:0,t:8},wfh:{u:0,t:12},comp:{u:0,t:3}}
  };
}

async function sendEmployeeWelcomeEmail(employee,tempPass){
  const res=await fetch('/api/send-welcome-email',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      companyName:COMPANY.companyName,
      portalName:COMPANY.portalName,
      portalUrl:location.origin,
      employee:{name:employee.name,email:employee.email,tempPassword:tempPass}
    })
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'Email could not be sent');
  return data;
}

async function applyEmployeeRows(rows,{resultId='bulkEmpResult',manual=false,source='upload'}={}){
  const result=document.getElementById(resultId);
  const knownEmails=new Set([...store.employees,...store.hrs].map(user=>user.email.toLowerCase()));
  const created=[];
  const updated=[];
  const skipped=[];

  rows.forEach(row=>{
    const email=(row.email||'').trim().toLowerCase();
    const pass=(row.tempPass||document.getElementById('empBulkDefaultPass')?.value||'emp123'||tempPassword()).trim();
    if(!row.name||!isEmail(email)){
      skipped.push(`Line ${row.line||'?'}: invalid name or email`);
      return;
    }
    if(pass.length<4){
      skipped.push(`Line ${row.line||'?'}: temporary password too short`);
      return;
    }
    const existing=store.employees.find(employee=>employee.email.toLowerCase()===email);
    if(existing){
      existing.name=row.name;
      existing.dept=row.dept||existing.dept||'General';
      existing.role=row.role||existing.role||'Employee';
      updated.push(existing);
      return;
    }
    if(knownEmails.has(email)){
      skipped.push(`Line ${row.line||'?'}: ${email} already exists`);
      return;
    }
    knownEmails.add(email);
    const employee=createEmployeeRecord({name:row.name,email,dept:row.dept,role:row.role,tempPass:pass});
    store.employees.push(employee);
    created.push({employee,tempPass:pass,line:row.line});
  });

  if(!created.length&&!updated.length){
    if(manual&&result) result.innerHTML=`<div class="hint-box danger-soft">No employee changes found.${skipped.length?`<br>${skipped.slice(0,8).join('<br>')}`:''}</div>`;
    return {created,updated,skipped,emailResults:[]};
  }

  try{
    saveStore();
  }catch(err){
    const createdIds=new Set(created.map(item=>item.employee.id));
    store.employees=store.employees.filter(employee=>!createdIds.has(employee.id));
    toast('Employees could not be saved. Browser storage may be full.');
    return {created:[],updated:[],skipped:[...skipped,'Browser storage may be full'],emailResults:[]};
  }

  renderEmpTable();
  if(created.length) toast(`${created.length} new employee(s) created from ${source}. Sending emails...`);

  const emailResults=[];
  for(const item of created){
    try{
      await sendEmployeeWelcomeEmail(item.employee,item.tempPass);
      emailResults.push({ok:true,email:item.employee.email});
    }catch(err){
      emailResults.push({ok:false,email:item.employee.email,error:err.message});
    }
  }

  const sent=emailResults.filter(item=>item.ok).length;
  const failed=emailResults.filter(item=>!item.ok);
  if(result&&(manual||created.length||updated.length)){
    result.innerHTML=`<div class="hint-box ${failed.length?'':'success-soft'}"><strong>${created.length} created, ${updated.length} updated.</strong><br>${sent} welcome emails sent.${failed.length?`<br>${failed.length} email(s) failed: ${failed.slice(0,5).map(item=>`${item.email} - ${item.error}`).join('<br>')}`:''}${skipped.length?`<br><br>Skipped rows:<br>${skipped.slice(0,8).join('<br>')}`:''}</div>`;
  }
  if(manual) toast(failed.length?`${sent}/${created.length} emails sent. Check sync summary.`:`${source} sync complete.`);
  return {created,updated,skipped,emailResults};
}

window.syncEmployeesFromBackendSheet=async function(manual=false){
  if(employeeSheetSyncing) return;
  employeeSheetSyncing=true;
  const result=document.getElementById('sheetSyncResult');
  try{
    const res=await fetch('/api/employee-sheet',{cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||'Employee sheet could not be read');
    if(!manual&&data.modifiedAt&&data.modifiedAt===lastEmployeeSheetModifiedAt) return;
    lastEmployeeSheetModifiedAt=data.modifiedAt||Date.now();
    const rows=Array.isArray(data.employees)?data.employees:[];
    if(!rows.length){
      if(manual&&result) result.innerHTML=`<div class="hint-box">Connected to ${data.path||'employee sheet'}, but no employee rows were found.</div>`;
      return;
    }
    await applyEmployeeRows(rows,{resultId:'sheetSyncResult',manual,source:'Excel sheet'});
  }catch(err){
    if(manual&&result) result.innerHTML=`<div class="hint-box danger-soft">${err.message}</div>`;
    if(manual) toast(`Excel sync failed: ${err.message}`);
  }finally{
    employeeSheetSyncing=false;
  }
};

function parseEmployeeCsv(text){
  const rows=[];
  let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i],next=text[i+1];
    if(char==='"'&&quoted&&next==='"'){
      cell+='"';
      i++;
    }else if(char==='"'){
      quoted=!quoted;
    }else if(char===','&&!quoted){
      row.push(cell.trim());
      cell='';
    }else if((char==='\n'||char==='\r')&&!quoted){
      if(char==='\r'&&next==='\n') i++;
      row.push(cell.trim());
      if(row.some(value=>value)) rows.push(row);
      row=[];
      cell='';
    }else{
      cell+=char;
    }
  }
  row.push(cell.trim());
  if(row.some(value=>value)) rows.push(row);
  if(!rows.length) return [];
  const header=rows[0].map(value=>value.toLowerCase().replace(/\s+/g,''));
  const hasHeader=header.includes('email')||header.includes('companyemail')||header.includes('name')||header.includes('fullname');
  const dataRows=hasHeader?rows.slice(1):rows;
  const indexOf=(names, fallback)=>names.map(name=>header.indexOf(name)).find(index=>index>=0) ?? fallback;
  const indexes={
    name:hasHeader?indexOf(['name','fullname','employee'],0):0,
    email:hasHeader?indexOf(['email','companyemail','loginid','mail'],1):1,
    dept:hasHeader?indexOf(['department','dept'],2):2,
    role:hasHeader?indexOf(['role','designation','jobtitle'],3):3,
    tempPass:hasHeader?indexOf(['temppassword','temporarypassword','password','temppass'],4):4
  };
  return dataRows.map((cells,line)=>({
    line:hasHeader?line+2:line+1,
    name:(cells[indexes.name]||'').trim(),
    email:(cells[indexes.email]||'').trim().toLowerCase(),
    dept:(cells[indexes.dept]||'').trim(),
    role:(cells[indexes.role]||'').trim(),
    tempPass:(cells[indexes.tempPass]||'').trim()
  }));
}

async function parseEmployeeUploadFile(file){
  if(/\.(csv)$/i.test(file.name)||file.type==='text/csv'){
    return parseEmployeeCsv(await file.text());
  }
  const fileData=await fileToDataUrl(file);
  const res=await fetch('/api/parse-employee-upload',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fileName:file.name,fileData})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'Employee file could not be parsed');
  return Array.isArray(data.employees)?data.employees:[];
}

window.downloadEmployeeCsvTemplate=function(){
  const csv='name,email,department,role,tempPassword\nAarav Mehta,aarav@company.com,Engineering,Developer,\nNisha Rao,nisha@company.com,Finance,Analyst,Welcome123';
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  const link=document.createElement('a');
  link.href=url;
  link.download='hrpulse-employee-bulk-template.csv';
  link.click();
  URL.revokeObjectURL(url);
};

window.bulkUploadEmployees=async function(){
  const file=document.getElementById('empBulkFile')?.files?.[0];
  const defaultPass=(document.getElementById('empBulkDefaultPass')?.value||'emp123').trim();
  const result=document.getElementById('bulkEmpResult');
  if(!file){toast('Choose a CSV or Excel file');return;}
  if(defaultPass.length<4){toast('Default temporary password must be at least 4 characters');return;}
  let rows=[];
  try{
    if(result) result.innerHTML='<div class="hint-box">Reading employee file...</div>';
    rows=await parseEmployeeUploadFile(file);
  }catch(err){
    if(result) result.innerHTML=`<div class="hint-box danger-soft">${err.message}</div>`;
    toast(err.message);
    return;
  }
  if(!rows.length){toast('File has no employee rows');return;}
  rows.forEach(row=>{ if(!row.tempPass) row.tempPass=defaultPass; });
  await applyEmployeeRows(rows,{resultId:'bulkEmpResult',manual:true,source:file.name});
  document.getElementById('empBulkFile').value='';
};

window.addEmployee=async function(){
  const name=document.getElementById('empName').value.trim(), email=document.getElementById('empEmail').value.trim().toLowerCase();
  const tempPass=document.getElementById('empPass').value.trim()||'emp123';
  if(!name||!isEmail(email)){toast('Enter a valid employee name and email');return;}
  if(tempPass.length<4){toast('Temporary password must be at least 4 characters');return;}
  if([...store.employees,...store.hrs].some(u=>u.email.toLowerCase()===email)){toast('Email already exists');return;}
  const employee=createEmployeeRecord({name,email,tempPass,dept:document.getElementById('empDept').value.trim(),role:document.getElementById('empRole').value.trim()});
  store.employees.push(employee);
  try{
    saveStore();
  }catch(err){
    store.employees=store.employees.filter(e=>e.id!==employee.id);
    toast('Employee could not be saved. Browser storage may be full.');
    return;
  }
  closeM('mEmp');
  ['empName','empEmail','empDept','empRole'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('empPass').value='emp123';
  renderEmpTable();
  toast('Employee login created. Sending email...');
  try{
    await sendEmployeeWelcomeEmail(employee,tempPass);
    toast('Welcome email sent to employee.');
  }catch(err){
    toast(`Employee saved. Email not sent: ${err.message}`);
  }
};
window.toggleEmployee=function(id){
  const e=employeeById(id);
  if(!e) return;
  e.status=e.status==='Active'?'Inactive':'Active';
  saveStore();renderEmpTable();toast(`${e.name} is now ${e.status}`);
};

window.deleteEmployee=function(id){
  const employee=employeeById(id);
  if(!employee) return;
  const ok=confirm(`Delete ${employee.name} permanently?\n\nTheir login and leave balance will be removed. Existing HR queries will be kept for record history.`);
  if(!ok) return;
  store.employees=store.employees.filter(e=>e.id!==id);
  store.queries.forEach(q=>{
    if(q.empId===id){
      q.empId=null;
      q.emp=`${employee.name} (deleted)`;
    }
  });
  saveStore();
  renderEmpTable();
  if(document.getElementById('ovEmp')) document.getElementById('ovEmp').textContent=store.employees.length;
  toast(`${employee.name} deleted`);
};

window.renderOverview=function(){
  document.getElementById('ovEmp').textContent=store.employees.length;
  document.getElementById('ovAct').textContent=store.policies.filter(p=>p.status==='Active').length;
  document.getElementById('ovQ').textContent=store.queries.filter(q=>q.status!=='resolved').length;
  const ctx=document.getElementById('ovChart');
  if(!ctx||typeof Chart==='undefined') return;
  if(liveChart) liveChart.destroy();
  liveChart=new Chart(ctx,{type:'bar',data:{labels:store.employees.map(e=>e.name.split(' ')[0]),datasets:[{label:'Annual',data:store.employees.map(e=>e.leave.annual.u),backgroundColor:'#7F77DD'},{label:'Sick',data:store.employees.map(e=>e.leave.sick.u),backgroundColor:'#1D9E75'},{label:'WFH',data:store.employees.map(e=>e.leave.wfh.u),backgroundColor:'#EF9F27'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{stepSize:5}}}}});
};

window.updateBars=function(){
  const e=employeeById(currentUser?.id)||store.employees[0], l=e.leave;
  document.querySelector('#pg-myLeaves .pg-title').textContent=`${e.name}'s leave tracker`;
  document.getElementById('eAL').textContent=l.annual.t-l.annual.u;
  document.getElementById('eSL').textContent=l.sick.t-l.sick.u;
  document.getElementById('eWL').textContent=l.wfh.t-l.wfh.u;
  document.getElementById('eCL').textContent=l.comp.t-l.comp.u;
  [['a',l.annual],['sk',l.sick],['w',l.wfh],['c',l.comp]].forEach(([id,b])=>{
    document.getElementById(id+'Bar').style.width=Math.round(b.u/b.t*100)+'%';
  });
  document.getElementById('aTxt').textContent=`${l.annual.u} used - ${l.annual.t-l.annual.u} remaining of ${l.annual.t}`;
  document.getElementById('skTxt').textContent=`${l.sick.u} used - ${l.sick.t-l.sick.u} remaining of ${l.sick.t}`;
  document.getElementById('wTxt').textContent=`${l.wfh.u} used - ${l.wfh.t-l.wfh.u} remaining of ${l.wfh.t}`;
  document.getElementById('cTxt').textContent=`${l.comp.u} used - ${l.comp.t-l.comp.u} remaining of ${l.comp.t}`;
};

window.applyLeave=function(){
  const e=employeeById(currentUser?.id);
  if(!e){toast('Please sign in again');return;}
  const type=document.getElementById('lvT').value, days=parseInt(document.getElementById('lvD').value)||1;
  const key=type==='Annual'?'annual':type==='Sick'?'sick':type==='WFH'?'wfh':'comp';
  const b=e.leave[key];
  if(b.u+days>b.t){toast(`Not enough ${type} balance`);return;}
  b.u+=days;
  store.queries.push({id:store.nextQueryId++,empId:e.id,emp:e.name,category:'Leave',subject:`${type} leave - ${days} day(s)`,msg:document.getElementById('lvR').value.trim()||`Applied for ${days} day(s) of ${type} leave.`,status:'pending',response:null,createdAt:new Date().toISOString()});
  saveStore();updateBars();renderEmployeeHome();document.getElementById('lvR').value='';toast(`${days} day(s) of ${type} leave submitted`);
};

window.renderMyQueries=function(){
  const e=employeeById(currentUser?.id);
  const list=document.getElementById('myQueryList');
  if(!list||!e) return;
  const mine=store.queries.filter(q=>q.empId===e.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  list.innerHTML=mine.length?mine.map(q=>`<div class="row-item" style="flex-direction:column;align-items:flex-start;gap:6px"><div style="display:flex;justify-content:space-between;width:100%;gap:10px"><div><div class="ri-name">${q.subject}</div><div class="ri-meta">${q.category||'General'} - Raised ${formatQueryTime(q.createdAt)}</div><div class="query-msg">${q.msg}</div></div><span class="badge b-${q.status}">${q.status}</span></div>${q.response?`<div class="hr-reply"><div class="reply-label"><i class="ti ti-check" aria-hidden="true"></i> HR reply ${q.resolvedAt?`- ${formatQueryTime(q.resolvedAt)}`:''}</div><div>${q.response}</div></div>`:`<div class="reply-pending"><i class="ti ti-clock" aria-hidden="true"></i> Waiting for HR response</div>`}</div>`).join(''):'<div class="empty-state">No queries raised yet.</div>';
};

window.raiseEmployeeQuery=function(){
  const e=employeeById(currentUser?.id);
  if(!e){toast('Please sign in again');return;}
  const subject=document.getElementById('rqSubject').value.trim();
  const msg=document.getElementById('rqMsg').value.trim();
  const category=document.getElementById('rqCategory').value;
  if(!subject||!msg){toast('Enter a subject and question');return;}
  store.queries.push({id:store.nextQueryId++,empId:e.id,emp:e.name,category,subject,msg,status:'open',response:null,createdAt:new Date().toISOString()});
  saveStore();
  const openCount=store.queries.filter(q=>q.status!=='resolved').length;
  if(document.getElementById('qBadge')) document.getElementById('qBadge').textContent=openCount;
  if(document.getElementById('ovQ')) document.getElementById('ovQ').textContent=openCount;
  document.getElementById('rqSubject').value='';
  document.getElementById('rqMsg').value='';
  renderMyQueries();
  renderEmployeeHome();
  toast('Query submitted to HR');
};

window.renderEPolicies=function(){
  const el=document.getElementById('ePList');
  el.innerHTML='';
  const employee=employeeById(currentUser?.id);
  const activePolicies=store.policies.filter(p=>p.status==='Active');
  if(!activePolicies.length){
    el.innerHTML='<div class="empty-state">No active policies available.</div>';
    return;
  }
  activePolicies.forEach(p=>{
    const d=document.createElement('div');
    d.className='card';
    const readValue=policyReadValue(employee,p.id);
    const readAt=typeof readValue==='string'?readValue:readValue?.acknowledgedAt;
    const current=isPolicyAcknowledgedCurrent(employee,p);
    const stale=readAt&&!current;
    d.innerHTML=`<div class="card-hd"><div class="card-title"><i class="ti ti-file-text" aria-hidden="true"></i> ${p.name}</div><span class="badge b-active">${p.cat}</span></div><div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6">${policySummary(p)}</div>${policyAttachmentLink(p)}<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:8px">Effective ${p.date} - Last updated ${formatQueryTime(p.updatedAt||p.date)}</div><label class="policy-read ${current?'locked':''}"><input type="checkbox" ${current?'checked disabled':''} onchange="togglePolicyRead(${p.id},this.checked)"> ${current?'Policy acknowledged and locked':'I have read and understood this policy'}</label>${current?`<div class="read-time">Acknowledged ${formatQueryTime(readAt)}. You cannot untick this unless HR updates the policy.</div>`:stale?`<div class="read-time warning">Policy was updated after your last acknowledgement. Please read and acknowledge again.</div>`:''}`;
    el.appendChild(d);
  });
};

window.togglePolicyRead=function(policyId,checked){
  const employee=employeeById(currentUser?.id);
  if(!employee){toast('Please sign in again');return;}
  const policy=store.policies.find(p=>String(p.id)===String(policyId));
  if(!policy){toast('Policy not found');return;}
  employee.policyReads=employee.policyReads||{};
  if(!checked&&isPolicyAcknowledgedCurrent(employee,policy)){
    renderEPolicies();
    toast('Acknowledged policies are locked until HR updates them');
    return;
  }
  if(checked) employee.policyReads[policyId]=new Date().toISOString();
  else if(!isPolicyAcknowledgedCurrent(employee,policy)) delete employee.policyReads[policyId];
  saveStore();
  renderEPolicies();
  renderEmployeeHome();
  toast(checked?'Policy marked as read':'Policy acknowledgement removed');
};

window.initChat=function(){
  chatHistory=[];
  document.getElementById('chatMsgs').innerHTML='';
  document.getElementById('chatErr').style.display='none';
  const e=employeeById(currentUser?.id)||store.employees[0];
  addBot(`Hi ${e.name.split(' ')[0]}! I can answer from live HRPulse data: policies, leaves, documents, your queries, and announcements. What would you like to know?`);
  checkAiStatus();
};

function setAiStatus(state,text){
  const el=document.getElementById('aiStatus');
  if(!el) return;
  el.className=`ai-status ${state}`;
  el.innerHTML=`<i class="ti ${state==='live'?'ti-circle-check':state==='thinking'?'ti-loader-2':'ti-alert-circle'}" aria-hidden="true"></i> ${text}`;
}

function aiPayload(question,employee){
  const docs=(employee.documents||[]).map(doc=>({type:doc.type,title:doc.title,fileName:doc.fileName,uploadedAt:doc.uploadedAt,acknowledgedAt:doc.acknowledgedAt||''}));
  return {
    question,
    employee:{
      name:employee.name,
      email:employee.email,
      dept:employee.dept,
      role:employee.role,
      manager:employee.manager,
      leave:employee.leave,
      profileCompletion:profileCompletion(employee),
      gameProgress:employee.gameProgress||null,
      learningCompletions:employee.learningCompletions||[]
    },
    policies:store.policies.filter(p=>p.status==='Active'),
    unreadPolicies:unreadPolicies(employee).map(p=>({id:p.id,name:p.name,cat:p.cat})),
    queries:employeeQueries(employee).slice(0,8),
    documents:docs,
    events:upcomingEvents().slice(0,5),
    news:latestNews().slice(0,5),
    history:chatHistory.slice(-8)
  };
}

window.checkAiStatus=async function(){
  try{
    setAiStatus('thinking','Checking live AI...');
    const res=await fetch('/api/ai-status');
    const data=await res.json();
    if(data.connected) setAiStatus('live',`Live AI connected (${data.provider||'ai'}: ${data.model})`);
    else if(data.provider==='ollama') setAiStatus('offline',`Start Ollama and run: ollama pull ${data.model}`);
    else setAiStatus('offline','Add OPENAI_API_KEY in .env to enable live AI');
  }catch(err){
    setAiStatus('offline','Server AI endpoint not reachable');
  }
};

window.sendChat=async function(){
  if(botBusy) return;
  const inp=document.getElementById('chatIn'), msg=inp.value.trim();
  if(!msg) return;
  inp.value='';addUser(msg);botBusy=true;showTyping();setAiStatus('thinking','Live AI is thinking...');
  try{
    const e=employeeById(currentUser?.id)||store.employees[0];
    const res=await fetch('/api/hr-policy-ai',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(aiPayload(msg,e))
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'AI request failed');
    chatHistory.push({role:'user',content:msg},{role:'assistant',content:data.answer});
    hideTyping();botBusy=false;setAiStatus('live',`Live AI connected (${data.source||'ai'}: ${data.model||'model'})`);addBot(data.answer);
  }catch(err){
    hideTyping();botBusy=false;
    const errBox=document.getElementById('chatErr');
    errBox.textContent=`Live AI is unavailable: ${err.message}. Showing the built-in HRPulse answer instead.`;
    errBox.style.display='block';
    setAiStatus('offline','Live AI unavailable - using built-in answers');
    addBot(localReply(msg));
  }
};

function localReply(msg){
  const e=employeeById(currentUser?.id)||store.employees[0], l=e.leave, m=msg.toLowerCase();
  if(m.includes('unread')) {
    const unread=unreadPolicies(e);
    return unread.length?`You still need to read ${unread.length} active policy/policies: ${unread.map(p=>p.name).join(', ')}.`:'You have acknowledged all active policies.';
  }
  if(m.includes('pending action')||m.includes('action is pending')){
    const unread=unreadPolicies(e).length, open=employeeQueries(e).filter(q=>q.status!=='resolved').length;
    return `Pending actions: ${unread} unread policies and ${open} open HR query/query(s).`;
  }
  if(m.includes('annual')) return `You have ${l.annual.t-l.annual.u} annual leave day(s) left out of ${l.annual.t}. The Annual Leave Policy allows up to 5 unused days to be carried forward.`;
  if(m.includes('sick')) return `You have ${l.sick.t-l.sick.u} sick leave day(s) left. A medical certificate is required only for 3 or more consecutive sick days.`;
  if(m.includes('wfh')||m.includes('work from home')) return `You have ${l.wfh.t-l.wfh.u} WFH day(s) left. The active WFH policy allows up to 3 days per week with manager approval.`;
  if(m.includes('carry')) return 'The Annual Leave Policy allows up to 5 unused annual leave days to be carried forward to the next year.';
  if(m.includes('benefit')) return 'Current active benefit details are listed under active policies. HR has a maternity and paternity policy in draft, so ask HR before relying on it.';
  return `I found ${store.policies.filter(p=>p.status==='Active').length} active policies and your live balances: annual ${l.annual.t-l.annual.u}, sick ${l.sick.t-l.sick.u}, WFH ${l.wfh.t-l.wfh.u}, comp-off ${l.comp.t-l.comp.u}. For requests, use the My leaves tab.`;
}

/*game*/
let currentQuestion = 0;

let scores = {
    empathy: 0,
    strategy: 0,
    innovation: 0,
    speed: 0
};

const scenarios = [

{
title:"Employee Leave Request",
question:"Your top performer asks for 2 weeks leave during a critical project.",
choices:[
{
text:"Reject the leave",
effects:{strategy:10,speed:10}
},
{
text:"Approve immediately",
effects:{empathy:15}
},
{
text:"Discuss alternative dates",
effects:{strategy:10,empathy:10}
}
]
},

{
title:"Remote Work Policy",
question:"Employees want more flexibility.",
choices:[
{
text:"Keep existing rules",
effects:{strategy:10}
},
{
text:"Allow hybrid work",
effects:{innovation:15,empathy:10}
},
{
text:"Allow complete freedom",
effects:{innovation:20}
}
]
},

{
title:"Team Conflict",
question:"Two team members are constantly arguing.",
choices:[
{
text:"Ignore it",
effects:{speed:10}
},
{
text:"Conduct mediation",
effects:{empathy:15}
},
{
text:"Reassign responsibilities",
effects:{strategy:15}
}
]
},

{
title:"Budget Cut",
question:"Budget reduced by 20%.",
choices:[
{
text:"Lay off employees",
effects:{strategy:15}
},
{
text:"Reduce expenses elsewhere",
effects:{innovation:15,empathy:10}
},
{
text:"Freeze hiring",
effects:{strategy:10}
}
]
},

{
title:"New Technology",
question:"A new AI tool can automate tasks.",
choices:[
{
text:"Ignore it",
effects:{speed:10}
},
{
text:"Pilot test it",
effects:{innovation:20}
},
{
text:"Deploy immediately",
effects:{innovation:15,speed:10}
}
]
}

];
function startMaze(){

currentQuestion = 0;

scores = {
    empathy:0,
    strategy:0,
    innovation:0,
    speed:0
};

showQuestion();
}

function showQuestion(){

const q = scenarios[currentQuestion];

let html = `
<h2>${q.title}</h2>
<p style="margin-bottom:20px">
${q.question}
</p>
`;

q.choices.forEach((choice,index)=>{

html += `
<button
class="btn"
style="display:block;width:100%;margin-bottom:10px"
onclick="chooseOption(${index})"
>
${choice.text}
</button>
`;

});

document.getElementById("gameArea").innerHTML = html;
}

function chooseOption(index){

const choice =
scenarios[currentQuestion].choices[index];

for(let key in choice.effects){

scores[key] += choice.effects[key];

}

currentQuestion++;

if(currentQuestion >= scenarios.length){

showResult();

}else{

showQuestion();

}
}
function showResult(){

const maxTrait =
Object.keys(scores).reduce((a,b)=>
scores[a] > scores[b] ? a : b
);

let profile = "";

switch(maxTrait){

case "empathy":
profile =
"🤝 The People Leader";
break;

case "strategy":
profile =
"📊 The Strategic Thinker";
break;

case "innovation":
profile =
"🚀 The Visionary Innovator";
break;

case "speed":
profile =
"⚡ The Fast Decision Maker";
break;

}

document.getElementById("gameArea").innerHTML = `

<h2>🎉 Your Leadership Profile</h2>

<div style="text-align:left;margin-top:20px">

<p><b>Empathy:</b> ${scores.empathy}</p>

<p><b>Strategy:</b> ${scores.strategy}</p>

<p><b>Innovation:</b> ${scores.innovation}</p>

<p><b>Decision Speed:</b> ${scores.speed}</p>

</div>

<h3 style="margin-top:20px">
${profile}
</h3>

<p style="margin-top:15px">
Your decisions reveal how you approach
leadership and workplace challenges.
</p>

<button
class="btn pri"
onclick="startMaze()"
>
Play Again
</button>

`;
}
const wordWonderLevels=[
  {theme:'Team basics',letters:['T','E','A','M'],words:['TEAM','MEAT','MATE','TAME','TEA','EAT','ATE','MET']},
  {theme:'Leave desk',letters:['L','E','A','V','E'],words:['LEAVE','VEAL','VALE','ALE','EEL','EVE']},
  {theme:'Policy room',letters:['P','O','L','I','C','Y'],words:['POLICY','COPY','CLIP','OIL','ICY']},
  {theme:'Work mode',letters:['W','O','R','K'],words:['WORK','ROW','WOK']},
  {theme:'Growth track',letters:['G','R','O','W','T','H'],words:['GROWTH','GROW','WORTH','ROW','HOT','TOW']},
  {theme:'Payroll desk',letters:['P','A','Y','R','O','L','L'],words:['PAYROLL','PAY','ROLL','PLAY','LOYAL','RAY','LAY']},
  {theme:'Culture club',letters:['C','U','L','T','U','R','E'],words:['CULTURE','CURE','TRUE','RULE','CUTE','LURE']},
  {theme:'Talent room',letters:['T','A','L','E','N','T'],words:['TALENT','LATE','LEAN','TENT','ANT','LANE','TEAL']},
  {theme:'Benefits bay',letters:['B','E','N','E','F','I','T'],words:['BENEFIT','FIT','NET','TEN','BITE','FINE','BEET']},
  {theme:'Office flow',letters:['O','F','F','I','C','E'],words:['OFFICE','ICE','OFF','FOE','FIFE','COIF']}
];
const wordWonderGeneratedLevels=[
  {theme:'Career climb',letters:['C','A','R','E','E','R'],words:['CAREER','CARE','RACE','ACRE','RARE','EAR','ERA']},
  {theme:'Hiring round',letters:['H','I','R','I','N','G'],words:['HIRING','RING','GRIN','GIRN','HIN','GIN']},
  {theme:'Mentor map',letters:['M','E','N','T','O','R'],words:['MENTOR','METRO','TENOR','TONER','MORE','ROTE','TONE']},
  {theme:'Bonus lane',letters:['B','O','N','U','S'],words:['BONUS','SNOB','ONUS','BUN','SUN','NUB']},
  {theme:'Review desk',letters:['R','E','V','I','E','W'],words:['REVIEW','VIEW','VEER','WIRE','WEIR','EVER']},
  {theme:'Skill lab',letters:['S','K','I','L','L'],words:['SKILL','SILK','KILL','ILL','SKI']},
  {theme:'Training hub',letters:['T','R','A','I','N'],words:['TRAIN','RAIN','RANT','TARN','ANTI','AIR','TIN']},
  {theme:'Reward room',letters:['R','E','W','A','R','D'],words:['REWARD','DRAW','WARD','WARE','DEAR','DARE','READ']},
  {theme:'Sprint board',letters:['S','P','R','I','N','T'],words:['SPRINT','PRINT','STRIP','TRIPS','TINS','RIP','PIN']},
  {theme:'Project pod',letters:['P','R','O','J','E','C','T'],words:['PROJECT','PRO','JET','TOE','COT','CORE','ROPE']},
  {theme:'Meeting mode',letters:['M','E','E','T','I','N','G'],words:['MEETING','MEET','MINE','TIME','TINGE','ITEM','TEN']},
  {theme:'Survey stack',letters:['S','U','R','V','E','Y'],words:['SURVEY','SURE','USER','VERY','RUE','YES']},
  {theme:'Roster route',letters:['R','O','S','T','E','R'],words:['ROSTER','ROSE','ROTE','REST','SORE','TORE','ERR']},
  {theme:'Notice nook',letters:['N','O','T','I','C','E'],words:['NOTICE','NOTE','TONE','CITE','COIN','ICON','ICE']},
  {theme:'Salary suite',letters:['S','A','L','A','R','Y'],words:['SALARY','SLAY','RAYS','LAY','SAY','RAY']},
  {theme:'Holiday hill',letters:['H','O','L','I','D','A','Y'],words:['HOLIDAY','DAILY','IDOL','HOLD','LOAD','LADY','DAY']},
  {theme:'Wellness wave',letters:['W','E','L','L','N','E','S','S'],words:['WELLNESS','WELL','SELL','LESS','NEW','SEWN','SEW']},
  {theme:'Portal path',letters:['P','O','R','T','A','L'],words:['PORTAL','PLOT','ALTO','ORAL','TARP','RAPT','LAP']},
  {theme:'Ticket trail',letters:['T','I','C','K','E','T'],words:['TICKET','TICK','KITE','KITT','CITE','TIE','KIT']},
  {theme:'Query quest',letters:['Q','U','E','R','Y'],words:['QUERY','RUE','RYE','YER','QUE']},
  {theme:'Finance flow',letters:['F','I','N','A','N','C','E'],words:['FINANCE','FINE','CAFE','CANE','NICE','FACE','FAN']},
  {theme:'Admin arena',letters:['A','D','M','I','N'],words:['ADMIN','MAIN','MIND','MAID','DAM','AID']},
  {theme:'People pulse',letters:['P','E','O','P','L','E'],words:['PEOPLE','PEEL','POLE','LOPE','PLOP','PEEP']},
  {theme:'Health help',letters:['H','E','A','L','T','H'],words:['HEALTH','HEAL','HEAT','HATE','LATE','TEAL','EAT']},
  {theme:'Target track',letters:['T','A','R','G','E','T'],words:['TARGET','GREAT','GRATE','TREAT','GEAR','RATE','TEAR']},
  {theme:'Budget bay',letters:['B','U','D','G','E','T'],words:['BUDGET','BUDGE','DEBUT','TUBE','DUET','GET','BET']},
  {theme:'Office orbit',letters:['O','R','B','I','T'],words:['ORBIT','TRIO','RIOT','BRIO','BIT','ROB']},
  {theme:'Report ridge',letters:['R','E','P','O','R','T'],words:['REPORT','PORT','ROPE','TORE','POET','REPO','TOP']},
  {theme:'Growth grid',letters:['G','R','I','D'],words:['GRID','GIRD','RID','DIG','RIG']},
  {theme:'Annual arc',letters:['A','N','N','U','A','L'],words:['ANNUAL','ANNAL','LUNA','ULAN','NUN','ALAN']},
  {theme:'Policy peak',letters:['P','E','A','K'],words:['PEAK','PEA','APE','AKE']},
  {theme:'Shift shine',letters:['S','H','I','F','T'],words:['SHIFT','FISH','HITS','SIFT','HIS','FIT']},
  {theme:'Bonus bridge',letters:['B','R','I','D','G','E'],words:['BRIDGE','BRIE','BIRD','RIDE','GRID','DIRE','BIG']},
  {theme:'Culture curve',letters:['C','U','R','V','E'],words:['CURVE','CURE','RUE','REV','CUE']},
  {theme:'Vision vault',letters:['V','I','S','I','O','N'],words:['VISION','IONS','VINO','SON','SIN','ION']},
  {theme:'Mission map',letters:['M','I','S','S','I','O','N'],words:['MISSION','MISS','IONS','MINI','MOSS','SIM','ION']},
  {theme:'Payroll path',letters:['P','A','T','H'],words:['PATH','HAT','PAT','TAP','APT']},
  {theme:'Workplace way',letters:['W','A','Y'],words:['WAY','YAW','AW']},
  {theme:'Benefit beam',letters:['B','E','A','M'],words:['BEAM','MAE','ABE','AM','ME']},
  {theme:'Feedback field',letters:['F','I','E','L','D'],words:['FIELD','FILE','LIED','DELI','LID','DIE']}
];
let wordWonderLevel=0;
let wordWonderFound=[];
let wordWonderPoints=0;
let wordWonderLetters=[];
let wordWonderStarted=false;

function getWordWonderLevel(){
  if(wordWonderLevel<wordWonderLevels.length){
    const fixed=wordWonderLevels[wordWonderLevel];
    return {
      theme:fixed.theme,
      letters:[...fixed.letters],
      words:[...fixed.words]
    };
  }
  const generatedIndex=(wordWonderLevel-wordWonderLevels.length)%wordWonderGeneratedLevels.length;
  const cycle=Math.floor((wordWonderLevel-wordWonderLevels.length)/wordWonderGeneratedLevels.length);
  const base=wordWonderGeneratedLevels[generatedIndex];
  const words=[...base.words];
  if(cycle){
    const rotateBy=cycle%words.length;
    words.push(...words.splice(0,rotateBy));
  }
  return {
    theme:cycle?`${base.theme} ${cycle+1}`:base.theme,
    letters:[...base.letters],
    words
  };
}

function sameWordLetterBag(left=[],right=[]){
  if(left.length!==right.length) return false;
  const normalize=letters=>[...letters].map(letter=>String(letter).toUpperCase()).sort().join('');
  return normalize(left)===normalize(right);
}

function currentGameEmployee(){
  return employeeById(currentUser?.id);
}

function wordWonderStorageId(employee=currentGameEmployee()){
  return employee?.id||currentUser?.id||currentUser?.email||'guest';
}

function getSavedWordWonderProgress(employee=currentGameEmployee()){
  let cached=null;
  try{
    const all=JSON.parse(localStorage.getItem(HRP_GAME_KEY)||'{}');
    cached=all[wordWonderStorageId(employee)]||null;
  }catch(err){
    cached=null;
  }
  const embedded=employee?.gameProgress?.game==='words-of-wonders'?employee.gameProgress:null;
  if(cached&&embedded){
    const cachedTime=new Date(cached.updatedAt||0).getTime();
    const embeddedTime=new Date(embedded.updatedAt||0).getTime();
    return cachedTime>=embeddedTime?cached:embedded;
  }
  return cached||embedded;
}

function loadWordWonderProgress(){
  const employee=currentGameEmployee();
  const progress=getSavedWordWonderProgress(employee);
  if(!progress||progress.game!=='words-of-wonders'){
    wordWonderStarted=false;
    wordWonderLevel=0;
    wordWonderFound=[];
    wordWonderPoints=0;
    wordWonderLetters=[...getWordWonderLevel().letters];
    return;
  }
  wordWonderStarted=Boolean(progress.started);
  wordWonderLevel=Number.isInteger(progress.level)?progress.level:0;
  const level=getWordWonderLevel();
  wordWonderFound=Array.isArray(progress.found)?progress.found.filter(word=>level.words.includes(word)):[];
  wordWonderPoints=Number(progress.points)||0;
  wordWonderLetters=Array.isArray(progress.letters)&&sameWordLetterBag(progress.letters,level.letters)?progress.letters:[...level.letters];
}

function saveWordWonderProgress(){
  const employee=currentGameEmployee();
  if(!employee) return;
  const progress={
    game:'words-of-wonders',
    started:wordWonderStarted,
    level:wordWonderLevel,
    found:[...wordWonderFound],
    points:wordWonderPoints,
    letters:[...wordWonderLetters],
    updatedAt:new Date().toISOString()
  };
  employee.gameProgress=progress;
  try{
    const all=JSON.parse(localStorage.getItem(HRP_GAME_KEY)||'{}');
    all[wordWonderStorageId(employee)]=progress;
    localStorage.setItem(HRP_GAME_KEY,JSON.stringify(all));
  }catch(err){}
  saveStore();
}

function renderWordWonderLeaderboard(){
  const currentId=currentUser?.id;
  const leaders=store.employees
    .map(employee=>{
      const progress=getSavedWordWonderProgress(employee);
      return {
        id:employee.id,
        name:employee.name,
        points:Number(progress?.points)||0,
        level:Number.isInteger(progress?.level)?progress.level:0,
        found:Array.isArray(progress?.found)?progress.found.length:0
      };
    })
    .sort((a,b)=>b.points-a.points||b.level-a.level||b.found-a.found||a.name.localeCompare(b.name))
    .slice(0,5);
  return `<div class="word-leaderboard">
    <div class="word-leaderboard-title"><i class="ti ti-trophy" aria-hidden="true"></i> Leaderboard</div>
    ${leaders.map((player,index)=>`<div class="leader-row ${player.id===currentId?'me':''}">
      <span class="leader-rank">#${index+1}</span>
      <span class="leader-name">${player.name}</span>
      <span class="leader-meta">Level ${player.level+1}</span>
      <strong>${player.points}</strong>
    </div>`).join('')}
  </div>`;
}

function updateWordWonderStatus(){
  const level=getWordWonderLevel();
  const foundEl=document.getElementById('wordsFound');
  const pointsEl=document.getElementById('wordPoints');
  if(foundEl) foundEl.textContent=`${wordWonderFound.length}/${level.words.length}`;
  if(pointsEl) pointsEl.textContent=wordWonderPoints;
}

function renderWordWonderIntro(){
  const area=document.getElementById('gameArea');
  if(!area) return;
  const saved=getSavedWordWonderProgress();
  const hasSavedGame=saved?.game==='words-of-wonders'&&saved.started;
  updateWordWonderStatus();
  area.innerHTML=`<div class="word-game"><div class="game-intro"><i class="ti ti-letters-case" aria-hidden="true"></i><h2>Words of Wonders</h2><p>Make as many valid words as you can from the given letters. Complete the list to move to the next level.</p><button class="btn pri" onclick="${hasSavedGame?'resumeWordGame()':'startWordGame()'}"><i class="ti ti-player-play" aria-hidden="true"></i> ${hasSavedGame?`Resume Level ${Number(saved.level||0)+1}`:'Start Game'}</button>${hasSavedGame?'<button class="btn sm" onclick="startWordGame(true)" style="margin-left:8px"><i class="ti ti-refresh" aria-hidden="true"></i> New game</button>':''}</div>${renderWordWonderLeaderboard()}</div>`;
}

function renderWordWonderRound(message=''){
  const area=document.getElementById('gameArea');
  if(!area) return;
  const level=getWordWonderLevel();
  const complete=wordWonderFound.length===level.words.length;
  updateWordWonderStatus();
  area.innerHTML=`
    <div class="word-game">
      <div class="game-progress">Level ${wordWonderLevel+1} - ${level.theme}</div>
      <h2>Find the hidden words</h2>
      <div class="word-letters">${wordWonderLetters.map(letter=>`<span class="word-letter">${letter}</span>`).join('')}</div>
      <div class="word-entry">
        <input id="wordGuess" autocomplete="off" placeholder="Type a word" onkeydown="if(event.key==='Enter') submitWonderWord()">
        <button class="btn pri" onclick="submitWonderWord()"><i class="ti ti-check" aria-hidden="true"></i> Submit</button>
      </div>
      <div class="word-actions">
        <button class="btn sm" onclick="shuffleWonderLetters()"><i class="ti ti-arrows-shuffle" aria-hidden="true"></i> Shuffle</button>
        ${complete?`<button class="btn pri sm" onclick="nextWonderLevel()"><i class="ti ti-arrow-right" aria-hidden="true"></i> Next level</button>`:''}
      </div>
      ${message?`<div class="word-message ${complete?'good':''}">${message}</div>`:''}
      <div class="word-hints">${level.words.map(word=>`<span>${wordWonderFound.includes(word)?word:word.length+' letters'}</span>`).join('')}</div>
      <div class="found-words">${wordWonderFound.length?wordWonderFound.map(word=>`<span class="found-word">${word}</span>`).join(''):'<span class="empty-word">No words found yet</span>'}</div>
      ${renderWordWonderLeaderboard()}
    </div>`;
  const input=document.getElementById('wordGuess');
  if(input) input.focus();
}

function canBuildWord(word,letters){
  const available=[...letters];
  for(const char of word){
    const index=available.indexOf(char);
    if(index<0) return false;
    available.splice(index,1);
  }
  return true;
}

window.renderGameTab=function(){
  const area=document.getElementById('gameArea');
  if(!area) return;
  loadWordWonderProgress();
  if(wordWonderStarted) renderWordWonderRound();
  else renderWordWonderIntro();
};

window.startWordGame=function(forceNew=false){
  if(!forceNew){
    const saved=getSavedWordWonderProgress();
    if(saved?.game==='words-of-wonders'&&saved.started){
      window.resumeWordGame();
      return;
    }
  }
  wordWonderStarted=true;
  wordWonderLevel=0;
  wordWonderFound=[];
  wordWonderPoints=0;
  wordWonderLetters=[...getWordWonderLevel().letters];
  saveWordWonderProgress();
  renderWordWonderRound('Level started. Find every word to move ahead.');
};

window.resumeWordGame=function(){
  loadWordWonderProgress();
  wordWonderStarted=true;
  saveWordWonderProgress();
  renderWordWonderRound(`Resumed Level ${wordWonderLevel+1}. Continue from where you left.`);
};

window.submitWonderWord=function(){
  const input=document.getElementById('wordGuess');
  const guess=(input?.value||'').trim().toUpperCase();
  const level=getWordWonderLevel();
  if(!guess){
    renderWordWonderRound('Type a word first.');
    return;
  }
  if(wordWonderFound.includes(guess)){
    renderWordWonderRound('You already found that word.');
    return;
  }
  if(!canBuildWord(guess,level.letters)){
    renderWordWonderRound('Use only the letters shown in this level.');
    return;
  }
  if(!level.words.includes(guess)){
    renderWordWonderRound('Nice try. That word is not in this puzzle list.');
    return;
  }
  wordWonderFound.push(guess);
  wordWonderPoints+=guess.length*10;
  saveWordWonderProgress();
  const complete=wordWonderFound.length===level.words.length;
  renderWordWonderRound(complete?'Level complete. Move to the next word wonder.':`Good one. ${guess.length*10} points added.`);
};

window.shuffleWonderLetters=function(){
  wordWonderLetters=[...wordWonderLetters].sort(()=>Math.random()-.5);
  saveWordWonderProgress();
  renderWordWonderRound('Letters shuffled.');
};

window.nextWonderLevel=function(){
  wordWonderLevel++;
  wordWonderFound=[];
  wordWonderLetters=[...getWordWonderLevel().letters];
  saveWordWonderProgress();
  renderWordWonderRound('New level unlocked.');
};

function bindPolicyImporter(){
  const button=document.getElementById('policyTokenizeBtn');
  if(!button) return;
  button.onclick=event=>{
    event.preventDefault();
    window.importPolicies();
  };
}

enhanceUI();
bindPolicyImporter();
selRole('admin');
saveStore();

