# 外贸操作管理系统 — 项目概览

## 项目位置
C:\Users\35382\foreign-trade-tracker

## 架构
单页应用（SPA），纯前端 HTML + CSS + JS，无框架，部署在 GitHub Pages。

## 文件结构

```
├── nav.html          ← 导航首页（4 个卡片入口）
├── index.html        ← 外贸跟单（主模块）
│   引用: styles.min.css + app.min.js
├── shipping.html     ← 海运操作模块
│   引用: styles.min.css + shipping.min.js
├── docs.html         ← 单证操作模块
│   引用: styles.min.css + docs.min.js
├── customs.html      ← 报关操作模块
│   引用: styles.min.css + customs.min.js
│
├── app.js            ← [编辑此文件] 外贸跟单主逻辑源码 (65KB)
├── styles.css        ← [编辑此文件] 样式源码 (16KB)
│
├── app.min.js        ← 混淆后（不直接编辑）
├── styles.min.css    ← 压缩后（不直接编辑）
├── *.min.js          ← 其他模块混淆版（原始源码已丢失）
│
├── scripts/crypto.js ← 加密/解密脚本
├── package.json      ← npm 脚本
└── .gitignore        ← 保护源码
```

## 当前任务
修改和优化外贸跟单模块。

## 数据流
- localStorage 存储订单数据 (STORAGE_KEY = "foreignTradeTracker.orders.v1")
- 支持 Excel 导入导出（xlsx 库）
- 支持 PDF/Word 文件解析（pdfjs-dist + mammoth.js）
- 20 个订单阶段：询盘→报价→寄样→...→退税→完成
- 5 种状态：进行中、已延迟、有风险、暂停、已完成

## 安全机制
- 源码用 AES-256-GCM 加密存储（app.js.enc / styles.css.enc）
- GitHub Pages 只部署混淆后的 .min.js
- 本机已信任，Codex 可直接编辑 app.js 和 styles.css

## 编辑完后的步骤
```
npm run lock    # 重新加密源码
# 然后手动混淆: javascript-obfuscator app.js -o app.min.js
# 提交推送
```
