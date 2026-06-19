
let loginRole='admin', resolveId=null, ovCI=null, chatHistory=[], isBotTyping=false;
let pidNext=6;
const COMPANY={
  companyName:'Vayana Network',
  portalName:'HRPulse',
  portalSubtitle:'Internal HR Portal',
  supportEmail:'hr@company.com',
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
  if(pg==='overview') renderOverview();
}

function ePage(pg,el){
  document.querySelectorAll('#s-employee .pg').forEach(p=>p.classList.remove('act'));
  document.querySelectorAll('#eSidebar .ni').forEach(n=>n.classList.remove('act'));
  document.getElementById('pg-'+pg).classList.add('act');
  el.classList.add('act');
  if(pg==='ePolicies') renderEPolicies();
  if(pg==='raiseQuery') renderMyQueries();
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
  const name=document.getElementById('pN').value.trim();
  if(!name){toast('Enter a policy name');return;}
  policies.push({id:pidNext++,name,cat:document.getElementById('pC').value,status:document.getElementById('pSt').value,date:document.getElementById('pDt').value||new Date().toISOString().slice(0,10),desc:document.getElementById('pDs').value});
  closeM('mPol');
  ['pN','pDs'].forEach(id=>document.getElementById(id).value='');
  renderPolicies();
  toast('Policy saved');
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
let liveRole='hr', currentUser=null, liveResolveId=null, liveChart=null, botBusy=false;

const seedData={
  hrs:[
    {id:'hr-1',name:'Meera Shah',email:'admin@company.com',password:'admin123',title:'HR Admin'},
    {id:'hr-2',name:'Nikhil Rao',email:'nikhil.hr@company.com',password:'hr123',title:'People Partner'}
  ],
  employees:[
    {id:'emp-1',name:'Priya K.',email:'priya@company.com',password:'emp123',mustChangePassword:false,dept:'Engineering',role:'Frontend Engineer',status:'Active',manager:'Amit S.',leave:{annual:{u:8,t:18},sick:{u:2,t:8},wfh:{u:5,t:12},comp:{u:1,t:3}}},
    {id:'emp-2',name:'Rajan M.',email:'rajan@company.com',password:'emp123',mustChangePassword:false,dept:'Finance',role:'Analyst',status:'Active',manager:'Meera Shah',leave:{annual:{u:5,t:18},sick:{u:0,t:8},wfh:{u:3,t:12},comp:{u:0,t:3}}},
    {id:'emp-3',name:'Ananya T.',email:'ananya@company.com',password:'emp123',mustChangePassword:false,dept:'Design',role:'Product Designer',status:'Active',manager:'Amit S.',leave:{annual:{u:12,t:18},sick:{u:3,t:8},wfh:{u:7,t:12},comp:{u:0,t:3}}},
    {id:'emp-4',name:'Dev K.',email:'dev@company.com',password:'emp123',mustChangePassword:false,dept:'Marketing',role:'Growth Lead',status:'Active',manager:'Nikhil Rao',leave:{annual:{u:2,t:18},sick:{u:1,t:8},wfh:{u:4,t:12},comp:{u:0,t:3}}}
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
  merged.queries=Array.isArray(data.queries)?data.queries:base.queries;
  merged.policies.forEach(p=>{p.format=p.format||'text';});
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
    e.leave=e.leave||JSON.parse(JSON.stringify(base.employees[0].leave));
    ['annual','sick','wfh','comp'].forEach(k=>{e.leave[k]=e.leave[k]||{u:0,t:k==='annual'?18:k==='sick'?8:k==='wfh'?12:3};});
    e.policyReads=e.policyReads||{};
  });
  merged.nextPolicyId=merged.nextPolicyId||Math.max(0,...merged.policies.map(p=>Number(p.id)||0))+1;
  merged.nextQueryId=merged.nextQueryId||Math.max(0,...merged.queries.map(q=>Number(q.id)||0))+1;
  merged.nextEmployeeId=merged.nextEmployeeId||Math.max(0,...merged.employees.map(e=>Number(String(e.id).replace(/\D/g,''))||0))+1;
  return merged;
}
function initials(name){return name.split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase();}
function employeeById(id){return store.employees.find(e=>e.id===id);}
function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function formatQueryTime(value){
  const dt=new Date(value||Date.now());
  if(Number.isNaN(dt.getTime())) return 'Time unavailable';
  return dt.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function policyReadStats(employee){
  const active=store.policies.filter(p=>p.status==='Active');
  const read=active.filter(p=>employee.policyReads?.[p.id]).length;
  return {read,total:active.length};
}
function policyReadDetails(employee){
  const active=store.policies.filter(p=>p.status==='Active');
  if(!active.length) return '<div class="ri-meta">No active policies assigned</div>';
  return `<div class="policy-read-list">${active.map(p=>{
    const readAt=employee.policyReads?.[p.id];
    return `<span class="policy-read-chip ${readAt?'done':'todo'}"><i class="ti ${readAt?'ti-check':'ti-clock'}" aria-hidden="true"></i> ${p.name}${readAt?` - ${formatQueryTime(readAt)}`:' - not read'}</span>`;
  }).join('')}</div>`;
}
function portalBrand(role){
  const name=COMPANY.portalName||'HRPulse';
  const split=name.length>2?`<span>${name.slice(0,2)}</span>${name.slice(2)}`:name;
  return `${split} <span style="font-size:11px;color:var(--color-text-tertiary);font-weight:400;margin-left:4px">${role}</span>`;
}
function applyCompanyBranding(){
  document.title=`${COMPANY.portalName} - ${COMPANY.companyName}`;
  document.querySelector('.sr-only').textContent=`${COMPANY.portalName} - ${COMPANY.companyName} HR portal`;
  const loginBrand=document.querySelector('.login-brand');
  if(loginBrand) loginBrand.innerHTML=portalBrand('').replace(/ <span[^>]*><\/span>$/,'');
  const loginSub=document.querySelector('.login-sub');
  if(loginSub) loginSub.textContent=`Sign in to ${COMPANY.companyName} HR workspace`;
  const loginTag=document.querySelector('.login-tagline');
  if(loginTag) loginTag.textContent=`${COMPANY.portalSubtitle} for policies, leaves, and employee support.`;
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
  return p.format==='pdf' ? `PDF policy document: ${p.fileName||'attached file'}` : (p.desc||'No description added yet.');
}
function policyAttachmentLink(p){
  if(p.format!=='pdf'||!p.fileData) return '';
  const fileName=p.fileName||`${p.name}.pdf`;
  return `<a class="policy-file-link" href="${p.fileData}" target="_blank" rel="noopener" download="${fileName}"><i class="ti ti-file-type-pdf" aria-hidden="true"></i> ${fileName}</a>`;
}
window.togglePolicyFormat=function(){
  const format=document.getElementById('pFormat')?.value||'text';
  document.getElementById('pTextWrap').style.display=format==='text'?'block':'none';
  document.getElementById('pPdfWrap').style.display=format==='pdf'?'block':'none';
};
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error||new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
function resetPolicyForm(){
  ['pN','pDs'].forEach(id=>document.getElementById(id).value='');
  const pdf=document.getElementById('pPdf');
  if(pdf) pdf.value='';
  document.getElementById('pFormat').value='text';
  togglePolicyFormat();
}

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
    </div>`);
  document.querySelectorAll('.modal-bg').forEach(bg=>bg.addEventListener('click',e=>{if(e.target===bg)bg.classList.remove('open')}));
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
  document.getElementById(liveRole==='hr'?'s-admin':'s-employee').classList.add('active');
  if(liveRole==='hr'){
    document.getElementById('hrAvatar').textContent=initials(currentUser.name);
    document.getElementById('hrTopName').textContent=currentUser.name;
    renderPolicies();renderQueries();
  }else{
    document.getElementById('empAvatar').textContent=initials(currentUser.name);
    document.getElementById('empTopName').textContent=currentUser.name;
    updateBars();initChat();
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
    d.innerHTML=`<div><div class="ri-name">${p.name}</div><div class="ri-meta">${p.cat} - ${p.date} - ${(p.format||'text').toUpperCase()}</div><div class="query-msg">${policySummary(p)}</div>${policyAttachmentLink(p)}</div><div class="ri-right"><span class="badge b-${p.status.toLowerCase()}">${p.status}</span><button class="btn sm" title="Cycle status" onclick="cycleStatus(${p.id})"><i class="ti ti-refresh" aria-hidden="true"></i></button><button class="btn sm danger" title="Delete" onclick="delPol(${p.id})"><i class="ti ti-trash" aria-hidden="true"></i></button></div>`;
    l.appendChild(d);
  });
  document.getElementById('sTot').textContent=store.policies.length;
  document.getElementById('sAct').textContent=store.policies.filter(p=>p.status==='Active').length;
  document.getElementById('sDraft').textContent=store.policies.filter(p=>p.status==='Draft').length;
  document.getElementById('sArch').textContent=store.policies.filter(p=>p.status==='Archived').length;
};

window.addPolicy=async function(){
  const name=document.getElementById('pN').value.trim();
  if(!name){toast('Enter a policy name');return;}
  const format=document.getElementById('pFormat').value;
  const policy={id:store.nextPolicyId++,name,cat:document.getElementById('pC').value,status:document.getElementById('pSt').value,date:document.getElementById('pDt').value||new Date().toISOString().slice(0,10),format,desc:''};
  if(format==='pdf'){
    const file=document.getElementById('pPdf').files[0];
    if(!file){toast('Choose a PDF file');return;}
    if(file.type&&file.type!=='application/pdf'){toast('Only PDF files are accepted');return;}
    try{
      policy.fileName=file.name;
      policy.fileData=await fileToDataUrl(file);
      policy.desc=`PDF policy document: ${file.name}`;
    }catch(err){
      toast('Could not read PDF file');
      return;
    }
  }else{
    policy.desc=document.getElementById('pDs').value.trim();
    if(!policy.desc){toast('Enter policy text');return;}
  }
  store.policies.push(policy);
  saveStore();closeM('mPol');resetPolicyForm();renderPolicies();toast('Policy saved');
};
window.delPol=function(id){store.policies=store.policies.filter(p=>p.id!==id);saveStore();renderPolicies();toast('Policy removed');};
window.cycleStatus=function(id){
  const p=store.policies.find(x=>x.id===id);
  if(!p) return;
  p.status=p.status==='Active'?'Draft':p.status==='Draft'?'Archived':'Active';
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

window.renderEmpTable=function(){
  document.getElementById('empTotal').textContent=store.employees.length;
  document.getElementById('empActive').textContent=store.employees.filter(e=>e.status==='Active').length;
  document.getElementById('hrTotal').textContent=store.hrs.length;
  document.getElementById('empOpenQ').textContent=store.queries.filter(q=>q.status!=='resolved').length;
  document.getElementById('employeeNames').innerHTML=store.employees.map(e=>{const pr=policyReadStats(e);return `<div class="row-item policy-row"><div><div class="ri-name">${e.name}</div><div class="ri-meta">${e.email} - ${e.dept} - Policy read ${pr.read}/${pr.total}</div>${policyReadDetails(e)}</div><div class="ri-right"><span class="badge ${pr.total&&pr.read===pr.total?'b-active':'b-pending'}">${pr.total&&pr.read===pr.total?'All read':'Pending'}</span><span class="badge ${e.status==='Active'?'b-active':'b-archived'}">${e.status}</span></div></div>`;}).join('');
  document.getElementById('eTable').innerHTML=`<thead><tr><th>Name</th><th>Company email</th><th>Dept</th><th>Role</th><th>Policy read</th><th>Annual left</th><th>Sick left</th><th>WFH left</th><th>Password</th><th>Status</th><th>Action</th></tr></thead><tbody>${store.employees.map(e=>{const l=e.leave, pr=policyReadStats(e);return `<tr><td style="font-weight:500">${e.name}</td><td>${e.email}</td><td style="color:var(--color-text-secondary)">${e.dept}</td><td>${e.role||'-'}</td><td><span class="badge ${pr.total&&pr.read===pr.total?'b-active':'b-pending'}">${pr.read}/${pr.total}</span></td><td>${l.annual.t-l.annual.u}</td><td>${l.sick.t-l.sick.u}</td><td>${l.wfh.t-l.wfh.u}</td><td><span class="badge ${e.mustChangePassword?'b-pending':'b-active'}">${e.mustChangePassword?'Reset required':'Private'}</span></td><td><span class="badge ${e.status==='Active'?'b-active':'b-archived'}">${e.status}</span></td><td><button class="btn sm" onclick="toggleEmployee('${e.id}')">${e.status==='Active'?'Deactivate':'Activate'}</button></td></tr>`;}).join('')}</tbody>`;
};

window.addEmployee=async function(){
  const name=document.getElementById('empName').value.trim(), email=document.getElementById('empEmail').value.trim().toLowerCase();
  const tempPass=document.getElementById('empPass').value.trim()||'emp123';
  if(!name||!isEmail(email)){toast('Enter a valid employee name and email');return;}
  if(tempPass.length<4){toast('Temporary password must be at least 4 characters');return;}
  if([...store.employees,...store.hrs].some(u=>u.email.toLowerCase()===email)){toast('Email already exists');return;}
  const employee={id:`emp-${store.nextEmployeeId++}`,name,email,password:tempPass,mustChangePassword:true,dept:document.getElementById('empDept').value.trim()||'General',role:document.getElementById('empRole').value.trim()||'Employee',status:'Active',manager:currentUser?.name||'HR',policyReads:{},leave:{annual:{u:0,t:18},sick:{u:0,t:8},wfh:{u:0,t:12},comp:{u:0,t:3}}};
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
    const res=await fetch('/api/send-welcome-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        companyName:COMPANY.companyName,
        portalName:COMPANY.portalName,
        portalUrl:location.origin,
        employee:{name,email,tempPassword:tempPass}
      })
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Email could not be sent');
    toast('Welcome email sent to employee.');
  }catch(err){
    toast('Employee saved. Email not sent: check SMTP settings.');
  }
};
window.toggleEmployee=function(id){
  const e=employeeById(id);
  if(!e) return;
  e.status=e.status==='Active'?'Inactive':'Active';
  saveStore();renderEmpTable();toast(`${e.name} is now ${e.status}`);
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
  saveStore();updateBars();document.getElementById('lvR').value='';toast(`${days} day(s) of ${type} leave submitted`);
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
    const readAt=employee?.policyReads?.[p.id];
    d.innerHTML=`<div class="card-hd"><div class="card-title"><i class="ti ti-file-text" aria-hidden="true"></i> ${p.name}</div><span class="badge b-active">${p.cat}</span></div><div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6">${policySummary(p)}</div>${policyAttachmentLink(p)}<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:8px">Effective ${p.date}</div><label class="policy-read"><input type="checkbox" ${readAt?'checked':''} onchange="togglePolicyRead(${p.id},this.checked)"> I have read and understood this policy</label>${readAt?`<div class="read-time">Acknowledged ${formatQueryTime(readAt)}</div>`:''}`;
    el.appendChild(d);
  });
};

window.togglePolicyRead=function(policyId,checked){
  const employee=employeeById(currentUser?.id);
  if(!employee){toast('Please sign in again');return;}
  employee.policyReads=employee.policyReads||{};
  if(checked) employee.policyReads[policyId]=new Date().toISOString();
  else delete employee.policyReads[policyId];
  saveStore();
  renderEPolicies();
  toast(checked?'Policy marked as read':'Policy acknowledgement removed');
};

window.initChat=function(){
  document.getElementById('chatMsgs').innerHTML='';
  document.getElementById('chatErr').style.display='none';
  const e=employeeById(currentUser?.id)||store.employees[0];
  addBot(`Hi ${e.name.split(' ')[0]}! I can answer you from the active company policies. What would you like to know?`);
};

window.sendChat=async function(){
  if(botBusy) return;
  const inp=document.getElementById('chatIn'), msg=inp.value.trim();
  if(!msg) return;
  inp.value='';addUser(msg);botBusy=true;showTyping();
  try{
    const e=employeeById(currentUser?.id)||store.employees[0];
    const res=await fetch('/api/hr-policy-ai',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        question:msg,
        employee:{name:e.name,leave:e.leave},
        policies:store.policies.filter(p=>p.status==='Active')
      })
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'AI request failed');
    hideTyping();botBusy=false;addBot(data.answer);
  }catch(err){
    hideTyping();botBusy=false;
    const errBox=document.getElementById('chatErr');
    errBox.textContent='Real AI is not connected yet. Showing the built-in policy answer instead.';
    errBox.style.display='block';
    addBot(localReply(msg));
  }
};

function localReply(msg){
  const e=employeeById(currentUser?.id)||store.employees[0], l=e.leave, m=msg.toLowerCase();
  if(m.includes('annual')) return `You have ${l.annual.t-l.annual.u} annual leave day(s) left out of ${l.annual.t}. The Annual Leave Policy allows up to 5 unused days to be carried forward.`;
  if(m.includes('sick')) return `You have ${l.sick.t-l.sick.u} sick leave day(s) left. A medical certificate is required only for 3 or more consecutive sick days.`;
  if(m.includes('wfh')||m.includes('work from home')) return `You have ${l.wfh.t-l.wfh.u} WFH day(s) left. The active WFH policy allows up to 3 days per week with manager approval.`;
  if(m.includes('carry')) return 'The Annual Leave Policy allows up to 5 unused annual leave days to be carried forward to the next year.';
  if(m.includes('benefit')) return 'Current active benefit details are listed under active policies. HR has a maternity and paternity policy in draft, so ask HR before relying on it.';
  return `I found ${store.policies.filter(p=>p.status==='Active').length} active policies and your live balances: annual ${l.annual.t-l.annual.u}, sick ${l.sick.t-l.sick.u}, WFH ${l.wfh.t-l.wfh.u}, comp-off ${l.comp.t-l.comp.u}. For requests, use the My leaves tab.`;
}

enhanceUI();
selRole('admin');
saveStore();

