// ========== Shipping Steps (15) ==========
const STEPS = [
  { id:'01', name:'接收委托', desc:'接收客户海运委托书，确认货物信息、船期要求、运价条款' },
  { id:'02', name:'订舱放号', desc:'向船公司或代理订舱，获取SO/Booking Confirmation' },
  { id:'03', name:'放柜提空', desc:'凭SO到指定堆场提取空集装箱，核对箱号、封号、箱况' },
  { id:'04', name:'拖车运输', desc:'安排拖车公司将空箱运送至工厂/仓库装货地点' },
  { id:'05', name:'工厂装货', desc:'工厂装货作业，记录实际件数、毛重、体积等数据' },
  { id:'06', name:'报关申报', desc:'准备并提交报关资料：发票、箱单、合同、申报要素等' },
  { id:'07', name:'海关查验', desc:'配合海关完成货物查验（如被抽中），记录查验结果' },
  { id:'08', name:'还柜进港', desc:'将已装箱的重箱返回码头/堆场，确认进港回执' },
  { id:'09', name:'VGM申报', desc:'提交VGM（核实总重）信息至船公司及码头' },
  { id:'10', name:'提单确认', desc:'核对并确认提单草稿：收发货人、品名、件重尺、运费条款' },
  { id:'11', name:'装船开船', desc:'确认货物已装船，记录实际开船日期(ATD)' },
  { id:'12', name:'中转跟踪', desc:'跟踪中转港状态（如有），确认二程船期' },
  { id:'13', name:'到港通知', desc:'向收货人/通知方发送到货通知(AN)，记录实际到港日期(ATA)' },
  { id:'14', name:'换单提货', desc:'目的港换提货单(D/O)，缴纳目的港费用' },
  { id:'15', name:'送货还箱', desc:'安排送货至收货人指定地址，还空箱至承运人指定堆场' }
];

const STATUSES = ['进行中','已完成','有异常','已取消'];
const STORAGE_KEY = 'shippingOps.shipments.v1';

// ========== State ==========
const state = { shipments: [], selectedId: null, selectedNode: null, pendingUpdates: [], activeAlarm: null };

// ========== Helpers ==========
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const now = () => new Date().toISOString();
const nowText = () => new Date().toLocaleString('zh-CN',{hour12:false});
const esc = s => { const m={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}; return String(s||'').replace(/[&<>"']/g,c=>m[c]); };
const fmt = v => v ? new Date(v).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) : '';
function formatReminder(v) { if(!v)return''; const d = new Date(v); if(isNaN(d.getTime())) return String(v); return d.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}); }

function selected() { return state.shipments.find(s => s.id === state.selectedId) || null; }

function initShip(s) {
  s.status = STATUSES.includes(s.status) ? s.status : '进行中';
  s.steps = s.steps || {};
  STEPS.forEach(st => { s.steps[st.id] = s.steps[st.id] || { status:'pending', date:'', note:'' }; });
  s.issues = Array.isArray(s.issues) ? s.issues : [];
  s.contacts = Array.isArray(s.contacts) ? s.contacts : [];
  s.costs = Array.isArray(s.costs) ? s.costs : [];
  s.activities = Array.isArray(s.activities) ? s.activities : [];
  s.carrier = s.carrier || ''; s.vessel = s.vessel || ''; s.pol = s.pol || ''; s.pod = s.pod || '';
  s.etd = s.etd || ''; s.eta = s.eta || ''; s.soNo = s.soNo || ''; s.cntrNo = s.cntrNo || '';
  s.cntrType = s.cntrType || '40HQ'; s.sealNo = s.sealNo || ''; s.vgm = s.vgm || '';
  s.forwarder = s.forwarder || ''; s.nextAction = s.nextAction || ''; s.notes = s.notes || '';
  s.ref = s.ref || ''; s.currentStep = s.currentStep || '';
  return s;
}

// ========== Persistence ==========
function load() { try { state.shipments = JSON.parse(localStorage.getItem(STORAGE_KEY))||[]; } catch { state.shipments = []; } state.shipments.forEach(initShip); state.selectedId = state.shipments[0]?.id || null; }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.shipments)); }

// ========== Populate ==========
function populateSelects() {
  const sf = document.querySelector('#statusFilter');
  if(sf) sf.innerHTML = '<option value="">全部状态</option>' + STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
  const fs = document.querySelector('#fStatus');
  if(fs) fs.innerHTML = STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
  const fst = document.querySelector('#fStage');
  if(fst) fst.innerHTML = '<option value="">选择当前步骤</option>' + STEPS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  // Reminder pickers
  const nm = document.querySelector('#nodeReminderMonth');
  if(nm) nm.innerHTML = '<option value="">月</option>' + Array.from({length:12},(_,i) => `<option value="${i+1}">${i+1}月</option>`).join('');
  const nd = document.querySelector('#nodeReminderDay');
  if(nd) nd.innerHTML = '<option value="">日</option>' + Array.from({length:31},(_,i) => `<option value="${i+1}">${i+1}日</option>`).join('');
  const nh = document.querySelector('#nodeReminderHour');
  if(nh) nh.innerHTML = '<option value="">时</option>' + Array.from({length:24},(_,i) => `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}时</option>`).join('');
  const nmn = document.querySelector('#nodeReminderMinute');
  if(nmn) nmn.innerHTML = '<option value="">分</option>' + Array.from({length:60},(_,i) => `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}分</option>`).join('');
}

// ========== Render List ==========
function renderList() {
  const q = (document.querySelector('#searchInput')?.value||'').trim().toLowerCase();
  const status = document.querySelector('#statusFilter')?.value||'';
  const list = document.querySelector('#shipList');
  const filtered = state.shipments.filter(s => !status || s.status === status).filter(s => {
    if(!q) return true;
    return [s.ref,s.vessel,s.carrier,s.pol,s.pod].join(' ').toLowerCase().includes(q);
  }).sort((a,b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0));

  if(!list) return;
  const done = s => Object.values(s.steps||{}).filter(v => v.status==='done').length;
  if(!filtered.length) { list.innerHTML = '<div class="order-item"><span>暂无匹配委托</span></div>'; return; }

  const tpl = document.querySelector('#shipItemTemplate');
  list.innerHTML = '';
  filtered.forEach(s => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.toggle('active', s.id === state.selectedId);
    node.querySelector('strong').textContent = s.ref || '未填委托号';
    node.querySelector('small').textContent = `${s.carrier||''} ${s.vessel||''} · ${s.pol||''}→${s.pod||''}`;
    node.querySelector('.sub-info').textContent = `${done(s)}/${STEPS.length}步 ${s.status||''}`;
    node.querySelector('.order-meta').textContent = `${s.cntrNo||''}\n${s.cntrType||''}`;
    node.addEventListener('click', () => { state.selectedId = s.id; state.selectedNode = null; renderAll(); });
    list.appendChild(node);
  });
}

// ========== Metrics ==========
function renderMetrics() {
  const el = document.querySelector('#metrics'); if(!el) return;
  const active = state.shipments.filter(s => s.status === '进行中').length;
  const done = state.shipments.filter(s => s.status === '已完成').length;
  const issue = state.shipments.filter(s => s.status === '有异常' || s.issues?.some(i => i.status !== '已解决')).length;
  el.innerHTML = [['进行中',active],['已完成',done],['有异常',issue]].map(([l,v]) => `<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join('');
}

// ========== Process Chain ==========
function renderProcessChain() {
  const s = selected(); if(!s) return;
  const steps = s.steps || {};
  const doneCnt = Object.values(steps).filter(v => v.status === 'done').length;
  const probCnt = Object.values(steps).filter(v => v.status === 'problem').length;
  const progress = document.querySelector('#stepProgress');
  if(progress) progress.textContent = `${doneCnt}/${STEPS.length} 已完成`;
  const md = document.querySelector('#milestoneDone');
  if(md) md.style.width = (doneCnt / STEPS.length * 100) + '%';
  const mp = document.querySelector('#milestoneProblem');
  if(mp) mp.style.width = (probCnt / STEPS.length * 100) + '%';

  const chain = document.querySelector('#progressChain');
  if(!chain) return;
  chain.innerHTML = STEPS.map((st,i) => {
    const step = steps[st.id] || { status:'pending', date:'', note:'' };
    let cls = 'chain-node';
    if(step.status === 'done') cls += ' done';
    if(step.status === 'problem') cls += ' risk';
    if(state.selectedNode === st.id) cls += ' selected current';
    const sLabel = { pending:'待处理', ongoing:'进行中', done:'✓ 已完成', problem:'⚠ 异常' }[step.status] || '';
    return `<div class="chain-node-wrap"><button class="${cls}" type="button" data-step="${st.id}">
      <span class="node-dot">${i+1}</span><span class="node-name">${st.name}</span>
      <span class="node-summary">${step.date ? step.date.slice(0,10) : sLabel}</span>
      ${step.note ? `<span class="node-badges"><span class="node-badge note-badge">备注</span></span>` : ''}
    </button></div>`;
  }).join('');

  chain.querySelectorAll('.chain-node').forEach(btn => {
    btn.addEventListener('click', () => { state.selectedNode = btn.dataset.step; renderProcessChain(); renderNodeEditor(); });
  });
}

function renderNodeEditor() {
  const s = selected(); if(!s) return;
  const ed = document.querySelector('#nodeEditor');
  if(!state.selectedNode) { ed.style.display = 'none'; return; }
  ed.style.display = 'grid';
  const step = s.steps[state.selectedNode] || { status:'pending', date:'', note:'' };
  const def = STEPS.find(x => x.id === state.selectedNode);
  document.querySelector('#nodeNoteTitle').textContent = `${def?.name || ''} - 步骤详情`;
  document.querySelector('#nodeNoteMeta').textContent = def?.desc || '';
  document.querySelector('#nodeNoteText').value = step.note || '';
  // Set date
  const dateEl = document.querySelector('#nodeReminderDay');
  if(dateEl && step.date) {
    const d = new Date(step.date);
    document.querySelector('#nodeReminderMonth').value = d.getMonth() + 1;
    document.querySelector('#nodeReminderDay').value = d.getDate();
    document.querySelector('#nodeReminderHour').value = String(d.getHours()).padStart(2,'0');
    document.querySelector('#nodeReminderMinute').value = String(d.getMinutes()).padStart(2,'0');
  }
}

// ========== Render All ==========
function renderAll() {
  const s = selected();
  document.querySelector('#emptyState').classList.toggle('hidden', !!s);
  document.querySelector('#editorArea').classList.toggle('hidden', !s);
  document.querySelector('#deleteShipBtn').classList.toggle('hidden', !s);
  document.querySelector('#pageTitle').textContent = s ? `${s.ref||'未填委托号'} · ${s.carrier||''} ${s.vessel||''}` : '选择或新建海运委托';
  if(!s) { renderList(); renderMetrics(); return; }

  // Form
  document.querySelector('#fRef').value = s.ref || '';
  document.querySelector('#fStatus').value = s.status || '进行中';
  document.querySelector('#fCarrier').value = s.carrier || '';
  document.querySelector('#fVessel').value = s.vessel || '';
  document.querySelector('#fPol').value = s.pol || '';
  document.querySelector('#fPod').value = s.pod || '';
  document.querySelector('#fEtd').value = s.etd || '';
  document.querySelector('#fEta').value = s.eta || '';
  document.querySelector('#fSoNo').value = s.soNo || '';
  document.querySelector('#fCntrNo').value = s.cntrNo || '';
  document.querySelector('#fCntrType').value = s.cntrType || '40HQ';
  document.querySelector('#fSealNo').value = s.sealNo || '';
  document.querySelector('#fVgm').value = s.vgm || '';
  document.querySelector('#fForwarder').value = s.forwarder || '';
  document.querySelector('#fStage').value = s.currentStep || '';
  document.querySelector('#fNextAction').value = s.nextAction || '';
  document.querySelector('#fNotes').value = s.notes || '';
  document.querySelector('#lastUpdated').textContent = `更新于 ${fmt(s.updatedAt)}`;

  renderProcessChain();
  renderNodeEditor();
  renderReminders(s);
  renderIssues(s);
  renderContacts(s);
  renderCosts(s);
  renderActivities(s);
  renderList();
  renderMetrics();
}

// ========== Reminders ==========
function renderReminders(s) {
  // Collect reminders from step dates
  const rems = STEPS.map(st => ({ stage: st.name, reminderAt: s.steps[st.id]?.date || '', note: s.steps[st.id]?.note || '' })).filter(r => r.reminderAt);
  document.querySelector('#reminderCount').textContent = rems.length ? `${rems.length} 条` : '无';
  const rl = document.querySelector('#reminderList');
  if(!rems.length) { rl.innerHTML = '<div class="reminder-item">暂无提醒</div>'; } else {
    rems.sort((a,b) => a.reminderAt.localeCompare(b.reminderAt));
    rl.innerHTML = rems.map(r => `<article class="reminder-item"><strong>${esc(r.stage)} · ${formatReminder(r.reminderAt)}</strong><span>${esc(r.note || '需跟进')}</span></article>`).join('');
  }
  // Follow summary
  const fs = document.querySelector('#followSummary');
  if(!fs) return;
  const openIssues = (s.issues||[]).filter(i => i.status !== '已解决');
  const primary = (s.contacts||[])[0];
  fs.innerHTML = `<div class="follow-grid">
    <article><strong>当前状态</strong><span>${esc(s.status||'进行中')} · ${STEPS.find(x=>x.id===s.currentStep)?.name||'未设置'}</span></article>
    <article><strong>下一步</strong><span>${esc(s.nextAction||'暂无')}</span></article>
    <article><strong>问题</strong><span>${openIssues.length ? openIssues.length+' 个未解决' : '暂无'}</span></article>
    <article><strong>联系人</strong><span>${primary ? `${primary.role} ${primary.name||''} ${primary.phone||''}` : '暂无'}</span></article>
  </div>
  <div class="goods-strip">
    <span>${esc(s.carrier||'未填船公司')}</span><span>${esc(s.pol||'?')} → ${esc(s.pod||'?')}</span><span>${esc(s.cntrNo||'未填箱号')}</span><span>${esc(s.cntrType||'')}</span>
  </div>`;
}

// ========== Issues ==========
function renderIssues(s) {
  const open = (s.issues||[]).filter(i => i.status !== '已解决').length;
  document.querySelector('#issueCount').textContent = `${open} 个未解决`;
  const il = document.querySelector('#issueList'); if(!il) return;
  if(!s.issues?.length) { il.innerHTML = '<div class="issue-item"><p>暂无问题记录</p></div>'; return; }
  const tpl = document.querySelector('#issueTemplate');
  il.innerHTML = '';
  s.issues.slice().sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(issue => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.toggle('resolved', issue.status === '已解决');
    const sev = node.querySelector('.severity');
    sev.textContent = `${issue.category||'问题'} · ${issue.severity} · ${issue.status}`;
    sev.classList.add(issue.severity);
    node.querySelector('p').textContent = issue.text;
    node.querySelector('small').textContent = `创建 ${fmt(issue.createdAt)} · 更新 ${fmt(issue.updatedAt)}`;
    node.querySelector('.close-issue').addEventListener('click', () => toggleIssue(issue.id));
    node.querySelector('.delete-issue').addEventListener('click', () => deleteIssue(issue.id));
    il.appendChild(node);
  });
}

function addIssue(e) {
  e.preventDefault(); const s = selected(); if(!s) return;
  const text = document.querySelector('#issueText').value.trim(); if(!text) return;
  const ca = now();
  s.issues.push({ id: uid(), text, severity: document.querySelector('#issueSeverity').value, category: '问题', status: '未解决', createdAt: ca, updatedAt: ca });
  s.updatedAt = ca; save(); document.querySelector('#issueText').value = ''; renderAll();
}
function toggleIssue(id) { const s = selected(); const i = s?.issues?.find(x => x.id === id); if(!i) return; i.status = i.status === '已解决' ? '未解决' : '已解决'; i.updatedAt = now(); s.updatedAt = now(); save(); renderAll(); }
function deleteIssue(id) { const s = selected(); if(!s) return; s.issues = s.issues.filter(x => x.id !== id); s.updatedAt = now(); save(); renderAll(); }

// ========== Contacts ==========
function renderContacts(s) {
  const contacts = s.contacts||[];
  document.querySelector('#contactCount').textContent = contacts.length ? `${contacts.length} 个` : '无';
  const cl = document.querySelector('#contactList'); if(!cl) return;
  if(!contacts.length) { cl.innerHTML = '<div class="contact-item"><p>暂无联系方式</p></div>'; return; }
  cl.innerHTML = contacts.map(c => `<article class="contact-item"><div><strong>${esc(c.role||'其他')}${c.name?` · ${esc(c.name)}`:''}</strong><p>📞 ${esc(c.phone||'未填')} ✉ ${esc(c.email||'未填')}</p></div><div class="contact-actions"><button class="ghost" onclick="deleteContact('${c.id}')">×</button></div></article>`).join('');
}
function addContact(e) {
  e.preventDefault(); const s = selected(); if(!s) return;
  const phone = document.querySelector('#contactPhone').value.trim();
  const email = document.querySelector('#contactEmail').value.trim();
  if(!phone && !email) { alert('请至少填写电话或邮箱'); return; }
  const ca = now();
  s.contacts.push({ id: uid(), role: document.querySelector('#contactRole').value, name: document.querySelector('#contactNote').value.trim(), phone, email, createdAt: ca, updatedAt: ca });
  s.updatedAt = ca; save();
  document.querySelector('#contactNote').value = ''; document.querySelector('#contactPhone').value = ''; document.querySelector('#contactEmail').value = '';
  renderAll();
}
function deleteContact(id) { const s = selected(); if(!s) return; s.contacts = s.contacts.filter(x => x.id !== id); s.updatedAt = now(); save(); renderAll(); }

// ========== Costs ==========
function renderCosts(s) {
  const costs = s.costs||[];
  const tbody = document.querySelector('#costBody');
  tbody.innerHTML = costs.map((c,i) => `
    <tr>
      <td><input value="${esc(c.item||'')}" onchange="updateCost(${i},'item',this.value)" placeholder="费用项目" /></td>
      <td><select onchange="updateCost(${i},'ccy',this.value)"><option value="USD" ${c.ccy==='USD'?'selected':''}>USD</option><option value="CNY" ${c.ccy==='CNY'?'selected':''}>CNY</option><option value="EUR" ${c.ccy==='EUR'?'selected':''}>EUR</option></select></td>
      <td class="num"><input value="${c.unitPrice||''}" onchange="updateCost(${i},'unitPrice',this.value)" type="number" step="0.01" style="text-align:right;" /></td>
      <td class="num"><input value="${c.qty||1}" onchange="updateCost(${i},'qty',this.value)" type="number" step="0.01" style="text-align:right;" /></td>
      <td class="num" style="font-weight:600;">${((parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||1)).toFixed(2)}</td>
      <td><button class="ghost" onclick="removeCost(${i})" style="color:var(--danger);">×</button></td>
    </tr>`).join('');
  const totals = {};
  costs.forEach(c => { const a = (parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||1); totals[c.ccy] = (totals[c.ccy]||0) + a; });
  document.querySelector('#costFoot').innerHTML = Object.entries(totals).map(([ccy,amt]) => `<tr><td colspan="4" style="text-align:right;font-weight:700;">合计 (${ccy})</td><td class="num" style="color:var(--accent);font-size:15px;font-weight:700;">${amt.toFixed(2)}</td><td></td></tr>`).join('');
}
function addCost() { const s = selected(); if(!s) return; s.costs.push({ item:'', ccy:'USD', unitPrice:'', qty:'1' }); s.updatedAt = now(); save(); renderCosts(s); }
function updateCost(i,k,v) { const s = selected(); if(!s) return; s.costs[i][k] = v; s.updatedAt = now(); save(); renderCosts(s); }
function removeCost(i) { const s = selected(); if(!s) return; s.costs.splice(i,1); s.updatedAt = now(); save(); renderAll(); }

// ========== Activities ==========
function renderActivities(s) {
  const acts = s.activities||[];
  document.querySelector('#activityCount').textContent = `${acts.length} 条`;
  document.querySelector('#activityList').innerHTML = acts.length ? acts.slice().reverse().map(a => `<article class="activity-item"><p>${esc(a.text)}</p><small>${fmt(a.createdAt)}</small></article>`).join('') : '<div class="activity-item"><p>暂无记录</p></div>';
}

// ========== CRUD ==========
function addShip() {
  const ca = now();
  const s = initShip({ id: uid(), ref: `S/O-${new Date().getFullYear()}-${String(state.shipments.length+1).padStart(3,'0')}`, createdAt: ca, updatedAt: ca });
  s.activities.push({ id: uid(), text:'新建海运委托', createdAt: ca });
  state.shipments.unshift(s); state.selectedId = s.id; save(); renderAll();
  document.querySelector('#fRef')?.focus();
}

function saveShip(e) {
  e.preventDefault(); const s = selected(); if(!s) return;
  const g = id => document.querySelector(id)?.value || '';
  Object.assign(s, {
    ref: g('#fRef'), status: g('#fStatus'), carrier: g('#fCarrier'), vessel: g('#fVessel'),
    pol: g('#fPol'), pod: g('#fPod'), etd: g('#fEtd'), eta: g('#fEta'),
    soNo: g('#fSoNo'), cntrNo: g('#fCntrNo'), cntrType: g('#fCntrType'),
    sealNo: g('#fSealNo'), vgm: g('#fVgm'), forwarder: g('#fForwarder'),
    currentStep: g('#fStage'), nextAction: g('#fNextAction'), notes: g('#fNotes'),
    updatedAt: now()
  });
  s.activities.push({ id: uid(), text: '更新委托信息', createdAt: now() });
  save(); renderAll();
  document.querySelector('#saveHint').textContent = `已保存 ${nowText()}`;
  setTimeout(() => document.querySelector('#saveHint').textContent = '', 2200);
}

function deleteShip() {
  const s = selected(); if(!s) return;
  if(!confirm(`确定删除委托 ${s.ref||'未填'}？`)) return;
  state.shipments = state.shipments.filter(x => x.id !== s.id);
  state.selectedId = state.shipments[0]?.id || null; save(); renderAll();
}

// ========== Save Step ==========
function saveNode() {
  const s = selected(); if(!s || !state.selectedNode) return;
  const st = s.steps[state.selectedNode];
  st.note = document.querySelector('#nodeNoteText').value.trim();
  const m = document.querySelector('#nodeReminderMonth').value;
  const d = document.querySelector('#nodeReminderDay').value;
  const h = document.querySelector('#nodeReminderHour').value || '09';
  const min = document.querySelector('#nodeReminderMinute').value || '00';
  if (m && d) {
    const y = new Date().getFullYear();
    st.date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${h}:${min}`;
  }
  // Toggle status when saving: if pending, mark as done; if done, keep done
  if (st.status === 'pending') st.status = 'done';
  st.updatedAt = now();
  s.updatedAt = now();
  s.activities.push({ id: uid(), text: `更新步骤：${STEPS.find(x=>x.id===state.selectedNode)?.name||''} → ${st.status==='done'?'已完成':'已备注'}`, createdAt: now() });
  save();
  state.selectedNode = null;
  document.querySelector('#nodeEditor').style.display = 'none';
  renderAll();
}

function clearNodeReminder() {
  const s = selected(); if(!s || !state.selectedNode) return;
  s.steps[state.selectedNode].date = '';
  s.steps[state.selectedNode].updatedAt = now();
  s.updatedAt = now(); save(); renderAll();
}

// ========== Export / Import ==========
function exportData() {
  const blob = new Blob([JSON.stringify(state.shipments, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `海运操作-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
}
function importData(e) {
  const f = e.target.files?.[0]; if(!f) return;
  const r = new FileReader(); r.onload = () => {
    try { const d = JSON.parse(r.result); if(!Array.isArray(d)) throw new Error('格式错误'); state.shipments = d; d.forEach(initShip); state.selectedId = state.shipments[0]?.id||null; save(); renderAll(); }
    catch(ex) { alert('导入失败：'+ex.message); }
  }; r.readAsText(f); e.target.value = '';
}

// ========== Events ==========
function bind() {
  document.querySelector('#newShipBtn')?.addEventListener('click', addShip);
  document.querySelector('#emptyNewShipBtn')?.addEventListener('click', addShip);
  document.querySelector('#deleteShipBtn')?.addEventListener('click', deleteShip);
  document.querySelector('#shipForm')?.addEventListener('submit', saveShip);
  document.querySelector('#issueForm')?.addEventListener('submit', addIssue);
  document.querySelector('#contactForm')?.addEventListener('submit', addContact);
  document.querySelector('#saveNodeNoteBtn')?.addEventListener('click', saveNode);
  document.querySelector('#clearNodeReminderBtn')?.addEventListener('click', clearNodeReminder);
  document.querySelector('#addCostBtn')?.addEventListener('click', addCost);
  document.querySelector('#searchInput')?.addEventListener('input', renderList);
  document.querySelector('#statusFilter')?.addEventListener('change', renderList);
  document.querySelector('#exportBtn')?.addEventListener('click', exportData);
  document.querySelector('#importInput')?.addEventListener('change', importData);
}

populateSelects();
load();
bind();
renderAll();