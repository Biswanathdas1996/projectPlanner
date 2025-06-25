import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import {
  Sparkles,
  FileText,
  ArrowRight,
  Users,
  Workflow,
  Download,
  Edit,
  CheckCircle,
  Target,
  Zap,
  Globe,
  Shield,
  BarChart3,
  GitBranch,
  Clock,
  Star,
  Award,
  Rocket,
  Brain,
  Layout,
  Code2,
  Database,
  Settings,
  MonitorSpeaker
} from 'lucide-react';

export default function HomeLanding() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950 to-purple-950"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation Header */}
        <header className="flex items-center justify-between p-6 backdrop-blur-lg bg-white/5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Project Planner
              </h1>
              <p className="text-xs text-cyan-300 font-medium">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/start-over">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/25 border-0">
                Start Planning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative text-center py-12 px-6 overflow-hidden">
          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Premium Badge with Glow */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-cyan-400/30 rounded-full mb-6 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 group">
              <div className="p-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mr-2 group-hover:rotate-12 transition-transform duration-300">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">✨ AI-Powered Workflow</span>
            </div>
            
            {/* Dynamic Title with Enhanced Typography */}
            <div className="relative mb-6">
              <h1 className="text-4xl md:text-7xl font-bold leading-tight tracking-tight">
                <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                  Dream
                </span>
                <span className="inline-block text-white mx-2 md:mx-4 opacity-60">→</span>
                <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                  Deploy
                </span>
              </h1>
              
              {/* Subtitle with Charm */}
              <p className="text-lg md:text-xl text-gray-300 mt-4 mb-8 max-w-3xl mx-auto leading-relaxed">
                Turn your wildest ideas into <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">production-ready code</span> with our magical 7-step AI workflow
              </p>
            </div>

            {/* Elegant Workflow Visualization */}
            <div className="mb-10">
              <div className="relative max-w-7xl mx-auto">
                {/* Progress Line */}
                <div className="absolute top-5 md:top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-blue-500 via-purple-500 via-orange-500 via-teal-500 via-indigo-500 to-pink-500 opacity-30 rounded-full"></div>
                
                <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 relative">
                  {[
                    { step: 1, label: "AI Chat", icon: MonitorSpeaker, color: "from-cyan-500 to-blue-600", textColor: "text-cyan-400", href: "/ai-consultant", description: "Voice planning" },
                    { step: 2, label: "Idea", icon: Sparkles, color: "from-green-500 to-emerald-600", textColor: "text-green-400", href: "/start-over", description: "Spark creativity" },
                    { step: 3, label: "Research", icon: BarChart3, color: "from-blue-500 to-blue-600", textColor: "text-blue-400", href: "/research", description: "Market insights" },
                    { step: 4, label: "Planning", icon: FileText, color: "from-purple-500 to-purple-600", textColor: "text-purple-400", href: "/plan", description: "Smart strategy" },
                    { step: 5, label: "Process", icon: Workflow, color: "from-orange-500 to-red-600", textColor: "text-orange-400", href: "/editor", description: "Flow design" },
                    { step: 6, label: "Wireframes", icon: Layout, color: "from-teal-500 to-cyan-600", textColor: "text-teal-400", href: "/wireframes", description: "UI magic" },
                    { step: 7, label: "Stories", icon: Users, color: "from-indigo-500 to-purple-600", textColor: "text-indigo-400", href: "/stories", description: "User journeys" },
                    { step: 8, label: "Code", icon: Code2, color: "from-pink-500 to-rose-600", textColor: "text-pink-400", href: "/code", description: "Ship it!" }
                  ].map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <Link key={item.step} href={item.href}>
                        <div className="group flex flex-col items-center cursor-pointer">
                          <div className={`relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-current/40 group-hover:scale-110 transition-all duration-300 border border-white/10`}>
                            <IconComponent className="h-5 w-5 md:h-7 md:w-7 text-white" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{item.step}</span>
                            </div>
                          </div>
                          <div className="text-center mt-2 group-hover:scale-105 transition-transform duration-200">
                            <div className={`text-sm font-semibold ${item.textColor} mb-0.5`}>{item.label}</div>
                            <div className="text-xs text-gray-500 whitespace-nowrap leading-tight hidden md:block">{item.description}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6 text-sm text-gray-400 max-w-2xl mx-auto">
                <span className="inline-block bg-gradient-to-r from-cyan-400/20 to-purple-400/20 px-3 py-1 rounded-full border border-white/10">
                  Click any step to jump in, or start from the beginning for the full experience
                </span>
              </div>
            </div>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link href="/start-over">
                <Button className="group relative bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 hover:from-green-400 hover:via-blue-400 hover:to-purple-500 px-8 py-3 font-semibold shadow-2xl shadow-blue-500/25 border-0 rounded-xl text-base overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Rocket className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/plan">
                <Button variant="outline" className="group px-8 py-3 border-2 border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400/80 backdrop-blur-lg bg-white/5 text-base rounded-xl transition-all duration-300">
                  <FileText className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Quick Start
                </Button>
              </Link>
            </div>

            {/* Modern Achievement Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { number: "7", label: "Steps", color: "from-green-400 to-emerald-400", border: "border-green-400/30", icon: "✨" },
                { number: "AI", label: "Powered", color: "from-blue-400 to-cyan-400", border: "border-blue-400/30", icon: "🤖" },
                { number: "∞", label: "Possibilities", color: "from-purple-400 to-pink-400", border: "border-purple-400/30", icon: "🚀" },
                { number: "⚡", label: "Lightning Fast", color: "from-orange-400 to-red-400", border: "border-orange-400/30", icon: "⚡" }
              ].map((stat, index) => (
                <div key={index} className={`group text-center backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border ${stat.border} hover:bg-white/10 transition-all duration-300 hover:scale-105`}>
                  <div className="text-xs text-gray-400 mb-1 opacity-60">{stat.icon}</div>
                  <div className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                    {stat.number}
                  </div>
                  <div className={`text-xs font-medium bg-gradient-to-r ${stat.color} bg-clip-text text-transparent opacity-80`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7-Step Detailed Workflow */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Complete Project Development Workflow
              </h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Seven comprehensive steps to transform any idea into production-ready code with AI-powered automation at every phase
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Step 1: AI Consultant */}
              <Link href="/ai-consultant">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                      <MonitorSpeaker className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      1
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">AI Consultant</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Voice-powered conversation to discuss your tech problems and get project plans.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-cyan-300">
                        <MonitorSpeaker className="h-3 w-3 mr-2" />
                        Voice Conversation
                      </div>
                      <div className="flex items-center text-xs text-cyan-300">
                        <FileText className="h-3 w-3 mr-2" />
                        Project Planning
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 2: Idea */}
              <Link href="/start-over">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-green-400/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      2
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Idea</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Start with your project concept and let AI transform it into structured requirements.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-green-300">
                        <Brain className="h-3 w-3 mr-2" />
                        Concept Analysis
                      </div>
                      <div className="flex items-center text-xs text-green-300">
                        <Target className="h-3 w-3 mr-2" />
                        Goal Definition
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 3: Research */}
              <Link href="/research">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      3
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Research</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      AI-powered market analysis to discover competitors and opportunities.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-blue-300">
                        <Globe className="h-3 w-3 mr-2" />
                        Market Analysis
                      </div>
                      <div className="flex items-center text-xs text-blue-300">
                        <Users className="h-3 w-3 mr-2" />
                        Competitor Research
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 4: Planning */}
              <Link href="/plan">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      4
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Planning</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Generate comprehensive project plans with technical architecture and timelines.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-purple-300">
                        <Layout className="h-3 w-3 mr-2" />
                        Architecture
                      </div>
                      <div className="flex items-center text-xs text-purple-300">
                        <Clock className="h-3 w-3 mr-2" />
                        Timeline
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 5: Process Mapping */}
              <Link href="/editor">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-2xl p-6 border border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                      <Workflow className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      5
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Process Mapping</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Create BPMN 2.0 process flows with stakeholder journeys and decision points.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-orange-300">
                        <GitBranch className="h-3 w-3 mr-2" />
                        BPMN Flows
                      </div>
                      <div className="flex items-center text-xs text-orange-300">
                        <Users className="h-3 w-3 mr-2" />
                        Stakeholder Maps
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 5: Wireframes */}
              <Link href="/wireframes">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-teal-400/30 hover:border-teal-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-teal-500/25">
                      <Layout className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      6
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Wireframes</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Design responsive UI wireframes with interactive elements and AI-enhanced layouts.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-teal-300">
                        <MonitorSpeaker className="h-3 w-3 mr-2" />
                        UI Design
                      </div>
                      <div className="flex items-center text-xs text-teal-300">
                        <Edit className="h-3 w-3 mr-2" />
                        Interactive
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 6: Stories */}
              <Link href="/stories">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-indigo-400/30 hover:border-indigo-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      7
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Stories</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Generate user stories, acceptance criteria, and Gherkin scenarios for development.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-indigo-300">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        User Stories
                      </div>
                      <div className="flex items-center text-xs text-indigo-300">
                        <Target className="h-3 w-3 mr-2" />
                        Acceptance Criteria
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Step 7: Code */}
              <Link href="/code">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10 rounded-2xl p-6 border border-pink-400/30 hover:border-pink-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-pink-400 via-rose-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-500/25">
                      <Code2 className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      8
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Code</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Generate production-ready code with complete project structure and documentation.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-pink-300">
                        <Database className="h-3 w-3 mr-2" />
                        Full Stack
                      </div>
                      <div className="flex items-center text-xs text-pink-300">
                        <Rocket className="h-3 w-3 mr-2" />
                        Production Ready
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Powerful AI Features
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Advanced capabilities to supercharge your project development workflow
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-cyan-400/30">
                <Shield className="h-12 w-12 text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-white">Enterprise Ready</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Security-first architecture with compliance frameworks and audit trails for enterprise deployment.
                </p>
              </div>
              
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-purple-400/30">
                <Zap className="h-12 w-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-white">Lightning Fast</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Generate comprehensive project documentation and code in minutes, not weeks.
                </p>
              </div>
              
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-green-400/30">
                <Star className="h-12 w-12 text-green-400 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-white">Quality Assured</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Industry best practices and proven methodologies built into every generated output.
                </p>
              </div>

              <Link href="/flow-mapping">
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 cursor-pointer group">
                  <GitBranch className="h-12 w-12 text-orange-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-bold mb-3 text-white">Flow Mapping</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Visualize process flows alongside their corresponding wireframe implementations in one unified view.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Project Planner
              </h3>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-6">
              Transform your ideas into production-ready solutions with our comprehensive 7-step AI-powered workflow. From concept to code, we've got you covered.
            </p>
            <div className="text-xs text-gray-500">
              Powered by Gemini AI • Built with modern web technologies
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}