import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle, Cpu, ExternalLink, Key, Loader2, Lock, LogOut, MessageCircle, Plus, Rocket, Server, Settings, Shield, Sparkles, Trash2, User, Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import TokenConfigCard from "../components/TokenConfigCard";
import ChannelConfigCard from "../components/ChannelConfigCard";

interface InstanceInfo {
  id: number;
  clawmanager_instance_id: number;
  name: string;
  instance_type: string;
  skill_template?: string;
  default_provider?: string;
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  created_at: string;
}

interface QAgentStatus {
  has_instance: boolean;
  instances: InstanceInfo[];
  max_instances: number;
  can_create: boolean;
}

interface ClawManagerInstanceStatus {
  status: string;
  pod_status?: string;
}

type InstanceType = "OpenClaw" | "HermesAgent";
type SkillTemplate = "content" | "devops" | "tutor" | "none";
type ActiveTab = "config" | "token" | "channel";

const SKILL_TEMPLATES: { id: SkillTemplate; label: string; desc: string }[] = [
  { id: "content", label: "内容创作", desc: "文案撰写、内容策划、创意生成" },
  { id: "devops", label: "DevOps", desc: "CI/CD、容器编排、运维自动化" },
  { id: "tutor", label: "学习辅导", desc: "知识讲解、习题解答、学习计划" },
  { id: "none", label: "无", desc: "通用模式，不预设特定技能" },
];

const POLL_INTERVAL_MS = 5000;

const statusLabelMap: Record<string, string> = {
  creating: "创建中",
  running: "运行中",
  stopped: "已停止",
  error: "异常",
  deleting: "删除中",
};

const SIDEBAR_ITEMS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: "config", label: "基础配置", icon: Settings },
  { id: "token", label: "Token配置", icon: Key },
  { id: "channel", label: "Channel配置", icon: MessageCircle },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [status, setStatus] = useState<QAgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [instanceName, setInstanceName] = useState("我的 QAgent");
  const [instanceType, setInstanceType] = useState<InstanceType>("OpenClaw");
  const [skillTemplate, setSkillTemplate] = useState<SkillTemplate>("none");
  const [cpuCores, setCpuCores] = useState<number>(1);
  const [memoryGb, setMemoryGb] = useState<number>(4);
  const [diskGb, setDiskGb] = useState<number>(20);
  const [error, setError] = useState("");
  const [accessInfo, setAccessInfo] = useState<{
    proxy_url: string;
    expires_at: string;
  } | null>(null);
  const [instanceStatusMap, setInstanceStatusMap] = useState<Record<number, ClawManagerInstanceStatus>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>("config");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (status?.instances.length && selectedInstanceId === null) {
      setSelectedInstanceId(status.instances[0].id);
    }
  }, [status?.instances, selectedInstanceId]);

  useEffect(() => {
    if (!status?.has_instance || !selectedInstanceId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const response = await api.get(`/qagent/instance-status/${selectedInstanceId}`);
        if (!cancelled) {
          setInstanceStatusMap((prev) => ({ ...prev, [selectedInstanceId]: response.data }));
          if (response.data.status !== "running") {
            timer = setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setInstanceStatusMap((prev) => {
              const next = { ...prev };
              delete next[selectedInstanceId];
              return next;
            });
          } else {
            setError(err.response?.data?.detail || "获取实例状态失败");
            timer = setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [status?.has_instance, selectedInstanceId]);

  const fetchStatus = async () => {
    try {
      const response = await api.get("/qagent/status");
      setStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "获取状态失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      await api.post("/qagent/create", null, {
        params: {
          name: instanceName,
          type: instanceType,
          skill: skillTemplate,
          cpu_cores: cpuCores,
          memory_gb: memoryGb,
          disk_gb: diskGb,
        },
      });
      await refreshUser();
      await fetchStatus();
      setShowCreateForm(false);
      setActiveTab("config");
    } catch (err: any) {
      setError(err.response?.data?.detail || "创建失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAccess = async () => {
    if (!selectedInstanceId) return;
    setError("");
    try {
      const response = await api.post(`/qagent/access/${selectedInstanceId}`);
      setAccessInfo(response.data);
      window.open(response.data.proxy_url, "_blank");
    } catch (err: any) {
      setError(err.response?.data?.detail || "获取访问链接失败");
    }
  };

  const handleDelete = async () => {
    if (!selectedInstanceId) return;
    setError("");
    setIsDeleting(true);
    try {
      await api.delete(`/qagent/instance/${selectedInstanceId}`);
      setInstanceStatusMap((prev) => {
        const next = { ...prev };
        delete next[selectedInstanceId];
        return next;
      });
      setAccessInfo(null);
      setShowDeleteConfirm(false);
      setSelectedInstanceId(null);
      await refreshUser();
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || "关闭实例失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  const selectedInstance = status?.instances.find((i) => i.id === selectedInstanceId) || null;
  const selectedStatus = selectedInstanceId ? instanceStatusMap[selectedInstanceId] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="logoGradDash" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <polygon points="20,50 50,80 80,50 70,40 50,60 30,40" fill="url(#logoGradDash)" />
                <rect x="55" y="25" width="15" height="15" fill="#3b82f6" transform="rotate(45 62.5 32.5)" />
                <rect x="45" y="10" width="10" height="10" fill="#ef4444" transform="rotate(45 50 15)" />
                <rect x="30" y="30" width="8" height="8" fill="#22c55e" transform="rotate(45 34 34)" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">QAgent</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <User className="w-4 h-4" />
              <span>{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Leftmost: Instance List + Create */}
        <aside className="w-16 shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col items-center py-6 gap-4">
          {status?.instances.map((instance) => {
            const isSelected = selectedInstanceId === instance.id && !showCreateForm;
            const instStatus = instanceStatusMap[instance.id];
            const isRunning = instStatus?.status === "running";
            return (
              <button
                key={instance.id}
                onClick={() => { setSelectedInstanceId(instance.id); setActiveTab("config"); setShowCreateForm(false); }}
                className={`relative group w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  isSelected
                    ? "bg-slate-700 border-amber-500/50"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className={`text-sm font-bold ${isRunning ? "text-green-400" : "text-amber-400"}`}>
                  {instance.skill_template && instance.skill_template !== "none"
                    ? instance.skill_template.charAt(0).toUpperCase()
                    : instance.name.charAt(0)}
                </span>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {instance.name}
                </div>
              </button>
            );
          })}

          {status?.can_create ? (
            <button
              onClick={() => { setSelectedInstanceId(null); setShowCreateForm(true); setActiveTab("config"); }}
              className={`relative group w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                showCreateForm
                  ? "bg-slate-700 border-amber-500/50"
                  : "bg-slate-800 border-slate-700 hover:border-amber-500"
              }`}
            >
              <Plus className="w-5 h-5 text-amber-400" />
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                开通 QAgent
              </div>
            </button>
          ) : null}

          {!status?.has_instance && !status?.can_create ? (
            <div className="relative group w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700">
              <Lock className="w-5 h-5 text-slate-500" />
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                暂无开通权限，请联系管理员
              </div>
            </div>
          ) : null}
        </aside>

        {/* Middle: Feature Navigation */}
        <aside className="w-56 shrink-0 bg-slate-900/50 border-r border-slate-800 py-6 px-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            配置
          </h2>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const disabled = !selectedInstanceId && item.id !== "config";
              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && setActiveTab(item.id)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:!outline-none focus-visible:!outline-none active:!outline-none focus:!ring-0 focus-visible:!ring-0 border ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : disabled
                      ? "text-slate-600 cursor-not-allowed border-transparent"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right: Content Area */}
        <main className="flex-1 px-8 py-8 overflow-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {showCreateForm ? (
            /* Create Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">开通我的QAgent</h2>
                    <p className="text-slate-400 text-sm">
                      已开通 {status?.instances.length || 0} / {status?.max_instances || 0} 个实例
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      实例名称
                    </label>
                    <input
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      required
                      minLength={3}
                      maxLength={50}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      实例类型
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { id: "OpenClaw" as InstanceType, label: "OpenClaw", desc: "复杂任务编排与多工具协作" },
                        { id: "HermesAgent" as InstanceType, label: "HermesAgent", desc: "长期记忆与自主技能进化" },
                      ]).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setInstanceType(t.id)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                            instanceType === t.id
                              ? "border-amber-500 bg-amber-500/10 text-amber-400"
                              : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          <span className="block">{t.label}</span>
                          <span className="block text-[11px] font-normal text-slate-500 mt-0.5">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      预设技能模板
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SKILL_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSkillTemplate(t.id)}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                            skillTemplate === t.id
                              ? "border-green-500 bg-green-500/10 text-green-400"
                              : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          <span className="block">{t.label}</span>
                          <span className="block text-[11px] font-normal text-slate-500 mt-0.5">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-slate-300">容器配置</h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu className="w-4 h-4 text-amber-400" />
                          <span className="text-slate-300 text-sm font-medium">CPU</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={cpuCores}
                            onChange={(e) => setCpuCores(parseFloat(e.target.value) || 0.1)}
                            className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-slate-400 text-sm">核</span>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-300 text-sm font-medium">内存</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={memoryGb}
                            onChange={(e) => setMemoryGb(parseInt(e.target.value, 10) || 1)}
                            className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-slate-400 text-sm">GB</span>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300 text-sm font-medium">磁盘</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="1"
                            min="10"
                            value={diskGb}
                            onChange={(e) => setDiskGb(parseInt(e.target.value, 10) || 10)}
                            className={`w-20 bg-slate-900 border rounded-lg px-3 py-1.5 text-white text-lg font-bold focus:outline-none ${diskGb < 10 ? "border-red-500 focus:border-red-500" : "border-slate-600 focus:border-green-500"}`}
                          />
                          <span className="text-slate-400 text-sm">GB</span>
                        </div>
                        {diskGb < 10 && (
                          <p className="text-red-400 text-xs mt-1.5">磁盘不能小于 10 GB</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>系统：Ubuntu 22.04 | 类型：{instanceType}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-all"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || diskGb < 10}
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          创建中...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          立即开通
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : !status?.has_instance ? (
            /* No instance - welcome prompt */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl">
                <Rocket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">请先开通 QAgent 实例</h3>
                <p className="text-slate-400 text-sm mb-6">
                  开通实例后即可配置 {SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label}
                </p>
                {status?.can_create ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all"
                  >
                    立即开通
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">暂无开通权限，请联系管理员</p>
                )}
              </div>
            </motion.div>
          ) : selectedInstance && activeTab === "config" ? (
            /* Config Panel (基础配置) */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedStatus?.status === "running" ? "bg-green-500/10" : "bg-amber-500/10"}`}>
                    {selectedStatus?.status === "running" ? (
                      <Sparkles className="w-6 h-6 text-green-400" />
                    ) : (
                      <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedInstance.name}</h2>
                    <p className="text-slate-400 text-sm">
                      实例 ID: {selectedInstance.clawmanager_instance_id}
                      {selectedInstance.instance_type && (
                        <>
                          {" · "}
                          <span className="text-slate-300">{selectedInstance.instance_type}</span>
                        </>
                      )}
                      {selectedInstance.skill_template && selectedInstance.skill_template !== "none" && (
                        <>
                          {" · "}
                          <span className="text-green-400">
                            {SKILL_TEMPLATES.find((t) => t.id === selectedInstance.skill_template)?.label || selectedInstance.skill_template}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span className="text-slate-300 text-sm font-medium">CPU</span>
                    </div>
                    <p className="text-white text-lg font-bold">{selectedInstance.cpu_cores} 核</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300 text-sm font-medium">内存</span>
                    </div>
                    <p className="text-white text-lg font-bold">{selectedInstance.memory_gb} GB</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm font-medium">磁盘</span>
                    </div>
                    <p className="text-white text-lg font-bold">{selectedInstance.disk_gb} GB</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300 text-sm font-medium">预设技能模板</span>
                    </div>
                    <p className="text-white text-lg font-bold">
                      {SKILL_TEMPLATES.find((t) => t.id === selectedInstance.skill_template)?.label || "无"}
                    </p>
                  </div>
                </div>

                {selectedStatus?.status && selectedStatus.status !== "running" && (
                  <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>实例状态：{statusLabelMap[selectedStatus.status] || selectedStatus.status}</span>
                    </div>
                    {selectedStatus.pod_status && (
                      <p className="text-slate-500 text-xs mt-1 ml-6">Pod 状态：{selectedStatus.pod_status}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleAccess}
                  disabled={selectedStatus?.status !== "running"}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedStatus?.status === "running"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:shadow-green-500/30"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {selectedStatus?.status === "running" ? (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      在线管理 QAgent 实例
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      准备中...
                    </>
                  )}
                </button>

                {accessInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                  >
                    <p className="text-slate-400 text-sm mb-1">访问链接已生成</p>
                    <p className="text-slate-500 text-xs">过期时间: {new Date(accessInfo.expires_at).toLocaleString()}</p>
                  </motion.div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    关闭实例
                  </button>
                  <p className="text-slate-500 text-xs text-center mt-2">
                    关闭后将停止并删除当前实例，此操作不可撤销
                  </p>
                </div>
              </div>
            </motion.div>
          ) : activeTab === "token" ? (
            <TokenConfigCard instanceId={selectedInstance?.id} defaultProvider={selectedInstance?.default_provider} />
          ) : (
            <ChannelConfigCard instanceId={selectedInstance?.id} />
          )}
        </main>
      </div>

      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">确认关闭实例？</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  此操作将停止并删除您的 QAgent 实例（ID: {selectedInstance?.clawmanager_instance_id}），实例中的数据将无法恢复。关闭后您可以重新开通新的实例。
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    关闭中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    确认关闭
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
