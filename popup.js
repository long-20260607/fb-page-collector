// popup.js - popup interaction: gate activation, dispatch collect command

const grabBtn = document.getElementById("grabBtn");
const logEl = document.getElementById("log");

function log(text) {
  logEl.textContent = text;
}

function sendToActiveTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, missing: true });
        return;
      }
      resolve(response || { ok: false, error: "empty response" });
    });
  });
}

function injectCollector(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/xlsx.full.min.js", "content.js"],
  });
}

async function runCollect() {
  log("定位活动标签页…");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    log("未找到活动标签页");
    return;
  }

  let result = await sendToActiveTab(tab.id, { cmd: "collect" });
  if (result.missing) {
    log("注入抓取模块…");
    try {
      await injectCollector(tab.id);
    } catch (err) {
      log("注入失败: " + err.message);
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
    result = await sendToActiveTab(tab.id, { cmd: "collect" });
  }

  if (result.ok) {
    log(
      result.count > 0
        ? "完成，共导出 " + result.count + " 条记录"
        : "未找到主页，未生成文件"
    );
  } else {
    log("失败: " + (result.error || "未知错误"));
  }
}

grabBtn.addEventListener("click", async () => {
  grabBtn.disabled = true;
  try {
    await LicenseGate.requireActivation();
    await runCollect();
  } catch (err) {
    log(err.message === "LICENSE_REQUIRED" ? "插件未激活" : "出错: " + err.message);
  } finally {
    grabBtn.disabled = false;
  }
});
