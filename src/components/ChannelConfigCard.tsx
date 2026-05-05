import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, QrCode } from "lucide-react";

type ChannelType = "feishu" | "wechat" | "qq";

const CHANNEL_META: Record<
  ChannelType,
  { label: string; desc: string; qrPlaceholder: string }
> = {
  feishu: {
    label: "飞书",
    desc: "通过飞书机器人与 QAgent 交互",
    qrPlaceholder: "飞书群机器人二维码",
  },
  wechat: {
    label: "微信",
    desc: "通过微信与 QAgent 交互",
    qrPlaceholder: "微信服务号二维码",
  },
  qq: {
    label: "QQ",
    desc: "通过 QQ 群机器人与 QAgent 交互",
    qrPlaceholder: "QQ 群机器人二维码",
  },
};

const ChannelConfigCard: React.FC = () => {
  const [channel, setChannel] = useState<ChannelType | null>(null);

  const handleSelectChannel = (c: ChannelType) => {
    setChannel(c);
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
            <div className="text-center">
              <p className="text-slate-300 text-sm mb-4">
                {CHANNEL_META[channel].desc}
              </p>

              <div className="inline-flex flex-col items-center">
                <div className="w-48 h-48 bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 mb-3">
                  <QrCode className="w-10 h-10 text-slate-500" />
                  <span className="text-slate-500 text-xs">
                    {CHANNEL_META[channel].qrPlaceholder}
                  </span>
                </div>
                <p className="text-slate-500 text-xs">
                  扫码添加或绑定
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChannelConfigCard;
