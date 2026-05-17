const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) { console.log("用法: node scripts/deobfuscate.js <file.min.js>"); process.exit(1); }

const src = path.resolve(file);
const code = fs.readFileSync(src, "utf-8");

// Extract variable names
const varMatch = code.match(/const\s+(\w+)=(\w+);/);
if (!varMatch) { console.log("No decoder var found"); process.exit(1); }
const decoderVar = varMatch[1], decoderFunc = varMatch[2];

const iifeEnd = code.match(/\}\((\w+),\s*(0x[a-fA-F0-9]+)\)\)/);
if (!iifeEnd) { console.log("No IIFE found"); process.exit(1); }
const arrayFuncName = iifeEnd[1];

// Extract string array by bracket matching
const funcStart = code.indexOf("function " + arrayFuncName + "()");
let startBracket = -1, endBracket = -1, depth = 0;
for (let i = funcStart; i < code.length; i++) {
  if (code[i] === "{") depth++;
  else if (code[i] === "}") { depth--; if (depth === 0) break; }
  else if (code[i] === "[" && depth === 1 && startBracket === -1) startBracket = i;
}
depth = 0;
for (let i = startBracket; i < code.length; i++) {
  if (code[i] === "[") depth++;
  else if (code[i] === "]") { depth--; if (depth === 0) { endBracket = i; break; } }
}
const encodedArray = eval("(" + code.substring(startBracket, endBracket + 1) + ")");

// Decode custom base64
const alphaMatch = code.match(/var\s+\w+=function\(\w+\)\{const\s+\w+='([^']+)'/);
const alpha = alphaMatch ? alphaMatch[1] : "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
const stdAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeStr(enc) {
  let mapped = "";
  for (const c of enc) {
    if (c === "=") { mapped += "="; continue; }
    const idx = alpha.indexOf(c);
    mapped += idx !== -1 ? stdAlpha[idx] : c;
  }
  return Buffer.from(mapped, "base64").toString("utf-8");
}
const decodedArray = encodedArray.map(decodeStr);

// Find offset from decoder function: _0x5e8bad=_0x5e8bad-0xNNN
const offsetMatch = code.match(new RegExp(decoderFunc + "\\([^)]*\\)\\{[^}]*?-(0x[a-fA-F0-9]+)"));
if (!offsetMatch) { console.log("No offset found"); process.exit(1); }
const offset = parseInt(offsetMatch[1], 16);

// Find business logic: between IIFE end and decoder function
const afterIife = code.indexOf("));const") + 3 || code.indexOf("));let") + 3 || code.indexOf("));var") + 3;
const beforeDecoder = code.indexOf("function " + decoderFunc + "(");
if (beforeDecoder === -1) { console.log("Decoder function not found"); process.exit(1); }

let result = code.substring(afterIife, beforeDecoder).trim();

// Find and replace all decoderVar(0xNNN) calls
const prefix = decoderVar + "(0x";
const callSites = [];
let pos = 0;
while ((pos = result.indexOf(prefix, pos)) !== -1) {
  const hexStart = pos + prefix.length;
  let hexEnd = hexStart;
  while (hexEnd < result.length && /[a-fA-F0-9]/.test(result[hexEnd])) hexEnd++;
  if (result[hexEnd] === ")") {
    callSites.push({ start: pos, end: hexEnd + 1, hex: parseInt(result.substring(hexStart, hexEnd), 16) });
  }
  pos = hexEnd;
}

// Replace from end to start
let decoded = 0, missed = 0;
const sorted = [...callSites].sort((a, b) => b.start - a.start);
for (const site of sorted) {
  const idx = site.hex - offset;
  if (idx < 0 || idx >= decodedArray.length) { missed++; continue; }
  const str = decodedArray[idx];
  const esc = str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "");
  result = result.substring(0, site.start) + "'" + esc + "'" + result.substring(site.end);
  decoded++;
}

// Prepend comment header
const name = path.basename(src, ".min.js");
const header = `// ${name}.js — 从 ${path.basename(src)} 反混淆还原\n// 编码字符串 ${encodedArray.length} 个，已映射 ${decoded} 个\n\n`;
result = header + result;

const outPath = src.replace(".min.js", ".js");
fs.writeFileSync(outPath, result);
console.log(path.basename(src) + " -> " + path.basename(outPath));
console.log("Mapped: " + decoded + " / Missed: " + missed + " / Sites: " + callSites.length);
console.log("Output: " + result.length + " chars");
