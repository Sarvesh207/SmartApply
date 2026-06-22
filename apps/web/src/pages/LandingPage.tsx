import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Target, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Cpu, 
  Shield, 
  Zap, 
  ExternalLink,
  Chrome,
  CheckCircle2,
  Lock,
  Globe,
  User,
  FileText,
  Play,
  Check,
  Terminal,
  Settings as SettingsIcon,
  ChevronRight,
  Search,
  Upload,
  RefreshCw,
  Sliders,
  Send,
  Building,
  MapPin,
  Activity,
  Database,
  Network,
  HelpCircle,
  FileCode,
  ListTodo
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  
  // Interactive simulator pipeline states
  const [simState, setSimState] = useState<'idle' | 'scraping' | 'matching' | 'autofilling' | 'done'>('idle');
  const [simProgress, setSimProgress] = useState(0);
  const [simScrapedCount, setSimScrapedCount] = useState(0);
  const [simMatchTarget, setSimMatchTarget] = useState<'openai' | 'stripe' | 'google'>('openai');
  const [simFilledFields, setSimFilledFields] = useState<string[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'agent' | 'terminal' | 'config'>('agent');
  
  // Custom interactive Zod validation box states
  const [zodEmail, setZodEmail] = useState('sarvesh@example.com');
  const [zodPhone, setZodPhone] = useState('+91 98765 43210');
  const [zodPortfolio, setZodPortfolio] = useState('portfolio.dev');
  
  // Custom CTA floating panel states
  const [speedSetting, setSpeedSetting] = useState<'fast' | 'natural'>('natural');
  const [browserMode, setBrowserMode] = useState<'headless' | 'headed'>('headless');
  const [agentModel, setAgentModel] = useState<'sonnet' | 'haiku'>('sonnet');

  // Trigger agent pipeline demo
  const triggerSimulation = () => {
    if (simState !== 'idle') return;
    
    // 1. Scraping Phase
    setSimState('scraping');
    setSimProgress(0);
    setSimScrapedCount(0);
    setSimFilledFields([]);
    
    let scrapeInterval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(scrapeInterval);
          setSimScrapedCount(3);
          
          // Transition to Matching Phase
          setTimeout(() => {
            setSimState('matching');
            setSimProgress(0);
            
            // 2. Matching Phase
            let matchInterval = setInterval(() => {
              setSimProgress(p => {
                if (p >= 100) {
                  clearInterval(matchInterval);
                  
                  // Transition to Autofill Phase
                  setTimeout(() => {
                    setSimState('autofilling');
                    setSimProgress(0);
                    
                    // 3. Autofill Phase (Step-by-step fields)
                    const fields = ['Full Name', 'Email', 'Portfolio Link', 'Resume PDF'];
                    fields.forEach((field, idx) => {
                      setTimeout(() => {
                        setSimFilledFields(prevFields => [...prevFields, field]);
                        if (idx === fields.length - 1) {
                          setTimeout(() => {
                            setSimState('done');
                          }, 1000);
                        }
                      }, (idx + 1) * 600);
                    });
                  }, 800);
                  
                  return 100;
                }
                return p + 10;
              });
            }, 100);
          }, 800);
          
          return 100;
        }
        return prev + 5;
      });
    }, 80);
  };

  const resetSimulation = () => {
    setSimState('idle');
    setSimProgress(0);
    setSimScrapedCount(0);
    setSimFilledFields([]);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="bg-[#000000] min-h-screen text-white selection:bg-white selection:text-black overflow-x-hidden font-sans relative">
      
      {/* Background blueprint layout mesh lines (Framer Style) */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none -z-20"></div>
      <div className="absolute top-0 left-0 w-full h-[1000px] bg-grid-pattern opacity-10 pointer-events-none -z-20"></div>

      {/* Floating high-contrast clean radial spotlight behind content */}
      <div className="absolute top-[-100px] left-[20%] w-[800px] h-[800px] bg-white/[0.02] rounded-full filter blur-[150px] pointer-events-none -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-white/[0.01] rounded-full filter blur-[150px] pointer-events-none -z-10"></div>

      {/* 1. SaaS NAVIGATION HEADER (Clean sticky borders) */}
      <header className="sticky top-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-neutral-900 py-3.5 px-6 md:px-12 flex justify-between items-center h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black">
            <Target className="w-5 h-5 text-black" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">SmartApply</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
          <a href="#product" className="hover:text-white transition-colors">Workspace</a>
          <a href="#features" className="hover:text-white transition-colors">Specs Matrix</a>
          <a href="#bento" className="hover:text-white transition-colors">Architecture</a>
        </nav>

        <div className="flex items-center gap-4">
          {token ? (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="py-1.5 px-4 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-all flex items-center gap-1"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <Link to="/login" className="text-neutral-400 hover:text-white text-xs font-semibold tracking-wide transition-colors">Log in</Link>
              <button 
                onClick={() => navigate('/register')} 
                className="py-1.5 px-4 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-all"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO HEADER SECTION (Left-aligned, crisp white, clean buttons) */}
      <section className="relative pt-24 pb-20 px-6 md:px-12 max-w-6xl mx-auto flex flex-col items-start text-left">
        
        {/* Floating Release badge */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[#0a0a0a] border border-neutral-900 rounded-full text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-6 hover:border-neutral-800 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-ping"></span>
          <span>SmartApply Grayscale release v3.0</span>
          <ChevronRight className="w-3 h-3 text-neutral-600" />
        </motion.div>

        {/* Hero Headings */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl"
        >
          <motion.h1 
            variants={itemVariants} 
            className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white"
          >
            Apply with agents.<br />
            Refine on the canvas.<br />
            Land on the table.
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-neutral-400 text-sm md:text-lg max-w-2xl leading-relaxed font-sans font-normal pt-2"
          >
            An autonomous browser automation assistant. Scrape listings automatically, evaluate matching scores with AI models, and fill form fields via secure Playwright browser runners.
          </motion.p>

          <motion.div variants={itemVariants} className="pt-6 flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/register')} 
              className="py-3 px-6 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:scale-101"
            >
              Get started for free
            </button>
            <button 
              onClick={() => {
                if (token) navigate('/jobs');
                else navigate('/login');
              }} 
              className="py-3 px-6 bg-transparent border border-neutral-800 text-white font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-neutral-900 transition-all hover:scale-101"
            >
              Explore Job Board
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. WORKSPACE CANVAS MOCKUP (The center high-fidelity interactive illustration) */}
      <section id="product" className="px-6 max-w-6xl mx-auto pb-24">
        <div className="bg-[#050505] border border-neutral-900 rounded-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
          
          {/* Mockup Window Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-neutral-900 text-xs">
            <div className="flex gap-1.5 items-center">
              <span className="w-2.5 h-2.5 bg-neutral-800 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-neutral-800 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-neutral-800 rounded-full"></span>
              <span className="text-[10px] text-neutral-500 font-mono ml-4">workspace.smartapply.dev / agent-canvas</span>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-neutral-500 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${simState !== 'idle' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                {simState === 'idle' ? 'Worker Offline' : 'Worker Live'}
              </div>
              <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 text-[8px] font-mono border border-neutral-800">API: 200 OK</span>
            </div>
          </div>

          {/* Mockup Workspace Body (3-Column Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[460px] divide-y md:divide-y-0 md:divide-x divide-neutral-900">
            
            {/* Column 1: Left Workspace Sidebar */}
            <div className="p-4 bg-[#030303] text-left space-y-5">
              <div>
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block mb-2">Workspace Nodes</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 text-xs text-white">
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-neutral-400" /> LinkedIn Scraper
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-neutral-500" /> Indeed Crawler
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-neutral-500" /> Resume Profile
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-700"></span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold block mb-2">Preset Profiles</span>
                <div className="space-y-1 font-mono text-[9px] text-neutral-400">
                  <div className="p-2 border border-neutral-900 rounded bg-neutral-950/40 flex justify-between">
                    <span>Sarvesh_CV.pdf</span>
                    <span className="text-neutral-600">Active</span>
                  </div>
                  <div className="p-2 border border-neutral-900 rounded bg-neutral-950/40 flex justify-between">
                    <span>Credentials preset</span>
                    <span className="text-neutral-600">Encrypted</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {simState === 'idle' ? (
                  <button 
                    onClick={triggerSimulation}
                    className="w-full py-2.5 px-3 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 flex items-center justify-center gap-1.5 transition-all shadow shadow-white/5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Agent Demo
                  </button>
                ) : (
                  <button 
                    onClick={resetSimulation}
                    className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Simulation
                  </button>
                )}
              </div>
            </div>

            {/* Column 2 & 3: Middle Canvas Area (With Grid mesh and active flow nodes) */}
            <div className="md:col-span-2 p-6 bg-[#020202] bg-grid-pattern relative flex flex-col justify-between overflow-hidden">
              
              {/* Overlay Flow Guide Lines */}
              <div className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-neutral-900 -translate-y-1/2 -z-10"></div>
              
              {/* Canvas Headers */}
              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                <span>ACTIVE WORKFLOW NET</span>
                <span>GRID: OFFSETS [X: 12, Y: -4]</span>
              </div>

              {/* Connected Active Nodes */}
              <div className="grid grid-cols-3 gap-4 items-center justify-center py-10 relative z-10">
                
                {/* Node 1: Scraper */}
                <div className={`p-3 bg-black border rounded-lg text-left space-y-2 transition-all duration-300 ${
                  simState === 'scraping' 
                    ? 'border-white ring-1 ring-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                    : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">1. Scraping</span>
                    <Activity className={`w-3 h-3 ${simState === 'scraping' ? 'text-white' : 'text-neutral-600'}`} />
                  </div>
                  <div className="text-xs font-bold text-white">LinkedIn Scraper</div>
                  {simState === 'scraping' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[8px] text-neutral-400 font-mono">
                        <span>Progress</span>
                        <span>{simProgress}%</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-1 transition-all duration-75" style={{ width: `${simProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                  {simScrapedCount > 0 && (
                    <div className="text-[8px] text-emerald-400 font-bold font-mono">✓ Found 3 jobs</div>
                  )}
                </div>

                {/* Node 2: Matching */}
                <div className={`p-3 bg-black border rounded-lg text-left space-y-2 transition-all duration-300 ${
                  simState === 'matching' 
                    ? 'border-white ring-1 ring-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                    : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">2. Match AI</span>
                    <Cpu className={`w-3 h-3 ${simState === 'matching' ? 'text-white' : 'text-neutral-600'}`} />
                  </div>
                  <div className="text-xs font-bold text-white">Model scoring</div>
                  
                  {simState === 'matching' && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden relative">
                        <div className="bg-white h-full transition-all duration-75" style={{ width: `${simProgress}%` }}></div>
                      </div>
                      <div className="text-[8px] text-neutral-400 font-mono">Evaluating qualifications...</div>
                    </div>
                  )}

                  {simState !== 'idle' && simState !== 'scraping' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-300 bg-neutral-900 px-1 py-0.5 rounded">
                        <span>OpenAI</span>
                        <span className="text-emerald-400 font-bold">98% Match</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-300 bg-neutral-900 px-1 py-0.5 rounded">
                        <span>Stripe</span>
                        <span className="text-emerald-400 font-bold">91% Match</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Node 3: Playwright Fill */}
                <div className={`p-3 bg-black border rounded-lg text-left space-y-2 transition-all duration-300 ${
                  simState === 'autofilling' || simState === 'done'
                    ? 'border-white ring-1 ring-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                    : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">3. Playwright</span>
                    <Chrome className={`w-3 h-3 ${simState === 'autofilling' || simState === 'done' ? 'text-white' : 'text-neutral-600'}`} />
                  </div>
                  <div className="text-xs font-bold text-white">Browser Auto-fill</div>
                  
                  {simState === 'autofilling' && (
                    <div className="space-y-1 font-mono text-[7px] text-neutral-400">
                      <div className="flex justify-between">
                        <span>Email input</span>
                        <span className={simFilledFields.includes('Email') ? 'text-emerald-400 font-bold' : 'text-neutral-700'}>
                          {simFilledFields.includes('Email') ? '✓ Fill' : '...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resume PDF</span>
                        <span className={simFilledFields.includes('Resume PDF') ? 'text-emerald-400 font-bold' : 'text-neutral-700'}>
                          {simFilledFields.includes('Resume PDF') ? '✓ Fill' : '...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {simState === 'done' && (
                    <div className="text-[9px] text-emerald-400 font-bold font-mono text-center flex items-center justify-center gap-1 pt-1 bg-emerald-500/10 border border-emerald-500/20 py-1 rounded">
                      <Check className="w-3.5 h-3.5" /> Autofill Ready
                    </div>
                  )}
                </div>

              </div>

              {/* Target job selector representation */}
              <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg text-left flex justify-between items-center">
                <div className="flex gap-2.5 items-center">
                  <Building className="w-4 h-4 text-neutral-500" />
                  <div>
                    <span className="text-[9px] text-neutral-500 block uppercase tracking-wider leading-none">Target Application</span>
                    <span className="text-xs font-bold text-white block mt-0.5">Staff Frontend Developer - OpenAI</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 font-mono block">SF, CA • Remote</span>
                  <span className="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-neutral-400 mt-1 inline-block font-mono">Autofill Mode</span>
                </div>
              </div>

            </div>

            {/* Column 4: Right Workspace Console Panel */}
            <div className="p-4 bg-[#030303] text-left flex flex-col justify-between">
              
              {/* Tab Selector */}
              <div className="space-y-4">
                <div className="flex border-b border-neutral-900 text-[10px] uppercase font-bold tracking-wider text-neutral-500 font-mono pb-2">
                  <button 
                    onClick={() => setActiveConsoleTab('agent')}
                    className={`flex-1 text-center transition-colors ${activeConsoleTab === 'agent' ? 'text-white' : 'hover:text-neutral-300'}`}
                  >
                    Agent Console
                  </button>
                  <button 
                    onClick={() => setActiveConsoleTab('terminal')}
                    className={`flex-1 text-center border-l border-neutral-900 transition-colors ${activeConsoleTab === 'terminal' ? 'text-white' : 'hover:text-neutral-300'}`}
                  >
                    CLI logs
                  </button>
                </div>

                {/* Agent Panel Content */}
                <div className="min-h-[220px] font-mono text-[9px] text-neutral-400 leading-relaxed space-y-3">
                  {activeConsoleTab === 'agent' && (
                    <>
                      <div className="text-neutral-500 font-semibold">// AI Model suggestions</div>
                      {simState === 'idle' && (
                        <div>Idle state. Press "Run Agent Demo" to start process pipeline.</div>
                      )}
                      
                      {simState === 'scraping' && (
                        <div className="animate-pulse">
                          <span className="text-white block">{'>'} [agent] Launching LinkedIn scrape worker...</span>
                          <span className="block mt-1">{'>'} [agent] Querying keywords: React, TypeScript, Vite...</span>
                        </div>
                      )}

                      {simState === 'matching' && (
                        <div>
                          <span className="text-neutral-500 block">{'>'} [agent] Job listings captured: 3</span>
                          <span className="text-white block mt-2">{'>'} [agent] Commencing profile parser matching...</span>
                          <span className="block mt-1">{'>'} [agent] Matching qualifications OpenAI CV parsing: 98%</span>
                        </div>
                      )}

                      {simState === 'autofilling' && (
                        <div className="space-y-1">
                          <span className="text-neutral-500 block">{'>'} [agent] Selecting staff position at OpenAI</span>
                          <span className="text-white block">{'>'} [agent] Launching Playwright browser instance...</span>
                          <span className="block">{'>'} [agent] Injecting profile preset schemas:</span>
                          <span className="block pl-2 text-neutral-500">- Full Name: Sarvesh Gaynar</span>
                          <span className="block pl-2 text-neutral-500">- Email: sarvesh@example.com</span>
                          <span className="block pl-2 text-neutral-500">- Resume: Sarvesh_CV.pdf</span>
                        </div>
                      )}

                      {simState === 'done' && (
                        <div className="space-y-1">
                          <span className="text-emerald-400 block">{'>'} [agent] Pipeline successfully executed!</span>
                          <span className="text-neutral-400 block">{'>'} [agent] Form fields pre-filled in sandbox browser.</span>
                          <span className="text-neutral-500 block">{'>'} [agent] Connection held open. Awaiting user submission confirmation.</span>
                        </div>
                      )}
                    </>
                  )}

                  {activeConsoleTab === 'terminal' && (
                    <div className="space-y-1.5">
                      <div className="text-neutral-600">$ npm run worker:dev</div>
                      <div>[worker] Queue worker initialized. listening on port 6379</div>
                      {simState !== 'idle' && (
                        <>
                          <div className="text-neutral-500">[worker] processing task: scrape_and_match</div>
                          <div className="text-neutral-500">[worker] scraper response: status 200</div>
                        </>
                      )}
                      {(simState === 'autofilling' || simState === 'done') && (
                        <>
                          <div>[playwright] chromium runner launched in headless mode</div>
                          <div>[playwright] page navigated: jobs.openai.com/application</div>
                          <div>[playwright] prefill success (took 1840ms)</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Status indicators at bottom of Column 4 */}
              <div className="pt-4 border-t border-neutral-900 flex justify-between items-center text-[8px] font-mono text-neutral-500">
                <span>Model: Claude 3.5 Sonnet</span>
                <span>Speed: {speedSetting === 'fast' ? '120ms/f' : 'Natural'}</span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. GRAYSCALE PARTNER SLIDER (Divide grid lines) */}
      <section className="max-w-6xl mx-auto px-6 mb-24 text-center">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-center mb-8">
          Grayscale Monorepo System Integrations
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 border border-neutral-900 bg-neutral-950/20 text-center font-extrabold text-neutral-500 text-xs select-none">
          <div className="py-5 hover:text-white transition-colors cursor-default border-r border-b md:border-b-0 border-neutral-900">LINKEDIN</div>
          <div className="py-5 hover:text-white transition-colors cursor-default border-r border-b md:border-b-0 border-neutral-900">INDEED</div>
          <div className="py-5 hover:text-white transition-colors cursor-default border-r border-b md:border-b-0 border-neutral-900">PLAYWRIGHT</div>
          <div className="py-5 hover:text-white transition-colors cursor-default border-r border-neutral-900">CLAUDE CODE</div>
          <div className="py-5 hover:text-white transition-colors cursor-default border-r border-neutral-900">REDIS</div>
          <div className="py-5 hover:text-white transition-colors cursor-default">VITE</div>
        </div>
      </section>

      {/* 5. METRICS GRID SECTION (Clean numeric specifications) */}
      <section id="features" className="py-20 px-6 border-t border-neutral-900 bg-[#050505] text-left">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white select-none">
              Not just vibes, a complete platform.
            </h2>
            <p className="text-neutral-400 text-sm max-w-xl">
              Engineered with speed and data protection. Automate form pre-filling without exposing credentials to central servers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: Core Web Vitals */}
            <div className="p-8 bg-black border border-neutral-900 rounded-xl flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Fast Autofill</span>
                <h3 className="text-lg font-bold text-white mt-2">Core Web Vitals</h3>
              </div>
              <div className="space-y-3 pt-6 font-mono text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Chrome Launch time</span>
                  <span className="text-white font-bold">1.2s</span>
                </div>
                <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden border border-neutral-900">
                  <div className="bg-white h-1 w-[90%] rounded-full"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Autofill Execution</span>
                  <span className="text-white font-bold">1.5s</span>
                </div>
                <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden border border-neutral-900">
                  <div className="bg-white h-1 w-[85%] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Box 2: Accuracy */}
            <div className="p-8 bg-black border border-neutral-900 rounded-xl flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Accuracy</span>
                <h3 className="text-lg font-bold text-white mt-2">Parser Precision</h3>
              </div>
              <div className="pt-6">
                <div className="text-4xl md:text-5xl font-black text-white tracking-tight">99.9%</div>
                <p className="text-[9px] text-neutral-500 mt-2 leading-relaxed font-mono">
                  Advanced coordinate selector matchings map data into inputs without script execution errors.
                </p>
              </div>
            </div>

            {/* Box 3: Security & Encryption */}
            <div className="p-8 bg-black border border-neutral-900 rounded-xl flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Security</span>
                <h3 className="text-lg font-bold text-white mt-2">Confidential Storage</h3>
              </div>
              <div className="flex items-center gap-3.5 pt-6">
                <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl text-neutral-300">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Local Encrypted Settings</div>
                  <div className="text-[9px] text-neutral-500 mt-0.5 leading-normal">
                    Target settings reside encrypted in your secure browser space.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. BENTO GRID FEATURES (spreadsheet line borders separating cards) */}
      <section id="bento" className="py-24 px-6 border-t border-neutral-900 bg-black text-left">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="space-y-4">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-mono">Architectural Specifications</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white select-none">
              High-quality interface components
            </h2>
            <p className="text-neutral-400 text-sm max-w-xl">
              Observe how the core client layers interact with validation schemas, caching hooks, and logger instances in a dark layout block.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="border border-neutral-900 rounded-xl overflow-hidden bg-[#030303] divide-y divide-neutral-900">
            
            {/* Top Row: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-900">
              
              {/* Card 1: Network Axios Interceptor */}
              <div className="p-8 space-y-4 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <Network className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs uppercase font-bold tracking-wider font-mono">Central Request Interceptor</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">Axios Token & Error Injector</h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    All network operations execute through a single interceptor instance. It attaches authorization tokens, hooks warning states, and standardizes error responses.
                  </p>
                </div>

                {/* Mock log feed */}
                <div className="p-3 bg-black border border-neutral-900 rounded-lg font-mono text-[9px] space-y-1 text-neutral-400">
                  <div className="flex justify-between items-center border-b border-neutral-950 pb-1 text-neutral-600">
                    <span>METHOD / PATH</span>
                    <span>STATUS</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>→ GET /api/jobs/openai</span>
                    <span className="text-emerald-500 font-bold">200 OK</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>→ POST /api/resume/upload</span>
                    <span className="text-emerald-500 font-bold">201 CREATED</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>→ GET /api/settings</span>
                    <span className="text-neutral-500 font-bold">304 STALE</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Interactive Zod Schema Validator */}
              <div className="p-8 space-y-4 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <FileCode className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs uppercase font-bold tracking-wider font-mono">Form Validation</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">Zod & React Hook Form Schema</h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Prevent script input mistakes. Input validation ensures that names, telephone strings, and document links conform to strict formatting schemas.
                  </p>
                </div>

                {/* Interactive validation simulator */}
                <div className="p-4 bg-black border border-neutral-900 rounded-lg space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-neutral-500">z.string().email()</span>
                      <span className={zodEmail.includes('@') && zodEmail.includes('.') ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {zodEmail.includes('@') && zodEmail.includes('.') ? '✓ Valid Email' : '⚠ Invalid Format'}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={zodEmail} 
                      onChange={e => setZodEmail(e.target.value)}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-neutral-500">z.string().min(1)</span>
                      <span className={zodPhone.trim().length > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {zodPhone.trim().length > 0 ? '✓ Valid Phone' : '⚠ Required'}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={zodPhone} 
                      onChange={e => setZodPhone(e.target.value)}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-900">
              
              {/* Card 3: TanStack Query Cache */}
              <div className="p-8 space-y-4 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <Database className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs uppercase font-bold tracking-wider font-mono">State Cache Hooks</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">TanStack Query Store</h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Optimized server-state integration. Caching hooks query profile profiles and listing tables without redundant endpoint requests.
                  </p>
                </div>

                {/* Simulated Cache State */}
                <div className="p-3 bg-black border border-neutral-900 rounded-lg font-mono text-[9px] space-y-2 text-neutral-400">
                  <div className="flex items-center justify-between text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      <span>["auth-profile"]</span>
                    </div>
                    <span className="text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded text-[8px] font-bold">FRESH</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></span>
                      <span>["jobs-feed", "react"]</span>
                    </div>
                    <span className="text-neutral-500 bg-white/5 px-1 py-0.2 rounded text-[8px] font-bold">STALE (14s)</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      <span>["applications-tracker"]</span>
                    </div>
                    <span className="text-white bg-white/10 px-1 py-0.2 rounded text-[8px] font-bold">FETCHING...</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Playwright Execution Logs */}
              <div className="p-8 space-y-4 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center gap-2 text-white">
                    <Terminal className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs uppercase font-bold tracking-wider font-mono">Automation Runner</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">Playwright Exec Console</h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Browser automation fills forms natively inside Chromium, recording output messages and screenshot points for validation review.
                  </p>
                </div>

                {/* Console text log */}
                <div className="p-3 bg-black border border-neutral-900 rounded-lg font-mono text-[8px] space-y-1 text-neutral-500">
                  <div>$ npx playwright test --headed</div>
                  <div>[playwright] Launching Chrome browser engine...</div>
                  <div className="text-neutral-300">[playwright] Fill element #name {'->'} "Sarvesh"</div>
                  <div className="text-neutral-300">[playwright] Fill element #email {'->'} "sarvesh@example.com"</div>
                  <div className="text-neutral-300">[playwright] Action: Upload PDF file "Sarvesh_CV.pdf"</div>
                  <div className="text-emerald-400 font-bold">[playwright] Test success. Pre-fill complete (4.2s)</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION SECTION (Sleek bold heading + Floating glow config panel) */}
      <section className="py-32 px-6 text-center max-w-4xl mx-auto space-y-12 relative">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-white select-none leading-none">
            Ready to automate?<br />
            Start using SmartApply.
          </h2>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto">
            Run browser automation agents directly from your workspace dashboard. Get started in minutes.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => navigate('/register')} 
            className="py-3 px-8 bg-white text-black font-extrabold text-xs tracking-wider uppercase rounded-lg hover:bg-neutral-200 transition-all shadow-xl shadow-white/5"
          >
            Get started for free
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="py-3 px-8 bg-neutral-950 border border-neutral-850 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg hover:bg-neutral-900 transition-all"
          >
            Sign In Account
          </button>
        </div>

        {/* Floating Settings Console Toolbar (Framer glowing style widget) */}
        <div className="max-w-md mx-auto p-[1px] rounded-xl bg-gradient-to-b from-neutral-800 to-transparent shadow-xl relative mt-16">
          <div className="bg-[#050505] border border-neutral-900 rounded-xl px-4 py-3.5 flex justify-between items-center text-[10px] font-mono text-neutral-400">
            
            {/* Speed toggle state */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Speed Preset</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSpeedSetting('natural')}
                  className={`transition-colors ${speedSetting === 'natural' ? 'text-white font-bold' : 'hover:text-neutral-300'}`}
                >
                  Natural
                </button>
                <button 
                  onClick={() => setSpeedSetting('fast')}
                  className={`transition-colors ${speedSetting === 'fast' ? 'text-white font-bold' : 'hover:text-neutral-300'}`}
                >
                  Fast (120ms)
                </button>
              </div>
            </div>

            {/* Headless toggle state */}
            <div className="flex flex-col items-start gap-1 border-l border-neutral-900 pl-4">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Browser Runner</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setBrowserMode('headless')}
                  className={`transition-colors ${browserMode === 'headless' ? 'text-white font-bold' : 'hover:text-neutral-300'}`}
                >
                  Headless
                </button>
                <button 
                  onClick={() => setBrowserMode('headed')}
                  className={`transition-colors ${browserMode === 'headed' ? 'text-white font-bold' : 'hover:text-neutral-300'}`}
                >
                  Chrome Window
                </button>
              </div>
            </div>

            {/* Model toggle state */}
            <div className="flex flex-col items-start gap-1 border-l border-neutral-900 pl-4">
              <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">AI Agent</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setAgentModel('sonnet')}
                  className={`transition-colors ${agentModel === 'sonnet' ? 'text-white font-bold' : 'hover:text-neutral-300'}`}
                >
                  Sonnet 3.5
                </button>
                <button 
                  onClick={() => setAgentModel('haiku')}
                  className={`transition-colors ${agentModel === 'haiku' ? 'text-white font-bold' : 'hover:text-neutral-300'}`}
                >
                  Haiku
                </button>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-neutral-900 py-16 px-6 md:px-12 bg-black text-neutral-500 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="space-y-4 col-span-2 text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white text-black rounded flex items-center justify-center font-extrabold">
                <Target className="w-4 h-4 text-black" />
              </div>
              <span className="font-extrabold text-sm text-white">SmartApply</span>
            </div>
            <p className="text-[10px] leading-normal text-neutral-600 max-w-xs font-sans">
              AI-powered automated job search and form filling utility. Powered by react-hook-form, zod validation, and TanStack Query.
            </p>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Product</div>
            <ul className="space-y-2">
              <li><a href="#product" className="hover:text-white transition-colors">AI Matcher</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Autofills</a></li>
              <li><a href="#bento" className="hover:text-white transition-colors">Scrapers</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Resources</div>
            <ul className="space-y-2">
              <li><a href="#product" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Guide Profile</a></li>
              <li><a href="#bento" className="hover:text-white transition-colors">Monorepo API</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Company</div>
            <ul className="space-y-2">
              <li><a href="https://github.com" className="hover:text-white transition-colors flex items-center gap-1">GitHub <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="#product" className="hover:text-white transition-colors">About Us</a></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row justify-between items-center gap-4 font-sans text-[10px] text-neutral-600">
          <span>&copy; {new Date().getFullYear()} SmartApply. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-neutral-400 transition-colors">Privacy Policy</Link>
            <a href="#terms" className="hover:text-neutral-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
