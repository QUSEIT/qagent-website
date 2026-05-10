import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Globe, Cpu, Save, CheckCircle, AlertCircle } from "lucide-react";
import api from "../services/api";

type TokenProvider = "minimx" | "kimi";

interface TokenConfig {
  key: string;
  model: string;
  baseUrl: string;
}

interface TokenConfigCardProps {
  instanceId?: number;
  defaultProvider?: string;
}

const PROVIDER_LABELS: Record<TokenProvider, string> = {
  minimx: "Minimax Coding Plan",
  kimi: "Kimi Coding Plan",
};

const DEFAULT_CONFIGS: Record<TokenProvider, TokenConfig> = {
  minimx: {
    key: "",
    model: "minimax/MiniMax-M2.7",
    baseUrl: "https://api.minimaxi.com/anthropic",
  },
  kimi: {
    key: "",
    model: "kimi/kimi-code",
    baseUrl: "https://api.kimi.com/coding/v1",
  },
};

const MINIMX_MODELS = [
  { value: "minimax/MiniMax-M2.7", label: "minimax/MiniMax-M2.7" },
  { value: "minimax/MiniMax-M2.7-highspeed", label: "minimax/MiniMax-M2.7-highspeed" },
];

const KIMI_MODELS = [
  { value: "kimi/kimi-code", label: "kimi/kimi-code" },
  { value: "kimi-coding/kimi-for-coding", label: "kimi-coding/kimi-for-coding" },
  { value: "kimi-coding/kimi-k2-thinking", label: "kimi-coding/kimi-k2-thinking" },
  { value: "kimi-coding/k2p6", label: "kimi-coding/k2p6" },
];

function buildOnboardCommand(provider: TokenProvider, apiKey: string, model: string): string {
  let onboard: string;
  if (provider === "minimx") {
    onboard = `MINIMAX_API_KEY="${apiKey}" openclaw onboard --non-interactive --mode local --auth-choice minimax-cn-api --accept-risk --skip-bootstrap --skip-skills --skip-search --skip-health --skip-channels --skip-ui --gateway-bind loopback`;
  } else {
    onboard = `KIMI_API_KEY="${apiKey}" openclaw onboard --non-interactive --mode local --auth-choice kimi-code-api-key --accept-risk --skip-bootstrap --skip-skills --skip-search --skip-health --skip-channels --skip-ui --gateway-bind loopback`;
  }
  return `${onboard} && openclaw config set agents.defaults.model.primary ${model}`;
}

const TokenConfigCard: React.FC<TokenConfigCardProps> = ({ instanceId, defaultProvider }) => {
  const [provider, setProvider] = useState<TokenProvider | null>(null);
  const [config, setConfig] = useState<TokenConfig>({ key: "", model: "", baseUrl: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [displayDefaultProvider, setDisplayDefaultProvider] = useState(defaultProvider);

  useEffect(() => {
    setDisplayDefaultProvider(defaultProvider);
  }, [defaultProvider]);

  const handleSelectProvider = async (p: TokenProvider) => {
    setProvider(p);
    setSaved(false);
    try {
      const res = await api.get(`/qagent/token-config/${p}`);
      setConfig({
        key: res.data.api_key,
        model: res.data.model,
        baseUrl: res.data.base_url,
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setConfig({ ...DEFAULT_CONFIGS[p] });
      } else {
        setError(err.response?.data?.detail || "获取配置失败");
        setConfig({ ...DEFAULT_CONFIGS[p] });
      }
    }
  };

  const handleChange = (field: keyof TokenConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    if (!provider) return;
    setIsSaving(true);
    setError("");

    try {
      await api.post("/qagent/token-config", {
        provider,
        api_key: config.key.trim(),
        model: config.model.trim(),
        base_url: config.baseUrl.trim(),
        instance_id: instanceId,
      });

      if ((provider === "minimx" || provider === "kimi") && instanceId && config.key.trim()) {
        const command = buildOnboardCommand(provider, config.key.trim(), config.model);
        await api.post(`/qagent/exec/${instanceId}`, { command });
      }

      setSaved(true);
      setDisplayDefaultProvider(provider);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = provider && config.key.trim() && config.model.trim() && config.baseUrl.trim();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Key className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Token 配置</h2>
          <p className="text-slate-400 text-sm">配置 AI 模型 API 密钥</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["minimx", "kimi"] as TokenProvider[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSelectProvider(p)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              provider === p
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
            }`}
          >
            {PROVIDER_LABELS[p]}
            {displayDefaultProvider === p && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30">
                默认
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {provider && (
          <motion.div
            key={provider}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={config.key}
                  onChange={(e) => handleChange("key", e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Model
              </label>
              <div className="relative">
                <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                {provider === "minimx" || provider === "kimi" ? (
                  <select
                    value={config.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    {(provider === "minimx" ? MINIMX_MODELS : KIMI_MODELS).map((m) => (
                      <option key={m.value} value={m.value} className="bg-slate-800">
                        {m.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    placeholder="e.g. moonshot-v1-8k"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Base URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => handleChange("baseUrl", e.target.value)}
                  placeholder="https://api.example.com/v1"
                  disabled={provider === "minimx" || provider === "kimi"}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-all ${
                    provider === "minimx" || provider === "kimi"
                      ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                saved
                  ? "bg-green-500/20 border border-green-500/50 text-green-400"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-500/30"
              }`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  保存配置
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenConfigCard;
