const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");
const KEY_FILE = path.join(ROOT, ".crypto-key");
const FILES = ["app.js", "styles.css", "shipping.js", "docs.js", "customs.js"];

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, 32);
}

function getPassword() {
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE, "utf-8").trim();
  }
  return null;
}

function savePassword(password) {
  fs.writeFileSync(KEY_FILE, password, { mode: 0o600 });
}

function encryptFile(filePath, password) {
  const content = fs.readFileSync(filePath);
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = {
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    data: encrypted.toString("base64"),
  };
  fs.writeFileSync(filePath + ".enc", JSON.stringify(payload, null, 2));
}

function decryptFile(encPath, password) {
  const payload = JSON.parse(fs.readFileSync(encPath, "utf-8"));
  const salt = Buffer.from(payload.salt, "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final(),
  ]);
  const outPath = encPath.replace(/\.enc$/, "");
  fs.writeFileSync(outPath, decrypted);
}

function secureDelete(filePath) {
  const stats = fs.statSync(filePath);
  const fd = fs.openSync(filePath, "w");
  fs.writeSync(fd, crypto.randomBytes(stats.size));
  fs.closeSync(fd);
  fs.unlinkSync(filePath);
}

async function lock() {
  let pwd = getPassword();
  if (pwd) {
    console.log("[本机信任] 已记住口令，无需输入");
  } else {
    pwd = await ask("设置口令: ");
    if (!pwd) { console.log("口令不能为空"); return; }
    const confirm = await ask("确认口令: ");
    if (pwd !== confirm) { console.log("两次口令不一致"); return; }
    savePassword(pwd);
    console.log("[本机已信任] 以后无需再次输入口令");
  }

  for (const f of FILES) {
    const src = path.join(ROOT, f);
    if (!fs.existsSync(src)) { console.log(`跳过 ${f}（文件不存在）`); continue; }
    encryptFile(src, pwd);
    secureDelete(src);
    console.log(`已加密: ${f} → ${f}.enc`);
  }
  console.log("\n源码已锁定。编辑前请运行 npm run unlock。");
}

async function unlock() {
  let pwd = getPassword();
  if (pwd) {
    console.log("[本机信任] 已记住口令，自动解密...");
  } else {
    pwd = await ask("输入口令: ");
    if (!pwd) { console.log("口令不能为空"); return; }
  }

  for (const f of FILES) {
    const enc = path.join(ROOT, f + ".enc");
    if (!fs.existsSync(enc)) { console.log(`跳过 ${f}.enc（文件不存在）`); continue; }
    try {
      decryptFile(enc, pwd);
      console.log(`已解密: ${f}.enc → ${f}`);
    } catch {
      console.log(`解密 ${f}.enc 失败：口令错误`);
      return;
    }
  }

  if (!getPassword()) {
    savePassword(pwd);
    console.log("[本机已信任] 以后无需再次输入口令");
  }
  console.log("\n源码已解锁，可以编辑。完成后请运行 npm run lock。");
}

const cmd = process.argv[2];
if (cmd === "lock") lock();
else if (cmd === "unlock") unlock();
else { console.log("用法: node scripts/crypto.js <lock|unlock>"); process.exit(1); }
