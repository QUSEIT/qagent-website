import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, QrCode, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import api from "../services/api";

type ChannelType = "feishu" | "wechat" | "qq";

interface ChannelConfigCardProps {
  instanceId?: number;
}

const CHANNEL_META: Record<
  ChannelType,
  { label: string; desc: string }
> = {
  feishu: {
    label: "飞书",
    desc: "通过飞书机器人与 QAgent 交互",
  },
  wechat: {
    label: "微信",
    desc: "通过微信与 QAgent 交互",
  },
  qq: {
    label: "QQ",
    desc: "通过 QQ 群机器人与 QAgent 交互",
  },
};

type FeishuState = "idle" | "loading" | "scanning" | "success" | "error";

interface FeishuConfig {
  app_id: string;
  owner_open_id?: string;
  tenant_brand: string;
}

const ChannelConfigCard: React.FC<ChannelConfigCardProps> = ({ instanceId }) => {
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [feishuState, setFeishuState] = useState<FeishuState>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [deviceCode, setDeviceCode] = useState<string>("");
  const [intervalSec, setIntervalSec] = useState<number>(5);
  const [error, setError] = useState<string>("");
  const [feishuConfig, setFeishuConfig] = useState<FeishuConfig | null>(null);

  const fetchExistingConfig = useCallback(async () => {
    if (!instanceId) return;
    try {
      const res = await api.get(`/qagent/channel/feishu/${instanceId}`);
      setFeishuConfig({
        app_id: res.data.app_id,
        owner_open_id: res.data.owner_open_id,
        tenant_brand: res.data.tenant_brand,
      });
      setFeishuState("success");
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || "获取配置失败");
      }
    }
  }, [instanceId]);

  useEffect(() => {
    if (channel === "feishu") {
      fetchExistingConfig();
    }
  }, [channel, fetchExistingConfig]);

  const startFeishuFlow = async () => {
    setFeishuState("loading");
    setError("");
    try {
      const res = await api.post("/qagent/channel/feishu/qr");
      const { device_code, qr_url, interval, expire_in } = res.data;
      const dataUrl = await QRCode.toDataURL(qr_url, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
      setDeviceCode(device_code);
      setIntervalSec(interval);
      setFeishuState("scanning");
    } catch (err: any) {
      setError(err.response?.data?.detail || "生成二维码失败");
      setFeishuState("error");
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
          setFeishuConfig({
            app_id: res.data.app_id,
            owner_open_id: res.data.owner_open_id,
            tenant_brand: res.data.tenant_brand,
          });
          setFeishuState("success");
          return;
        }

        if (res.data.status === "failed") {
          setError(res.data.error || "扫码失败");
          setFeishuState("error");
          return;
        }

        // pending - schedule next poll
        const nextInterval = res.data.interval || intervalSec;
        timer = setTimeout(poll, nextInterval * 1000);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.detail || "轮询失败");
          setFeishuState("error");
        }
      }
    };

    timer = setTimeout(poll, intervalSec * 1000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [feishuState, deviceCode, intervalSec]);

  const handleSelectChannel = (c: ChannelType) => {
    setChannel(c);
    setError("");
    if (c === "feishu") {
      setFeishuState("idle");
      setQrDataUrl("");
      setFeishuConfig(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Channel 配置</h2>
          <p className="text-slate-400 text-sm">配置消息通道与 QAgent 交互</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["feishu", "wechat", "qq"] as ChannelType[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleSelectChannel(c)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              channel === c
                ? "border-purple-500 bg-purple-500/10 text-purple-400"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
            }`}
          >
            {CHANNEL_META[c].label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {channel && (
          <motion.div
            key={channel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {channel === "feishu" ? (
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
                ) : feishuState === "scanning" ? (
                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm">
                      请用飞书扫描下方二维码完成绑定
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
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <p className="text-slate-400 text-sm">正在生成二维码...</p>
                  </div>
                ) : feishuState === "error" ? (
                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={startFeishuFlow}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重试
                    </button>
                  </div>
                ) : (
                  <div className="py-4 space-y-3">
                    <p className="text-slate-400 text-sm">
                      绑定飞书机器人后，可通过飞书与 QAgent 交互
                    </p>
                    <button
                      onClick={startFeishuFlow}
                      disabled={!instanceId}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      生成二维码
                    </button>
                    {!instanceId && (
                      <p className="text-slate-500 text-xs">请先选择实例</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">{CHANNEL_META[channel].desc}</p>
                <div className="inline-flex flex-col items-center mt-4">
                  <div className="w-48 h-48 bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2">
                    <QrCode className="w-10 h-10 text-slate-500" />
                    <span className="text-slate-500 text-xs">{channel === "wechat" ? "微信服务号二维码" : "QQ 群机器人二维码"}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChannelConfigCard;
