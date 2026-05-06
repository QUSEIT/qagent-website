import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Cloud, Shield, Zap, Download, Settings, Users, BookOpen, Coins,
  PenTool, Code, ChevronRight, ChevronLeft, Menu, X, Github, Twitter, Linkedin, Mail,
  Server, Box, Layers, Terminal, CheckCircle, ArrowRight, Sparkles,
  MessageSquare, FileText, Globe, Briefcase, Home, TrendingUp, Edit3,
  Laptop, Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [agentIndex, setAgentIndex] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const agents = [
    { name: "文案Q姐", role: "内容创作", color: "pink" },
    { name: "财务Q爷", role: "财务管理", color: "green" },
    { name: "工程Q哥", role: "技术编程", color: "blue" },
    { name: "教务阿Q", role: "学习辅导", color: "amber" },
  ];
  const visibleCount = 4;
  const totalPages = Math.ceil(agents.length / visibleCount);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handleStart = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-slate-950/95 backdrop-blur-md shadow-lg shadow-amber-500/10" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <polygon points="20,50 50,80 80,50 70,40 50,60 30,40" fill="url(#logoGrad)" />
                  <rect x="55" y="25" width="15" height="15" fill="#3b82f6" transform="rotate(45 62.5 32.5)" />
                  <rect x="45" y="10" width="10" height="10" fill="#ef4444" transform="rotate(45 50 15)" />
                  <rect x="30" y="30" width="8" height="8" fill="#22c55e" transform="rotate(45 34 34)" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">QAgent</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <button onClick={() => scrollToSection("principle")} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                技术原理
              </button>
              <button onClick={() => scrollToSection("deployment")} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                服务方式
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                收费模式
              </button>
              <button onClick={() => scrollToSection("showcase")} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                场景示范
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm"
                >
                  控制台
                </button>
              ) : (
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm"
                >
                  立即体验
                </button>
              )}
            </div>

            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900 border-t border-slate-800"
            >
              <div className="px-4 py-4 space-y-3">
                <button onClick={() => scrollToSection("principle")} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  技术原理
                </button>
                <button onClick={() => scrollToSection("deployment")} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  服务方式
                </button>
                <button onClick={() => scrollToSection("pricing")} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  收费模式
                </button>
                <button onClick={() => scrollToSection("showcase")} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  场景示范
                </button>
                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium"
                >
                  {isAuthenticated ? "控制台" : "立即体验"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">构建OPC（一人公司）的技术基座</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                QAgent
              </span>
            </h1>

            
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-base sm:text-lg">
              基于包括OpenClaw/HermesAgent等开源生态，构建企业级AI智能体容器化方案，让初级智能体变为可靠、可协作、即开即用的数字员工。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStart}
                className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center gap-2"
              >
                立即体验
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="https://github.com/QUSEIT/qagent-image" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border border-slate-600 text-slate-300 rounded-full font-semibold text-lg hover:border-amber-500 hover:text-amber-400 transition-all flex items-center gap-2">
                <Github className="w-5 h-5" />
                查看源码
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 lg:mt-32 mb-20"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30" />
              <div className="relative bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 overflow-hidden">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">开箱即用的数字员工库</h3>
                  <p className="text-slate-400 text-sm">点击查看ta如何工作</p>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAgentIndex((prev) => (prev - 1 + totalPages) % totalPages)}
                      className="shrink-0 w-10 h-10 rounded-full bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 border border-slate-700 flex items-center justify-center transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {agents.slice(agentIndex * visibleCount, agentIndex * visibleCount + visibleCount).map((agent) => (
                        <motion.div
                          key={agent.name}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className={`bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-${agent.color}-500/50 transition-all cursor-pointer group`}
                        >
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-${agent.color}-400/50 group-hover:border-${agent.color}-400 group-hover:shadow-lg group-hover:shadow-${agent.color}-500/30 transition-all`}>
                            <div className={`w-full h-full bg-${agent.color}-500/20 flex items-center justify-center`}>
                              <span className={`text-${agent.color}-400 text-2xl font-bold`}>{agent.name[0]}</span>
                            </div>
                          </div>
                          <p className="text-white font-medium text-sm">{agent.name}</p>
                          <p className="text-slate-500 text-xs mt-1">{agent.role}</p>
                          <div className="mt-2 flex items-center justify-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-green-400 text-xs">待命</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <button
                      onClick={() => setAgentIndex((prev) => (prev + 1) % totalPages)}
                      className="shrink-0 w-10 h-10 rounded-full bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 border border-slate-700 flex items-center justify-center transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <div className="flex -space-x-2">
                    {["Q", "A", "G", "T"].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-300">
                        {c}
                      </div>
                    ))}
                  </div>
                  <span>没有你需要的数字员工？→ 咨询新类型 ｜ 定制专属技能</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Principle Section */}
      <section id="principle" className="py-20 lg:py-32 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                技术原理
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              基于开源软件生态，构建企业级AI智能体容器化架构
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {[
                { icon: Box, title: "容器单体及集群技术", desc: "采用Docker容器化部署，支持单机运行与Kubernetes集群编排，实现弹性伸缩与高可用保障。每个Agent实例独立运行在隔离环境中，确保资源隔离与安全性。", color: "amber" },
                { icon: Layers, title: "OpenClaw / Hermes Agent / OpenCode 基座", desc: "集成OpenClaw、Hermes Agent等主流智能体，融合OpenCode等AI编程引擎，让数字员工具备自主迭代与技能进化的能力。", color: "blue" },
                { icon: Terminal, title: "精选专业技能，开箱即用", desc: "内置 SkillHub，精选应用市场与自研技能，覆盖文案创作、社媒发布、数据抓取、文档处理、数据分析等核心工作场景。", color: "green" },
              ].map((item) => (
                <div key={item.title} className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-${item.color}-500/50 transition-colors`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  架构示意图
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: MessageSquare, title: "用户交互层", desc: "微信 / QQ / Web / API", color: "amber" },
                    { icon: Server, title: "控制面 (Control Plane)", desc: "QAgent编排引擎", color: "blue" },
                    { icon: Cpu, title: "执行面 (Execution Plane)", desc: "OpenClaw / Hermes Agent / OpenCode 运行时", color: "green" },
                  ].map((layer, i, arr) => (
                    <div key={layer.title}>
                      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                        <div className={`w-10 h-10 bg-${layer.color}-500/20 rounded-lg flex items-center justify-center`}>
                          <layer.icon className={`w-5 h-5 text-${layer.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{layer.title}</p>
                          <p className="text-slate-500 text-sm">{layer.desc}</p>
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex items-center justify-center">
                          <div className="w-0.5 h-6 bg-slate-700" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: FileText, label: "文件系统" },
                      { icon: Globe, label: "浏览器" },
                      { icon: Code, label: "命令行" },
                    ].map((item) => (
                      <div key={item.label} className="p-3 bg-slate-800/30 rounded-lg text-center">
                        <item.icon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <p className="text-slate-500 text-xs">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section id="deployment" className="py-20 lg:py-32 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                服务方式
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              社区支持 / 按需部署 / 技能定制，灵活匹配您的数字员工建设需求
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Download, color: "green", title: "社区支持",
                desc: "适合个人爱好者与学习研究。基于开源版本自行部署，社区提供技术支持。",
                points: ["开源版本完全免费", "社区论坛技术支持", "文档与教程支持"],
                btn: "了解详情",
              },
              {
                icon: Settings, color: "blue", title: "按需部署",
                desc: "适合企业用户。由我们提供专业的私有化部署实施服务，支持单节点与多节点容器集群。",
                points: ["专业团队部署实施", "集群高可用架构", "按需定制配置"],
                btn: "获取方案",
              },
              {
                icon: Layers, color: "red", title: "技能定制",
                desc: "针对特殊业务场景的个性化数字员工技能开发。基于现有能力进行深度定制，满足独特业务需求。",
                points: ["深度技能定制", "专属工作流编排", "源码级交付"],
                btn: "需求评估",
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className={`h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-${plan.color}-500/50 transition-all`}>
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      {plan.badge}
                    </div>
                  )}
                  <div className={`w-12 h-12 bg-${plan.color}-500/10 rounded-xl flex items-center justify-center mb-6`}>
                    <plan.icon className={`w-6 h-6 text-${plan.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{plan.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">{plan.desc}</p>
                  <div className="space-y-3 mb-6">
                    {plan.points.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className={`w-4 h-4 text-${plan.color}-400`} />
                        {p}
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-3 border border-${plan.color}-500 text-${plan.color}-400 rounded-lg font-medium hover:bg-${plan.color}-500 hover:text-${plan.color === "blue" ? "white" : "slate-950"} transition-all`}>
                    {plan.btn}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                收费模式
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              从免费到企业级，按需选择，灵活付费
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {[
              {
                icon: Download, color: "green", title: "社区版本",
                price: "免费", unit: "",
                billing: "灵活定制",
                desc: "开源版本，完全免费，自行部署，社区技术支持。",
                points: ["开源版本完全免费", "社区论坛技术支持", "文档与教程支持"],
                btn: "了解详情",
                highlight: false,
              },
              {
                icon: Server, color: "blue", title: "独立节点部署",
                price: "¥5,000", unit: "/ 节点", billing: "支持1-6容器",
                desc: "专业私有化部署，按实际节点计费，享1年专业技术支持。",
                points: ["系统部署与环境调优", "节点配置和技能组合", "交付培训与文档"],
                btn: "了解详情",
                highlight: false,
              },
              {
                icon: Shield, color: "amber", title: "集群部署", badge: "推荐",
                price: "¥12,000", unit: "起 / 年", billing: "按年订阅",
                desc: "集群私有化部署，按节点角色与数量计费，享1年专业技术支持。",
                points: ["专业私有化部署", "按实际节点计费", "1年专业技术支持"],
                btn: "立即联系",
                highlight: true,
              },
              {
                icon: Box, color: "red", title: "技能定制",
                price: "另行评估", unit: "", billing: "按需报价",
                desc: "源码级定制开发，满足深度业务需求。",
                points: ["深度需求调研", "源码级定制开发", "专属技术支持与交付"],
                btn: "获取方案",
                highlight: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className={`h-full rounded-2xl p-8 transition-all ${plan.highlight ? 'bg-gradient-to-b from-amber-500/10 to-slate-900 border-2 border-amber-500/50' : 'bg-slate-900 border border-slate-800 hover:border-slate-700'}`}>
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      {plan.badge}
                    </div>
                  )}
                  <div className={`w-12 h-12 bg-${plan.color}-500/10 rounded-xl flex items-center justify-center mb-6`}>
                    <plan.icon className={`w-6 h-6 text-${plan.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.unit && <span className="text-slate-400 text-sm ml-1">{plan.unit}</span>}
                  </div>
                  {plan.billing && (
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 bg-${plan.color}-500/10 text-${plan.color}-400`}>
                      {plan.billing}
                    </div>
                  )}
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">{plan.desc}</p>
                  <div className="space-y-3 mb-6">
                    {plan.points.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className={`w-4 h-4 text-${plan.color}-400 flex-shrink-0`} />
                        {p}
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-3 rounded-lg font-medium transition-all ${plan.highlight ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30' : `border border-${plan.color}-500 text-${plan.color}-400 hover:bg-${plan.color}-500 hover:text-${plan.color === "blue" ? "white" : "slate-950"}`}`}>
                    {plan.btn}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-20 lg:py-32 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                场景示范
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              在真实场景中，QAgent数字员工如何为您提升效率
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              { icon: Briefcase, color: "amber", title: "企业办公场景", metric: "效率提升 300%", desc: "在繁忙的办公环境中，QAgent成为您的智能秘书。自动整理会议纪要、安排日程提醒、处理邮件回复、管理待办事项。一位市场经理使用后，每日节省2小时行政时间，将精力集中在核心业务决策上。", points: ["语音录入自动生成会议纪要", "智能日程冲突检测与优化", "邮件自动分类与智能回复建议"] },
              { icon: Home, color: "blue", title: "学习辅导场景", metric: "学习效率提升 150%", desc: "老师通过QAgent为学生制定个性化学习计划，自动整理学习资料、生成知识框架图、监督学习进度。一位班主任使用后，班级平均成绩提升15%，教学效率显著提高。", points: ["智能生成个性化学习计划", "知识点自动梳理与思维导图", "作业批改与错题分析"] },
              { icon: TrendingUp, color: "green", title: "财务管理场景", metric: "报销效率提升 500%", desc: "月末报销不再头疼。QAgent自动识别发票信息、分类整理单据、生成报销明细表、计算金额汇总。一位销售代表使用后，原本需要半天整理的报销材料，现在5分钟完成。", points: ["发票自动识别与信息提取", "智能分类与报销单自动生成", "费用统计与预算跟踪"] },
              { icon: Edit3, color: "red", title: "内容创作场景", metric: "创作效率提升 400%", desc: "自媒体创作者使用QAgent进行选题调研、素材收集、内容撰写、多平台适配。一位科技博主使用后，原本一周的内容产出，现在一天即可完成，粉丝增长300%。", points: ["热点话题自动追踪与选题建议", "一键生成多平台适配内容", "文案润色与SEO优化"] },
              { icon: Laptop, color: "indigo", title: "软件项目管理场景", metric: "产品迭代效率提升 10倍", desc: "开发者使用QAgent来管理Claude Code，文档编写、项目发布。一位全栈工程师使用后，项目交付周期缩短了80%，代码质量显著提升。", points: ["Claude Code项目管理", "文档自动编写与更新", "项目一键发布与部署"] },
              { icon: Search, color: "purple", title: "研究分析场景", metric: "研究效率提升 350%", desc: "研究人员使用QAgent进行文献检索、资料整理、数据分析、报告撰写。一位研究生使用后，文献综述撰写时间从两周缩短至两天，研究效率大幅提升。", points: ["学术文献自动检索与摘要", "数据自动整理与可视化", "研究报告自动生成"] },
            ].map((scene, i) => (
              <motion.div
                key={scene.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group"
              >
                <div className={`h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-${scene.color}-500/50 transition-all hover:shadow-xl hover:shadow-${scene.color}-500/10`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 bg-${scene.color}-500/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <scene.icon className={`w-6 h-6 text-${scene.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{scene.title}</h3>
                      <p className={`text-${scene.color}-400 text-sm`}>{scene.metric}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{scene.desc}</p>
                  <div className="space-y-2">
                    {scene.points.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className={`w-4 h-4 text-${scene.color}-400 flex-shrink-0`} />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-amber-400" />
                <span className="text-slate-300">还有更多场景等待探索？</span>
              </div>
              <button
                onClick={handleStart}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2"
              >
                定制您的专属场景
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-white">准备好拥有您的</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">数字员工</span>
              <span className="text-white">了吗？</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              立即体验，让QAgent成为您的数字员工，提升工作效率，释放创造力和生产力
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStart}
                className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all"
              >
                立即体验
              </button>
              <button className="px-10 py-4 border border-slate-600 text-slate-300 rounded-full font-semibold text-lg hover:border-amber-500 hover:text-amber-400 transition-all flex items-center gap-2">
                <Mail className="w-5 h-5" />
                获取方案
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="logoGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <polygon points="20,50 50,80 80,50 70,40 50,60 30,40" fill="url(#logoGradFooter)" />
                    <rect x="55" y="25" width="15" height="15" fill="#3b82f6" transform="rotate(45 62.5 32.5)" />
                    <rect x="45" y="10" width="10" height="10" fill="#ef4444" transform="rotate(45 50 15)" />
                    <rect x="30" y="30" width="8" height="8" fill="#22c55e" transform="rotate(45 34 34)" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">QAgent</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                基于包括OpenClaw/HermesAgent等开源生态，构建企业级AI智能体容器化方案，让初级智能体变为可靠、可协作、即开即用的数字员工。
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">产品</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection("principle")} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">技术原理</button></li>
                <li><button onClick={() => scrollToSection("deployment")} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">服务方式</button></li>
                <li><button onClick={() => scrollToSection("pricing")} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">收费模式</button></li>
                <li><button onClick={() => scrollToSection("showcase")} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">场景示范</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">资源</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">开发文档</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">API参考</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">技能市场</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">社区论坛</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">商务合作</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">技术支持</a></li>
                <li><a href="#" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">加入我们</a></li>
              </ul>
              <div className="flex items-center gap-4 mt-4">
                <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-white transition-all">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; 2026 QAgent. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">隐私政策</a>
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">服务条款</a>
              <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Cookie设置</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
