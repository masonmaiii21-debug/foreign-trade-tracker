const STORAGE_KEY = "foreignTradeTracker.orders.v1";
const CLOUD_SETTINGS_KEY = "foreignTradeTracker.cloudReminder.v1";

const STAGES = ["询盘", "报价", "打样", "合同", "生产", "验货", "订舱", "出运", "收款", "售后", "完成"];
const STATUSES = ["进行中", "待客户", "有风险", "暂停", "已完成"];

const stageKeywords = [
  ["完成", ["完成", "结束", "结案", "已收尾"]],
  ["收款", ["收款", "尾款", "定金", "付款", "水单", "到账"]],
  ["出运", ["出运", "发货", "装柜", "提单", "报关", "清关", "船期"]],
  ["订舱", ["订舱", "booking", "订船", "舱位"]],
  ["验货", ["验货", "质检", "qc", "inspection", "验厂"]],
  ["生产", ["生产", "排产", "量产", "大货", "工厂在做"]],
  ["合同", ["合同", "pi", "形式发票", "po", "订单确认"]],
  ["打样", ["打样", "样品", "寄样", "样板", "确认样"]],
  ["报价", ["报价", "报盘", "价格", "询价"]]
];

const issueKeywords = ["问题", "异常", "投诉", "缺少", "破损", "延期", "延误", "错误", "不符", "无法", "失败", "风险", "质量", "返工", "客户反馈"];
const riskKeywords = ["风险", "延期", "延误", "投诉", "返工", "无法", "失败", "暂停", "不符"];
const waitingKeywords = ["等客户", "待客户", "客户确认", "等确认", "客户回复"];
const issueRules = [
  ["质量", ["质量", "破损", "不良", "瑕疵", "色差", "尺寸不符", "返工", "不符"]],
  ["交期", ["延期", "延误", "赶不上", "来不及", "交期", "船期"]],
  ["付款", ["付款", "尾款", "定金", "水单", "到账", "信用证", "lc"]],
  ["单证", ["单证", "发票", "箱单", "提单", "产地证", "报关"]],
  ["物流", ["订舱", "装柜", "清关", "报关", "货代", "仓库", "物流"]],
  ["沟通", ["客户反馈", "客户投诉", "未回复", "确认慢", "沟通"]]
];

const state = {
  orders: [],
  selectedId: null,
  selectedNode: "询盘",
  pendingUpdates: [],
  activeAlarm: null
};

const el = {
  metrics: document.querySelector("#metrics"),
  newOrderBtn: document.querySelector("#newOrderBtn"),
  emptyNewOrderBtn: document.querySelector("#emptyNewOrderBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  orderList: document.querySelector("#orderList"),
  pageTitle: document.querySelector("#pageTitle"),
  deleteOrderBtn: document.querySelector("#deleteOrderBtn"),
  emptyState: document.querySelector("#emptyState"),
  orderEditor: document.querySelector("#orderEditor"),
  orderForm: document.querySelector("#orderForm"),
  orderNo: document.querySelector("#orderNo"),
  customer: document.querySelector("#customer"),
  country: document.querySelector("#country"),
  product: document.querySelector("#product"),
  quantity: document.querySelector("#quantity"),
  weight: document.querySelector("#weight"),
  category: document.querySelector("#category"),
  amount: document.querySelector("#amount"),
  dueDate: document.querySelector("#dueDate"),
  status: document.querySelector("#status"),
  stage: document.querySelector("#stage"),
  nextAction: document.querySelector("#nextAction"),
  notes: document.querySelector("#notes"),
  lastUpdated: document.querySelector("#lastUpdated"),
  saveHint: document.querySelector("#saveHint"),
  issueForm: document.querySelector("#issueForm"),
  issueText: document.querySelector("#issueText"),
  issueSeverity: document.querySelector("#issueSeverity"),
  issueCount: document.querySelector("#issueCount"),
  issueList: document.querySelector("#issueList"),
  contactForm: document.querySelector("#contactForm"),
  contactRole: document.querySelector("#contactRole"),
  contactNote: document.querySelector("#contactNote"),
  contactDialCode: document.querySelector("#contactDialCode"),
  customDialCode: document.querySelector("#customDialCode"),
  contactPhone: document.querySelector("#contactPhone"),
  contactEmail: document.querySelector("#contactEmail"),
  contactCount: document.querySelector("#contactCount"),
  contactList: document.querySelector("#contactList"),
  progressChain: document.querySelector("#progressChain"),
  nodeNoteTitle: document.querySelector("#nodeNoteTitle"),
  nodeNoteMeta: document.querySelector("#nodeNoteMeta"),
  nodeNoteText: document.querySelector("#nodeNoteText"),
  nodeReminderDate: document.querySelector("#nodeReminderDate"),
  nodeReminderAt: document.querySelector("#nodeReminderAt"),
  clearNodeReminderBtn: document.querySelector("#clearNodeReminderBtn"),
  saveNodeNoteBtn: document.querySelector("#saveNodeNoteBtn"),
  reminderCount: document.querySelector("#reminderCount"),
  reminderList: document.querySelector("#reminderList"),
  uploadFileBtn: document.querySelector("#uploadFileBtn"),
  fileReadHint: document.querySelector("#fileReadHint"),
  infoFileInput: document.querySelector("#infoFileInput"),
  workLog: document.querySelector("#workLog"),
  previewLogBtn: document.querySelector("#previewLogBtn"),
  applyLogBtn: document.querySelector("#applyLogBtn"),
  logPreview: document.querySelector("#logPreview"),
  activityCount: document.querySelector("#activityCount"),
  activityList: document.querySelector("#activityList"),
  alarmOverlay: document.querySelector("#alarmOverlay"),
  alarmTitle: document.querySelector("#alarmTitle"),
  alarmContent: document.querySelector("#alarmContent"),
  snoozeAlarmBtn: document.querySelector("#snoozeAlarmBtn"),
  dismissAlarmBtn: document.querySelector("#dismissAlarmBtn"),
  cloudReminderEmail: document.querySelector("#cloudReminderEmail"),
  cloudFunctionUrl: document.querySelector("#cloudFunctionUrl"),
  cloudAnonKey: document.querySelector("#cloudAnonKey"),
  saveCloudSettingsBtn: document.querySelector("#saveCloudSettingsBtn"),
  syncCloudRemindersBtn: document.querySelector("#syncCloudRemindersBtn"),
  cloudReminderStatus: document.querySelector("#cloudReminderStatus")
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function loadOrders() {
  try {
    state.orders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    state.orders = [];
  }
  state.orders.forEach(ensureOrderShape);
  state.selectedId = state.orders[0]?.id || null;
  state.selectedNode = selectedOrder()?.stage || "询盘";
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.orders));
}

function selectedOrder() {
  return state.orders.find((order) => order.id === state.selectedId) || null;
}

function ensureOrderShape(order) {
  order.issues = Array.isArray(order.issues) ? order.issues : [];
  order.contacts = Array.isArray(order.contacts) ? order.contacts : [];
  order.contacts.forEach((contact) => {
    contact.name = contact.name || contact.note || "";
    contact.note = contact.note || "";
    contact.dialCode = contact.dialCode || dialCodeFromPhone(contact.phone) || "";
    contact.email = contact.email || "";
    contact.phone = contact.phone || "";
  });
  order.activities = Array.isArray(order.activities) ? order.activities : [];
  order.weight = order.weight || "";
  order.category = order.category || "";
  order.stageNotes = order.stageNotes && typeof order.stageNotes === "object" ? order.stageNotes : {};
  STAGES.forEach((stage) => {
    order.stageNotes[stage] = {
      note: order.stageNotes[stage]?.note || "",
      reminderAt: normalizeReminderAt(order.stageNotes[stage]?.reminderAt || ""),
      updatedAt: order.stageNotes[stage]?.updatedAt || ""
    };
  });
  order.stage = STAGES.includes(order.stage) ? order.stage : "询盘";
  order.status = STATUSES.includes(order.status) ? order.status : "进行中";
}

function createEmptyStageNotes() {
  return STAGES.reduce((result, stage) => {
    result[stage] = { note: "", reminderAt: "", updatedAt: "" };
    return result;
  }, {});
}

function populateSelects() {
  el.status.innerHTML = STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("");
  el.stage.innerHTML = STAGES.map((stage) => `<option value="${stage}">${stage}</option>`).join("");
  el.statusFilter.innerHTML = `<option value="">全部状态</option>${STATUSES.map((status) => `<option value="${status}">${status}</option>`).join("")}`;
}

function render() {
  renderMetrics();
  renderOrderList();
  renderEditor();
  renderCloudSettings();
}

function renderMetrics() {
  const active = state.orders.filter((order) => order.status !== "已完成").length;
  const risky = state.orders.filter((order) => order.status === "有风险" || order.issues?.some((issue) => issue.status !== "已解决")).length;
  const waiting = state.orders.filter((order) => order.status === "待客户").length;
  el.metrics.innerHTML = [
    ["进行中", active],
    ["有风险", risky],
    ["待客户", waiting]
  ]
    .map(([label, value]) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");
}

function renderOrderList() {
  const query = el.searchInput.value.trim().toLowerCase();
  const status = el.statusFilter.value;
  const orders = state.orders
    .filter((order) => !status || order.status === status)
    .filter((order) => {
      const text = [order.orderNo, order.customer, order.product, order.country, order.category].join(" ").toLowerCase();
      return !query || text.includes(query);
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  el.orderList.innerHTML = "";
  if (!orders.length) {
    el.orderList.innerHTML = `<div class="order-item"><span>暂无匹配订单</span></div>`;
    return;
  }

  const template = document.querySelector("#orderItemTemplate");
  orders.forEach((order) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active", order.id === state.selectedId);
    node.querySelector("strong").textContent = order.orderNo || "未填写订单号";
    node.querySelector("small").textContent = `${order.customer || "未填客户"} · ${order.product || "未填产品"}`;
    node.querySelector(".order-meta").textContent = `${order.stage || "询盘"}\n${order.status || "进行中"}`;
    node.addEventListener("click", () => {
      state.selectedId = order.id;
      state.selectedNode = order.stage || "询盘";
      state.pendingUpdates = [];
      render();
    });
    el.orderList.appendChild(node);
  });
}

function renderEditor() {
  const order = selectedOrder();
  el.emptyState.classList.toggle("hidden", Boolean(order));
  el.orderEditor.classList.toggle("hidden", !order);
  el.deleteOrderBtn.classList.toggle("hidden", !order);

  if (!order) {
    el.pageTitle.textContent = "选择或新建订单";
    return;
  }
  ensureOrderShape(order);
  if (!STAGES.includes(state.selectedNode)) state.selectedNode = order.stage || "询盘";

  el.pageTitle.textContent = `${order.orderNo || "未填写订单号"} · ${order.customer || "未填客户"}`;
  el.orderNo.value = order.orderNo || "";
  el.customer.value = order.customer || "";
  el.country.value = order.country || "";
  el.product.value = order.product || "";
  el.quantity.value = order.quantity || "";
  el.weight.value = order.weight || "";
  el.category.value = order.category || "";
  el.amount.value = order.amount || "";
  el.dueDate.value = order.dueDate || "";
  el.status.value = order.status || "进行中";
  el.stage.value = order.stage || "询盘";
  el.nextAction.value = order.nextAction || "";
  el.notes.value = order.notes || "";
  el.lastUpdated.textContent = `更新于 ${formatDateTime(order.updatedAt)}`;
  el.workLog.value = "";
  el.logPreview.innerHTML = "";
  el.applyLogBtn.disabled = true;
  renderProgressChain(order);
  renderNodeEditor(order);
  renderReminders(order);
  renderIssues(order);
  renderContacts(order);
  renderActivities(order);
}

function renderProgressChain(order) {
  const currentIndex = STAGES.indexOf(order.stage);
  el.progressChain.innerHTML = STAGES.map((stage, index) => {
    const note = order.stageNotes?.[stage] || {};
    const stageIssues = issuesForStage(order, stage);
    const stageActivities = activitiesForStage(order, stage);
    const isCurrent = stage === order.stage;
    const classes = ["chain-node"];
    if (index < currentIndex || order.status === "已完成") classes.push("done");
    if (isCurrent) classes.push("current");
    if (stage === state.selectedNode) classes.push("selected");
    if (stageIssues.length) classes.push("risk");
    if (note.reminderAt) classes.push("remind");

    const summary = nodeSummary(order, stage, note, stageIssues, stageActivities);
    const tooltip = nodeTooltip(order, stage, note, stageIssues, stageActivities);
    const badges = [
      stageIssues.length ? `<span class="node-badge issue">${stageIssues.length} 问题</span>` : "",
      note.reminderAt ? `<span class="node-badge reminder">${formatReminder(note.reminderAt)}</span>` : ""
    ].join("");

    return `
      <button class="${classes.join(" ")}" type="button" data-stage="${stage}">
        <span class="node-dot">${index + 1}</span>
        <span class="node-name">${stage}</span>
        <span class="node-summary">${escapeHtml(summary)}</span>
        <span class="node-badges">${badges}</span>
        <span class="node-tooltip">${tooltip}</span>
      </button>
    `;
  }).join("");

  el.progressChain.querySelectorAll(".chain-node").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedNode = node.dataset.stage;
      renderProgressChain(order);
      renderNodeEditor(order);
    });
  });
}

function renderNodeEditor(order) {
  const stage = state.selectedNode || order.stage || "询盘";
  const note = order.stageNotes?.[stage] || { note: "", reminderAt: "" };
  const stageIssues = issuesForStage(order, stage);
  const stageActivities = activitiesForStage(order, stage);
  el.nodeNoteTitle.textContent = `${stage}节点`;
  el.nodeNoteMeta.textContent = `${stageActivities.length} 条详情 · ${stageIssues.length} 个问题`;
  el.nodeNoteText.value = note.note || "";
  el.nodeReminderDate.value = toMonthDayValue(note.reminderAt);
  el.nodeReminderAt.value = toTimeValue(note.reminderAt);
}

function renderReminders(order) {
  const reminders = STAGES.map((stage) => ({
    stage,
    reminderAt: order.stageNotes?.[stage]?.reminderAt || "",
    note: order.stageNotes?.[stage]?.note || ""
  })).filter((item) => item.reminderAt);

  el.reminderCount.textContent = reminders.length ? `${reminders.length} 条` : "无";
  if (!reminders.length) {
    el.reminderList.innerHTML = `<div class="reminder-item">暂无提醒</div>`;
    return;
  }

  reminders.sort((a, b) => a.reminderAt.localeCompare(b.reminderAt));
  el.reminderList.innerHTML = reminders.map((item) => {
    const due = isDueReminder(item.reminderAt);
    return `
      <article class="reminder-item ${due ? "due" : ""}">
        <strong>${escapeHtml(item.stage)} · ${formatReminder(item.reminderAt)}</strong>
        <span>${escapeHtml(item.note || order.nextAction || "需要跟进")}</span>
      </article>
    `;
  }).join("");
}

function renderCloudSettings() {
  const settings = loadCloudSettings();
  el.cloudReminderEmail.value = settings.email || "";
  el.cloudFunctionUrl.value = settings.functionUrl || "";
  el.cloudAnonKey.value = settings.anonKey || "";
  const ready = settings.email && settings.functionUrl && settings.anonKey;
  el.cloudReminderStatus.textContent = ready ? "已配置" : "未配置";
}

function nodeSummary(order, stage, note, stageIssues, stageActivities) {
  if (note.note) return note.note.slice(0, 28);
  if (stage === order.stage && order.nextAction) return order.nextAction.slice(0, 28);
  if (stageIssues[0]) return stageIssues[0].text.slice(0, 28);
  if (stageActivities[0]) return stageActivities[0].text.slice(0, 28);
  return stage === order.stage ? "当前节点" : "暂无详情";
}

function nodeTooltip(order, stage, note, stageIssues, stageActivities) {
  const latestActivity = stageActivities[0]?.text || "暂无日志详情";
  const latestIssue = stageIssues[0]?.text || "暂无问题";
  return `
    <strong>${escapeHtml(stage)}</strong>
    <p>备注：${escapeHtml(note.note || "暂无")}</p>
    <p>提醒：${escapeHtml(note.reminderAt ? formatReminder(note.reminderAt) : "无")}</p>
    <p>最近详情：${escapeHtml(latestActivity)}</p>
    <p>问题：${escapeHtml(latestIssue)}</p>
  `;
}

function issuesForStage(order, stage) {
  return (order.issues || [])
    .filter((issue) => issue.status !== "已解决")
    .filter((issue) => (issue.stage || order.stage) === stage)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function activitiesForStage(order, stage) {
  return (order.activities || [])
    .filter((item) => (item.stage || inferStageFromText(item.text) || order.stage) === stage)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderIssues(order) {
  const openIssues = (order.issues || []).filter((issue) => issue.status !== "已解决").length;
  el.issueCount.textContent = `${openIssues} 个未解决`;
  el.issueList.innerHTML = "";

  if (!order.issues?.length) {
    el.issueList.innerHTML = `<div class="issue-item"><p>暂无问题记录</p></div>`;
    return;
  }

  const template = document.querySelector("#issueTemplate");
  order.issues
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((issue) => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.classList.toggle("resolved", issue.status === "已解决");
      const severity = node.querySelector(".severity");
      severity.textContent = `${issue.category || "问题"} · ${issue.severity} · ${issue.status}`;
      severity.classList.add(issue.severity);
      node.querySelector("p").textContent = issue.text;
      node.querySelector("small").textContent = `创建 ${formatDateTime(issue.createdAt)} · 更新 ${formatDateTime(issue.updatedAt)}`;
      node.querySelector(".close-issue").addEventListener("click", () => toggleIssue(issue.id));
      node.querySelector(".delete-issue").addEventListener("click", () => deleteIssue(issue.id));
      el.issueList.appendChild(node);
    });
}

function renderContacts(order) {
  const contacts = order.contacts || [];
  el.contactCount.textContent = contacts.length ? `${contacts.length} 个` : "无";
  el.contactList.innerHTML = "";

  if (!contacts.length) {
    el.contactList.innerHTML = `<div class="contact-item"><p>暂无联系方式</p></div>`;
    return;
  }

  contacts
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .forEach((contact) => {
      const article = document.createElement("article");
      article.className = "contact-item";
      const displayName = contact.name || contact.note || "";
      article.innerHTML = `
        <div>
          <strong>${escapeHtml(contact.role || "其他")}${displayName ? ` · ${escapeHtml(displayName)}` : ""}</strong>
          <p>电话：${escapeHtml(contact.phone || "未填")}<br />邮箱：${escapeHtml(contact.email || "未填")}</p>
        </div>
        <div class="contact-actions">
          <button class="ghost" type="button" title="删除联系人">×</button>
        </div>
      `;
      article.querySelector("button").addEventListener("click", () => deleteContact(contact.id));
      el.contactList.appendChild(article);
    });
}

function renderActivities(order) {
  const activities = order.activities || [];
  el.activityCount.textContent = `${activities.length} 条`;
  el.activityList.innerHTML = activities.length
    ? activities
        .slice()
        .reverse()
        .map((item) => `<article class="activity-item"><p>${escapeHtml(item.text)}</p><small>${formatDateTime(item.createdAt)}</small></article>`)
        .join("")
    : `<div class="activity-item"><p>暂无更新记录</p></div>`;
}

function addOrder() {
  const createdAt = new Date().toISOString();
  const order = {
    id: createId(),
    orderNo: `PI-${new Date().getFullYear()}-${String(state.orders.length + 1).padStart(3, "0")}`,
    customer: "",
    country: "",
    product: "",
    quantity: "",
    weight: "",
    category: "",
    amount: "",
    dueDate: "",
    status: "进行中",
    stage: "询盘",
    nextAction: "",
    notes: "",
    issues: [],
    contacts: [],
    stageNotes: createEmptyStageNotes(),
    activities: [{ id: createId(), text: "新建订单", createdAt }],
    createdAt,
    updatedAt: createdAt
  };
  state.orders.unshift(order);
  state.selectedId = order.id;
  state.selectedNode = order.stage || "询盘";
  saveOrders();
  render();
  el.orderNo.focus();
}

function saveOrderFromForm(event) {
  event.preventDefault();
  const order = selectedOrder();
  if (!order) return;

  const before = `${order.stage} / ${order.status}`;
  Object.assign(order, {
    orderNo: el.orderNo.value.trim(),
    customer: el.customer.value.trim(),
    country: el.country.value.trim(),
    product: el.product.value.trim(),
    quantity: el.quantity.value.trim(),
    weight: el.weight.value.trim(),
    category: el.category.value.trim(),
    amount: el.amount.value.trim(),
    dueDate: el.dueDate.value,
    status: el.status.value,
    stage: el.stage.value,
    nextAction: el.nextAction.value.trim(),
    notes: el.notes.value.trim(),
    updatedAt: new Date().toISOString()
  });
  const after = `${order.stage} / ${order.status}`;
  if (before !== after) {
    addActivity(order, `手动更新进度：${before} → ${after}`, false);
  }
  state.selectedNode = order.stage || "询盘";
  saveOrders();
  render();
  el.saveHint.textContent = `已保存 ${nowText()}`;
  setTimeout(() => (el.saveHint.textContent = ""), 2200);
}

function addIssue(event) {
  event.preventDefault();
  const order = selectedOrder();
  const text = el.issueText.value.trim();
  if (!order || !text) return;
  pushIssue(order, text, el.issueSeverity.value);
  order.status = order.status === "已完成" ? "有风险" : order.status;
  if (riskKeywords.some((word) => text.includes(word))) order.status = "有风险";
  touch(order, `新增问题：${text}`);
  el.issueText.value = "";
  saveOrders();
  render();
}

function pushIssue(order, text, severity = "一般", meta = {}) {
  const createdAt = new Date().toISOString();
  order.issues = order.issues || [];
  const category = meta.category || detectIssueCategory(text);
  order.issues.push({
    id: createId(),
    text,
    severity,
    category,
    stage: meta.stage || state.selectedNode || order.stage || "询盘",
    status: "未解决",
    createdAt,
    updatedAt: createdAt
  });
}

function toggleIssue(issueId) {
  const order = selectedOrder();
  const issue = order?.issues?.find((item) => item.id === issueId);
  if (!order || !issue) return;
  issue.status = issue.status === "已解决" ? "未解决" : "已解决";
  issue.updatedAt = new Date().toISOString();
  touch(order, `${issue.status === "已解决" ? "解决" : "重开"}问题：${issue.text}`);
  saveOrders();
  render();
}

function deleteIssue(issueId) {
  const order = selectedOrder();
  if (!order) return;
  const issue = order.issues.find((item) => item.id === issueId);
  order.issues = order.issues.filter((item) => item.id !== issueId);
  touch(order, `删除问题：${issue?.text || issueId}`);
  saveOrders();
  render();
}

function addContact(event) {
  event.preventDefault();
  const order = selectedOrder();
  if (!order) return;
  const dialCode = selectedDialCode();
  const phone = el.contactPhone.value.trim();
  const email = el.contactEmail.value.trim();
  const name = el.contactNote.value.trim();
  if (!phone && !email) {
    window.alert("请至少填写电话或邮箱。");
    return;
  }
  if (email && !isValidEmail(email)) {
    window.alert("邮箱格式不正确，请填写类似 name@example.com 的邮箱。");
    return;
  }
  if (phone && !isValidDialCode(dialCode) && !phone.trim().startsWith("+")) {
    window.alert("请填写电话区号，例如中国 +86、美国 +1。");
    return;
  }

  const createdAt = new Date().toISOString();
  const fullPhone = phone ? formatPhoneWithDialCode(dialCode, phone) : "";
  order.contacts = order.contacts || [];
  order.contacts.push({
    id: createId(),
    role: el.contactRole.value,
    name,
    note: name,
    dialCode: phone.startsWith("+") ? dialCodeFromPhone(phone) : dialCode,
    phone: fullPhone,
    email,
    createdAt,
    updatedAt: createdAt
  });
  touch(order, `新增${el.contactRole.value}联系方式${name ? `：${name}` : ""}`);
  el.contactNote.value = "";
  el.contactPhone.value = "";
  el.contactEmail.value = "";
  saveOrders();
  render();
}

function selectedDialCode() {
  return el.contactDialCode.value === "custom"
    ? el.customDialCode.value.trim()
    : el.contactDialCode.value.trim();
}

function toggleCustomDialCode() {
  const custom = el.contactDialCode.value === "custom";
  el.customDialCode.classList.toggle("hidden", !custom);
  if (custom) el.customDialCode.focus();
}

function deleteContact(contactId) {
  const order = selectedOrder();
  if (!order) return;
  const contact = (order.contacts || []).find((item) => item.id === contactId);
  order.contacts = (order.contacts || []).filter((item) => item.id !== contactId);
  const displayName = contact?.name || contact?.note || "";
  touch(order, `删除${contact?.role || "联系人"}联系方式${displayName ? `：${displayName}` : ""}`);
  saveOrders();
  render();
}

function deleteOrder() {
  const order = selectedOrder();
  if (!order) return;
  const ok = window.confirm(`确定删除订单 ${order.orderNo || "未填写订单号"}？此操作只影响本浏览器本地数据。`);
  if (!ok) return;
  state.orders = state.orders.filter((item) => item.id !== order.id);
  state.selectedId = state.orders[0]?.id || null;
  saveOrders();
  render();
}

function saveNodeNote() {
  const order = selectedOrder();
  if (!order) return;
  ensureOrderShape(order);
  const stage = state.selectedNode || order.stage || "询盘";
  const note = order.stageNotes[stage];
  note.note = el.nodeNoteText.value.trim();
  note.reminderAt = monthDayTimeToReminderAt(el.nodeReminderDate.value, el.nodeReminderAt.value, note.reminderAt);
  note.updatedAt = new Date().toISOString();
  touch(order, `更新${stage}节点：${note.note || "修改备注/提醒"}`, stage);
  saveOrders();
  render();
}

function clearNodeReminder() {
  const order = selectedOrder();
  if (!order) return;
  ensureOrderShape(order);
  const stage = state.selectedNode || order.stage || "询盘";
  order.stageNotes[stage].reminderAt = "";
  order.stageNotes[stage].updatedAt = new Date().toISOString();
  touch(order, `清除${stage}节点提醒`, stage);
  saveOrders();
  render();
}

function previewWorkLog() {
  const text = el.workLog.value.trim();
  state.pendingUpdates = parseWorkLog(text);
  renderLogPreview();
}

async function readInfoFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    el.fileReadHint.textContent = `正在读取：${file.name}`;
    const text = await fileToText(file);
    el.workLog.value = text.slice(0, 60000);
    state.pendingUpdates = parseWorkLog(text);
    renderLogPreview();
    el.fileReadHint.textContent = `已读取：${file.name}`;
  } catch (error) {
    el.fileReadHint.textContent = "读取失败";
    window.alert(`文件识别失败：${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function parseWorkLog(text) {
  if (!text) return [];
  const chunks = [
    ...expandStructuredRows(text),
    ...text
    .split(/\n+/)
    .flatMap((line) => line.split(/[。；;]/))
    .map((line) => line.trim())
    .filter(Boolean)
  ];

  const updates = [];
  chunks.forEach((line) => {
    const orderNo = extractOrderNo(line);
    const order = matchOrder(line) || null;
    const fallbackOrder = order || selectedOrder();
    if (!order && !orderNo && !fallbackOrder) return;

    const update = {
      orderId: order?.id || fallbackOrder?.id || null,
      orderNo: order?.orderNo || orderNo || fallbackOrder?.orderNo || "",
      source: line,
      stage: detectStage(line),
      status: detectStatus(line),
      issues: detectIssues(line),
      nextAction: detectNextAction(line),
      reminderAt: detectReminderAt(line),
      orderPatch: extractOrderPatch(line),
      contacts: extractContacts(line),
      detail: cleanLogDetail(line)
    };

    if (update.stage || update.status || update.issues.length || update.nextAction || update.reminderAt || Object.keys(update.orderPatch).length || update.contacts.length) {
      updates.push(update);
    }
  });
  return updates;
}

function matchOrder(line) {
  const lower = line.toLowerCase();
  const explicit = extractOrderNo(line);
  if (explicit) {
    const hit = state.orders.find((order) => normalize(order.orderNo).includes(normalize(explicit)) || normalize(explicit).includes(normalize(order.orderNo)));
    if (hit) return hit;
  }
  return state.orders.find((order) => order.orderNo && lower.includes(order.orderNo.toLowerCase()));
}

function extractOrderNo(line) {
  return line.match(/(?:订单号|订单|合同号|po|pi|so|invoice|order)[:：#\s-]*([a-z0-9][a-z0-9._/-]{2,})/i)?.[1] || "";
}

function detectStage(line) {
  const lower = line.toLowerCase();
  const found = stageKeywords.find(([, keywords]) => keywords.some((word) => lower.includes(word.toLowerCase())));
  return found?.[0] || "";
}

function detectStatus(line) {
  if (line.includes("完成") || line.includes("结束") || line.includes("结案")) return "已完成";
  if (line.includes("暂停")) return "暂停";
  if (riskKeywords.some((word) => line.includes(word))) return "有风险";
  if (waitingKeywords.some((word) => line.includes(word))) return "待客户";
  return "";
}

function detectIssues(line) {
  if (!issueKeywords.some((word) => line.includes(word))) return [];
  const text = cleanLogDetail(line);
  return [{
    text,
    category: detectIssueCategory(text),
    severity: riskKeywords.some((word) => text.includes(word)) ? "重要" : "一般"
  }];
}

function detectNextAction(line) {
  const nextMatch = line.match(/(?:下一步|待办|跟进|需要|明天|今天)(.+)$/);
  if (!nextMatch) return "";
  return nextMatch[0].trim();
}

function extractOrderPatch(line) {
  const patch = {};
  const fieldRules = [
    ["customer", /(?:客户|客人|买家|货主|customer|buyer)[:：\s]*([^,，;；\n]+)/i],
    ["country", /(?:国家|地区|目的国|market|country)[:：\s]*([^,，;；\n]+)/i],
    ["product", /(?:产品|货物|品名|product|goods|item)[:：\s]*([^,，;；\n]+)/i],
    ["category", /(?:品类|类别|分类|category)[:：\s]*([^,，;；\n]+)/i],
    ["quantity", /(?:数量|件数|qty|quantity)[:：\s]*([^,，;；\n]+)/i],
    ["weight", /(?:重量|毛重|净重|体积|weight|gw|nw|cbm)[:：\s]*([^,，;；\n]+)/i],
    ["amount", /(?:金额|货值|价格|amount|value|price)[:：\s]*([^,，;；\n]+)/i]
  ];
  fieldRules.forEach(([key, pattern]) => {
    const value = line.match(pattern)?.[1]?.trim();
    if (value) patch[key] = value;
  });

  if (!patch.weight) {
    const weight = line.match(/(\d+(?:\.\d+)?\s*(?:kg|kgs|公斤|吨|t|cbm|方))/i)?.[1];
    if (weight) patch.weight = weight;
  }
  if (!patch.quantity) {
    const qty = line.match(/(\d+(?:\.\d+)?\s*(?:pcs|件|箱|ctns|sets|套|个))/i)?.[1];
    if (qty) patch.quantity = qty;
  }
  return patch;
}

function extractContacts(line) {
  const emails = [...line.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0]);
  const phones = [...line.matchAll(/(?:\+?\d[\d\s-]{6,}\d)/g)].map((match) => match[0].trim());
  if (!emails.length && !phones.length) return [];

  const role = detectContactRole(line);
  const name = extractContactName(line);
  const max = Math.max(emails.length, phones.length);
  return Array.from({ length: max }, (_, index) => ({
    role,
    name,
    note: name,
    phone: normalizeExtractedPhone(phones[index] || phones[0] || ""),
    email: emails[index] || emails[0] || ""
  }));
}

function extractContactName(line) {
  const matched = line.match(/(?:联系人|contact|备注|姓名|name)[:：\s]*([^,，;；\n]+)/i)?.[1]?.trim();
  if (!matched) return "";
  return matched
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/(?:\+?\d[\d\s-]{6,}\d)/g, "")
    .trim();
}

function detectContactRole(line) {
  if (/工厂|供应商|厂家|factory|supplier/i.test(line)) return "工厂";
  if (/货主|客户|客人|买家|buyer|customer/i.test(line)) return "货主";
  if (/货代|物流|forwarder|agent|shipping/i.test(line)) return "货代";
  return "其他";
}

function detectIssueCategory(text) {
  const lower = text.toLowerCase();
  const rule = issueRules.find(([, keywords]) => keywords.some((word) => lower.includes(word.toLowerCase())));
  return rule?.[0] || "其他";
}

function cleanLogDetail(line) {
  return line.replace(/^(今天|昨日|昨天|明天|后天|上午|下午|晚上)\s*/, "").trim();
}

function detectReminderAt(line) {
  const today = new Date();
  const time = extractTimeParts(line);
  const dateMatch = line.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/);
  if (dateMatch) return toDateTimeInput(Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]), time.hour, time.minute);

  const monthDayMatch = line.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDayMatch) {
    const month = Number(monthDayMatch[1]);
    const day = Number(monthDayMatch[2]);
    let year = today.getFullYear();
    const candidate = new Date(year, month - 1, day);
    if (candidate < startOfToday()) year += 1;
    return toDateTimeInput(year, month, day, time.hour, time.minute);
  }

  if (line.includes("后天")) return offsetDateTimeInput(2, time.hour, time.minute);
  if (line.includes("明天")) return offsetDateTimeInput(1, time.hour, time.minute);
  if (line.includes("今天") || line.includes("今日")) return offsetDateTimeInput(0, time.hour, time.minute);
  return "";
}

function extractTimeParts(line) {
  const explicit = line.match(/(?:上午|下午|晚上|晚|早上|中午)?\s*(\d{1,2})[:：点](\d{1,2})?分?/);
  if (!explicit) return { hour: 9, minute: 0 };
  let hour = Number(explicit[1]);
  const minute = Number(explicit[2] || 0);
  if (/下午|晚上|晚/.test(explicit[0]) && hour < 12) hour += 12;
  if (/中午/.test(explicit[0]) && hour < 11) hour += 12;
  return { hour: Math.min(hour, 23), minute: Math.min(minute, 59) };
}

function renderLogPreview() {
  el.applyLogBtn.disabled = !state.pendingUpdates.length;
  if (!state.pendingUpdates.length) {
    el.logPreview.innerHTML = `<div class="preview-item">没有识别到可更新内容。请确认日志里包含订单号、进度关键词或问题描述。</div>`;
    return;
  }

  el.logPreview.innerHTML = state.pendingUpdates
    .map((item) => {
      const lines = [];
      if (item.stage) lines.push(`阶段 → ${item.stage}`);
      if (item.status) lines.push(`状态 → ${item.status}`);
      if (item.nextAction) lines.push(`下一步 → ${item.nextAction}`);
      if (item.reminderAt) lines.push(`提醒 → ${formatReminder(item.reminderAt)}`);
      if (Object.keys(item.orderPatch).length) lines.push(`货物信息 → ${formatPatch(item.orderPatch)}`);
      if (item.contacts.length) lines.push(`联系人 → ${item.contacts.map((contact) => `${contact.role}${contact.name ? ` ${contact.name}` : ""}${contact.email ? ` ${contact.email}` : ""}${contact.phone ? ` ${contact.phone}` : ""}`).join("；")}`);
      if (item.issues.length) lines.push(`新增问题 → ${item.issues.map((issue) => `${issue.category}:${issue.text}`).join("；")}`);
      return `<article class="preview-item"><strong>${escapeHtml(item.orderNo || "当前订单")}</strong><span>${escapeHtml(lines.join("，"))}</span><small>来源：${escapeHtml(item.source)}</small></article>`;
    })
    .join("");
}

function applyWorkLog() {
  if (!state.pendingUpdates.length) return;
  state.pendingUpdates.forEach((update) => {
    let order = state.orders.find((item) => item.id === update.orderId);
    if (!order && update.orderNo) {
      order = findOrCreateOrder(update.orderNo);
    }
    if (!order) return;
    ensureOrderShape(order);
    const changes = [];
    const targetStage = update.stage || order.stage || "询盘";
    Object.entries(update.orderPatch || {}).forEach(([key, value]) => {
      if (value && order[key] !== value) {
        order[key] = value;
        changes.push(`${fieldLabel(key)}：${value}`);
      }
    });
    if (update.stage && update.stage !== order.stage) {
      changes.push(`阶段 ${order.stage || "未填"} → ${update.stage}`);
      order.stage = update.stage;
    }
    if (update.status && update.status !== order.status) {
      changes.push(`状态 ${order.status || "未填"} → ${update.status}`);
      order.status = update.status;
    }
    if (update.nextAction && update.nextAction !== order.nextAction) {
      changes.push(`下一步：${update.nextAction}`);
      order.nextAction = update.nextAction;
    }
    if (update.detail) {
      const note = order.stageNotes[targetStage];
      const oldNote = note.note ? `${note.note}\n` : "";
      if (!note.note.includes(update.detail)) {
        note.note = `${oldNote}${formatDate(new Date().toISOString())}: ${update.detail}`.trim();
        note.updatedAt = new Date().toISOString();
        changes.push(`${targetStage}节点详情已更新`);
      }
    }
    if (update.reminderAt) {
      order.stageNotes[targetStage].reminderAt = update.reminderAt;
      order.stageNotes[targetStage].updatedAt = new Date().toISOString();
      changes.push(`${targetStage}提醒：${formatReminder(update.reminderAt)}`);
    }
    update.issues.forEach((issue) => {
      const exists = order.issues?.some((item) => item.text === issue.text && item.status !== "已解决");
      if (!exists) {
        pushIssue(order, issue.text, issue.severity, { category: issue.category, stage: targetStage });
        changes.push(`新增${issue.category}问题：${issue.text}`);
      }
    });
    (update.contacts || []).forEach((contact) => {
      if (!contact.phone && !contact.email) return;
      if (contact.email && !isValidEmail(contact.email)) return;
      const phone = normalizeExtractedPhone(contact.phone || "");
      const exists = order.contacts?.some((item) => normalize(item.email) === normalize(contact.email) && normalize(item.phone) === normalize(phone));
      if (!exists) {
        const createdAt = new Date().toISOString();
        order.contacts.push({
          id: createId(),
          ...contact,
          phone,
          dialCode: dialCodeFromPhone(phone),
          note: contact.note || contact.name || "",
          createdAt,
          updatedAt: createdAt
        });
        changes.push(`新增${contact.role}联系人${contact.name ? ` ${contact.name}` : ""}${contact.email ? ` ${contact.email}` : ""}${phone ? ` ${phone}` : ""}`);
      }
    });
    if (changes.length) touch(order, `日志自动更新：${changes.join("；")}`, targetStage);
  });

  state.pendingUpdates = [];
  el.workLog.value = "";
  saveOrders();
  render();
  checkReminderAlarms();
}

function touch(order, activityText, stage = "") {
  order.updatedAt = new Date().toISOString();
  addActivity(order, activityText, false, stage);
}

function addActivity(order, text, shouldTouch = true, stage = "") {
  order.activities = order.activities || [];
  order.activities.push({ id: createId(), text, stage: stage || order.stage || "询盘", createdAt: new Date().toISOString() });
  if (shouldTouch) order.updatedAt = new Date().toISOString();
}

function startReminderWatcher() {
  checkReminderAlarms();
  window.setInterval(checkReminderAlarms, 30000);
}

function checkReminderAlarms() {
  if (state.activeAlarm || !el.alarmOverlay.classList.contains("hidden")) return;
  const due = collectDueReminders().find((item) => !sessionStorage.getItem(alarmKey(item)));
  if (due) showAlarm(due);
}

function collectDueReminders() {
  return state.orders.flatMap((order) => {
    ensureOrderShape(order);
    return STAGES.map((stage) => ({
      order,
      stage,
      reminderAt: order.stageNotes?.[stage]?.reminderAt || "",
      note: order.stageNotes?.[stage]?.note || ""
    }));
  }).filter((item) => item.reminderAt && isDueReminder(item.reminderAt));
}

function showAlarm(alarm) {
  state.activeAlarm = alarm;
  el.alarmTitle.textContent = `${alarm.order.orderNo || "订单"} · ${alarm.stage}`;
  el.alarmContent.innerHTML = `
    <p><strong>提醒时间：</strong>${escapeHtml(formatReminder(alarm.reminderAt))}</p>
    <p><strong>客户：</strong>${escapeHtml(alarm.order.customer || "未填写")}</p>
    <p><strong>产品：</strong>${escapeHtml(alarm.order.product || "未填写")}</p>
    <p><strong>事项：</strong>${escapeHtml(alarm.note || alarm.order.nextAction || "需要跟进")}</p>
  `;
  el.alarmOverlay.classList.remove("hidden");
  sendBrowserNotification(alarm);
}

function dismissAlarm() {
  if (state.activeAlarm) sessionStorage.setItem(alarmKey(state.activeAlarm), "dismissed");
  state.activeAlarm = null;
  el.alarmOverlay.classList.add("hidden");
  checkReminderAlarms();
}

function snoozeAlarm() {
  const alarm = state.activeAlarm;
  if (!alarm) return;
  const next = new Date();
  next.setMinutes(next.getMinutes() + 10);
  alarm.order.stageNotes[alarm.stage].reminderAt = toDateTimeInput(next.getFullYear(), next.getMonth() + 1, next.getDate(), next.getHours(), next.getMinutes());
  alarm.order.stageNotes[alarm.stage].updatedAt = new Date().toISOString();
  touch(alarm.order, `${alarm.stage}提醒延后 10 分钟`, alarm.stage);
  state.activeAlarm = null;
  saveOrders();
  el.alarmOverlay.classList.add("hidden");
  render();
}

function alarmKey(item) {
  return `alarm:${item.order.id}:${item.stage}:${item.reminderAt}`;
}

function loadCloudSettings() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCloudSettings() {
  const settings = {
    email: el.cloudReminderEmail.value.trim(),
    functionUrl: el.cloudFunctionUrl.value.trim(),
    anonKey: el.cloudAnonKey.value.trim()
  };
  if (settings.email && !isValidEmail(settings.email)) {
    window.alert("接收邮箱格式不正确。");
    return;
  }
  localStorage.setItem(CLOUD_SETTINGS_KEY, JSON.stringify(settings));
  el.cloudReminderStatus.textContent = settings.email && settings.functionUrl && settings.anonKey ? "已配置" : "未配置";
}

async function syncCloudReminders() {
  saveCloudSettings();
  const settings = loadCloudSettings();
  if (!settings.email || !settings.functionUrl || !settings.anonKey) {
    window.alert("请先填写接收邮箱、Supabase 函数地址和 anon key。");
    return;
  }
  const reminders = state.orders.flatMap((order) => {
    ensureOrderShape(order);
    return STAGES.map((stage) => {
      const stageNote = order.stageNotes?.[stage] || {};
      if (!stageNote.reminderAt) return null;
      return {
        client_id: `${order.id}:${stage}:${stageNote.reminderAt}`,
        recipient_email: settings.email,
        order_no: order.orderNo || "",
        customer: order.customer || "",
        product: order.product || "",
        stage,
        reminder_at: new Date(normalizeReminderAt(stageNote.reminderAt)).toISOString(),
        note: stageNote.note || order.nextAction || "需要跟进"
      };
    }).filter(Boolean);
  });
  if (!reminders.length) {
    window.alert("当前没有可同步的提醒。");
    return;
  }

  el.cloudReminderStatus.textContent = "同步中";
  try {
    const response = await fetch(settings.functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.anonKey}`
      },
      body: JSON.stringify({ reminders })
    });
    if (!response.ok) throw new Error(await response.text());
    el.cloudReminderStatus.textContent = "已同步";
  } catch (error) {
    el.cloudReminderStatus.textContent = "同步失败";
    window.alert(`同步失败：${error.message}`);
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  Notification.requestPermission().catch(() => {});
}

function sendBrowserNotification(alarm) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(`跟单提醒：${alarm.order.orderNo || "订单"}`, {
    body: `${alarm.stage} · ${alarm.note || alarm.order.nextAction || "需要跟进"}`,
    tag: alarmKey(alarm)
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.orders, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `外贸跟单记录-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data)) throw new Error("数据格式不正确");
      state.orders = data;
      state.selectedId = state.orders[0]?.id || null;
      saveOrders();
      render();
    } catch (error) {
      window.alert(`导入失败：${error.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

async function fileToText(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (["xlsx", "xls"].includes(extension)) {
    if (!window.XLSX) {
      throw new Error("Excel 解析库未加载，请刷新页面后重试，或先另存为 CSV。");
    }
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: "array" });
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = window.XLSX.utils.sheet_to_csv(sheet);
      return `工作表：${sheetName}\n${csv}`;
    }).join("\n");
  }
  if (extension === "json") {
    return jsonFileToText(await file.text());
  }
  if (extension === "pdf") {
    return pdfToText(await file.arrayBuffer());
  }
  if (extension === "docx") {
    return docxToText(await file.arrayBuffer());
  }
  return file.text();
}

function jsonFileToText(text) {
  const data = JSON.parse(text);
  const rows = Array.isArray(data) ? data : [data];
  return rows.map((row) => flattenObject(row)
    .map(([key, value]) => `${fieldLabel(mapHeaderKey(key) || key)}:${value}`)
    .join("，"))
    .join("\n");
}

function flattenObject(value, prefix = "") {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [[prefix, String(value)]];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenObject(item, prefix ? `${prefix}${index + 1}` : String(index + 1)));
  }
  return Object.entries(value).flatMap(([key, item]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    return flattenObject(item, nextKey);
  });
}

async function pdfToText(buffer) {
  const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
  if (!pdfjs) throw new Error("PDF 解析库未加载，请刷新页面后重试。");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}

async function docxToText(buffer) {
  if (!window.mammoth) throw new Error("DOCX 解析库未加载，请刷新页面后重试。");
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || "";
}

function expandStructuredRows(text) {
  const rows = parseDelimitedRows(text).filter((row) => row.some(Boolean));
  if (rows.length < 2) return [];
  const expanded = [];
  for (let i = 0; i < rows.length - 1; i += 1) {
    const header = rows[i].map((cell) => cell.trim());
    const keys = header.map(mapHeaderKey);
    const usefulCount = keys.filter(Boolean).length;
    if (usefulCount < 2) continue;

    let rowIndex = i + 1;
    while (rowIndex < rows.length) {
      const row = rows[rowIndex];
      const rowHasAnotherHeader = row.map((cell) => mapHeaderKey(cell)).filter(Boolean).length >= 2;
      if (rowHasAnotherHeader) break;
      const parts = row.map((value, columnIndex) => {
        const key = keys[columnIndex];
        return key && value ? `${fieldLabel(key)}:${value.trim()}` : "";
      }).filter(Boolean);
      if (parts.length) expanded.push(parts.join("，"));
      rowIndex += 1;
    }
  }
  return expanded;
}

function parseDelimitedRows(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ",";
      return splitDelimitedLine(line, delimiter).map((cell) => cell.trim());
    });
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
}

function mapHeaderKey(header = "") {
  const value = header.toLowerCase().replace(/\s/g, "");
  if (/订单号|订单|合同号|po|pi|so|invoice|orderno/.test(value)) return "orderNo";
  if (/客户|客人|买家|货主|customer|buyer/.test(value)) return "customer";
  if (/国家|地区|目的国|country|market/.test(value)) return "country";
  if (/产品|货物|品名|product|goods|item/.test(value)) return "product";
  if (/品类|类别|分类|category/.test(value)) return "category";
  if (/数量|件数|qty|quantity/.test(value)) return "quantity";
  if (/重量|毛重|净重|体积|weight|gw|nw|cbm/.test(value)) return "weight";
  if (/金额|货值|价格|amount|value|price/.test(value)) return "amount";
  if (/电话|手机|phone|tel|mobile/.test(value)) return "phone";
  if (/邮箱|邮件|email|mail/.test(value)) return "email";
  if (/联系人|姓名|contact|name/.test(value)) return "name";
  if (/备注|note/.test(value)) return "note";
  if (/类型|角色|role|type/.test(value)) return "role";
  return "";
}

function findOrCreateOrder(orderNo) {
  let order = state.orders.find((item) => normalize(item.orderNo) === normalize(orderNo));
  if (order) return order;
  const createdAt = new Date().toISOString();
  order = {
    id: createId(),
    orderNo,
    customer: "",
    country: "",
    product: "",
    quantity: "",
    weight: "",
    category: "",
    amount: "",
    dueDate: "",
    status: "进行中",
    stage: "询盘",
    nextAction: "",
    notes: "",
    issues: [],
    contacts: [],
    stageNotes: createEmptyStageNotes(),
    activities: [{ id: createId(), text: "从文件/日志自动创建订单", stage: "询盘", createdAt }],
    createdAt,
    updatedAt: createdAt
  };
  state.orders.unshift(order);
  if (!state.selectedId) state.selectedId = order.id;
  return order;
}

function fieldLabel(key) {
  const labels = {
    orderNo: "订单号",
    customer: "客户",
    country: "国家/地区",
    product: "产品",
    quantity: "数量",
    weight: "重量",
    category: "品类",
    amount: "金额",
    phone: "电话",
    email: "邮箱",
    role: "类型",
    name: "姓名",
    note: "备注"
  };
  return labels[key] || key;
}

function formatPatch(patch) {
  return Object.entries(patch).map(([key, value]) => `${fieldLabel(key)}:${value}`).join("；");
}

function formatDateTime(value) {
  if (!value) return "无";
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function formatReminder(value) {
  if (!value) return "";
  const date = new Date(normalizeReminderAt(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function toDateInput(year, month, day) {
  const date = new Date(year, month - 1, day);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function toDateTimeInput(year, month, day, hour = 9, minute = 0) {
  return `${toDateInput(year, month, day)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function offsetDateInput(days) {
  const date = startOfToday();
  date.setDate(date.getDate() + days);
  return toDateInput(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function offsetDateTimeInput(days, hour = 9, minute = 0) {
  const date = startOfToday();
  date.setDate(date.getDate() + days);
  return toDateTimeInput(date.getFullYear(), date.getMonth() + 1, date.getDate(), hour, minute);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isDueDate(value) {
  if (!value) return false;
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date <= startOfToday();
}

function normalizeReminderAt(value) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return timeInputToReminderAt(value, "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T09:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return toDateTimeInput(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes());
}

function toTimeValue(value) {
  const reminderAt = normalizeReminderAt(value);
  if (!reminderAt) return "";
  return reminderAt.slice(11, 16);
}

function toMonthDayValue(value) {
  const reminderAt = normalizeReminderAt(value);
  if (!reminderAt) return "";
  const date = new Date(reminderAt);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthDayTimeToReminderAt(monthDayValue, timeValue, existingValue = "") {
  if (!monthDayValue && !timeValue) return "";
  const time = timeValue || toTimeValue(existingValue) || "09:00";
  const parsed = parseMonthDay(monthDayValue) || parseMonthDay(toMonthDayValue(existingValue));
  if (!parsed) return timeInputToReminderAt(time, existingValue);
  const [hour, minute] = time.split(":").map(Number);
  let year = new Date().getFullYear();
  const candidate = new Date(year, parsed.month - 1, parsed.day, hour, minute, 0, 0);
  if (candidate.getTime() <= Date.now()) year += 1;
  return toDateTimeInput(year, parsed.month, parsed.day, hour, minute);
}

function parseMonthDay(value = "") {
  const normalized = value.trim();
  if (!normalized) return null;
  const match = normalized.match(/^(\d{1,2})(?:月|-|\/|\.)(\d{1,2})日?$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function timeInputToReminderAt(timeValue, existingValue = "") {
  if (!timeValue) return "";
  const [hour, minute] = timeValue.split(":").map(Number);
  const existing = normalizeReminderAt(existingValue);
  const base = existing ? new Date(existing) : new Date();
  const candidate = new Date(base);
  candidate.setHours(hour, minute, 0, 0);
  if (!existing && candidate.getTime() <= Date.now()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return toDateTimeInput(candidate.getFullYear(), candidate.getMonth() + 1, candidate.getDate(), candidate.getHours(), candidate.getMinutes());
}

function isDueReminder(value) {
  const reminderAt = normalizeReminderAt(value);
  if (!reminderAt) return false;
  return new Date(reminderAt).getTime() <= Date.now();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidDialCode(value) {
  return /^\+\d{1,4}$/.test(value);
}

function formatPhoneWithDialCode(dialCode, phone) {
  const compact = phone.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) return compact;
  return `${dialCode}${compact.replace(/^0+/, "")}`;
}

function dialCodeFromPhone(phone = "") {
  return phone.match(/^\+\d{1,4}/)?.[0] || "";
}

function normalizeExtractedPhone(phone = "") {
  const compact = phone.replace(/[^\d+]/g, "");
  if (!compact) return "";
  if (compact.startsWith("+")) return compact;
  return `+86${compact.replace(/^0+/, "")}`;
}

function inferStageFromText(text = "") {
  return STAGES.find((stage) => text.includes(stage)) || detectStage(text);
}

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function bindEvents() {
  el.newOrderBtn.addEventListener("click", addOrder);
  el.emptyNewOrderBtn.addEventListener("click", addOrder);
  el.deleteOrderBtn.addEventListener("click", deleteOrder);
  el.orderForm.addEventListener("submit", saveOrderFromForm);
  el.issueForm.addEventListener("submit", addIssue);
  el.contactForm.addEventListener("submit", addContact);
  el.contactDialCode.addEventListener("change", toggleCustomDialCode);
  el.saveNodeNoteBtn.addEventListener("click", saveNodeNote);
  el.clearNodeReminderBtn.addEventListener("click", clearNodeReminder);
  el.uploadFileBtn.addEventListener("click", () => el.infoFileInput.click());
  el.infoFileInput.addEventListener("change", readInfoFile);
  el.previewLogBtn.addEventListener("click", previewWorkLog);
  el.applyLogBtn.addEventListener("click", applyWorkLog);
  el.searchInput.addEventListener("input", renderOrderList);
  el.statusFilter.addEventListener("change", renderOrderList);
  el.exportBtn.addEventListener("click", exportData);
  el.importInput.addEventListener("change", importData);
  el.dismissAlarmBtn.addEventListener("click", dismissAlarm);
  el.snoozeAlarmBtn.addEventListener("click", snoozeAlarm);
  el.saveCloudSettingsBtn.addEventListener("click", saveCloudSettings);
  el.syncCloudRemindersBtn.addEventListener("click", syncCloudReminders);
  document.addEventListener("click", requestNotificationPermission, { once: true });
}

populateSelects();
loadOrders();
bindEvents();
render();
startReminderWatcher();
