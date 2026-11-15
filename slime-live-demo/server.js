/**
 * Slime Live local event bridge.
 * TikTok LIVE Connector is an unofficial community integration, not an official TikTok API.
 * Never put TikTok passwords, session cookies, or access tokens in this project.
 */
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 3001);

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
  res.json({ ok: true, status: liveStatus, provider: "TikFinity", endpoint: "ws://127.0.0.1:21213/", clients: clients.size });
});

app.post("/test-gift", (req, res) => {
  const allowed = new Set(["water", "borax", "foam", "color", "tea", "finger", "perfume", "handheart", "work", "unknown"]);
  const kind = allowed.has(req.body?.kind) ? req.body.kind : "water";
  const names = {
    water: "Test Gül", borax: "Test Boraks", foam: "Test Köpük",
    color: "Test Renk", tea: "Test Çay", finger: "Test Finger Heart",
    perfume: "Test Parfüm", handheart: "Test El Kalbi", work: "Test İş Gücü",
    unknown: "Test Hediye"
  };
  const event = {
    type: "gift", kind, action: kind, label: names[kind],
    giftName: names[kind], username: String(req.body?.username || "Test_izleyici").slice(0, 32),
    nickname: String(req.body?.username || "Test izleyici").slice(0, 32),
    repeatCount: 1, diamondCount: 0, timestamp: Date.now(), test: true
  };
  broadcast(event);
  res.json({ ok: true, event });
});

function normalizeGift(data = {}) {
  const giftName = String(data.giftName || data.giftDetails?.giftName || data.gift?.name || "").toLocaleLowerCase("tr-TR");
  let kind = "unknown";
  if (giftName.includes("borax") || giftName.includes("boraks")) kind = "borax";
  else if (giftName.includes("foam") || giftName.includes("köpük")) kind = "foam";
  else if (giftName.includes("color") || giftName.includes("renk")) kind = "color";
  else if (giftName.includes("water") || giftName.includes("su") || giftName.includes("rose") || giftName.includes("gül")) kind = "water";
  else if (giftName.includes("tea") || giftName.includes("çay")) kind = "tea";
  else if (giftName.includes("finger") || giftName.includes("parmak")) kind = "finger";
  else if (giftName.includes("perfume") || giftName.includes("parfüm")) kind = "perfume";
  else if (giftName.includes("hand heart") || giftName.includes("elle kalp") || giftName.includes("el kalp")) kind = "handheart";
  else if (giftName.includes("work") || giftName.includes("iş gücü") || giftName.includes("işgücü")) kind = "work";

  const user = data.user || data.sender || {};
  return {
    type: "gift", kind, action: kind === "unknown" ? "celebrate" : kind,
    label: kind === "unknown" ? "Hediye alındı" : giftName,
    giftName: data.giftName || data.giftDetails?.giftName || "TikTok hediyesi",
    username: user.uniqueId || user.unique_id || user.nickname || data.uniqueId || "TikTok izleyicisi",
    nickname: user.nickname || user.uniqueId || "İzleyici",
    repeatCount: Number(data.repeatCount || data.repeat_count || 1),
    diamondCount: Number(data.diamondCount || data.diamond_count || 0),
    timestamp: Date.now()
  };
}

// TikFinity Desktop Event API. TikFinity must be running on this same PC.
let tikfinitySocket = null;
let reconnectTimer = null;
let stopping = false;

function connectTikFinity() {
  if (stopping) return;
  liveStatus = "connecting_tikfinity";
  broadcast({ type: "status", status: liveStatus });
  tikfinitySocket = new WebSocket("ws://127.0.0.1:21213/");

  tikfinitySocket.on("open", () => {
    liveStatus = "connected";
    console.log("TikFinity Event API bağlandı: ws://127.0.0.1:21213/");
    broadcast({ type: "status", status: liveStatus, provider: "TikFinity" });
  });

  tikfinitySocket.on("message", (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.event === "gift") {
      const giftEvent = normalizeGift(message.data || {});
      broadcast(giftEvent);
      console.log("TikFinity hediye:", giftEvent.giftName, "->", giftEvent.kind);
    }
  });

  tikfinitySocket.on("close", () => {
    liveStatus = "tikfinity_disconnected";
    broadcast({ type: "status", status: liveStatus, provider: "TikFinity" });
    if (!stopping) reconnectTimer = setTimeout(connectTikFinity, 4000);
  });

  tikfinitySocket.on("error", (error) => {
    liveStatus = "tikfinity_connection_error";
    console.error("TikFinity bağlantı hatası:", error.message);
    broadcast({ type: "status", status: liveStatus, provider: "TikFinity" });
  });
}

process.on("SIGINT", () => {
  stopping = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (tikfinitySocket) tikfinitySocket.close();
  server.close(() => process.exit(0));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Slime Live hazır: http://localhost:${PORT}`);
  console.log("TikFinity Desktop uygulamasını açın; Event API aynı bilgisayarda ws://127.0.0.1:21213/ adresinde dinlenir.");
  connectTikFinity();
});
