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
        <section className="text-center py-8 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Compact Badge */}
            <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 backdrop-blur-sm border border-cyan-400/20 rounded-full mb-4 shadow-md">
              <Brain className="h-3 w-3 mr-1.5 text-cyan-400" />
              <span className="text-xs font-medium bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">7-Step AI Workflow</span>
            </div>
            
            {/* Streamlined Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Idea</span>
              <span className="text-white"> → </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Production</span>
            </h1>
            
            {/* Concise Description */}
            <p className="text-base text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform any project concept into production-ready code with our <span className="text-cyan-400">AI-powered</span> 7-step workflow.
            </p>

            {/* Modern Compact Workflow */}
            <div className="mb-8">
              <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2 max-w-4xl mx-auto bg-gradient-to-r from-black/40 via-gray-900/40 to-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                {/* Step 1: Idea */}
                <div className="flex items-center">
                  <Link href="/start-over">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-green-400">Idea</div>
                      </div>
                    </div>
                  </Link>
                  <ArrowRight className="h-3 w-3 text-gray-500 mx-1 md:mx-2" />
                </div>

                {/* Step 2: Research */}
                <div className="flex items-center">
                  <Link href="/research">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-blue-400">Research</div>
                      </div>
                    </div>
                  </Link>
                  <ArrowRight className="h-3 w-3 text-gray-500 mx-1 md:mx-2" />
                </div>

                {/* Step 3: Planning */}
                <div className="flex items-center">
                  <Link href="/plan">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-purple-400">Planning</div>
                      </div>
                    </div>
                  </Link>
                  <ArrowRight className="h-3 w-3 text-gray-500 mx-1 md:mx-2" />
                </div>

                {/* Step 4: Process */}
                <div className="flex items-center">
                  <Link href="/editor">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">4</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-orange-400">Process</div>
                      </div>
                    </div>
                  </Link>
                  <ArrowRight className="h-3 w-3 text-gray-500 mx-1 md:mx-2" />
                </div>

                {/* Step 5: Wireframes */}
                <div className="flex items-center">
                  <Link href="/wireframes">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">5</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-teal-400">Wireframes</div>
                      </div>
                    </div>
                  </Link>
                  <ArrowRight className="h-3 w-3 text-gray-500 mx-1 md:mx-2" />
                </div>

                {/* Step 6: Stories */}
                <div className="flex items-center">
                  <Link href="/stories">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">6</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-indigo-400">Stories</div>
                      </div>
                    </div>
                  </Link>
                  <ArrowRight className="h-3 w-3 text-gray-500 mx-1 md:mx-2" />
                </div>

                {/* Step 7: Code */}
                <div className="flex items-center">
                  <Link href="/code">
                    <div className="group flex items-center cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-200">
                        <span className="text-white font-bold text-xs md:text-sm">7</span>
                      </div>
                      <div className="ml-2 hidden md:block">
                        <div className="text-xs font-medium text-pink-400">Code</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500 max-w-xl mx-auto">
                Click any step to jump directly, or start from the beginning for the complete workflow
              </div>
            </div>
            
            {/* Streamlined CTA */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
              <Link href="/start-over">
                <Button className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 hover:from-green-400 hover:via-blue-400 hover:to-purple-500 px-6 py-2.5 font-semibold shadow-lg text-sm rounded-lg border-0">
                  <Rocket className="h-4 w-4 mr-2" />
                  Start Project
                </Button>
              </Link>
              <Link href="/plan">
                <Button variant="outline" className="px-6 py-2.5 border border-purple-400/40 text-purple-300 hover:bg-purple-400/10 backdrop-blur-lg bg-white/5 text-sm rounded-lg">
                  <FileText className="h-4 w-4 mr-2" />
                  Quick Plan
                </Button>
              </Link>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="text-center backdrop-blur-md bg-white/5 rounded-lg p-3 border border-green-400/20">
                <div className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">7</div>
                <div className="text-xs text-green-300">Steps</div>
              </div>
              <div className="text-center backdrop-blur-md bg-white/5 rounded-lg p-3 border border-blue-400/20">
                <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</div>
                <div className="text-xs text-blue-300">Powered</div>
              </div>
              <div className="text-center backdrop-blur-md bg-white/5 rounded-lg p-3 border border-purple-400/20">
                <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Full</div>
                <div className="text-xs text-purple-300">Stack</div>
              </div>
              <div className="text-center backdrop-blur-md bg-white/5 rounded-lg p-3 border border-orange-400/20">
                <div className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Prod</div>
                <div className="text-xs text-orange-300">Ready</div>
              </div>
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
              {/* Step 1: Idea */}
              <Link href="/start-over">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-green-400/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      1
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

              {/* Step 2: Research */}
              <Link href="/research">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      2
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

              {/* Step 3: Planning */}
              <Link href="/plan">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      3
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

              {/* Step 4: Process Mapping */}
              <Link href="/editor">
                <div className="relative group cursor-pointer">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-2xl p-6 border border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                      <Workflow className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      4
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
                      5
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
                      6
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
                      7
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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