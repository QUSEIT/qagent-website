import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cpu, ExternalLink, LogOut, Rocket, Server, Shield, Sparkles, User, Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface HermesStatus {
  has_instance: boolean;
  instance_id: number | null;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [status, setStatus] = useState<HermesStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [instanceName, setInstanceName] = useState("我的 HermesAgent");
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
      const response = await api.get("/hermes/status");
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
      await api.post("/hermes/create", null, { params: { name: instanceName } });
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
      const response = await api.post("/hermes/access");
      setAccessInfo(response.data);
      window.open(response.data.proxy_url, "_blank");
    } catch (err: any) {
      setError(err.response?.data?.detail || "获取访问链接失败");
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
              ? "您的 HermesAgent AI 助理已就绪"
              : "您还没有开通 HermesAgent AI 助理，点击下方按钮立即开通"}
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
                  <h2 className="text-xl font-bold text-white">开通 HermesAgent</h2>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span className="text-slate-300 text-sm font-medium">CPU</span>
                    </div>
                    <p className="text-white text-lg font-bold">2 核</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300 text-sm font-medium">内存</span>
                    </div>
                    <p className="text-white text-lg font-bold">4 GB</p>
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
                  <span>系统：Ubuntu 22.04 | 类型：HermesAgent Desktop</span>
                </div>

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
                  <h2 className="text-xl font-bold text-white">HermesAgent 管理</h2>
                  <p className="text-slate-400 text-sm">实例 ID: {status.instance_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-sm font-medium">CPU</span>
                  </div>
                  <p className="text-white text-lg font-bold">2 核</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm font-medium">内存</span>
                  </div>
                  <p className="text-white text-lg font-bold">4 GB</p>
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
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
