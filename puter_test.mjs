// Puter TTS test: tries to make a short Tamil voice sample with Puter.js from Node (no browser).
// Needs the PUTER_AUTH_TOKEN secret. Writes puter-samples/*.mp3 and prints what happened.
import { init } from "@heyputer/puter.js/src/init.cjs";
import fs from "node:fs";

const TEXT = "நண்பர்களே, இன்னைக்கு ஒரு ஈசியான ஷார்ட்கட் சொல்றேன் கேளுங்க. இருநூறோட பதினைஞ்சு சதவீதம் எவ்வளவு? முதல்ல பத்து சதவீதம் பாருங்க, அது இருபது.";
const VOICES = (process.env.VOICES || "Puck,Charon").split(",").map((s) => s.trim()).filter(Boolean);
fs.mkdirSync("puter-samples", { recursive: true });

if (!process.env.PUTER_AUTH_TOKEN) { console.error("PUTER_AUTH_TOKEN secret is missing"); process.exit(1); }
const puter = init(process.env.PUTER_AUTH_TOKEN);

async function toBuffer(r) {
  console.log("  result type:", typeof r, r && r.constructor && r.constructor.name, r && Object.keys(r).slice(0, 8));
  if (Buffer.isBuffer(r)) return r;
  if (r instanceof ArrayBuffer) return Buffer.from(r);
  if (r && typeof r.arrayBuffer === "function") return Buffer.from(await r.arrayBuffer());
  const src = r && (r.src || r.url || r.currentSrc);
  if (typeof src === "string") {
    if (src.startsWith("data:")) return Buffer.from(src.split(",")[1], "base64");
    const resp = await fetch(src);
    if (!resp.ok) throw new Error("download failed " + resp.status);
    return Buffer.from(await resp.arrayBuffer());
  }
  throw new Error("unknown audio result shape (see the line above)");
}

let ok = 0;
for (const v of VOICES) {
  try {
    console.log("trying Gemini voice:", v);
    const r = await puter.ai.txt2speech(TEXT, { provider: "gemini", voice: v, language: "ta-IN" });
    const buf = await toBuffer(r);
    fs.writeFileSync(`puter-samples/${v}.mp3`, buf);
    console.log("ok:", v, buf.length, "bytes");
    ok++;
  } catch (e) {
    console.log("FAILED:", v, e && (e.message || JSON.stringify(e)));
  }
}
if (!ok) { console.error("no sample could be made - see the lines above"); process.exit(1); }
