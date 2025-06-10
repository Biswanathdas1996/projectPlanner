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
        <section className="text-center py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-cyan-400/30 rounded-full mb-8 shadow-lg shadow-cyan-500/10">
              <Brain className="h-5 w-5 mr-3 text-cyan-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Next-Generation AI Planning Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-cyan-300 to-blue-300 bg-clip-text text-transparent">Transform</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">Ideas</span>
              <span className="text-white"> Into</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Reality</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Harness the power of <span className="text-cyan-400 font-semibold">artificial intelligence</span> to generate comprehensive project plans, 
              stakeholder workflows, and user stories in <span className="text-purple-400 font-semibold">minutes, not weeks</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
              <Link href="/start-over">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 px-10 py-5 text-lg font-semibold shadow-2xl shadow-blue-500/25 border-0 rounded-xl">
                  <Zap className="h-6 w-6 mr-3" />
                  Launch AI Planning
                </Button>
              </Link>
              <Link href="/start-over">
                <Button variant="outline" size="lg" className="px-10 py-5 text-lg border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-300 backdrop-blur-lg bg-white/5 rounded-xl shadow-lg">
                  <Brain className="h-6 w-6 mr-3" />
                  Explore AI Features
                </Button>
              </Link>
            </div>

            {/* AI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-cyan-400/20">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">10+</div>
                <div className="text-sm text-cyan-300 font-medium">AI Sections</div>
              </div>
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-purple-400/20">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">BPMN 2.0</div>
                <div className="text-sm text-purple-300 font-medium">Smart Diagrams</div>
              </div>
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-blue-400/20">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">100%</div>
                <div className="text-sm text-blue-300 font-medium">AI Powered</div>
              </div>
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-green-400/20">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">∞</div>
                <div className="text-sm text-green-300 font-medium">Possibilities</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Process Flow */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                AI-Powered Workflow
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light">
                Experience the future of project planning with our advanced AI system that transforms ideas into actionable plans
              </p>
            </div>

            <div className="relative">
              {/* Glowing Connection Lines */}
              <div className="hidden lg:block absolute top-32 left-1/4 right-1/4 h-1 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 rounded-full shadow-lg shadow-blue-500/25"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Step 1 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl p-8 border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
                    <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                      <Edit className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                      01
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Neural Input Processing</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Advanced NLP algorithms analyze your project description and extract key requirements with human-like understanding.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-cyan-300">
                        <Zap className="h-4 w-4 mr-3" />
                        Natural Language Processing
                      </div>
                      <div className="flex items-center text-sm text-cyan-300">
                        <Brain className="h-4 w-4 mr-3" />
                        Context Understanding
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl p-8 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                      02
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">AI Strategic Planning</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Gemini AI generates comprehensive project architecture with technical specifications and visual representations.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-purple-300">
                        <Sparkles className="h-4 w-4 mr-3" />
                        Deep Learning Analysis
                      </div>
                      <div className="flex items-center text-sm text-purple-300">
                        <Layout className="h-4 w-4 mr-3" />
                        Intelligent Architecture
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-500/10 rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                      03
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Autonomous Workflow Generation</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Self-learning algorithms create BPMN 2.0 compliant stakeholder journeys with adaptive flow optimization.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-blue-300">
                        <GitBranch className="h-4 w-4 mr-3" />
                        Adaptive Flow Logic
                      </div>
                      <div className="flex items-center text-sm text-blue-300">
                        <Target className="h-4 w-4 mr-3" />
                        Multi-Persona Mapping
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
                      <Rocket className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                      04
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Intelligent Deployment</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Smart export system generates production-ready formats with automated team collaboration integration.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-green-300">
                        <Download className="h-4 w-4 mr-3" />
                        Multi-Format Export
                      </div>
                      <div className="flex items-center text-sm text-green-300">
                        <Globe className="h-4 w-4 mr-3" />
                        Team Synchronization
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="py-20 px-6 bg-white bg-opacity-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to plan, visualize, and execute your projects successfully
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Layout className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Comprehensive Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Generate 10 mandatory sections including technical architecture, methodology, and risk management.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Executive Summary</Badge>
                    <Badge variant="outline" className="text-xs">Technical Architecture</Badge>
                    <Badge variant="outline" className="text-xs">Development Timeline</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GitBranch className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Visual Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Create BPMN 2.0 compliant diagrams with flow charts, tables, timelines, and tree views.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Flow Diagrams</Badge>
                    <Badge variant="outline" className="text-xs">Timeline Charts</Badge>
                    <Badge variant="outline" className="text-xs">Data Tables</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Code2 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">User Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Generate Gherkin format user stories with acceptance criteria and export to JIRA.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Gherkin Format</Badge>
                    <Badge variant="outline" className="text-xs">JIRA Export</Badge>
                    <Badge variant="outline" className="text-xs">BDD Scenarios</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Persistent Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    All your work is automatically saved with localStorage and data export capabilities.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Auto Save</Badge>
                    <Badge variant="outline" className="text-xs">Data Export</Badge>
                    <Badge variant="outline" className="text-xs">Import/Backup</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Customizable</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Edit plans, customize flows, and adapt workflows to your specific requirements.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Rich Text Editor</Badge>
                    <Badge variant="outline" className="text-xs">Custom Flows</Badge>
                    <Badge variant="outline" className="text-xs">Flexible Export</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">AI-Powered</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Powered by Google Gemini AI for intelligent suggestions and comprehensive planning.
                  </p>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Gemini AI</Badge>
                    <Badge variant="outline" className="text-xs">Smart Suggestions</Badge>
                    <Badge variant="outline" className="text-xs">Context Aware</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Navigation */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Explore the Platform</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Navigate through different sections of the platform to build your complete project ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/start-over">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-blue-900">Project Planner</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Generate comprehensive AI-powered project plans with visual elements
                    </p>
                    <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-200">
                      Start Planning
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/start-over">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-purple-900">User Journey</h3>
                    <p className="text-purple-700 text-sm mb-4">
                      Create stakeholder-based BPMN workflows and user journey maps
                    </p>
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-200">
                      Build Journeys
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/start-over">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-indigo-900">User Stories</h3>
                    <p className="text-indigo-700 text-sm mb-4">
                      Generate Gherkin format user stories and export to JIRA
                    </p>
                    <Button variant="outline" size="sm" className="border-indigo-300 text-indigo-700 hover:bg-indigo-200">
                      Create Stories
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/start-over">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Workflow className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-green-900">BPMN Editor</h3>
                    <p className="text-green-700 text-sm mb-4">
                      Visual BPMN 2.0 diagram editor with advanced features
                    </p>
                    <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-200">
                      Open Editor
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-2xl bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
              <CardContent className="p-12 text-center relative">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Project Planning?</h2>
                  <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                    Join thousands of teams using AI-powered project planning to deliver better results faster.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/start-over">
                      <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                        <Rocket className="h-5 w-5 mr-2" />
                        Start Your First Project
                      </Button>
                    </Link>
                    <Link href="/start-over">
                      <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Explore Features
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-200 bg-white bg-opacity-50">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Project Planner
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Powered by Google Gemini AI • Built with React & TypeScript
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>© 2024 AI Project Planner</span>
              <span>•</span>
              <span>BPMN 2.0 Compliant</span>
              <span>•</span>
              <span>Enterprise Ready</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}