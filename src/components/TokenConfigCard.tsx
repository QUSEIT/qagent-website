import React, { useState } from "react";
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
}

const PROVIDER_LABELS: Record<TokenProvider, string> = {
  minimx: "Minimax Coding",
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
    model: "moonshot-v1-8k",
    baseUrl: "https://api.moonshot.cn/v1",
  },
};

const MINIMX_MODELS = [
  "minimax/MiniMax-M2.7",
  "minimax/MiniMax-M2.7-highspeed",
];

function buildMinimaxOnboardCommand(apiKey: string): string {
  return `MINIMAX_API_KEY="${apiKey}" openclaw onboard --non-interactive --mode local --auth-choice minimax-cn-api --accept-risk --skip-bootstrap --skip-skills --skip-search --skip-health --skip-channels --skip-ui --gateway-bind loopback`;
}

const TokenConfigCard: React.FC<TokenConfigCardProps> = ({ instanceId }) => {
  const [provider, setProvider] = useState<TokenProvider | null>(null);
  const [config, setConfig] = useState<TokenConfig>({ key: "", model: "", baseUrl: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSelectProvider = (p: TokenProvider) => {
    setProvider(p);
    setConfig({ ...DEFAULT_CONFIGS[p] });
    setSaved(false);
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
      const localKey = `token_config_${provider}`;
      localStorage.setItem(localKey, JSON.stringify(config));

      if (provider === "minimx" && instanceId && config.key.trim()) {
        const command = buildMinimaxOnboardCommand(config.key.trim());
        await api.post(`/qagent/exec/${instanceId}`, { command });
      }

      setSaved(true);
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
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              provider === p
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
            }`}
          >
            {PROVIDER_LABELS[p]}
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
                {provider === "minimx" ? (
                  <select
                    value={config.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    {MINIMX_MODELS.map((m) => (
                      <option key={m} value={m} className="bg-slate-800">
                        {m}
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
