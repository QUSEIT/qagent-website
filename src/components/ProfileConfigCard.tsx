import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle, Plus, Star, MoreVertical, Trash2, Edit3, Loader2, CheckCircle, AlertCircle, X, Save,
} from "lucide-react";
import api from "../services/api";

interface ProfileConfigCardProps {
  instanceId?: number;
}

interface Profile {
  id: number;
  instance_id: number;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  skills: string[];
  is_default: number;  // 0=normal, 1=default
  is_active: number;   // 0=normal, 1=active
  agent_id: string | null;
  soul_content: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_FORM: Omit<Profile, "id" | "instance_id" | "created_at" | "updated_at" | "agent_id" | "soul_content"> & { agent_id?: null; soul_content?: null } = {
  name: "",
  description: "",
  system_prompt: "",
  model: "kimi-k2.6",
  temperature: 0.7,
  skills: [],
  is_default: 0,
  is_active: 0,
  agent_id: null,
  soul_content: null,
};

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-sonnet-4-7", label: "Claude Sonnet 4" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4" },
  { value: "minimax/MiniMax-M2", label: "Minimax M2" },
  { value: "kimi/kimi-code", label: "Kimi Code" },
];

const SKILL_OPTIONS = [
  { value: "web-search", label: "网页搜索" },
  { value: "code-exec", label: "代码执行" },
  { value: "drawing", label: "绘图生成" },
  { value: "file-read", label: "文件读取" },
  { value: "web-browse", label: "网页浏览" },
];

const ProfileConfigCard: React.FC<ProfileConfigCardProps> = ({ instanceId }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [formError, setFormError] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [savingProfileId, setSavingProfileId] = useState<number | null>(null);

  type FormData = Omit<Profile, "created_at" | "updated_at">;
  const [form, setForm] = useState<FormData>(DEFAULT_FORM as FormData);

  useEffect(() => {
    if (!instanceId) return;
    setIsLoading(true);
    api.get(`/qagent/profiles/${instanceId}`)
      .then((res) => {
        const data = res.data as Profile[];
        setProfiles(data);
        if (data.length > 0) {
          const defaultOne = data.find((p) => p.is_default) || data[0];
          setSelectedProfile(defaultOne);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [instanceId]);

  const openAddModal = () => {
    setForm({ ...DEFAULT_FORM } as FormData);
    setFormError("");
    setModalMode("add");
    setShowModal(true);
  };

  const openEditModal = (profile: Profile) => {
    setForm({ ...profile });
    setFormError("");
    setModalMode("edit");
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleFormChange = (field: keyof FormData, value: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setFormError("请输入档案名称");
      return;
    }
    if (!instanceId) return;
    setSaving(true);
    setFormError("");
    try {
      if (modalMode === "add") {
        const res = await api.post(`/qagent/profiles/${instanceId}`, form);
        const newProfile = res.data as Profile;
        setProfiles((prev) => [...prev, newProfile]);
        setSelectedProfile(newProfile);
      } else {
        const res = await api.put(`/qagent/profiles/${instanceId}/${form.id}`, form);
        const updated = res.data as Profile;
        setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedProfile(updated);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (profile: Profile) => {
    if (!instanceId) return;
    setSavingProfileId(profile.id);
    try {
      await api.post(`/qagent/profiles/${instanceId}/${profile.id}/default`);
      setProfiles((prev) =>
        prev.map((p) => ({ ...p, is_default: p.id === profile.id ? 1 : 0 }))
      );
      if (selectedProfile) {
        setSelectedProfile({ ...selectedProfile, is_default: 1 });
      }
    } catch (err: any) {
      // silent
    } finally {
      setSavingProfileId(null);
      setMenuOpenId(null);
    }
  };

  const handleDeleteRequest = (profile: Profile) => {
    setProfileToDelete(profile);
    setShowDeleteConfirm(true);
    setMenuOpenId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!instanceId || !profileToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/qagent/profiles/${instanceId}/${profileToDelete.id}`);
      const remaining = profiles.filter((p) => p.id !== profileToDelete.id);
      setProfiles(remaining);
      if (selectedProfile?.id === profileToDelete.id) {
        const next = remaining.find((p) => p.is_default) || remaining[0] || null;
        setSelectedProfile(next);
      }
    } catch (err: any) {
      // silent
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setProfileToDelete(null);
    }
  };

  const handleActivate = async (profile: Profile) => {
    setProfiles((prev) =>
      prev.map((p) => ({ ...p, is_active: p.id === profile.id ? 1 : 0 }))
    );
    setSelectedProfile({ ...profile, is_active: 1 });
  };

  if (!instanceId) {
    return (
      <div className="py-10 text-center text-slate-500 text-sm">
        请先选择一个实例
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">多档案配置</h2>
            <p className="text-slate-400 text-sm">每个档案定义一个 Agent 角色与行为</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-full">
          {profiles.length} 个档案
        </span>
      </div>

      {/* Profile Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          <p className="text-slate-500 text-sm">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Profile cards */}
          {profiles.map((profile, idx) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`relative bg-slate-900 border rounded-2xl p-6 transition-all cursor-pointer group ${
                selectedProfile?.id === profile.id
                  ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
                  : "border-slate-800 hover:border-slate-700"
              }`}
              onClick={() => setSelectedProfile(profile)}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {profile.is_default === 1 && (
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  )}
                  {profile.is_active === 1 && profile.is_default !== 1 && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full font-medium">
                      已激活
                    </span>
                  )}
                </div>

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === profile.id ? null : profile.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {menuOpenId === profile.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-8 z-20 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEditModal(profile)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white text-sm transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          编辑档案
                        </button>
                        {!profile.is_default && (
                          <button
                            onClick={() => handleSetDefault(profile)}
                            disabled={savingProfileId === profile.id}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-300 hover:bg-slate-700 hover:text-white text-sm transition-all disabled:opacity-50"
                          >
                            {savingProfileId === profile.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Star className="w-3.5 h-3.5" />
                            )}
                            设为默认
                          </button>
                        )}
                        {profiles.length > 1 && (
                          <button
                            onClick={() => handleDeleteRequest(profile)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 text-sm transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除档案
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Profile name */}
              <h3 className="text-white font-semibold text-base mb-1 leading-tight">
                {profile.name}
              </h3>
              <p className="text-slate-500 text-xs mb-3 leading-relaxed">
                {profile.description || "暂无描述"}
              </p>

              {/* Tags row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[11px] rounded-md">
                  {profile.model}
                </span>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[11px] rounded-md">
                  T: {profile.temperature}
                </span>
                {profile.skills.slice(0, 2).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] rounded-md">
                    {SKILL_OPTIONS.find((o) => o.value === skill)?.label || skill}
                  </span>
                ))}
                {profile.skills.length > 2 && (
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-500 text-[11px] rounded-md">
                    +{profile.skills.length - 2}
                  </span>
                )}
              </div>

              {/* Activate button on hover */}
              {profile.is_active !== 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleActivate(profile); }}
                  className="mt-3 w-full py-2 bg-slate-800 hover:bg-green-500/20 border border-slate-700 hover:border-green-500/30 text-slate-400 hover:text-green-400 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
                >
                  激活此档案
                </button>
              )}
            </motion.div>
          ))}

          {/* Add new card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: profiles.length * 0.05 }}
            onClick={openAddModal}
            className="bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:bg-slate-900 min-h-[140px] group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-amber-500/10 border border-slate-700 group-hover:border-amber-500/30 flex items-center justify-center transition-all">
              <Plus className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-all" />
            </div>
            <span className="text-slate-500 group-hover:text-slate-300 text-sm font-medium transition-all">
              新增档案
            </span>
          </motion.button>
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpenId !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpenId(null)}
        />
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => !saving && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {modalMode === "add" ? "新增档案" : "编辑档案"}
                  </h3>
                </div>
                <button
                  onClick={() => !saving && setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    档案名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="例如：我的助手、代码助手"
                    maxLength={50}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    档案描述
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    placeholder="简单描述这个档案的用途"
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    系统指令
                  </label>
                  <textarea
                    value={form.system_prompt}
                    onChange={(e) => handleFormChange("system_prompt", e.target.value)}
                    placeholder="定义 Agent 的角色、行为规范与能力边界..."
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                  />
                </div>

                {/* Model + Temperature */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      模型
                    </label>
                    <div className="relative">
                      <select
                        value={form.model}
                        onChange={(e) => handleFormChange("model", e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none pr-8"
                      >
                        {MODEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Temperature
                    </label>
                    <input
                      type="number"
                      value={form.temperature}
                      onChange={(e) => handleFormChange("temperature", parseFloat(e.target.value) || 0)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    附加技能
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((opt) => {
                      const selected = form.skills.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSkillToggle(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            selected
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          {selected && <CheckCircle className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm">{formError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => !saving && setShowModal(false)}
                    disabled={saving}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-all disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存档案
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && profileToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">确认删除档案？</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    将删除「{profileToDelete.name}」，此操作不可撤销。
                    {profileToDelete.is_default === 1 && (
                      <span className="text-amber-400"> 这是默认档案，删除后第一个档案将自动成为默认。</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      删除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      确认删除
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileConfigCard;
