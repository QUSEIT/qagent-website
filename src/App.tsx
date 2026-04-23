import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Cloud, 
  Shield, 
  Zap, 
  Download, 
  Settings, 
  Users, 
  BookOpen, 
  Coins, 
  PenTool, 
  Code,
  ChevronRight,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Server,
  Box,
  Layers,
  Terminal,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  FileText,
  Calendar,
  Globe,
  Briefcase,
  Home,
  TrendingUp,
  Edit3,
  Laptop,
  Clock,
  BarChart3,
  Search,
  FolderOpen,
  Send
} from 'lucide-react';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/95 backdrop-blur-md shadow-lg shadow-amber-500/10' : 'bg-transparent'
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
                <span className="text-lg font-bold text-white">Q Agent</span>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-8">
              <button onClick={() => scrollToSection('principle')} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                服务原理
              </button>
              <button onClick={() => scrollToSection('features')} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                服务特点
              </button>
              <button onClick={() => scrollToSection('deployment')} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                部署方式
              </button>
              <button onClick={() => scrollToSection('showcase')} className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium">
                场景示范
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm">
                立即体验
              </button>
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
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900 border-t border-slate-800"
            >
              <div className="px-4 py-4 space-y-3">
                <button onClick={() => scrollToSection('principle')} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  服务原理
                </button>
                <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  服务特点
                </button>
                <button onClick={() => scrollToSection('deployment')} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  部署方式
                </button>
                <button onClick={() => scrollToSection('showcase')} className="block w-full text-left py-2 text-slate-300 hover:text-amber-400">
                  场景示范
                </button>
                <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium">
                  立即体验
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
              <span className="text-amber-400 text-sm font-medium">OpenClaw 企业级智能体服务</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Q Agent
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-slate-300 mb-4 font-light">
              极大释放AI潜力，而不是作为玩具
            </p>
            
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-base sm:text-lg">
              基于 OpenClaw 开源生态打造的企业级AI智能体服务平台，让AI从"会回答"走向"会执行"，
              真正实现本地安全、微信远程、开箱即用的智能办公体验
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center gap-2">
                免费开始使用
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border border-slate-600 text-slate-300 rounded-full font-semibold text-lg hover:border-amber-500 hover:text-amber-400 transition-all flex items-center gap-2">
                <Github className="w-5 h-5" />
                查看源码
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 lg:mt-24"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30" />
              <div className="relative bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 overflow-hidden">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">您的专属AI助手团队</h3>
                  <p className="text-slate-400 text-sm">随时待命，可靠便捷，一键唤醒</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-pink-500/50 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-pink-400/50 group-hover:border-pink-400 group-hover:shadow-lg group-hover:shadow-pink-500/30 transition-all">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=writer1&backgroundColor=ffdfbf&hairColor=2c1b18&skinColor=f8d25c&clothing=blazerAndShirt&eyebrows=default&eyes=default&mouth=smile" alt="笔杆Q姐" className="w-full h-full" />
                    </div>
                    <p className="text-white font-medium text-sm">笔杆Q姐</p>
                    <p className="text-slate-500 text-xs mt-1">内容创作</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs">待命</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-green-500/50 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-green-400/50 group-hover:border-green-400 group-hover:shadow-lg group-hover:shadow-green-500/30 transition-all">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=finance1&backgroundColor=d1d4f9&hairColor=2c1b18&skinColor=ffdbac&clothing=collarAndSweater&eyebrows=default&eyes=default&mouth=serious&facialHair=beardMedium" alt="财神Q爹" className="w-full h-full" />
                    </div>
                    <p className="text-white font-medium text-sm">财神Q爹</p>
                    <p className="text-slate-500 text-xs mt-1">财务管理</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs">待命</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-blue-400/50 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=dev1&backgroundColor=c0aede&hairColor=2c1b18&skinColor=ffdbac&clothing=hoodie&eyebrows=default&eyes=default&mouth=default&glasses=round" alt="开发Q哥" className="w-full h-full" />
                    </div>
                    <p className="text-white font-medium text-sm">开发Q哥</p>
                    <p className="text-slate-500 text-xs mt-1">技术编程</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs">待命</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-amber-400/50 group-hover:border-amber-400 group-hover:shadow-lg group-hover:shadow-amber-500/30 transition-all">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1&backgroundColor=ffdfbf&hairColor=a55728&skinColor=ffdbac&clothing=blazerAndShirt&eyebrows=default&eyes=default&mouth=smile&accessories=glasses" alt="助教阿Q" className="w-full h-full" />
                    </div>
                    <p className="text-white font-medium text-sm">助教阿Q</p>
                    <p className="text-slate-500 text-xs mt-1">学习辅导</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs">待命</span>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-800">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=writer1&backgroundColor=ffdfbf&hairColor=2c1b18&skinColor=f8d25c&clothing=blazerAndShirt" alt="" className="w-full h-full" />
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-800">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=finance1&backgroundColor=d1d4f9&hairColor=2c1b18&skinColor=ffdbac&clothing=collarAndSweater&facialHair=beardMedium" alt="" className="w-full h-full" />
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-800">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=dev1&backgroundColor=c0aede&hairColor=2c1b18&skinColor=ffdbac&clothing=hoodie&glasses=round" alt="" className="w-full h-full" />
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-800">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1&backgroundColor=ffdfbf&hairColor=a55728&skinColor=ffdbac&clothing=blazerAndShirt&accessories=glasses" alt="" className="w-full h-full" />
                    </div>
                  </div>
                  <span>4位助手已就绪，等待您的指令</span>
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
                服务原理
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              基于容器化技术与开源生态，构建企业级AI智能体服务架构
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
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Box className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">容器单体及集群技术</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      采用Docker容器化部署，支持单机运行与Kubernetes集群编排，实现弹性伸缩与高可用保障。
                      每个Agent实例独立运行在隔离环境中，确保资源隔离与安全性。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">OpenClaw / Hermes Agent / Opencore 基座</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      基于OpenClaw开源框架构建，集成Hermes Agent智能调度引擎与Opencore核心运行时，
                      提供完整的AI Agent能力栈，支持工具调用、技能管理、任务编排等核心功能。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Terminal className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">AICoding 技术栈</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      集成主流国产大模型（Kimi、MiniMax、GLM、DeepSeek），支持自定义模型接入。
                      内置5000+ Skills生态，覆盖代码生成、文档处理、数据分析等开发场景。
                    </p>
                  </div>
                </div>
              </div>
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
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">用户交互层</p>
                      <p className="text-slate-500 text-sm">微信 / QQ / Web / API</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-0.5 h-6 bg-slate-700" />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">控制面 (Control Plane)</p>
                      <p className="text-slate-500 text-sm">Hermes Agent 调度引擎</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-0.5 h-6 bg-slate-700" />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">执行面 (Execution Plane)</p>
                      <p className="text-slate-500 text-sm">OpenClaw / Opencore 运行时</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-0.5 h-6 bg-slate-700" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-800/30 rounded-lg text-center">
                      <FileText className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-slate-500 text-xs">文件系统</p>
                    </div>
                    <div className="p-3 bg-slate-800/30 rounded-lg text-center">
                      <Globe className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-slate-500 text-xs">浏览器</p>
                    </div>
                    <div className="p-3 bg-slate-800/30 rounded-lg text-center">
                      <Code className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-slate-500 text-xs">命令行</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-slate-900/50 relative">
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
                服务特点
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              三大核心优势，让AI智能体真正服务于企业生产力
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/10">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Github className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">技术开源</h3>
                <p className="text-slate-400 leading-relaxed">
                  基于OpenClaw开源生态构建，代码透明可控。支持ClawHub官方技能市场与GitHub开源生态，
                  5000+ Skills随取随用，企业可自主定制开发，无供应商锁定风险。
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    开源代码，自主可控
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    丰富技能生态
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    支持自定义扩展
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">按需获取</h3>
                <p className="text-slate-400 leading-relaxed">
                  灵活的部署与计费模式，从个人开发者到大型企业均可按需选择。
                  支持本地部署、私有云、公有云多种形态，资源弹性伸缩，成本可控。
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    多种部署形态
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    弹性资源伸缩
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    成本优化可控
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/10">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI潜力释放</h3>
                <p className="text-slate-400 leading-relaxed">
                  不只是聊天对话，而是真正能执行任务的AI智能体。支持文件处理、浏览器操作、
                  代码编写、定时任务等复杂场景，让AI从"会回答"走向"会执行"。
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    任务自动执行
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    多场景覆盖
                  </li>
                  <li className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    持续记忆学习
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section id="deployment" className="py-20 lg:py-32 bg-slate-950 relative">
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
                部署方式
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              三种部署模式，满足不同规模与场景的需求
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="group relative"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-amber-500/50 transition-all">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  推荐
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Download className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">自行部署</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  适合个人开发者与技术团队。一键安装包，开箱即用，
                  支持Windows与macOS双平台，20秒完成部署。
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    一键安装，零配置
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    本地运行，数据安全
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    免费使用，开源生态
                  </div>
                </div>
                <button className="w-full py-3 border border-amber-500 text-amber-400 rounded-lg font-medium hover:bg-amber-500 hover:text-slate-950 transition-all">
                  下载安装
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Settings className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">私有定制部署</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  适合中大型企业。私有化部署方案，支持Kubernetes集群编排，
                  定制化开发与专属技术支持。
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    私有化部署
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    集群高可用
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    专属技术支持
                  </div>
                </div>
                <button className="w-full py-3 border border-blue-500 text-blue-400 rounded-lg font-medium hover:bg-blue-500 hover:text-white transition-all">
                  联系销售
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-green-500/50 transition-all">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Cloud className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">云服务</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  适合快速启动与弹性需求。SaaS化云服务，按需付费，
                  免运维，支持多租户管理与企业级SLA保障。
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    即开即用
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    弹性伸缩
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    企业级SLA
                  </div>
                </div>
                <button className="w-full py-3 border border-green-500 text-green-400 rounded-lg font-medium hover:bg-green-500 hover:text-white transition-all">
                  了解详情
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Showcase Section - Scene Based */}
      <section id="showcase" className="py-20 lg:py-32 bg-slate-900/50 relative">
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
              在真实场景中，Q Agent如何帮助用户提升效率
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Enterprise Office Scene */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">企业办公场景</h3>
                    <p className="text-amber-400 text-sm">效率提升 300%</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  在繁忙的办公环境中，Q Agent成为您的智能秘书。自动整理会议纪要、安排日程提醒、
                  处理邮件回复、管理待办事项。一位市场经理使用后，每日节省2小时行政时间，
                  将精力集中在核心业务决策上。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>语音录入自动生成会议纪要</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>智能日程冲突检测与优化</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>邮件自动分类与智能回复建议</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Home Learning Scene */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">家庭学习场景</h3>
                    <p className="text-blue-400 text-sm">学习效率提升 150%</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  家长通过Q Agent为孩子制定个性化学习计划，自动整理学习资料、生成知识框架图、
                  监督学习进度。一位高中生使用后，期末成绩提升20%，学习效率显著提高。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>智能生成个性化学习计划</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>知识点自动梳理与思维导图</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>作业批改与错题分析</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Financial Management Scene */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">财务管理场景</h3>
                    <p className="text-green-400 text-sm">报销效率提升 500%</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  月末报销不再头疼。Q Agent自动识别发票信息、分类整理单据、生成报销明细表、
                  计算金额汇总。一位销售代表使用后，原本需要半天整理的报销材料，现在5分钟完成。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>发票自动识别与信息提取</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>智能分类与报销单自动生成</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>费用统计与预算跟踪</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content Writing Scene */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-pink-500/50 transition-all hover:shadow-xl hover:shadow-pink-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Edit3 className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">内容创作场景</h3>
                    <p className="text-pink-400 text-sm">创作效率提升 400%</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  自媒体创作者使用Q Agent进行选题调研、素材收集、内容撰写、多平台适配。
                  一位科技博主使用后，原本一周的内容产出，现在一天即可完成，粉丝增长300%。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span>热点话题自动追踪与选题建议</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span>一键生成多平台适配内容</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span>文案润色与SEO优化</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Software Development Scene */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Laptop className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">软件开发场景</h3>
                    <p className="text-indigo-400 text-sm">开发效率提升 200%</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  开发者使用Q Agent进行代码生成、Bug调试、文档编写、GitHub项目管理。
                  一位全栈工程师使用后，项目交付周期缩短40%，代码质量显著提升。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>自然语言描述生成代码</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>自动调试与Bug修复建议</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>GitHub项目自动托管与提交</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Research Analysis Scene */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="group"
            >
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">研究分析场景</h3>
                    <p className="text-purple-400 text-sm">研究效率提升 350%</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  研究人员使用Q Agent进行文献检索、资料整理、数据分析、报告撰写。
                  一位研究生使用后，文献综述撰写时间从两周缩短至两天，研究效率大幅提升。
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>学术文献自动检索与摘要</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>数据自动整理与可视化</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>研究报告自动生成</span>
                  </div>
                </div>
              </div>
            </motion.div>
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
              <button className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2">
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
              <span className="text-white">准备好释放AI的</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">真正潜力</span>
              <span className="text-white">了吗？</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              立即开始使用Q Agent，让AI智能体成为您的得力助手，提升工作效率，释放创造力
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all">
                免费开始使用
              </button>
              <button className="px-10 py-4 border border-slate-600 text-slate-300 rounded-full font-semibold text-lg hover:border-amber-500 hover:text-amber-400 transition-all flex items-center gap-2">
                <Mail className="w-5 h-5" />
                联系销售
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
                  <span className="text-lg font-bold text-white">Q Agent</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                基于OpenClaw开源生态的企业级AI智能体服务平台，让AI从"会回答"走向"会执行"。
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">产品</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('principle')} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">服务原理</button></li>
                <li><button onClick={() => scrollToSection('features')} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">服务特点</button></li>
                <li><button onClick={() => scrollToSection('deployment')} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">部署方式</button></li>
                <li><button onClick={() => scrollToSection('showcase')} className="text-slate-400 hover:text-amber-400 text-sm transition-colors">场景示范</button></li>
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
              © 2026 Q Agent. All rights reserved.
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

export default App;

