// content.js - harvest page entries from the current view and export a sheet

const ROWS_ROOT =
  "div.x9f619.x1n2onr6.x1ja2u2z.xeuugli.xs83m0k.xjl7jj.x1xmf6yo.x1xegmmw.x1e56ztr.x13fj5qh.x19h7ccj.xu9j1y6.x7ep2pv";

const ENTRY_LINKS =
  "div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.xeuugli.xamitd3.x1icxu4v.x25sj25.x10b6aqq.x1yrsyyn.x1j9u4d2 > a.x1i10hfl.xjbqb8w.x1ejq31n.x18oe1m7.x1sy0etr.xstzfhl.x972fbf.x10w94by.x1qhh985.x14e42zd.x9f619.x1ypdohk.xt0psk2.x3ct3a4.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1heor9g.xkrqix3.x1sur9pj.x1s688f";

const VIEWER_NAME =
  'a[href="https://www.facebook.com/me/"] > div > div > span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xudqn12.x676frb.x1lkfr7t.x1lbecb7.x1s688f.xzsf02u.x1yc453h';

function collectRows() {
  const root = document.querySelector(ROWS_ROOT);
  const links = root ? root.querySelectorAll(ENTRY_LINKS) : [];
  const rows = [["昵称", "账号ID", "主页链接"]];
  links.forEach((anchor, index) => {
    const href = anchor.getAttribute("href");
    const label = anchor.querySelector("span");
    rows[index + 1] = [
      label ? label.innerText : "",
      href ? (href.split("=")[1] || "") : "",
      href || "",
    ];
  });
  return rows;
}

function resolveExportName() {
  const viewer = document.querySelector(VIEWER_NAME);
  return viewer ? viewer.innerHTML : Date.now().toString();
}

function writeSheet(rows, fileName) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(book, sheet, "工作表1");
  XLSX.writeFile(book, fileName + ".xlsx");
}

chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (!message || message.cmd !== "collect") return;
  try {
    const rows = collectRows();
    const count = Math.max(rows.length - 1, 0);
    if (count > 0) {
      writeSheet(rows, resolveExportName());
    }
    alert("找到 " + count + " 个主页");
    reply({ ok: true, count });
  } catch (err) {
    reply({ ok: false, error: String(err) });
  }
});
