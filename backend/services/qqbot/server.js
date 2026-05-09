import express from "express";
import { startQrConnect } from "@tencent-connect/qqbot-connector";
import crypto from "crypto";

const app = express();
app.use(express.json());

const PORT = process.env.QQBOT_SERVICE_PORT || 3001;
const HOST = process.env.QQBOT_SERVICE_HOST || "127.0.0.1";

// In-memory session store
const sessions = new Map();

// 1. Start a registration session
app.post("/register", (req, res) => {
  const sessionId = crypto.randomUUID();
  const session = {
    qrUrl: null,
    credentials: null,
    error: null,
    stop: null,
  };
  sessions.set(sessionId, session);

  const stop = startQrConnect(
    {
      onQrDisplayed(url) {
        session.qrUrl = url;
        console.log(`[QQBot] Session ${sessionId} QR displayed`);
      },
      onSuccess(creds) {
        session.credentials = creds;
        console.log(`[QQBot] Session ${sessionId} success, appId=${creds[0]?.appId}`);
      },
      onFailure(err) {
        session.error = err.message;
        console.error(`[QQBot] Session ${sessionId} failed: ${err.message}`);
      },
      onQrExpired() {
        console.log(`[QQBot] Session ${sessionId} QR expired, refreshing...`);
      },
    },
    { displayQrCodeToConsole: false, source: "qagent" }
  );

  session.stop = stop;

  // Auto-cleanup after 10 minutes
  setTimeout(() => {
    if (sessions.has(sessionId) && !session.credentials && !session.error) {
      if (session.stop) session.stop();
      sessions.delete(sessionId);
      console.log(`[QQBot] Session ${sessionId} auto-cleaned after timeout`);
    }
  }, 10 * 60 * 1000);

  res.json({ session_id: sessionId, status: "pending" });
});

// 2. Poll for QR URL or result
app.get("/register/:sessionId", (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.credentials) {
    return res.json({ status: "success", credentials: session.credentials });
  }
  if (session.error) {
    return res.json({ status: "error", error: session.error });
  }
  return res.json({ status: "pending", qr_url: session.qrUrl });
});

// 3. Cancel a session
app.delete("/register/:sessionId", (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (session && session.stop) {
    session.stop();
  }
  sessions.delete(req.params.sessionId);
  res.json({ status: "cancelled" });
});

app.listen(PORT, HOST, () => {
  console.log(`[QQBot] Service listening on http://${HOST}:${PORT}`);
});
