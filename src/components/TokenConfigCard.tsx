import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Globe, Cpu, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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

type ProviderState = "idle" | "configured" | "saving" | "success" | "error";

const PROVIDER_LABELS: Record<TokenProvider, string> = {
  minimx: "Minimax",
  kimi: "Kimi",
};

const PROVIDER_SUBDESC: Record<TokenProvider, string> = {
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

function tokenKey(instanceId: number | undefined, provider: TokenProvider) {
  return `token-config-${instanceId ?? "noinst"}-${provider}`;
}

function loadTokenPending(instanceId: number | undefined, provider: TokenProvider): TokenConfig | null {
  try {
    const raw = localStorage.getItem(tokenKey(instanceId, provider));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTokenPending(instanceId: number | undefined, provider: TokenProvider, config: TokenConfig) {
  localStorage.setItem(tokenKey(instanceId, provider), JSON.stringify(config));
}

function clearTokenPending(instanceId: number | undefined, provider: TokenProvider) {
  localStorage.removeItem(tokenKey(instanceId, provider));
}

interface ProviderWidgetProps {
  provider: TokenProvider;
  state: ProviderState;
  config: TokenConfig;
  isDefault: boolean;
  error: string;
  onChange: (field: keyof TokenConfig, value: string) => void;
  onEnable: () => void;
  onSave: () => void;
  onRetry: () => void;
  onSetDefault: () => void;
}

const ProviderWidget: React.FC<ProviderWidgetProps> = ({
  provider,
  state,
  config,
  isDefault,
  error,
  onChange,
  onEnable,
  onSave,
  onRetry,
  onSetDefault,
}) => {
  const models = provider === "minimx" ? MINIMX_MODELS : KIMI_MODELS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: provider === "minimx" ? 0.1 : 0.2 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            provider === "minimx" ? "bg-blue-500/10" : "bg-purple-500/10"
          }`}>
            <Key className={`w-6 h-6 ${provider === "minimx" ? "text-blue-400" : "text-purple-400"}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{PROVIDER_LABELS[provider]}</h2>
            <p className="text-slate-400 text-sm">{PROVIDER_SUBDESC[provider]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state === "success" && isDefault && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
              默认
            </span>
          )}
          {state === "idle" && (
            <button
              onClick={onEnable}
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all ${
                provider === "minimx"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              启用
            </button>
          )}
          {state === "configured" && (
            <button
              onClick={onSave}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              保存
            </button>
          )}
          {state === "saving" && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              provider === "minimx" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
            }`}>
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                配置中
              </div>
            </span>
          )}
          {state === "success" && !isDefault && (
            <button
              onClick={onSetDefault}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              设为默认
            </button>
          )}
          {state === "error" && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
            >
              重试
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        {state === "idle" ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            点击右上角「启用」按钮开始配置
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={config.key}
                  onChange={(e) => onChange("key", e.target.value)}
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
                <select
                  value={config.model}
                  onChange={(e) => onChange("model", e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none appearance-none transition-all ${
                    provider === "minimx"
                      ? "focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      : "focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  }`}
                >
                  {models.map((m) => (
                    <option key={m.value} value={m.value} className="bg-slate-800">
                      {m.label}
                    </option>
                  ))}
                </select>
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
                  onChange={(e) => onChange("baseUrl", e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {state === "success" && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm">配置已保存</span>
              </div>
            )}

            {state === "error" && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm flex-1">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TokenConfigCard: React.FC<TokenConfigCardProps> = ({ instanceId, defaultProvider }) => {
  const [minimaxState, setMinimaxState] = useState<ProviderState>("idle");
  const [kimiState, setKimState] = useState<ProviderState>("idle");
  const [minimaxConfig, setMinimaxConfig] = useState<TokenConfig>(DEFAULT_CONFIGS.minimx);
  const [kimiConfig, setKimConfig] = useState<TokenConfig>(DEFAULT_CONFIGS.kimi);
  const [minimaxError, setMinimaxError] = useState("");
  const [kimiError, setKimError] = useState("");
  const [displayDefault, setDisplayDefault] = useState(defaultProvider);

  useEffect(() => {
    setDisplayDefault(defaultProvider);
  }, [defaultProvider]);

  // Load configs on mount — check DB first, then localStorage for pending
  useEffect(() => {
    if (!instanceId) return;

    // Minimx
    api.get("/qagent/token-config/minimx")
      .then((res) => {
        setMinimaxConfig({
          key: res.data.api_key,
          model: res.data.model,
          baseUrl: res.data.base_url,
        });
        setMinimaxState("success");
        clearTokenPending(instanceId, "minimx");
      })
      .catch(() => {
        const pending = loadTokenPending(instanceId, "minimx");
        if (pending) {
          setMinimaxConfig(pending);
          setMinimaxState("configured");
        } else {
          setMinimaxState("idle");
        }
      });

    // Kimi
    api.get("/qagent/token-config/kimi")
      .then((res) => {
        setKimConfig({
          key: res.data.api_key,
          model: res.data.model,
          baseUrl: res.data.base_url,
        });
        setKimState("success");
        clearTokenPending(instanceId, "kimi");
      })
      .catch(() => {
        const pending = loadTokenPending(instanceId, "kimi");
        if (pending) {
          setKimConfig(pending);
          setKimState("configured");
        } else {
          setKimState("idle");
        }
      });
  }, [instanceId]);

  const handleMinimaxChange = (field: keyof TokenConfig, value: string) => {
    const next = { ...minimaxConfig, [field]: value };
    setMinimaxConfig(next);
    if (minimaxState === "success") {
      setMinimaxState("configured");
    }
    if (minimaxState === "configured" || minimaxState === "error") {
      saveTokenPending(instanceId, "minimx", next);
    }
    setMinimaxError("");
  };

  const handleKimiChange = (field: keyof TokenConfig, value: string) => {
    const next = { ...kimiConfig, [field]: value };
    setKimConfig(next);
    if (kimiState === "success") {
      setKimState("configured");
    }
    if (kimiState === "configured" || kimiState === "error") {
      saveTokenPending(instanceId, "kimi", next);
    }
    setKimError("");
  };

  const saveProvider = async (
    provider: TokenProvider,
    config: TokenConfig,
    setState: (s: ProviderState) => void,
    setError: (e: string) => void,
    isDefault: boolean
  ) => {
    if (!config.key.trim() || !config.model.trim() || !config.baseUrl.trim()) return;

    setState("saving");
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

      setState("success");
      if (isDefault) {
        setDisplayDefault(provider);
      }
      clearTokenPending(instanceId, provider);
    } catch (err: any) {
      setError(err.response?.data?.detail || "保存失败，请重试");
      setState("error");
      saveTokenPending(instanceId, provider, config);
    }
  };

  const handleMinimaxEnable = () => {
    setMinimaxState("configured");
  };

  const handleKimiEnable = () => {
    setKimState("configured");
  };

  const handleMinimaxSave = () => {
    saveProvider("minimx", minimaxConfig, setMinimaxState, setMinimaxError, true);
  };

  const handleKimiSave = () => {
    saveProvider("kimi", kimiConfig, setKimState, setKimError, true);
  };

  const handleMinimaxSetDefault = () => {
    saveProvider("minimx", minimaxConfig, setMinimaxState, setMinimaxError, true);
  };

  const handleKimiSetDefault = () => {
    saveProvider("kimi", kimiConfig, setKimState, setKimError, true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ProviderWidget
        provider="minimx"
        state={minimaxState}
        config={minimaxConfig}
        isDefault={displayDefault === "minimx"}
        error={minimaxError}
        onChange={handleMinimaxChange}
        onEnable={handleMinimaxEnable}
        onSave={handleMinimaxSave}
        onRetry={handleMinimaxSave}
        onSetDefault={handleMinimaxSetDefault}
      />
      <ProviderWidget
        provider="kimi"
        state={kimiState}
        config={kimiConfig}
        isDefault={displayDefault === "kimi"}
        error={kimiError}
        onChange={handleKimiChange}
        onEnable={handleKimiEnable}
        onSave={handleKimiSave}
        onRetry={handleKimiSave}
        onSetDefault={handleKimiSetDefault}
      />
    </div>
  );
};

export default TokenConfigCard;
