const STORAGE_KEY = "foreignTradeTracker.orders.v2";

const STAGES = ["询盘","报价","寄样","确认样","签约","定金","备料","排产","生产","中检","终检","订舱","装柜","报关","出运","交单","结汇","售后","退税","完成"];
const STATUSES = ["进行中","待客户","有风险","暂停","已完成"];

// Shipping steps (15)
const SHIPPING_STEPS = [
  {id:'sh01',name:'接收委托',desc:'接收客户海运委托，确认货物信息、船期、运价'},
  {id:'sh02',name:'订舱放号',desc:'向船公司订舱，获取SO/Booking Confirmation'},
  {id:'sh03',name:'放柜提空',desc:'凭SO到堆场提取空箱，核对箱号封号'},
  {id:'sh04',name:'拖车运输',desc:'安排拖车提空箱送至工厂/仓库'},
  {id:'sh05',name:'工厂装货',desc:'工厂装货，记录件数、重量、体积'},
  {id:'sh06',name:'报关申报',desc:'准备报关资料、HS编码、发票箱单'},
  {id:'sh07',name:'海关查验',desc:'如需查验配合海关完成，记录查验结果'},
  {id:'sh08',name:'还柜进港',desc:'重箱返回码头/堆场，确认进港状态'},
  {id:'sh09',name:'VGM申报',desc:'提交VGM（核实的集装箱总重）信息'},
  {id:'sh10',name:'提单确认',desc:'核对提单草稿（MBL/HBL）、收发货人信息'},
  {id:'sh11',name:'装船开船',desc:'确认装船，记录实际开船日期ATD'},
  {id:'sh12',name:'中转跟踪',desc:'如有中转港，跟踪中转状态和预计二程船期'},
  {id:'sh13',name:'到港通知',desc:'发送到货通知(AN)给收货人，记录ATA'},
  {id:'sh14',name:'换单提货',desc:'换D/O、缴目的港费用、安排提货'},
  {id:'sh15',name:'送货还箱',desc:'安排送货到收货人地址，还空箱至指定堆场'}
];

// Document checklist
const DOC_CHECKLIST = [
  {id:'doc01',name:'订舱确认单 SO',step:'订舱放号'},
  {id:'doc02',name:'装箱单 Packing List',step:'报关申报'},
  {id:'doc03',name:'商业发票 Commercial Invoice',step:'报关申报'},
  {id:'doc04',name:'外贸合同 Sales Contract',step:'报关申报'},
  {id:'doc05',name:'报关委托书',step:'报关申报'},
  {id:'doc06',name:'申报要素表',step:'报关申报'},
  {id:'doc07',name:'报关单 Customs Declaration',step:'报关申报'},
  {id:'doc08',name:'VGM申报回执',step:'VGM申报'},
  {id:'doc09',name:'提单草稿 BL Draft',step:'提单确认'},
  {id:'doc10',name:'正本提单 Original BL',step:'装船开船'},
  {id:'doc11',name:'产地证 COO/FORM',step:'报关申报'},
  {id:'doc12',name:'保险单 Insurance Policy',step:'装船开船'},
  {id:'doc13',name:'检验证书 Inspection Cert',step:'报关申报'},
  {id:'doc14',name:'到货通知 Arrival Notice',step:'到港通知'},
  {id:'doc15',name:'提货单 Delivery Order',step:'换单提货'}
];

// Customs steps (12)
const CUSTOMS_STEPS = [
  {id:'cs01',name:'资料准备',desc:'收集发票、箱单、合同、申报要素等报关资料'},
  {id:'cs02',name:'HS编码确认',desc:'确认商品归类及HS编码，核查监管条件'},
  {id:'cs03',name:'电子申报',desc:'通过单一窗口/EDI系统提交报关数据'},
  {id:'cs04',name:'海关审单',desc:'海关审核报关数据，等待审单结果'},
  {id:'cs05',name:'查验通知',desc:'收到海关查验通知，准备配合查验'},
  {id:'cs06',name:'配合查验',desc:'安排人员配合海关现场查验货物'},
  {id:'cs07',name:'查验结果',desc:'记录查验结果，处理异常（如有）'},
  {id:'cs08',name:'缴税放行',desc:'完成关税/增值税缴纳，获取海关放行'},
  {id:'cs09',name:'装船出运',desc:'放行后安排装船，记录实际出运信息'},
  {id:'cs10',name:'结关完成',desc:'海关结关，获取结关单据'},
  {id:'cs11',name:'退税申报',desc:'准备退税资料，提交出口退税申报'},
  {id:'cs12',name:'退税到账',desc:'跟踪退税进度，确认退税款到账'}
];

const stageKeywords = [
  ["完成",["完成","结束","结案","已收尾","归档"]],
  ["退税",["退税","出口退税","退税款","退税率","退税申报"]],
  ["售后",["售后","客户反馈","投诉","回访","after sales","售后服务"]],
  ["结汇",["结汇","尾款","收款","到账","水单","付款","结算","lc","信用证"]],
  ["交单",["交单","单证","寄单","发票","箱单","产地证","提单副本","交银行"]],
  ["出运",["出运","发货","装船","离港","提单","船期","清关","到港","开船"]],
  ["报关",["报关","商检","通关","海关","customs","电子口岸"]],
  ["装柜",["装柜","装箱","拖车","装货","loading","柜号"]],
  ["订舱",["订舱","booking","订船","舱位","船公司","so"]],
  ["终检",["终检","出货检验","出厂检验","成品检验","final inspection","尾期检验"]],
  ["中检",["中检","中期检验","过程检验","inline inspection","巡检","中查"]],
  ["生产",["生产","量产","大货","工厂在做","车间"]],
  ["排产",["排产","排期","排单","产线安排","schedule","生产计划"]],
  ["备料",["备料","采购","原材料","辅料","面料","配件","采购单","物料"]],
  ["定金",["定金","预付款","订金","首款","deposit","定金到账"]],
  ["签约",["签约","合同","pi","形式发票","po","订单确认","签单"]],
  ["确认样",["确认样","封样","确认版","样板确认","approved sample","产前样"]],
  ["寄样",["寄样","样品","打样","寄送","快递单号","sample","样版"]],
  ["报价",["报价","报盘","价格","议价","quotation","fob","cif"]],
  ["询盘",["询盘","询价","enquiry","inquiry","需求","求购","意向"]]
];

const issueKeywords = ["问题","异常","投诉","缺少","破损","延期","延误","错误","不符","无法","失败","风险","质量","返工","客户反馈"];
const riskKeywords = ["风险","延期","延误","投诉","返工","无法","失败","暂停","不符"];
const waitingKeywords = ["等客户","待客户","客户确认","等确认","客户回复"];
const issueRules = [
  ["质量",["质量","破损","不良","瑕疵","色差","尺寸不符","返工","不符","次品"]],
  ["交期",["延期","延误","赶不上","来不及","交期","船期","推迟","赶不及"]],
  ["样品",["样品","打样","寄样","样板","确认样","产前样","样版出错"]],
  ["付款",["付款","尾款","定金","水单","到账","信用证","lc","拖欠"]],
  ["单证",["单证","发票","箱单","提单","产地证","报关","商检","单证不符"]],
  ["物流",["订舱","装柜","清关","报关","货代","仓库","物流","拖车","滞留"]],
  ["生产",["排产","备料","原材料","缺料","工厂","车间","产线","停产"]],
  ["沟通",["客户反馈","客户投诉","未回复","确认慢","沟通","失联"]]
];

// ========== State ==========
const state = {
  orders: [],
  selectedId: null,
  selectedNode: "询盘",
  pendingUpdates: [],
  activeAlarm: null,
  currentModule: "trade",
  shSelectedNode: null,
  csSelectedNode: null
};

// ========== Helpers ==========
function createId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function nowText() { return new Date().toLocaleString("zh-CN",{hour12:false}); }
function escHtml(v) { const m={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}; return String(v||'').replace(/[&<>"']/g,c=>m[c]); }
function formatDateTime(v) { if(!v)return"无";return new Date(v).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}); }
function formatDate(v) { if(!v)return"";const d=v instanceof Date?v:new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleDateString("zh-CN",{month:"2-digit",day:"2-digit"}); }
function formatReminder(v) { if(!v)return"";const d=new Date(normalizeReminderAt(v));if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}); }
function normalize(v) { return (v||"").toLowerCase().replace(/[^a-z0-9]/g,""); }

// ========== Data Init ==========
function createEmptyStageNotes() { return STAGES.reduce((r,s)=>{r[s]={note:"",reminderAt:"",updatedAt:"",checked:false};return r;},{}); }
function initStepMap(stepsDef) { const m={}; stepsDef.forEach(s=>{m[s.id]={status:"pending",date:"",note:""}}); return m; }

function ensureOrderShape(order) {
  order.issues = Array.isArray(order.issues)?order.issues:[];
  order.contacts = Array.isArray(order.contacts)?order.contacts:[];
  order.contacts.forEach(c=>{c.name=c.name||c.note||"";c.note=c.note||"";c.dialCode=c.dialCode||dialCodeFromPhone(c.phone)||"";c.email=c.email||"";c.phone=c.phone||"";});
  order.activities = Array.isArray(order.activities)?order.activities:[];
  order.weight = order.weight||"";
  order.category = order.category||"";
  order.packaging = order.packaging||"";
  order.stageNotes = order.stageNotes&&typeof order.stageNotes==="object"?order.stageNotes:{};
  STAGES.forEach(s=>{order.stageNotes[s]={note:order.stageNotes[s]?.note||"",reminderAt:normalizeReminderAt(order.stageNotes[s]?.reminderAt||""),updatedAt:order.stageNotes[s]?.updatedAt||"",checked:order.stageNotes[s]?.checked||false};});
  order.stage = STAGES.includes(order.stage)?order.stage:"询盘";
  order.status = STATUSES.includes(order.status)?order.status:"进行中";

  // New module data
  order.shipping = order.shipping||{carrier:"",vessel:"",pol:"",pod:"",etd:"",eta:"",cntrNo:"",cntrType:"40HQ",sealNo:"",vgm:"",forwarder:"",soNo:""};
  order.shippingSteps = order.shippingSteps||initStepMap(SHIPPING_STEPS);
  order.shippingCosts = Array.isArray(order.shippingCosts)?order.shippingCosts:[];
  order.docs = order.docs||{blNo:"",blType:"original",cooType:"",insurance:"",inspection:"",bank:"",presentDate:"",courier:""};
  order.docChecklist = order.docChecklist||{};
  DOC_CHECKLIST.forEach(d=>{order.docChecklist[d.id]=order.docChecklist[d.id]||{checked:false};});
  order.docNotes = Array.isArray(order.docNotes)?order.docNotes:[];
  order.customs = order.customs||{declNo:"",hsCode:"",declValue:"",tradeMode:"一般贸易",broker:"",port:"",taxRate:"",verifyNo:""};
  order.customsSteps = order.customsSteps||initStepMap(CUSTOMS_STEPS);
  return order;
}

// ========== Persistence ==========
function loadOrders() { try{state.orders=JSON.parse(localStorage.getItem(STORAGE_KEY))||[];}catch{state.orders=[];} state.orders.forEach(ensureOrderShape); state.selectedId=state.orders[0]?.id||null; state.selectedNode=selectedOrder()?.stage||"询盘"; }
function saveOrders() { localStorage.setItem(STORAGE_KEY,JSON.stringify(state.orders)); }
function selectedOrder() { return state.orders.find(o=>o.id===state.selectedId)||null; }

// ========== Populate Dropdowns ==========
function populateSelects() {
  const sEl = document.querySelector("#status");
  if(sEl) sEl.innerHTML = STATUSES.map(s=>`<option value="${s}">${s}</option>`).join("");
  const stEl = document.querySelector("#stage");
  if(stEl) stEl.innerHTML = STAGES.map(s=>`<option value="${s}">${s}</option>`).join("");
  const sfEl = document.querySelector("#statusFilter");
  if(sfEl) sfEl.innerHTML = `<option value="">全部状态</option>${STATUSES.map(s=>`<option value="${s}">${s}</option>`).join("")}`;
  const nm = document.querySelector("#nodeReminderMonth");
  if(nm) nm.innerHTML = `<option value="">选择月份</option>${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}月</option>`).join("")}`;
  const nd = document.querySelector("#nodeReminderDay");
  if(nd) nd.innerHTML = `<option value="">选择日期</option>${Array.from({length:31},(_,i)=>`<option value="${i+1}">${i+1}日</option>`).join("")}`;
  const nh = document.querySelector("#nodeReminderHour");
  if(nh) nh.innerHTML = `<option value="">选择小时</option>${Array.from({length:24},(_,i)=>{const v=String(i).padStart(2,"0");return`<option value="${v}">${i===0?"00点":`${v}点`}</option>`;}).join("")}`;
  const nmn = document.querySelector("#nodeReminderMinute");
  if(nmn) nmn.innerHTML = `<option value="">选择分钟</option>${Array.from({length:60},(_,i)=>{const v=String(i).padStart(2,"0");return`<option value="${v}">${v}分</option>`;}).join("")}`;
}

// ========== Module Switching ==========
function switchModule(moduleName) {
  state.currentModule = moduleName;
  document.querySelectorAll('.m-tab').forEach(t=>t.classList.remove('active'));
  const tab = document.querySelector(`.m-tab[data-module="${moduleName}"]`);
  if(tab) tab.classList.add('active');
  document.querySelectorAll('.module-panel').forEach(p=>p.classList.remove('active'));
  const panel = document.getElementById(`module-${moduleName}`);
  if(panel) panel.classList.add('active');
  renderEditor();
}

// ========== Render ==========
function render() { renderMetrics(); renderOrderList(); renderEditor(); }
function renderMetrics() {
  const el = document.querySelector("#metrics"); if(!el) return;
  const active = state.orders.filter(o=>o.status!=="已完成").length;
  const risky = state.orders.filter(o=>o.status==="有风险"||o.issues?.some(i=>i.status!=="已解决")).length;
  const waiting = state.orders.filter(o=>o.status==="待客户").length;
  el.innerHTML = [["进行中",active],["有风险",risky],["待客户",waiting]].map(([l,v])=>`<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join("");
}
function renderOrderList() {
  const el = document.querySelector("#orderList"); if(!el) return;
  const query = (document.querySelector("#searchInput")?.value||"").trim().toLowerCase();
  const status = document.querySelector("#statusFilter")?.value||"";
  const orders = state.orders.filter(o=>!status||o.status===status).filter(o=>{const t=[o.orderNo,o.customer,o.product,o.country,o.category].join(" ").toLowerCase();return!query||t.includes(query);}).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  el.innerHTML = "";
  if(!orders.length) { el.innerHTML = `<div class="order-item"><span>暂无匹配订单</span></div>`; return; }
  const tpl = document.querySelector("#orderItemTemplate");
  orders.forEach(o=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active",o.id===state.selectedId);
    node.querySelector("strong").textContent = o.orderNo||"未填写订单号";
    node.querySelector("small").textContent = `${o.customer||"未填客户"} · ${o.product||"未填产品"}`;
    node.querySelector(".order-meta").textContent = `${o.stage||"询盘"}\n${o.status||"进行中"}`;
    node.addEventListener("click",()=>{state.selectedId=o.id;state.selectedNode=o.stage||"询盘";state.pendingUpdates=[];state.shSelectedNode=null;state.csSelectedNode=null;render();});
    el.appendChild(node);
  });
}

// ========== Render Editor (module-aware) ==========
function renderEditor() {
  const order = selectedOrder();
  const emptyEl = document.querySelector("#emptyState");
  const editorEl = document.querySelector("#orderEditor");
  const delBtn = document.querySelector("#deleteOrderBtn");
  const titleEl = document.querySelector("#pageTitle");

  emptyEl.classList.toggle("hidden",Boolean(order));
  editorEl.classList.toggle("hidden",!order);
  if(delBtn) delBtn.classList.toggle("hidden",!order);
  if(!order) { if(titleEl) titleEl.textContent="选择或新建订单"; return; }

  ensureOrderShape(order);
  if(titleEl) titleEl.textContent = `${order.orderNo||"未填写订单号"} · ${order.customer||"未填客户"}`;

  // Render current module
  switch(state.currentModule) {
    case "trade": renderTradeModule(order); break;
    case "shipping": renderShippingModule(order); break;
    case "docs": renderDocsModule(order); break;
    case "customs": renderCustomsModule(order); break;
  }
}

// ===== MODULE: 外贸跟单 =====
function renderTradeModule(order) {
  // Order form
  const formEl = document.querySelector("#orderForm");
  if(formEl) {
    formEl.querySelector("#orderNo").value = order.orderNo||"";
    formEl.querySelector("#customer").value = order.customer||"";
    formEl.querySelector("#country").value = order.country||"";
    formEl.querySelector("#product").value = order.product||"";
    formEl.querySelector("#quantity").value = order.quantity||"";
    formEl.querySelector("#weight").value = order.weight||"";
    formEl.querySelector("#category").value = order.category||"";
    formEl.querySelector("#packaging").value = order.packaging||"";
    formEl.querySelector("#amount").value = order.amount||"";
    formEl.querySelector("#dueDate").value = order.dueDate||"";
    formEl.querySelector("#status").value = order.status||"进行中";
    formEl.querySelector("#stage").value = order.stage||"询盘";
    formEl.querySelector("#nextAction").value = order.nextAction||"";
    formEl.querySelector("#notes").value = order.notes||"";
    const lu = document.querySelector("#lastUpdated");
    if(lu) lu.textContent = `更新于 ${formatDateTime(order.updatedAt)}`;
  }
  renderProgressChain(order);
  renderNodeEditor(order);
  renderReminders(order);
  renderIssues(order);
  renderContacts(order);
  renderActivities(order);
}

// ===== MODULE: 海运操作 =====
function renderShippingModule(order) {
  const s = order.shipping;
  const set = (id,v) => { const el = document.getElementById(id); if(el) el.value = v||""; };
  set('shCarrier',s.carrier); set('shVessel',s.vessel); set('shPol',s.pol); set('shPod',s.pod);
  set('shEtd',s.etd); set('shEta',s.eta); set('shCntrNo',s.cntrNo); set('shCntrType',s.cntrType||'40HQ');
  set('shSealNo',s.sealNo); set('shVgm',s.vgm); set('shForwarder',s.forwarder); set('shSoNo',s.soNo);

  // Shipping process chain
  renderShippingChain(order);
  renderShippingCosts(order);
}

function renderShippingChain(order) {
  const chain = document.getElementById('shippingChain'); if(!chain) return;
  const steps = order.shippingSteps||{};
  const doneCnt = Object.values(steps).filter(v=>v.status==='done').length;
  const prog = document.getElementById('shStepProgress');
  if(prog) prog.textContent = `进度 ${doneCnt}/${SHIPPING_STEPS.length}`;

  chain.innerHTML = SHIPPING_STEPS.map((st,i)=>{
    const step = steps[st.id]||{status:'pending',date:'',note:''};
    let cls = 'chain-node';
    if(step.status==='done') cls+=' done';
    if(step.status==='problem') cls+=' risk';
    if(state.shSelectedNode===st.id) cls+=' selected current';
    const sLabel = {pending:'待处理',ongoing:'进行中',done:'已完成',problem:'有问题'}[step.status]||'待处理';
    return `<div class="chain-node-wrap"><button class="${cls}" type="button" data-shstep="${st.id}">
      <span class="node-dot">${i+1}</span><span class="node-name">${st.name}</span>
      <span class="node-summary">${sLabel}${step.date?' · '+step.date.slice(0,10):''}</span>
      <span class="node-badges">${step.note?`<span class="node-badge note-badge">备注</span>`:''}${step.status==='problem'?`<span class="node-badge issue">异常</span>`:''}</span>
    </button></div>`;
  }).join('');

  chain.querySelectorAll('.chain-node').forEach(btn=>{
    btn.addEventListener('click',()=>{
      state.shSelectedNode = btn.dataset.shstep;
      renderShippingChain(order);
      showShNodeEditor(order);
    });
  });
}

function showShNodeEditor(order) {
  const ed = document.getElementById('shNodeEditor'); if(!ed) return;
  const st = state.shSelectedNode;
  if(!st) { ed.classList.add('hidden'); return; }
  ed.classList.remove('hidden');
  const step = order.shippingSteps[st]||{status:'pending',date:'',note:''};
  const def = SHIPPING_STEPS.find(x=>x.id===st);
  const title = document.getElementById('shNodeTitle'); if(title) title.textContent = `${def?.name||st}`;
  const meta = document.getElementById('shNodeMeta'); if(meta) meta.textContent = def?.desc||'';
  const note = document.getElementById('shNodeNote'); if(note) note.value = step.note||'';
  const date = document.getElementById('shNodeDate'); if(date) date.value = step.date?step.date.slice(0,16):'';
  const stat = document.getElementById('shNodeStatus'); if(stat) stat.value = step.status||'pending';
}

function renderShippingCosts(order) {
  const tbody = document.getElementById('shippingCostBody'); if(!tbody) return;
  const costs = order.shippingCosts||[];
  tbody.innerHTML = costs.map((c,i)=>`
    <tr>
      <td><input value="${escHtml(c.item||'')}" onchange="updateShippingCost(${i},'item',this.value)" style="width:100%;background:transparent;border:none;color:var(--text);font-size:13px;" placeholder="费用项目" /></td>
      <td><select onchange="updateShippingCost(${i},'ccy',this.value)" style="background:transparent;border:none;color:var(--text);font-size:13px;"><option value="USD" ${c.ccy==='USD'?'selected':''}>USD</option><option value="CNY" ${c.ccy==='CNY'?'selected':''}>CNY</option><option value="EUR" ${c.ccy==='EUR'?'selected':''}>EUR</option></select></td>
      <td class="num"><input value="${c.unitPrice||''}" onchange="updateShippingCost(${i},'unitPrice',this.value)" type="number" step="0.01" style="width:80px;background:transparent;border:none;color:var(--text);font-size:13px;text-align:right;" /></td>
      <td class="num"><input value="${c.qty||1}" onchange="updateShippingCost(${i},'qty',this.value)" type="number" step="0.01" style="width:60px;background:transparent;border:none;color:var(--text);font-size:13px;text-align:right;" /></td>
      <td class="num" style="font-weight:600;">${((parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||1)).toFixed(2)}</td>
      <td><button class="ghost" onclick="removeShippingCost(${i})" style="color:var(--danger);">×</button></td>
    </tr>
  `).join('');
  const totals = {};
  costs.forEach(c=>{const a=(parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||1);totals[c.ccy]=(totals[c.ccy]||0)+a;});
  const foot = document.getElementById('shippingCostFoot'); if(foot) foot.innerHTML = Object.entries(totals).map(([ccy,amt])=>`<tr><td colspan="4" style="text-align:right;font-weight:700;">合计 (${ccy})</td><td class="num" style="color:var(--accent);font-size:15px;font-weight:700;">${amt.toFixed(2)}</td><td></td></tr>`).join('');
}

// ===== MODULE: 单证操作 =====
function renderDocsModule(order) {
  const d = order.docs||{};
  const set = (id,v) => { const el = document.getElementById(id); if(el) el.value = v||""; };
  set('docBlNo',d.blNo); set('docBlType',d.blType||'original'); set('docCooType',d.cooType||'');
  set('docInsurance',d.insurance); set('docInspection',d.inspection); set('docBank',d.bank);
  set('docPresentDate',d.presentDate); set('docCourier',d.courier);

  // Document checklist
  const grid = document.getElementById('docCheckGrid'); if(!grid) return;
  const checklist = order.docChecklist||{};
  const checkedCnt = Object.values(checklist).filter(v=>v.checked).length;
  const prog = document.getElementById('docProgress'); if(prog) prog.textContent = `${checkedCnt}/${DOC_CHECKLIST.length} 已确认`;

  grid.innerHTML = DOC_CHECKLIST.map(doc=>{
    const c = checklist[doc.id]||{checked:false};
    return `<div class="doc-check-item">
      <input type="checkbox" class="doc-checkbox" ${c.checked?'checked':''} onchange="toggleDocCheck('${doc.id}')" />
      <span class="doc-label">${c.checked?'<s style="color:var(--muted);">'+escHtml(doc.name)+'</s>':escHtml(doc.name)}</span>
      <span class="doc-badge ${c.checked?'ok':'wait'}">${c.checked?'✅':'待确认'}</span>
    </div>`;
  }).join('');

  // Doc notes
  const notesList = document.getElementById('docNotesList'); if(!notesList) return;
  notesList.innerHTML = (order.docNotes||[]).slice().reverse().map(n=>`<div class="activity-item"><p>${escHtml(n.text)}</p><small>${formatDateTime(n._time)}</small></div>`).join('')||'<div class="activity-item"><p>暂无备注</p></div>';
}

function toggleDocCheck(docId) {
  const order = selectedOrder(); if(!order) return;
  order.docChecklist[docId].checked = !order.docChecklist[docId].checked;
  order.updatedAt = new Date().toISOString();
  saveOrders(); renderDocsModule(order);
}

// ===== MODULE: 报关操作 =====
function renderCustomsModule(order) {
  const c = order.customs||{};
  const set = (id,v) => { const el = document.getElementById(id); if(el) el.value = v||""; };
  set('csDeclNo',c.declNo); set('csHsCode',c.hsCode); set('csDeclValue',c.declValue);
  set('csTradeMode',c.tradeMode||'一般贸易'); set('csBroker',c.broker); set('csPort',c.port);
  set('csTaxRate',c.taxRate); set('csVerifyNo',c.verifyNo);

  renderCustomsChain(order);
}

function renderCustomsChain(order) {
  const chain = document.getElementById('customsChain'); if(!chain) return;
  const steps = order.customsSteps||{};
  const doneCnt = Object.values(steps).filter(v=>v.status==='done').length;
  const prog = document.getElementById('csStepProgress');
  if(prog) prog.textContent = `进度 ${doneCnt}/${CUSTOMS_STEPS.length}`;

  chain.innerHTML = CUSTOMS_STEPS.map((st,i)=>{
    const step = steps[st.id]||{status:'pending',date:'',note:''};
    let cls = 'chain-node';
    if(step.status==='done') cls+=' done';
    if(step.status==='problem') cls+=' risk';
    if(state.csSelectedNode===st.id) cls+=' selected current';
    const sLabel = {pending:'待处理',ongoing:'进行中',done:'已完成',problem:'有问题'}[step.status]||'待处理';
    return `<div class="chain-node-wrap"><button class="${cls}" type="button" data-csstep="${st.id}">
      <span class="node-dot">${i+1}</span><span class="node-name">${st.name}</span>
      <span class="node-summary">${sLabel}${step.date?' · '+step.date.slice(0,10):''}</span>
      ${step.note?`<span class="node-badges"><span class="node-badge note-badge">备注</span></span>`:''}
    </button></div>`;
  }).join('');

  chain.querySelectorAll('.chain-node').forEach(btn=>{
    btn.addEventListener('click',()=>{
      state.csSelectedNode = btn.dataset.csstep;
      renderCustomsChain(order);
      showCsNodeEditor(order);
    });
  });
}

function showCsNodeEditor(order) {
  const ed = document.getElementById('csNodeEditor'); if(!ed) return;
  const st = state.csSelectedNode;
  if(!st) { ed.classList.add('hidden'); return; }
  ed.classList.remove('hidden');
  const step = order.customsSteps[st]||{status:'pending',date:'',note:''};
  const def = CUSTOMS_STEPS.find(x=>x.id===st);
  const title = document.getElementById('csNodeTitle'); if(title) title.textContent = `${def?.name||st}`;
  const meta = document.getElementById('csNodeMeta'); if(meta) meta.textContent = def?.desc||'';
  const note = document.getElementById('csNodeNote'); if(note) note.value = step.note||'';
  const date = document.getElementById('csNodeDate'); if(date) date.value = step.date?step.date.slice(0,16):'';
  const stat = document.getElementById('csNodeStatus'); if(stat) stat.value = step.status||'pending';
}

// ========== Trade Module Functions (preserved from original) ==========
function renderProgressChain(order) {
  const el = document.querySelector("#progressChain"); if(!el) return;
  const currentIndex = STAGES.indexOf(order.stage);
  el.innerHTML = STAGES.map((stage,i)=>{
    const note = order.stageNotes?.[stage]||{};
    const stageIssues = issuesForStage(order,stage);
    const classes = ["chain-node"];
    if(i<currentIndex||order.status==="已完成") classes.push("done");
    if(stage===order.stage) classes.push("current");
    if(stage===state.selectedNode) classes.push("selected");
    if(stageIssues.length) classes.push("risk");
    if(note.checked) classes.push("checked");
    if(note.reminderAt||note.note) classes.push("remind");
    const summary = nodeSummary(order,stage,note,stageIssues);
    const tooltip = nodeTooltip(order,stage,note,stageIssues);
    const badges = [stageIssues.length?`<button class="node-badge issue goto-issue" type="button" data-stage="${stage}" data-action="goto-issue">${stageIssues.length} 问题</button>`:"",note.note&&!note.reminderAt?`<span class="node-badge note-badge">备注</span>`:"",note.reminderAt?`<span class="node-badge reminder">${formatReminder(note.reminderAt)}</span>`:""].join("");
    const modifyBtn = note.checked?`<button class="node-modify-btn" type="button" data-stage="${stage}" data-action="modify">修改</button>`:"";
    return `<div class="chain-node-wrap"><button class="${classes.join(" ")}" type="button" data-stage="${stage}"><span class="node-dot">${i+1}</span><span class="node-name">${stage}</span><span class="node-summary">${escHtml(summary)}</span><span class="node-badges">${badges}</span><span class="node-tooltip">${tooltip}</span></button><div class="node-footer"><button class="node-check-btn ${note.checked?"done":""}" type="button" data-stage="${stage}" data-action="check" title="${note.checked?"已完成":"点击完成"}">${note.checked?"✓":"✅"}</button>${modifyBtn}</div></div>`;
  }).join("");
  el.querySelectorAll(".chain-node").forEach(node=>{node.addEventListener("click",()=>{state.selectedNode=node.dataset.stage;renderProgressChain(order);renderNodeEditor(order);});});
  el.querySelectorAll(".node-check-btn").forEach(btn=>{btn.addEventListener("click",e=>{e.stopPropagation();toggleNodeChecked(order,btn.dataset.stage);});});
  el.querySelectorAll(".node-modify-btn").forEach(btn=>{btn.addEventListener("click",e=>{e.stopPropagation();modifyCheckedNode(order,btn.dataset.stage);});});
  el.querySelectorAll(".goto-issue").forEach(btn=>{btn.addEventListener("click",e=>{e.stopPropagation();state.selectedNode=btn.dataset.stage;renderProgressChain(order);renderNodeEditor(order);document.querySelector("#issueText")?.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>document.querySelector("#issueText")?.focus(),300);});});
}

function renderNodeEditor(order) {
  const stage = state.selectedNode||order.stage||"询盘";
  const note = order.stageNotes?.[stage]||{note:"",reminderAt:""};
  const stageIssues = issuesForStage(order,stage);
  const stageActivities = activitiesForStage(order,stage);
  const title = document.querySelector("#nodeNoteTitle"); if(title) title.textContent = `${stage}节点`;
  const meta = document.querySelector("#nodeNoteMeta"); if(meta) meta.textContent = `${stageActivities.length} 条详情 · ${stageIssues.length} 个问题`;
  const nt = document.querySelector("#nodeNoteText"); if(nt) nt.value = note.note||"";
  const md = toMonthDayParts(note.reminderAt);
  const rm = document.querySelector("#nodeReminderMonth"); if(rm) rm.value = md?.month||"";
  const rd = document.querySelector("#nodeReminderDay"); if(rd) rd.value = md?.day||"";
  const tp = toTimeParts(note.reminderAt);
  const rh = document.querySelector("#nodeReminderHour"); if(rh) rh.value = tp?.hour||"";
  const rmn = document.querySelector("#nodeReminderMinute"); if(rmn) rmn.value = tp?.minute||"";
}

function renderReminders(order) {
  const reminders = STAGES.map(s=>({stage:s,reminderAt:order.stageNotes?.[s]?.reminderAt||"",note:order.stageNotes?.[s]?.note||""})).filter(i=>i.reminderAt);
  const rc = document.querySelector("#reminderCount"); if(rc) rc.textContent = reminders.length?`${reminders.length} 条`:"无";
  const rl = document.querySelector("#reminderList"); if(!rl) return;
  if(!reminders.length) { rl.innerHTML = `<div class="reminder-item">暂无提醒</div>`; renderFollowSummary(order); return; }
  reminders.sort((a,b)=>a.reminderAt.localeCompare(b.reminderAt));
  rl.innerHTML = reminders.map(i=>{const due=isDueReminder(i.reminderAt);return`<article class="reminder-item ${due?"due":""}"><strong>${escHtml(i.stage)} · ${formatReminder(i.reminderAt)}</strong><span>${escHtml(i.note||order.nextAction||"需要跟进")}</span></article>`;}).join("");
  renderFollowSummary(order);
}

function renderFollowSummary(order) {
  const fs = document.querySelector("#followSummary"); if(!fs) return;
  const openIssues = (order.issues||[]).filter(i=>i.status!=="已解决");
  const contacts = order.contacts||[];
  const primaryContact = contacts[0];
  const goods = [order.product?`产品：${order.product}`:"",order.quantity?`数量：${order.quantity}`:"",order.weight?`重量：${order.weight}`:"",order.category?`品类：${order.category}`:"",order.packaging?`包装：${order.packaging}`:""].filter(Boolean);
  fs.innerHTML = `<div class="follow-grid"><article><strong>当前阶段</strong><span>${escHtml(order.stage||"询盘")} · ${escHtml(order.status||"进行中")}</span></article><article><strong>下一步</strong><span>${escHtml(order.nextAction||"暂无下一步")}</span></article><article><strong>问题</strong><span>${openIssues.length?`${openIssues.length} 个未解决`:"暂无未解决问题"}</span></article><article><strong>联系人</strong><span>${escHtml(primaryContact?`${primaryContact.role||"联系人"} ${primaryContact.name||primaryContact.note||""} ${primaryContact.phone||primaryContact.email||""}`:"暂无联系人")}</span></article></div><div class="goods-strip">${goods.length?goods.map(g=>`<span>${escHtml(g)}</span>`).join(""):"<span>暂无货物摘要</span>"}</div>`;
}

function nodeSummary(order,stage,note,stageIssues,stageActivities) {
  if(note.note) return note.note.slice(0,28);
  if(stage===order.stage&&order.nextAction) return order.nextAction.slice(0,28);
  if(stageIssues[0]) return stageIssues[0].text.slice(0,28);
  if(stageActivities[0]) return stageActivities[0].text.slice(0,28);
  return stage===order.stage?"当前节点":"暂无详情";
}

function nodeTooltip(order,stage,note,stageIssues,stageActivities) {
  const latestActivity = stageActivities[0]?.text||"暂无日志详情";
  const latestIssue = stageIssues[0]?.text||"暂无问题";
  return `<strong>${escHtml(stage)}</strong><p>备注：${escHtml(note.note||"暂无")}</p><p>提醒：${escHtml(note.reminderAt?formatReminder(note.reminderAt):"无")}</p><p>最近详情：${escHtml(latestActivity)}</p><p>问题：${escHtml(latestIssue)}</p>`;
}

function issuesForStage(order,stage) { return (order.issues||[]).filter(i=>i.status!=="已解决").filter(i=>(i.stage||order.stage)===stage).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)); }
function activitiesForStage(order,stage) { return (order.activities||[]).filter(i=>(i.stage||inferStageFromText(i.text)||order.stage)===stage).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); }

function renderIssues(order) {
  const openIssues = (order.issues||[]).filter(i=>i.status!=="已解决").length;
  const ic = document.querySelector("#issueCount"); if(ic) ic.textContent = `${openIssues} 个未解决`;
  const il = document.querySelector("#issueList"); if(!il) return;
  if(!order.issues?.length) { il.innerHTML = `<div class="issue-item"><p>暂无问题记录</p></div>`; return; }
  const tpl = document.querySelector("#issueTemplate");
  il.innerHTML = "";
  order.issues.slice().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).forEach(issue=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.toggle("resolved",issue.status==="已解决");
    const sev = node.querySelector(".severity");
    sev.textContent = `${issue.category||"问题"} · ${issue.severity} · ${issue.status}`;
    sev.classList.add(issue.severity);
    node.querySelector("p").textContent = issue.text;
    node.querySelector("small").textContent = `创建 ${formatDateTime(issue.createdAt)} · 更新 ${formatDateTime(issue.updatedAt)}`;
    node.querySelector(".close-issue").addEventListener("click",()=>toggleIssue(issue.id));
    node.querySelector(".delete-issue").addEventListener("click",()=>deleteIssue(issue.id));
    il.appendChild(node);
  });
}

function renderContacts(order) {
  const contacts = order.contacts||[];
  const cc = document.querySelector("#contactCount"); if(cc) cc.textContent = contacts.length?`${contacts.length} 个`:"无";
  const cl = document.querySelector("#contactList"); if(!cl) return;
  cl.innerHTML = "";
  if(!contacts.length) { cl.innerHTML = `<div class="contact-item"><p>暂无联系方式</p></div>`; return; }
  contacts.slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt)).forEach(contact=>{
    const article = document.createElement("article");
    article.className = "contact-item";
    const dn = contact.name||contact.note||"";
    article.innerHTML = `<div><strong>${escHtml(contact.role||"其他")}${dn?` · ${escHtml(dn)}`:""}</strong><p>电话：${escHtml(contact.phone||"未填")}<br />邮箱：${escHtml(contact.email||"未填")}</p></div><div class="contact-actions"><button class="ghost" type="button" title="删除联系人">×</button></div>`;
    article.querySelector("button").addEventListener("click",()=>deleteContact(contact.id));
    cl.appendChild(article);
  });
}

function renderActivities(order) {
  const activities = order.activities||[];
  const ac = document.querySelector("#activityCount"); if(ac) ac.textContent = `${activities.length} 条`;
  const al = document.querySelector("#activityList"); if(!al) return;
  al.innerHTML = activities.length?activities.slice().reverse().map(i=>`<article class="activity-item"><p>${escHtml(i.text)}</p><small>${formatDateTime(i.createdAt)}</small></article>`).join(""):`<div class="activity-item"><p>暂无更新记录</p></div>`;
}

// ========== Order CRUD ==========
function addOrder() {
  const createdAt = new Date().toISOString();
  const order = {id:createId(),orderNo:`PI-${new Date().getFullYear()}-${String(state.orders.length+1).padStart(3,"0")}`,customer:"",country:"",product:"",quantity:"",weight:"",category:"",packaging:"",amount:"",dueDate:"",status:"进行中",stage:"询盘",nextAction:"",notes:"",issues:[],contacts:[],stageNotes:createEmptyStageNotes(),activities:[{id:createId(),text:"新建订单",createdAt}],createdAt,updatedAt:createdAt};
  ensureOrderShape(order);
  state.orders.unshift(order);
  state.selectedId = order.id;
  state.selectedNode = order.stage||"询盘";
  saveOrders(); render();
  document.querySelector("#orderNo")?.focus();
}

function saveOrderFromForm(event) {
  event.preventDefault();
  const order = selectedOrder(); if(!order) return;
  const before = `${order.stage} / ${order.status}`;
  const form = document.querySelector("#orderForm");
  if(!form) return;
  Object.assign(order,{
    orderNo: form.querySelector("#orderNo").value.trim(),
    customer: form.querySelector("#customer").value.trim(),
    country: form.querySelector("#country").value.trim(),
    product: form.querySelector("#product").value.trim(),
    quantity: form.querySelector("#quantity").value.trim(),
    weight: form.querySelector("#weight").value.trim(),
    category: form.querySelector("#category").value.trim(),
    packaging: form.querySelector("#packaging").value.trim(),
    amount: form.querySelector("#amount").value.trim(),
    dueDate: form.querySelector("#dueDate").value,
    status: form.querySelector("#status").value,
    stage: form.querySelector("#stage").value,
    nextAction: form.querySelector("#nextAction").value.trim(),
    notes: form.querySelector("#notes").value.trim(),
    updatedAt: new Date().toISOString()
  });
  const after = `${order.stage} / ${order.status}`;
  if(before!==after) addActivity(order,`手动更新进度：${before} → ${after}`,false);
  state.selectedNode = order.stage||"询盘";
  saveOrders(); render();
  const hint = document.querySelector("#saveHint"); if(hint) { hint.textContent = `已保存 ${nowText()}`; setTimeout(()=>hint.textContent="",2200); }
}

function deleteOrder() {
  const order = selectedOrder(); if(!order) return;
  if(!window.confirm(`确定删除订单 ${order.orderNo||"未填写订单号"}？`)) return;
  state.orders = state.orders.filter(i=>i.id!==order.id);
  state.selectedId = state.orders[0]?.id||null;
  saveOrders(); render();
}

// ========== Shipping Save ==========
function saveShipping() {
  const order = selectedOrder(); if(!order) return;
  const s = order.shipping;
  const g = id => { const el = document.getElementById(id); return el?el.value:""; };
  Object.assign(s,{carrier:g('shCarrier'),vessel:g('shVessel'),pol:g('shPol'),pod:g('shPod'),etd:g('shEtd'),eta:g('shEta'),cntrNo:g('shCntrNo'),cntrType:g('shCntrType'),sealNo:g('shSealNo'),vgm:g('shVgm'),forwarder:g('shForwarder'),soNo:g('shSoNo')});
  order.updatedAt = new Date().toISOString();
  saveOrders();
  const hint = document.querySelector("#shSaveHint"); if(hint) { hint.textContent = `已保存 ${nowText()}`; setTimeout(()=>hint.textContent="",2200); }
}

function saveShNode() {
  const order = selectedOrder(); if(!order||!state.shSelectedNode) return;
  const note = document.getElementById('shNodeNote'); const date = document.getElementById('shNodeDate'); const stat = document.getElementById('shNodeStatus');
  order.shippingSteps[state.shSelectedNode] = {status:stat?.value||'pending', date:date?.value||'', note:note?.value||''};
  order.updatedAt = new Date().toISOString();
  saveOrders();
  state.shSelectedNode = null;
  const ed = document.getElementById('shNodeEditor'); if(ed) ed.classList.add('hidden');
  renderShippingModule(order);
}

function addShippingCost() {
  const order = selectedOrder(); if(!order) return;
  order.shippingCosts.push({item:'',ccy:'USD',unitPrice:'',qty:'1'});
  order.updatedAt = new Date().toISOString(); saveOrders(); renderShippingCosts(order);
}
function updateShippingCost(i,key,val) { const order=selectedOrder(); if(!order)return; order.shippingCosts[i][key]=val; order.updatedAt=new Date().toISOString(); saveOrders(); renderShippingCosts(order); }
function removeShippingCost(i) { const order=selectedOrder(); if(!order)return; order.shippingCosts.splice(i,1); order.updatedAt=new Date().toISOString(); saveOrders(); renderShippingModule(order); }

// ========== Docs Save ==========
function saveDocs() {
  const order = selectedOrder(); if(!order) return;
  const g = id => { const el = document.getElementById(id); return el?el.value:""; };
  Object.assign(order.docs,{blNo:g('docBlNo'),blType:g('docBlType'),cooType:g('docCooType'),insurance:g('docInsurance'),inspection:g('docInspection'),bank:g('docBank'),presentDate:g('docPresentDate'),courier:g('docCourier')});
  order.updatedAt = new Date().toISOString(); saveOrders();
  const hint = document.querySelector("#docSaveHint"); if(hint) { hint.textContent = `已保存 ${nowText()}`; setTimeout(()=>hint.textContent="",2200); }
}

function addDocNote() {
  const order = selectedOrder(); if(!order) return;
  const input = document.getElementById('docNoteInput'); if(!input) return;
  const txt = input.value.trim(); if(!txt) return;
  order.docNotes.push({text:txt,_time:new Date().toISOString()});
  order.updatedAt = new Date().toISOString(); saveOrders();
  input.value = '';
  renderDocsModule(order);
}

// ========== Customs Save ==========
function saveCustoms() {
  const order = selectedOrder(); if(!order) return;
  const g = id => { const el = document.getElementById(id); return el?el.value:""; };
  Object.assign(order.customs,{declNo:g('csDeclNo'),hsCode:g('csHsCode'),declValue:g('csDeclValue'),tradeMode:g('csTradeMode'),broker:g('csBroker'),port:g('csPort'),taxRate:g('csTaxRate'),verifyNo:g('csVerifyNo')});
  order.updatedAt = new Date().toISOString(); saveOrders();
  const hint = document.querySelector("#csSaveHint"); if(hint) { hint.textContent = `已保存 ${nowText()}`; setTimeout(()=>hint.textContent="",2200); }
}

function saveCsNode() {
  const order = selectedOrder(); if(!order||!state.csSelectedNode) return;
  const note = document.getElementById('csNodeNote'); const date = document.getElementById('csNodeDate'); const stat = document.getElementById('csNodeStatus');
  order.customsSteps[state.csSelectedNode] = {status:stat?.value||'pending', date:date?.value||'', note:note?.value||''};
  order.updatedAt = new Date().toISOString();
  saveOrders();
  state.csSelectedNode = null;
  const ed = document.getElementById('csNodeEditor'); if(ed) ed.classList.add('hidden');
  renderCustomsModule(order);
}

// ========== Trade Issues & Contacts ==========
function addIssue(event) {
  event.preventDefault();
  const order = selectedOrder();
  const text = document.querySelector("#issueText")?.value.trim();
  if(!order||!text) return;
  pushIssue(order,text,document.querySelector("#issueSeverity")?.value||"一般");
  if(order.status==="已完成") order.status="有风险";
  if(riskKeywords.some(w=>text.includes(w))) order.status="有风险";
  touch(order,`新增问题：${text}`);
  const el = document.querySelector("#issueText"); if(el) el.value="";
  saveOrders(); render();
}

function pushIssue(order,text,severity="一般",meta={}) {
  const createdAt = new Date().toISOString();
  order.issues = order.issues||[];
  const category = meta.category||detectIssueCategory(text);
  order.issues.push({id:createId(),text,severity,category,stage:meta.stage||state.selectedNode||order.stage||"询盘",status:"未解决",createdAt,updatedAt:createdAt});
}

function toggleIssue(issueId) {
  const order = selectedOrder(); const issue = order?.issues?.find(i=>i.id===issueId);
  if(!order||!issue) return;
  issue.status = issue.status==="已解决"?"未解决":"已解决";
  issue.updatedAt = new Date().toISOString();
  touch(order,`${issue.status==="已解决"?"解决":"重开"}问题：${issue.text}`);
  saveOrders(); render();
}

function deleteIssue(issueId) {
  const order = selectedOrder(); if(!order) return;
  const issue = order.issues.find(i=>i.id===issueId);
  order.issues = order.issues.filter(i=>i.id!==issueId);
  touch(order,`删除问题：${issue?.text||issueId}`);
  saveOrders(); render();
}

function addContact(event) {
  event.preventDefault();
  const order = selectedOrder(); if(!order) return;
  const dialCodeEl = document.querySelector("#contactDialCode");
  const customEl = document.querySelector("#customDialCode");
  const phoneEl = document.querySelector("#contactPhone");
  const emailEl = document.querySelector("#contactEmail");
  const noteEl = document.querySelector("#contactNote");
  const roleEl = document.querySelector("#contactRole");
  if(!phoneEl||!emailEl) return;
  const dialCode = dialCodeEl?.value==="custom"?customEl?.value?.trim()||"":dialCodeEl?.value?.trim()||"";
  const phone = phoneEl.value.trim();
  const email = emailEl.value.trim();
  const name = noteEl?.value?.trim()||"";
  if(!phone&&!email) { window.alert("请至少填写电话或邮箱。"); return; }
  const createdAt = new Date().toISOString();
  const fullPhone = phone?(phone.startsWith("+")?phone:`${dialCode}${phone.replace(/^0+/,"")}`):"";
  order.contacts = order.contacts||[];
  order.contacts.push({id:createId(),role:roleEl?.value||"其他",name,note:name,dialCode:phone.startsWith("+")?dialCodeFromPhone(phone):dialCode,phone:fullPhone,email,createdAt,updatedAt:createdAt});
  touch(order,`新增${roleEl?.value||"其他"}联系方式${name?`：${name}`:""}`);
  if(noteEl) noteEl.value="";
  if(phoneEl) phoneEl.value="";
  if(emailEl) emailEl.value="";
  saveOrders(); render();
}

function deleteContact(contactId) {
  const order = selectedOrder(); if(!order) return;
  const contact = (order.contacts||[]).find(i=>i.id===contactId);
  order.contacts = (order.contacts||[]).filter(i=>i.id!==contactId);
  touch(order,`删除${contact?.role||"联系人"}联系方式${contact?.name||contact?.note?`：${contact.name||contact.note}`:""}`);
  saveOrders(); render();
}

// ========== Node Operations ==========
function saveNodeNote() {
  const order = selectedOrder(); if(!order) return;
  ensureOrderShape(order);
  const stage = state.selectedNode||order.stage||"询盘";
  const note = order.stageNotes[stage];
  const nt = document.querySelector("#nodeNoteText"); if(nt) note.note = nt.value.trim();
  note.reminderAt = monthDayTimeToReminderAt(document.querySelector("#nodeReminderMonth")?.value||"",document.querySelector("#nodeReminderDay")?.value||"",selectedReminderTime(),note.reminderAt);
  note.updatedAt = new Date().toISOString();
  touch(order,`更新${stage}节点：${note.note||"修改备注/提醒"}`,stage);
  saveOrders(); render();
}

function clearNodeReminder() {
  const order = selectedOrder(); if(!order) return;
  ensureOrderShape(order);
  const stage = state.selectedNode||order.stage||"询盘";
  order.stageNotes[stage].reminderAt = "";
  order.stageNotes[stage].updatedAt = new Date().toISOString();
  touch(order,`清除${stage}节点提醒`,stage);
  saveOrders(); render();
}

function toggleNodeChecked(order,stage) {
  ensureOrderShape(order);
  const note = order.stageNotes[stage];
  note.checked = !note.checked;
  note.updatedAt = new Date().toISOString();
  touch(order,`${stage}节点标记为${note.checked?"完成":"重开"}`,stage);
  saveOrders(); render();
}

function modifyCheckedNode(order,stage) {
  ensureOrderShape(order);
  order.stageNotes[stage].checked = false;
  order.stageNotes[stage].updatedAt = new Date().toISOString();
  state.selectedNode = stage;
  touch(order,`修改${stage}节点，取消完成状态`,stage);
  saveOrders(); render();
  setTimeout(()=>document.querySelector("#nodeNoteText")?.focus(),100);
}

function touch(order,activityText,stage="") { order.updatedAt=new Date().toISOString(); addActivity(order,activityText,false,stage); }
function addActivity(order,text,shouldTouch=true,stage="") { order.activities=order.activities||[]; order.activities.push({id:createId(),text,stage:stage||order.stage||"询盘",createdAt:new Date().toISOString()}); if(shouldTouch) order.updatedAt=new Date().toISOString(); }

// ========== Alarm ==========
function startReminderWatcher() { checkReminderAlarms(); window.setInterval(checkReminderAlarms,30000); }
function checkReminderAlarms() { const overlay = document.querySelector("#alarmOverlay"); if(state.activeAlarm||!overlay||!overlay.classList.contains("hidden")) return; const due=collectDueReminders().find(i=>!sessionStorage.getItem(alarmKey(i))); if(due) showAlarm(due); }
function collectDueReminders() { return state.orders.flatMap(o=>{ensureOrderShape(o);return STAGES.map(s=>({order:o,stage:s,reminderAt:o.stageNotes?.[s]?.reminderAt||"",note:o.stageNotes?.[s]?.note||""}));}).filter(i=>i.reminderAt&&isDueReminder(i.reminderAt)); }
function showAlarm(alarm) {
  state.activeAlarm = alarm;
  const title = document.querySelector("#alarmTitle"); if(title) title.textContent = `${alarm.order.orderNo||"订单"} · ${alarm.stage}`;
  const content = document.querySelector("#alarmContent"); if(content) content.innerHTML = `<p><strong>提醒时间：</strong>${escHtml(formatReminder(alarm.reminderAt))}</p><p><strong>客户：</strong>${escHtml(alarm.order.customer||"未填写")}</p><p><strong>产品：</strong>${escHtml(alarm.order.product||"未填写")}</p><p><strong>事项：</strong>${escHtml(alarm.note||alarm.order.nextAction||"需要跟进")}</p>`;
  const overlay = document.querySelector("#alarmOverlay"); if(overlay) overlay.classList.remove("hidden");
  sendBrowserNotification(alarm);
}
function dismissAlarm() { if(state.activeAlarm) sessionStorage.setItem(alarmKey(state.activeAlarm),"dismissed"); state.activeAlarm=null; const overlay=document.querySelector("#alarmOverlay"); if(overlay) overlay.classList.add("hidden"); checkReminderAlarms(); }
function snoozeAlarm() {
  const alarm=state.activeAlarm; if(!alarm) return;
  const next=new Date(); next.setMinutes(next.getMinutes()+10);
  alarm.order.stageNotes[alarm.stage].reminderAt = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-${String(next.getDate()).padStart(2,"0")}T${String(next.getHours()).padStart(2,"0")}:${String(next.getMinutes()).padStart(2,"0")}`;
  alarm.order.stageNotes[alarm.stage].updatedAt = new Date().toISOString();
  touch(alarm.order,`${alarm.stage}提醒延后 10 分钟`,alarm.stage);
  state.activeAlarm=null; saveOrders();
  const overlay=document.querySelector("#alarmOverlay"); if(overlay) overlay.classList.add("hidden");
  render();
}
function alarmKey(i) { return `alarm:${i.order.id}:${i.stage}:${i.reminderAt}`; }
function requestNotificationPermission() { if(!("Notification"in window)||Notification.permission!=="default") return; Notification.requestPermission().catch(()=>{}); }
function sendBrowserNotification(alarm) { if(!("Notification"in window)||Notification.permission!=="granted") return; new Notification(`跟单提醒：${alarm.order.orderNo||"订单"}`,{body:`${alarm.stage} · ${alarm.note||alarm.order.nextAction||"需要跟进"}`,tag:alarmKey(alarm)}); }

// ========== Log Parsing ==========
function previewWorkLog() { const text = document.querySelector("#workLog")?.value.trim(); state.pendingUpdates = parseWorkLog(text||""); renderLogPreview(); }
async function readInfoFile(event) {
  const file = event.target.files?.[0]; if(!file) return;
  try {
    const hint = document.querySelector("#fileReadHint"); if(hint) hint.textContent = `正在读取：${file.name}`;
    const text = await fileToText(file);
    const wl = document.querySelector("#workLog"); if(wl) wl.value = text.slice(0,60000);
    state.pendingUpdates = parseWorkLog(text);
    renderLogPreview();
    if(hint) hint.textContent = `已读取：${file.name}`;
  } catch(e) { const hint=document.querySelector("#fileReadHint"); if(hint) hint.textContent="读取失败"; window.alert(`文件识别失败：${e.message}`); }
  finally { event.target.value=""; }
}

function parseWorkLog(text) {
  if(!text) return [];
  const chunks = [...expandStructuredRows(text),...text.split(/\n+/).flatMap(l=>l.split(/[。；;]/)).map(l=>l.trim()).filter(Boolean)];
  const updates = [];
  chunks.forEach(line=>{
    const orderNo = extractOrderNo(line); const order = matchOrder(line)||null; const fallbackOrder = order||selectedOrder();
    if(!order&&!orderNo&&!fallbackOrder) return;
    const update = {orderId:order?.id||fallbackOrder?.id||null,orderNo:order?.orderNo||orderNo||fallbackOrder?.orderNo||"",source:line,stage:detectStage(line),status:detectStatus(line),issues:detectIssues(line),nextAction:detectNextAction(line),reminderAt:detectReminderAt(line),orderPatch:extractOrderPatch(line),contacts:extractContacts(line),detail:cleanLogDetail(line)};
    if(update.stage||update.status||update.issues.length||update.nextAction||update.reminderAt||Object.keys(update.orderPatch).length||update.contacts.length) updates.push(update);
  });
  return updates;
}

function matchOrder(line) { const lower=line.toLowerCase(); const explicit=extractOrderNo(line); if(explicit){const hit=state.orders.find(o=>normalize(o.orderNo).includes(normalize(explicit))||normalize(explicit).includes(normalize(o.orderNo)));if(hit)return hit;} return state.orders.find(o=>o.orderNo&&lower.includes(o.orderNo.toLowerCase())); }
function extractOrderNo(line) { return line.match(/(?:订单号|订单|合同号|po|pi|so|invoice|order)[:：#\s-]*([a-z0-9][a-z0-9._/-]{2,})/i)?.[1]||""; }
function detectStage(line) { const lower=line.toLowerCase(); const found=stageKeywords.find(([,kws])=>kws.some(w=>lower.includes(w.toLowerCase()))); return found?.[0]||""; }
function detectStatus(line) { if(line.includes("完成")||line.includes("结束")||line.includes("结案"))return"已完成"; if(line.includes("暂停"))return"暂停"; if(riskKeywords.some(w=>line.includes(w)))return"有风险"; if(waitingKeywords.some(w=>line.includes(w)))return"待客户"; return""; }
function detectIssues(line) { if(!issueKeywords.some(w=>line.includes(w)))return[]; const text=cleanLogDetail(line); return[{text,category:detectIssueCategory(text),severity:riskKeywords.some(w=>text.includes(w))?"重要":"一般"}]; }
function detectNextAction(line) { const m=line.match(/(?:下一步|待办|跟进|需要|明天|今天)(.+)$/); return m?m[0].trim():""; }
function extractOrderPatch(line) {
  const patch={};
  [["customer",/(?:客户|客人|买家|货主|customer|buyer)[:：\s]*([^,，;；\n]+)/i],["country",/(?:国家|地区|目的国|market|country)[:：\s]*([^,，;；\n]+)/i],["product",/(?:产品|货物|品名|product|goods|item)[:：\s]*([^,，;；\n]+)/i],["category",/(?:品类|类别|分类|category)[:：\s]*([^,，;；\n]+)/i],["quantity",/(?:数量|件数|qty|quantity)[:：\s]*([^,，;；\n]+)/i],["weight",/(?:重量|毛重|净重|体积|weight|gw|nw|cbm)[:：\s]*([^,，;；\n]+)/i],["amount",/(?:金额|货值|价格|amount|value|price)[:：\s]*([^,，;；\n]+)/i],["packaging",/(?:包装|装箱|packing|packaging)[:：\s]*([^,，;；\n]+)/i]].forEach(([k,r])=>{const v=line.match(r)?.[1]?.trim();if(v)patch[k]=v;});
  return patch;
}
function extractContacts(line) {
  const emails=[...line.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0]);
  const phones=[...line.matchAll(/(?:\+?\d[\d\s-]{6,}\d)/g)].map(m=>m[0].trim());
  if(!emails.length&&!phones.length)return[];
  const role=/工厂|供应商|厂家|factory|supplier/i.test(line)?"工厂":/货主|客户|客人|买家|buyer|customer/i.test(line)?"货主":/货代|物流|forwarder|agent|shipping/i.test(line)?"货代":"其他";
  const name = (line.match(/(?:联系人|contact|备注|姓名|name)[:：\s]*([^,，;；\n]+)/i)?.[1]||"").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"").replace(/(?:\+?\d[\d\s-]{6,}\d)/g,"").trim();
  const max=Math.max(emails.length,phones.length);
  return Array.from({length:max},(_,i)=>({role,name,note:name,phone:normalizeExtractedPhone(phones[i]||phones[0]||""),email:emails[i]||emails[0]||""}));
}
function detectIssueCategory(text) { const lower=text.toLowerCase(); const r=issueRules.find(([,kws])=>kws.some(w=>lower.includes(w.toLowerCase()))); return r?.[0]||"其他"; }
function cleanLogDetail(line) { return line.replace(/^(今天|昨日|昨天|明天|后天|上午|下午|晚上)\s*/,"").trim(); }
function detectReminderAt(line) { const today=new Date(); const time=extractTimeParts(line); const m=line.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/); if(m)return toDateTimeInput(Number(m[1]),Number(m[2]),Number(m[3]),time.hour,time.minute); const md=line.match(/(\d{1,2})月(\d{1,2})日?/); if(md){const month=Number(md[1]),day=Number(md[2]);let year=today.getFullYear();const c=new Date(year,month-1,day);if(c<startOfToday())year+=1;return toDateTimeInput(year,month,day,time.hour,time.minute);} if(line.includes("后天"))return offsetDateTimeInput(2,time.hour,time.minute); if(line.includes("明天"))return offsetDateTimeInput(1,time.hour,time.minute); if(line.includes("今天")||line.includes("今日"))return offsetDateTimeInput(0,time.hour,time.minute); return""; }
function extractTimeParts(line) { const e=line.match(/(?:上午|下午|晚上|晚|早上|中午)?\s*(\d{1,2})[:：点](\d{1,2})?分?/); if(!e)return{hour:9,minute:0}; let hour=Number(e[1]); const minute=Number(e[2]||0); if(/下午|晚上|晚/.test(e[0])&&hour<12)hour+=12; if(/中午/.test(e[0])&&hour<11)hour+=12; return{hour:Math.min(hour,23),minute:Math.min(minute,59)}; }
function renderLogPreview() {
  const applyBtn = document.querySelector("#applyLogBtn"); if(applyBtn) applyBtn.disabled = !state.pendingUpdates.length;
  const preview = document.querySelector("#logPreview"); if(!preview) return;
  if(!state.pendingUpdates.length){preview.innerHTML=`<div class="preview-item">没有识别到可更新内容。</div>`;return;}
  preview.innerHTML = state.pendingUpdates.map(i=>{const lines=[];if(i.stage)lines.push(`阶段→${i.stage}`);if(i.status)lines.push(`状态→${i.status}`);if(i.nextAction)lines.push(`下一步→${i.nextAction}`);if(i.reminderAt)lines.push(`提醒→${formatReminder(i.reminderAt)}`);if(Object.keys(i.orderPatch).length)lines.push(`货物信息→${formatPatch(i.orderPatch)}`);if(i.contacts.length)lines.push(`联系人→${i.contacts.map(c=>`${c.role}${c.name?` ${c.name}`:""}`).join("；")}`);if(i.issues.length)lines.push(`新增问题→${i.issues.map(iss=>`${iss.category}:${iss.text}`).join("；")}`);return`<article class="preview-item"><strong>${escHtml(i.orderNo||"当前订单")}</strong><span>${escHtml(lines.join("，"))}</span><small>来源：${escHtml(i.source)}</small></article>`;}).join("");
}
function applyWorkLog() {
  if(!state.pendingUpdates.length) return;
  state.pendingUpdates.forEach(u=>{let o=state.orders.find(x=>x.id===u.orderId);if(!o&&u.orderNo) o=findOrCreateOrder(u.orderNo);if(!o)return;ensureOrderShape(o);const changes=[];const ts=u.stage||o.stage||"询盘";Object.entries(u.orderPatch||{}).forEach(([k,v])=>{if(v&&o[k]!==v){o[k]=v;changes.push(`${fieldLabel(k)}：${v}`);}});if(u.stage&&u.stage!==o.stage){changes.push(`阶段 ${o.stage||"未填"}→${u.stage}`);o.stage=u.stage;}if(u.status&&u.status!==o.status){changes.push(`状态 ${o.status||"未填"}→${u.status}`);o.status=u.status;}if(u.nextAction&&u.nextAction!==o.nextAction){changes.push(`下一步：${u.nextAction}`);o.nextAction=u.nextAction;}if(u.detail){const n=o.stageNotes[ts];if(!n.note.includes(u.detail)){n.note=`${n.note?n.note+"\n":""}${formatDate(new Date().toISOString())}: ${u.detail}`.trim();n.updatedAt=new Date().toISOString();changes.push(`${ts}节点详情已更新`);}}if(u.reminderAt){o.stageNotes[ts].reminderAt=u.reminderAt;o.stageNotes[ts].updatedAt=new Date().toISOString();changes.push(`${ts}提醒：${formatReminder(u.reminderAt)}`);}u.issues.forEach(iss=>{const exists=o.issues?.some(x=>x.text===iss.text&&x.status!=="已解决");if(!exists){pushIssue(o,iss.text,iss.severity,{category:iss.category,stage:ts});changes.push(`新增${iss.category}问题：${iss.text}`);}});(u.contacts||[]).forEach(c=>{if(!c.phone&&!c.email)return;const p=normalizeExtractedPhone(c.phone||"");const exists=o.contacts?.some(x=>normalize(x.email)===normalize(c.email)&&normalize(x.phone)===normalize(p));if(!exists){const ca=new Date().toISOString();o.contacts.push({id:createId(),...c,phone:p,dialCode:dialCodeFromPhone(p),note:c.note||c.name||"",createdAt:ca,updatedAt:ca});changes.push(`新增${c.role}联系人${c.name?` ${c.name}`:""}`);}});if(changes.length) touch(o,`日志自动更新：${changes.join("；")}`,ts);});
  state.pendingUpdates=[]; const wl=document.querySelector("#workLog"); if(wl) wl.value=""; saveOrders(); render(); checkReminderAlarms();
}
function findOrCreateOrder(orderNo) {
  let o=state.orders.find(x=>normalize(x.orderNo)===normalize(orderNo)); if(o) return o;
  const ca=new Date().toISOString();
  o={id:createId(),orderNo,customer:"",country:"",product:"",quantity:"",weight:"",category:"",packaging:"",amount:"",dueDate:"",status:"进行中",stage:"询盘",nextAction:"",notes:"",issues:[],contacts:[],stageNotes:createEmptyStageNotes(),activities:[{id:createId(),text:"从文件/日志自动创建订单",stage:"询盘",createdAt:ca}],createdAt:ca,updatedAt:ca};
  ensureOrderShape(o);
  state.orders.unshift(o); if(!state.selectedId) state.selectedId=o.id;
  return o;
}

// ========== Export / Import ==========
function exportData() {
  const blob = new Blob([JSON.stringify(state.orders,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`外贸跟单-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
}
function importData(event) {
  const file=event.target.files?.[0]; if(!file) return;
  const r=new FileReader(); r.onload=()=>{try{const d=JSON.parse(String(r.result));if(!Array.isArray(d))throw new Error("格式错误");state.orders=d;d.forEach(ensureOrderShape);state.selectedId=state.orders[0]?.id||null;saveOrders();render();}catch(e){window.alert(`导入失败：${e.message}`);}};
  r.readAsText(file); event.target.value="";
}

// ========== File Reading ==========
async function fileToText(file) {
  const ext=file.name.split(".").pop().toLowerCase();
  if(["xlsx","xls"].includes(ext)){
    if(!window.XLSX) throw new Error("Excel解析库未加载");
    const buf=await file.arrayBuffer(); const wb=window.XLSX.read(buf,{type:"array"});
    return wb.SheetNames.map(sn=>{const sh=wb.Sheets[sn];const csv=window.XLSX.utils.sheet_to_csv(sh);return`工作表：${sn}\n${csv}`;}).join("\n");
  }
  if(ext==="json") return jsonFileToText(await file.text());
  if(ext==="pdf") return pdfToText(await file.arrayBuffer());
  if(ext==="docx") return docxToText(await file.arrayBuffer());
  return file.text();
}

function jsonFileToText(text) { const d=JSON.parse(text); const rows=Array.isArray(d)?d:[d]; return rows.map(r=>flattenObject(r).map(([k,v])=>`${fieldLabel(mapHeaderKey(k)||k)}:${v}`).join("，")).join("\n"); }
function flattenObject(v,p="") { if(v===null||v===undefined)return[]; if(typeof v!=="object")return[[p,String(v)]]; if(Array.isArray(v))return v.flatMap((i,idx)=>flattenObject(i,p?`${p}${idx+1}`:String(idx+1))); return Object.entries(v).flatMap(([k,i])=>{const nk=p?`${p}.${k}`:k;return flattenObject(i,nk);}); }

async function pdfToText(buf) {
  const pdfjs=window.pdfjsLib||globalThis.pdfjsLib; if(!pdfjs) throw new Error("PDF解析库未加载");
  pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const pdf=await pdfjs.getDocument({data:buf}).promise; const pages=[];
  for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();pages.push(c.items.map(it=>it.str).join(" "));}
  return pages.join("\n");
}
async function docxToText(buf) { if(!window.mammoth) throw new Error("DOCX解析库未加载"); const r=await window.mammoth.extractRawText({arrayBuffer:buf}); return r.value||""; }

function expandStructuredRows(text) {
  const rows=parseDelimitedRows(text).filter(r=>r.some(Boolean)); if(rows.length<2)return[];
  const expanded=[];
  for(let i=0;i<rows.length-1;i++){const h=rows[i].map(c=>c.trim());const ks=h.map(mapHeaderKey);const uc=ks.filter(Boolean).length;if(uc<2)continue;let ri=i+1;while(ri<rows.length){const r=rows[ri];if(r.map(c=>mapHeaderKey(c)).filter(Boolean).length>=2)break;const parts=r.map((v,ci)=>{const k=ks[ci];return k&&v?`${fieldLabel(k)}:${v.trim()}`:"";}).filter(Boolean);if(parts.length)expanded.push(parts.join("，"));ri++;}}
  return expanded;
}
function parseDelimitedRows(text) { return text.split(/\n+/).map(l=>l.trim()).filter(Boolean).map(l=>{const d=l.includes("\t")?"\t":",";return splitCSV(l,d).map(c=>c.trim());}); }
function splitCSV(l,d) { const c=[]; let cur="",q=false; for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"')q=!q;else if(ch===d&&!q){c.push(cur);cur="";}else cur+=ch;} c.push(cur); return c.map(x=>x.replace(/^"|"$/g,"").replace(/""/g,'"')); }
function mapHeaderKey(h="") { const v=h.toLowerCase().replace(/\s/g,""); if(/订单号|订单|合同号|po|pi|so|invoice|orderno/.test(v))return"orderNo";if(/客户|客人|买家|货主|customer|buyer/.test(v))return"customer";if(/国家|地区|目的国|country|market/.test(v))return"country";if(/产品|货物|品名|product|goods|item/.test(v))return"product";if(/品类|类别|分类|category/.test(v))return"category";if(/包装|装箱|packing|packaging/.test(v))return"packaging";if(/数量|件数|qty|quantity/.test(v))return"quantity";if(/重量|毛重|净重|体积|weight|gw|nw|cbm/.test(v))return"weight";if(/金额|货值|价格|amount|value|price/.test(v))return"amount";if(/电话|手机|phone|tel|mobile/.test(v))return"phone";if(/邮箱|邮件|email|mail/.test(v))return"email";if(/联系人|姓名|contact|name/.test(v))return"name";return""; }
function fieldLabel(k) { const m={orderNo:"订单号",customer:"客户",country:"国家/地区",product:"产品",quantity:"数量",weight:"重量",category:"品类",packaging:"货物包装",amount:"金额",phone:"电话",email:"邮箱",role:"类型",name:"姓名",note:"备注"}; return m[k]||k; }
function formatPatch(p) { return Object.entries(p).map(([k,v])=>`${fieldLabel(k)}:${v}`).join("；"); }

// ========== Reminder Helpers ==========
function normalizeReminderAt(v) { if(!v)return""; if(/^\d{2}:\d{2}$/.test(v))return timeInputToReminderAt(v,""); if(/^\d{4}-\d{2}-\d{2}$/.test(v))return`${v}T09:00`; if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v))return v.slice(0,16); const d=new Date(v);if(Number.isNaN(d.getTime()))return""; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function toTimeParts(v) { const r=normalizeReminderAt(v); if(!r)return null; const[h,min]=r.slice(11,16).split(":"); return {hour:h,minute:min}; }
function toMonthDayParts(v) { const r=normalizeReminderAt(v); if(!r)return null; const d=new Date(r); return {month:String(d.getMonth()+1),day:String(d.getDate())}; }
function selectedReminderTime() { const h=document.querySelector("#nodeReminderHour"); const m=document.querySelector("#nodeReminderMinute"); if(!h?.value&&!m?.value)return""; return `${h?.value||"09"}:${m?.value||"00"}`; }
function monthDayTimeToReminderAt(mv,dv,tv,ex="") { if(!mv&&!dv&&!tv)return""; const time=tv||(ex?normalizeReminderAt(ex)?.slice(11,16):"09:00"); const ep=toMonthDayParts(ex); const m=Number(mv||ep?.month); const d=Number(dv||ep?.day); if(!m||!d)return timeInputToReminderAt(time,ex); const[hh,mm]=time.split(":").map(Number); let y=new Date().getFullYear(); const c=new Date(y,m-1,d,hh,mm,0,0); if(c.getTime()<=Date.now())y+=1; return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`; }
function timeInputToReminderAt(tv,ex="") { if(!tv)return""; const[hh,mm]=tv.split(":").map(Number); const base=ex?new Date(normalizeReminderAt(ex)):new Date(); const c=new Date(base);c.setHours(hh,mm,0,0); if(!ex&&c.getTime()<=Date.now())c.setDate(c.getDate()+1); return `${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}T${String(c.getHours()).padStart(2,"0")}:${String(c.getMinutes()).padStart(2,"0")}`; }
function isDueReminder(v) { const r=normalizeReminderAt(v); if(!r)return false; return new Date(r).getTime()<=Date.now(); }
function toDateTimeInput(y,m,d,h=9,min=0) { return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`; }
function offsetDateTimeInput(days,h=9,min=0) { const d=startOfToday(); d.setDate(d.getDate()+days); return toDateTimeInput(d.getFullYear(),d.getMonth()+1,d.getDate(),h,min); }
function startOfToday() { const d=new Date(); d.setHours(0,0,0,0); return d; }
function dialCodeFromPhone(p="") { return p.match(/^\+\d{1,4}/)?.[0]||""; }
function normalizeExtractedPhone(p="") { const c=p.replace(/[^\d+]/g,""); if(!c)return""; if(c.startsWith("+"))return c; return `+86${c.replace(/^0+/,"")}`; }
function inferStageFromText(t="") { return STAGES.find(s=>t.includes(s))||detectStage(t); }

// ========== Event Binding ==========
function bindEvents() {
  document.querySelector("#newOrderBtn")?.addEventListener("click",addOrder);
  document.querySelector("#emptyNewOrderBtn")?.addEventListener("click",addOrder);
  document.querySelector("#deleteOrderBtn")?.addEventListener("click",deleteOrder);
  document.querySelector("#orderForm")?.addEventListener("submit",saveOrderFromForm);
  document.querySelector("#issueForm")?.addEventListener("submit",addIssue);
  document.querySelector("#contactForm")?.addEventListener("submit",addContact);
  document.querySelector("#contactDialCode")?.addEventListener("change",()=>{const c=document.querySelector("#customDialCode");if(c)c.classList.toggle("hidden",document.querySelector("#contactDialCode")?.value!=="custom");});
  document.querySelector("#saveNodeNoteBtn")?.addEventListener("click",saveNodeNote);
  document.querySelector("#clearNodeReminderBtn")?.addEventListener("click",clearNodeReminder);
  document.querySelector("#uploadFileBtn")?.addEventListener("click",()=>document.querySelector("#infoFileInput")?.click());
  document.querySelector("#infoFileInput")?.addEventListener("change",readInfoFile);
  document.querySelector("#previewLogBtn")?.addEventListener("click",previewWorkLog);
  document.querySelector("#applyLogBtn")?.addEventListener("click",applyWorkLog);
  document.querySelector("#searchInput")?.addEventListener("input",renderOrderList);
  document.querySelector("#statusFilter")?.addEventListener("change",renderOrderList);
  document.querySelector("#exportBtn")?.addEventListener("click",exportData);
  document.querySelector("#importInput")?.addEventListener("change",importData);
  document.querySelector("#dismissAlarmBtn")?.addEventListener("click",dismissAlarm);
  document.querySelector("#snoozeAlarmBtn")?.addEventListener("click",snoozeAlarm);

  // Module tabs
  document.querySelectorAll('.m-tab').forEach(t=>t.addEventListener('click',()=>switchModule(t.dataset.module)));

  // Shipping save
  document.querySelector("#saveShippingBtn")?.addEventListener("click",saveShipping);
  document.querySelector("#saveShNodeBtn")?.addEventListener("click",saveShNode);
  document.querySelector("#clearShNodeBtn")?.addEventListener("click",()=>{state.shSelectedNode=null;const ed=document.querySelector("#shNodeEditor");if(ed)ed.classList.add("hidden");renderShippingModule(selectedOrder());});
  document.querySelector("#addShippingCostBtn")?.addEventListener("click",addShippingCost);

  // Docs save
  document.querySelector("#saveDocsBtn")?.addEventListener("click",saveDocs);
  document.querySelector("#addDocNoteBtn")?.addEventListener("click",addDocNote);

  // Customs save
  document.querySelector("#saveCustomsBtn")?.addEventListener("click",saveCustoms);
  document.querySelector("#saveCsNodeBtn")?.addEventListener("click",saveCsNode);
  document.querySelector("#clearCsNodeBtn")?.addEventListener("click",()=>{state.csSelectedNode=null;const ed=document.querySelector("#csNodeEditor");if(ed)ed.classList.add("hidden");renderCustomsModule(selectedOrder());});

  document.addEventListener("click",requestNotificationPermission,{once:true});
}

// ========== Init ==========
populateSelects();
loadOrders();
bindEvents();
render();
startReminderWatcher();
switchModule('trade');
