// build.js - package the extension into a timestamped zip
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PLUGIN_NAME = "fb-page-collector";
const OUTPUT_DIR = __dirname;
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
  `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${PLUGIN_NAME}-${timestamp}.zip`);

const FILES = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "license.js",
  "content.js",
  "lib/xlsx.full.min.js",
];

console.log("检查文件...");
const missing = FILES.filter((f) => !fs.existsSync(path.join(__dirname, f)));
if (missing.length > 0) {
  console.error("错误：以下文件不存在：");
  missing.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

const oldZips = fs
  .readdirSync(OUTPUT_DIR)
  .filter((f) => f.startsWith(`${PLUGIN_NAME}-`) && f.endsWith(".zip"));
oldZips.forEach((f) => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
if (oldZips.length > 0) {
  console.log(`已删除 ${oldZips.length} 个旧包`);
}

// staging 目录保持相对结构（Compress-Archive 直接传文件会压平子目录）
const staging = path.join(OUTPUT_DIR, ".staging");
fs.rmSync(staging, { recursive: true, force: true });
FILES.forEach((f) => {
  const dest = path.join(staging, f);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(__dirname, f), dest);
});

console.log("打包中...");
try {
  // bsdtar 生成的 zip 条目用规范的 "/" 分隔；Compress-Archive 会写 "\" 导致 Chrome 解压失败
  const roots = [...new Set(FILES.map((f) => f.split("/")[0]))];
  // cmd.exe 不剥离单引号，文件名无空格故直接拼接
  const entries = roots.join(" ");
  execSync(
    `tar -a -c -f "${OUTPUT_FILE}" -C "${staging}" ${entries}`,
    { stdio: "inherit" }
  );
  console.log(`\n打包完成: ${OUTPUT_FILE}`);
} catch (error) {
  console.error("打包失败:", error.message);
  process.exit(1);
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
