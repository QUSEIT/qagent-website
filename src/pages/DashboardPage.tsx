import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle, ChevronDown, Cpu, ExternalLink, LogOut, Rocket, Server, Shield, Sparkles, Trash2, User, Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface QAgentStatus {
  has_instance: boolean;
  instance_id: number | null;
  instance_type?: string;
}

type InstanceType = "OpenClaw" | "HermesAgent";

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
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState("");
  const [accessInfo, setAccessInfo] = useState<{
    proxy_url: string;
    expires_at: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

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
      await api.post("/qagent/create", null, { params: { name: instanceName, type: instanceType } });
      await refreshUser();
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || "创建失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAccess = async () => {
    setError("");
    try {
      const response = await api.post("/qagent/access");
      setAccessInfo(response.data);
      window.open(response.data.proxy_url, "_blank");
    } catch (err: any) {
      setError(err.response?.data?.detail || "获取访问链接失败");
    }
  };

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);
    try {
      await api.delete("/qagent/instance");
      setAccessInfo(null);
      setShowDeleteConfirm(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Q Agent 控制台</span>
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
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            欢迎回来，{user?.username}
          </h1>
          <p className="text-slate-400">
            {status?.has_instance
              ? "您的 QAgent AI 助理已就绪"
              : "您还没有开通 QAgent AI 助理，点击下方按钮立即开通"}
          </p>
        </motion.div>

        {!status?.has_instance ? (
          /* Create Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">开通我的QAgent</h2>
                  <p className="text-slate-400 text-sm">每人限开通一个 AI 助理</p>
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
                    {(["OpenClaw", "HermesAgent"] as InstanceType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInstanceType(type)}
                        className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                          instanceType === type
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 hover:border-slate-600 transition-all"
                >
                  <span className="text-sm font-medium">助理配置</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showConfig ? "rotate-180" : ""}`} />
                </button>

                {showConfig && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu className="w-4 h-4 text-amber-400" />
                          <span className="text-slate-300 text-sm font-medium">CPU</span>
                        </div>
                        <p className="text-white text-lg font-bold">1 核</p>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-300 text-sm font-medium">内存</span>
                        </div>
                        <p className="text-white text-lg font-bold">2 GB</p>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300 text-sm font-medium">磁盘</span>
                        </div>
                        <p className="text-white text-lg font-bold">20 GB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>系统：Ubuntu 22.04 | 类型：{status?.instance_type || instanceType}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </form>
            </div>
          </motion.div>
        ) : (
          /* Management Panel */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">QAgent 管理</h2>
                  <p className="text-slate-400 text-sm">实例 ID: {status.instance_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-sm font-medium">CPU</span>
                  </div>
                  <p className="text-white text-lg font-bold">1 核</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm font-medium">内存</span>
                  </div>
                  <p className="text-white text-lg font-bold">2 GB</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300 text-sm font-medium">磁盘</span>
                  </div>
                  <p className="text-white text-lg font-bold">20 GB</p>
                </div>
              </div>

              <button
                onClick={handleAccess}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                打开 AI 助理系统
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
        )}
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
                  此操作将停止并删除您的 QAgent 实例（ID: {status?.instance_id}），实例中的数据将无法恢复。关闭后您可以重新开通新的实例。
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
