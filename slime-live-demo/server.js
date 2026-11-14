/**
 * Slime Live local event bridge.
 * TikTok LIVE Connector is an unofficial community integration, not an official TikTok API.
 * Never put TikTok passwords, session cookies, or access tokens in this project.
 */
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const WebSocket = require("ws");
const { WebcastPushConnection } = require("tiktok-live-connector");

const PORT = Number(process.env.PORT || 3001);
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || "").replace(/^@/, "").trim();

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(__dirname)));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/live" });

const clients = new Set();
let liveConnection = null;
let liveStatus = "idle";

const GIFT_RULES = {
  rose: { kind: "water", action: "water", label: "Su dök" },
  water: { kind: "water", action: "water", label: "Su dök" },
  borax: { kind: "borax", action: "borax", label: "Boraks ekle" },
  foam: { kind: "foam", action: "foam", label: "Köpüğü büyüt" },
  color: { kind: "color", action: "color", label: "Rastgele renk ekle" },
  tea: { kind: "tea", action: "tea", label: "Çaydanlıktan çay dök" },
  finger: { kind: "finger", action: "finger", label: "Parmak kalp tepkisi" },
  perfume: { kind: "perfume", action: "perfume", label: "Köpük artırıcı ekle" },
  handheart: { kind: "handheart", action: "handheart", label: "Rastgele renk şarkısı" },
  work: { kind: "work", action: "work", label: "Tepsiyi yana yatır" }
};

function broadcast(payload) {
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

function normalizeGift(data) {
  const giftName = String(data.giftName || data.giftDetails?.giftName || "").toLocaleLowerCase("tr-TR");
  let rule = null;
  if (giftName.includes("borax") || giftName.includes("boraks")) rule = GIFT_RULES.borax;
  else if (giftName.includes("foam") || giftName.includes("köpük")) rule = GIFT_RULES.foam;
  else if (giftName.includes("color") || giftName.includes("renk")) rule = GIFT_RULES.color;
  else if (giftName.includes("water") || giftName.includes("su") || giftName.includes("rose") || giftName.includes("gül")) rule = GIFT_RULES.water;
  else if (giftName.includes("tea") || giftName.includes("çay")) rule = GIFT_RULES.tea;
  else if (giftName.includes("finger") || giftName.includes("parmak")) rule = GIFT_RULES.finger;
  else if (giftName.includes("perfume") || giftName.includes("parfüm")) rule = GIFT_RULES.perfume;
  else if (giftName.includes("hand heart") || giftName.includes("elle kalp") || giftName.includes("el kalp")) rule = GIFT_RULES.handheart;
  else if (giftName.includes("work") || giftName.includes("iş gücü") || giftName.includes("işgücü")) rule = GIFT_RULES.work;

  const user = data.user || {};
  return {
    type: "gift",
    kind: rule ? rule.kind : "unknown",
    action: rule ? rule.action : "celebrate",
    label: rule ? rule.label : "Hediye alındı",
    giftName: data.giftName || "TikTok hediyesi",
    username: user.uniqueId || user.nickname || "TikTok izleyicisi",
    nickname: user.nickname || user.uniqueId || "İzleyici",
    repeatCount: Number(data.repeatCount || 1),
    diamondCount: Number(data.diamondCount || 0),
    timestamp: Date.now()
  };
}

wss.on("connection", (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify({ type: "status", status: liveStatus, connected: Boolean(liveConnection) }));
  socket.on("close", () => clients.delete(socket));
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: liveStatus, tiktokConfigured: Boolean(TIKTOK_USERNAME), clients: clients.size });
});

app.post("/test-gift", (req, res) => {
  const allowed = new Set(["rose", "heart", "flower", "diamond", "lion"]);
  const kind = allowed.has(req.body?.kind) ? req.body.kind : "rose";
  const names = {
    rose: "Gül", heart: "Kalp", flower: "Çiçek", diamond: "Elmas", lion: "Aslan"
  };
  const rule = GIFT_RULES[kind];
  const event = {
    type: "gift", kind, action: rule.action, label: rule.label,
    giftName: names[kind], username: String(req.body?.username || "Test_izleyici").slice(0, 32),
    nickname: String(req.body?.username || "Test izleyici").slice(0, 32),
    repeatCount: 1, diamondCount: 0, timestamp: Date.now(), test: true
  };
  broadcast(event);
  res.json({ ok: true, event });
});

async function connectTikTok() {
  if (!TIKTOK_USERNAME) {
    liveStatus = "waiting_for_username";
    console.log("TIKTOK_USERNAME tanımlı değil. Test hediyeleri /test-gift üzerinden kullanılabilir.");
    return;
  }
  try {
    liveStatus = "connecting";
    broadcast({ type: "status", status: liveStatus });
    liveConnection = new WebcastPushConnection(TIKTOK_USERNAME, {
      processInitialData: false,
      enableExtendedGiftInfo: true
    });
    await liveConnection.connect();
    liveStatus = "connected";
    broadcast({ type: "status", status: liveStatus, username: TIKTOK_USERNAME });
    liveConnection.on("gift", (data) => {
      // Streak gifts are emitted repeatedly; only act at the final event.
      if (Number(data.giftType) === 1 && data.repeatEnd === false) return;
      broadcast(normalizeGift(data));
    });
    liveConnection.on("disconnected", () => {
      liveStatus = "disconnected";
      broadcast({ type: "status", status: liveStatus });
    });
  } catch (error) {
    liveStatus = "error";
    console.error("TikTok LIVE bağlantı hatası:", error.message);
    broadcast({ type: "status", status: liveStatus, message: error.message });
  }
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Slime Live hazır: http://localhost:${PORT}`);
  connectTikTok();
});
