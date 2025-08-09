// scripts/split.js
import fs from "node:fs";
import path from "node:path";

const BASE_OUT = "public/programs-slim/v2";

function toDateStrJST(d = new Date()) {
  const tz = new Intl.DateTimeFormat("ja-JP-u-ca-gregory", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
  return tz.replaceAll("/", "");
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { "accept": "application/json" } });
  if (!res.ok) throw new Error(`fetch failed ${res.status} ${url}`);
  return res.json();
}

async function processDate(dateStr) {
  const src = `https://boatraceopenapi.github.io/programs/v2/${dateStr}.json`;
  console.log("fetch:", src);
  const data = await fetchJSON(src);
  for (const v of data) {
    const stadium = v.stadium;          // "03"
    const races = v.races || [];
    const base = path.join(BASE_OUT, dateStr, stadium);
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(path.join(base, "index.json"), JSON.stringify(v, null, 2), "utf8");
    for (const r of races) {
      fs.writeFileSync(path.join(base, `${r.race}.json`), JSON.stringify(r, null, 2), "utf8");
    }
  }
}

async function main() {
  const override = process.env.TARGET_DATES?.split(",").map(s=>s.trim()).filter(Boolean);
  const dates = override && override.length
    ? override
    : [toDateStrJST(), toDateStrJST(new Date(Date.now() + 24*60*60*1000))]; // 今日・明日
  for (const d of dates) await processDate(d);
  console.log("done");
}
main().catch(e => { console.error(e); process.exit(1); });
