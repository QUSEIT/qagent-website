import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, QrCode, Loader2, CheckCircle, AlertCircle, RefreshCw, Save } from "lucide-react";
import QRCode from "qrcode";
import api from "../services/api";

interface ChannelConfigCardProps {
  instanceId?: number;
}

type FeishuState = "idle" | "loading" | "scanning" | "scanned" | "success" | "error";
type QQState = "idle" | "loading" | "scanning" | "scanned" | "success" | "error";

interface FeishuConfig {
  app_id: string;
  owner_open_id?: string;
  tenant_brand: string;
}

interface QQConfig {
  app_id: string;
}

interface PendingScan {
  app_id: string;
  owner_open_id?: string;
  tenant_brand?: string;
}

const ChannelConfigCard: React.FC<ChannelConfigCardProps> = ({ instanceId }) => {
  const [feishuState, setFeishuState] = useState<FeishuState>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [deviceCode, setDeviceCode] = useState<string>("");
  const [intervalSec, setIntervalSec] = useState<number>(5);
  const [feishuError, setFeishuError] = useState<string>("");
  const [feishuConfig, setFeishuConfig] = useState<FeishuConfig | null>(null);
  const [isFeishuSaving, setIsFeishuSaving] = useState(false);

  const [qqState, setQQState] = useState<QQState>("idle");
  const [qqQrDataUrl, setQQQrDataUrl] = useState<string>("");
  const [qqQrUrl, setQQQrUrl] = useState<string>("");
  const [qqSessionId, setQQSessionId] = useState<string>("");
  const [qqError, setQQError] = useState<string>("");
  const [qqConfig, setQQConfig] = useState<QQConfig | null>(null);
  const [IsQQSaving, setIsQQSaving] = useState(false);

  // On mount: check DB for saved channel (status field reflects pending vs active)
  useEffect(() => {
    if (!instanceId) {
      setFeishuState("idle");
      setQQState("idle");
      return;
    }

    // Feishu
    api.get(`/qagent/channel/feishu/${instanceId}`)
      .then((res) => {
        setFeishuConfig({
          app_id: res.data.app_id,
          owner_open_id: res.data.owner_open_id,
          tenant_brand: res.data.tenant_brand,
        });
        setFeishuState(res.data.status === "pending" ? "scanned" : "success");
      })
      .catch(() => {
        setFeishuState("idle");
      });

    // QQ
    api.get(`/qagent/channel/qq/${instanceId}`)
      .then((res) => {
        setQQConfig({ app_id: res.data.app_id });
        setQQState(res.data.status === "pending" ? "scanned" : "success");
      })
      .catch(() => {
        setQQState("idle");
      });
  }, [instanceId]);

  const startFeishuFlow = async () => {
    setFeishuState("loading");
    setFeishuError("");
    try {
      const res = await api.post("/qagent/channel/feishu/qr");
      const { device_code, qr_url, interval } = res.data;
      const dataUrl = await QRCode.toDataURL(qr_url, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
      setDeviceCode(device_code);
      setIntervalSec(interval);
      setFeishuState("scanning");
    } catch (err: any) {
      setFeishuError(err.response?.data?.detail || "生成二维码失败");
      setFeishuState("error");
    }
  };

  const startQQFlow = async () => {
    setQQState("loading");
    setQQError("");
    try {
      const res = await api.post("/qagent/channel/qq/qr");
      const { session_id, qr_url } = res.data;
      if (qr_url) {
        const dataUrl = await QRCode.toDataURL(qr_url, { width: 200, margin: 2 });
        setQQQrDataUrl(dataUrl);
        setQQQrUrl(qr_url);
      }
      setQQSessionId(session_id);
      setQQState("scanning");
    } catch (err: any) {
      setQQError(err.response?.data?.detail || "生成二维码失败");
      setQQState("error");
    }
  };

  const handleFeishuSave = async () => {
    if (!instanceId) return;
    setIsFeishuSaving(true);
    setFeishuError("");
    try {
      await api.post(`/qagent/channel/feishu/save/${instanceId}`);
      const res = await api.get(`/qagent/channel/feishu/${instanceId}`);
      setFeishuConfig({
        app_id: res.data.app_id,
        owner_open_id: res.data.owner_open_id,
        tenant_brand: res.data.tenant_brand,
      });
      setFeishuState("success");
    } catch (err: any) {
      setFeishuError(err.response?.data?.detail || "保存失败");
      // stay in scanned so save button remains visible for retry
      setFeishuState("scanned");
    } finally {
      setIsFeishuSaving(false);
    }
  };

  const handleQQSave = async () => {
    if (!instanceId) return;
    setIsQQSaving(true);
    setQQError("");
    try {
      await api.post(`/qagent/channel/qq/save/${instanceId}`);
      const res = await api.get(`/qagent/channel/qq/${instanceId}`);
      setQQConfig({ app_id: res.data.app_id });
      setQQState("success");
    } catch (err: any) {
      setQQError(err.response?.data?.detail || "保存失败");
      // stay in scanned so save button remains visible for retry
      setQQState("scanned");
    } finally {
      setIsQQSaving(false);
    }
  };

  useEffect(() => {
    if (feishuState !== "scanning" || !deviceCode) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await api.get(`/qagent/channel/feishu/poll/${deviceCode}`, {
          params: instanceId ? { instance_id: instanceId } : undefined,
        });
        if (cancelled) return;

        if (res.data.status === "success") {
          const data: PendingScan = {
            app_id: res.data.app_id,
            owner_open_id: res.data.owner_open_id,
            tenant_brand: res.data.tenant_brand,
          };
          setFeishuConfig({
            app_id: data.app_id,
            owner_open_id: data.owner_open_id,
            tenant_brand: data.tenant_brand || "feishu",
          });
          setFeishuState("scanned");
          return;
        }

        if (res.data.status === "failed") {
          setFeishuError(res.data.error || "扫码失败");
          setFeishuState("error");
          return;
        }

        const nextInterval = res.data.interval || intervalSec;
        timer = setTimeout(poll, nextInterval * 1000);
      } catch (err: any) {
        if (!cancelled) {
          setFeishuError(err.response?.data?.detail || "轮询失败");
          setFeishuState("error");
        }
      }
    };

    timer = setTimeout(poll, intervalSec * 1000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [feishuState, deviceCode, intervalSec, instanceId]);

  useEffect(() => {
    if (qqState !== "scanning" || !qqSessionId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const POLL_INTERVAL_MS = 3000;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await api.get(`/qagent/channel/qq/poll/${qqSessionId}`, {
          params: instanceId ? { instance_id: instanceId } : undefined,
        });
        if (cancelled) return;

        if (res.data.status === "success") {
          const data: PendingScan = { app_id: res.data.app_id };
          setQQConfig({ app_id: data.app_id });
          setQQState("scanned");
          return;
        }

        if (res.data.status === "failed") {
          setQQError(res.data.error || "扫码失败");
          setQQState("error");
          return;
        }

        if (res.data.qr_url && res.data.qr_url !== qqQrUrl) {
          const dataUrl = await QRCode.toDataURL(res.data.qr_url, { width: 200, margin: 2 });
          setQQQrDataUrl(dataUrl);
          setQQQrUrl(res.data.qr_url);
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err: any) {
        if (!cancelled) {
          setQQError(err.response?.data?.detail || "轮询失败");
          setQQState("error");
        }
      }
    };

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [qqState, qqSessionId, qqQrUrl, instanceId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Feishu Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">飞书</h2>
              <p className="text-slate-400 text-sm">通过飞书机器人与 QAgent 交互</p>
            </div>
          </div>
          {feishuState === "idle" && (
            <button
              onClick={startFeishuFlow}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              启用
            </button>
          )}
          {feishuState === "scanned" && (
            <button
              onClick={handleFeishuSave}
              disabled={isFeishuSaving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isFeishuSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存
            </button>
          )}
          {(feishuState === "success" || feishuState === "scanning" || feishuState === "loading") && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              feishuState === "success"
                ? "bg-green-500/20 text-green-400"
                : "bg-blue-500/20 text-blue-400"
            }`}>
              {feishuState === "success" ? "已启用" : "配置中"}
            </span>
          )}
        </div>

        <div className="text-center">
          {feishuState === "success" && feishuConfig ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-medium">飞书已绑定</p>
                <div className="inline-block text-left bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-slate-300">
                    <span className="text-slate-500">App ID:</span> {feishuConfig.app_id}
                  </p>
                  {feishuConfig.owner_open_id && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Owner:</span> {feishuConfig.owner_open_id}
                    </p>
                  )}
                  <p className="text-slate-300">
                    <span className="text-slate-500">Domain:</span> {feishuConfig.tenant_brand === "lark" ? "Lark" : "Feishu"}
                  </p>
                </div>
              </div>
              <button
                onClick={startFeishuFlow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                重新绑定
              </button>
            </div>
          ) : feishuState === "scanned" ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white font-medium">扫码成功</p>
              <p className="text-slate-400 text-sm">请点击右上角「保存」按钮完成配置</p>
            </div>
          ) : feishuState === "scanning" ? (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                飞书对团队协作与企业办公场景比较友好，可与飞书强大的办公工作流深度集成。请用飞书扫描下方二维码完成绑定。
              </p>
              {qrDataUrl ? (
                <div className="inline-flex flex-col items-center gap-3">
                  <img
                    src={qrDataUrl}
                    alt="Feishu QR Code"
                    className="w-48 h-48 rounded-xl border border-slate-700"
                  />
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>等待扫码确认...</span>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                </div>
              )}
            </div>
          ) : feishuState === "loading" ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-slate-400 text-sm">正在生成二维码...</p>
            </div>
          ) : feishuState === "error" ? (
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{feishuError}</span>
              </div>
              <button
                onClick={startFeishuFlow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          ) : (
            <div className="py-8 text-slate-500 text-sm">
              点击右上角「启用」按钮开始配置飞书通道
            </div>
          )}
        </div>
      </motion.div>

      {/* QQ Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">QQ</h2>
              <p className="text-slate-400 text-sm">通过 QQ 群机器人与 QAgent 交互</p>
            </div>
          </div>
          {qqState === "idle" && (
            <button
              onClick={startQQFlow}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              启用
            </button>
          )}
          {qqState === "scanned" && (
            <button
              onClick={handleQQSave}
              disabled={IsQQSaving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {IsQQSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存
            </button>
          )}
          {(qqState === "success" || qqState === "scanning" || qqState === "loading") && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              qqState === "success"
                ? "bg-green-500/20 text-green-400"
                : "bg-purple-500/20 text-purple-400"
            }`}>
              {qqState === "success" ? "已启用" : "配置中"}
            </span>
          )}
        </div>

        <div className="text-center">
          {qqState === "success" && qqConfig ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-medium">QQ Bot 已绑定</p>
                <div className="inline-block text-left bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-slate-300">
                    <span className="text-slate-500">App ID:</span> {qqConfig.app_id}
                  </p>
                </div>
              </div>
              <button
                onClick={startQQFlow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                重新绑定
              </button>
            </div>
          ) : qqState === "scanned" ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-white font-medium">扫码成功</p>
              <p className="text-slate-400 text-sm">请点击右上角「保存」按钮完成配置</p>
            </div>
          ) : qqState === "scanning" ? (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                QQ 更适合个人使用，默认支持语音等便捷功能。请用 QQ 扫描下方二维码完成绑定。
              </p>
              {qqQrDataUrl ? (
                <div className="inline-flex flex-col items-center gap-3">
                  <img
                    src={qqQrDataUrl}
                    alt="QQ QR Code"
                    className="w-48 h-48 rounded-xl border border-slate-700"
                  />
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>等待扫码确认...</span>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                </div>
              )}
            </div>
          ) : qqState === "loading" ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-slate-400 text-sm">正在生成二维码...</p>
            </div>
          ) : qqState === "error" ? (
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{qqError}</span>
              </div>
              <button
                onClick={startQQFlow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          ) : (
            <div className="py-8 text-slate-500 text-sm">
              点击右上角「启用」按钮开始配置 QQ 通道
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChannelConfigCard;
