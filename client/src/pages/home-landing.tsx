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
        <section className="text-center py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-cyan-400/30 rounded-full mb-6 shadow-lg shadow-cyan-500/10">
              <Brain className="h-4 w-4 mr-2 text-cyan-400" />
              <span className="text-xs font-medium bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">AI Project Planner</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Transform Ideas</span>
              <span className="text-white"> Into </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Reality</span>
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
              Generate comprehensive project plans, workflows, and user stories with <span className="text-cyan-400">AI-powered insights</span> in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link href="/start-over">
                <Button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 px-8 py-3 font-semibold shadow-xl shadow-blue-500/25 border-0 rounded-lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Planning
                </Button>
              </Link>
              <Link href="/start-over">
                <Button variant="outline" className="px-8 py-3 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 backdrop-blur-lg bg-white/5 rounded-lg">
                  <Brain className="h-5 w-5 mr-2" />
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-xl p-3 border border-cyan-400/20">
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">10+</div>
                <div className="text-xs text-cyan-300">Sections</div>
              </div>
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-xl p-3 border border-purple-400/20">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">BPMN</div>
                <div className="text-xs text-purple-300">Diagrams</div>
              </div>
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-xl p-3 border border-blue-400/20">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">100%</div>
                <div className="text-xs text-blue-300">AI</div>
              </div>
              <div className="text-center backdrop-blur-lg bg-white/5 rounded-xl p-3 border border-green-400/20">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">∞</div>
                <div className="text-xs text-green-300">Custom</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Process Flow */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                AI Workflow
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Four steps to transform your ideas into comprehensive project plans
              </p>
            </div>

            <div className="relative">
              {/* Glowing Connection Lines */}
              <div className="hidden lg:block absolute top-20 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 rounded-full"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Step 1 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
                      <Edit className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      01
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Input Processing</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      AI analyzes your project description and extracts key requirements.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-cyan-300">
                        <Zap className="h-3 w-3 mr-2" />
                        NLP Analysis
                      </div>
                      <div className="flex items-center text-xs text-cyan-300">
                        <Brain className="h-3 w-3 mr-2" />
                        Smart Extraction
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      02
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">AI Planning</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Generates comprehensive project architecture with technical specifications.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-purple-300">
                        <Sparkles className="h-3 w-3 mr-2" />
                        Deep Analysis
                      </div>
                      <div className="flex items-center text-xs text-purple-300">
                        <Layout className="h-3 w-3 mr-2" />
                        Architecture
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      03
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Workflow Generation</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Creates BPMN 2.0 compliant stakeholder journeys with adaptive flows.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-blue-300">
                        <GitBranch className="h-3 w-3 mr-2" />
                        Smart Flows
                      </div>
                      <div className="flex items-center text-xs text-blue-300">
                        <Target className="h-3 w-3 mr-2" />
                        Multi-Persona
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative group">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-green-400/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                    <div className="w-14 h-14 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
                      <Rocket className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
                      04
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">Export & Deploy</h3>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      Export to multiple formats with automated team collaboration.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-green-300">
                        <Download className="h-3 w-3 mr-2" />
                        Multi-Format
                      </div>
                      <div className="flex items-center text-xs text-green-300">
                        <Globe className="h-3 w-3 mr-2" />
                        Team Sync
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                AI Features
              </h2>
              <p className="text-gray-300 max-w-xl mx-auto text-sm">
                Complete toolkit for intelligent project planning
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Feature 1 */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-400/20 hover:border-cyan-400/40 transition-all group">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Layout className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">Planning</h3>
                <p className="text-xs text-gray-300 mb-3">10+ sections with technical architecture</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs">Architecture</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">Timeline</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-400/20 hover:border-purple-400/40 transition-all group">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <GitBranch className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">Workflows</h3>
                <p className="text-xs text-gray-300 mb-3">BPMN 2.0 compliant diagrams</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">BPMN</span>
                  <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs">Charts</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-400/20 hover:border-blue-400/40 transition-all group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">User Stories</h3>
                <p className="text-xs text-gray-300 mb-3">Gherkin format with JIRA export</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">Gherkin</span>
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">JIRA</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-400/20 hover:border-green-400/40 transition-all group">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Database className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">Storage</h3>
                <p className="text-xs text-gray-300 mb-3">Auto-save with data export</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">Auto-Save</span>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs">Export</span>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl p-4 border border-orange-400/20 hover:border-orange-400/40 transition-all group">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">Customizable</h3>
                <p className="text-xs text-gray-300 mb-3">Edit and adapt workflows</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs">Editor</span>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">Flexible</span>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-xl p-4 border border-pink-400/20 hover:border-pink-400/40 transition-all group">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">AI-Powered</h3>
                <p className="text-xs text-gray-300 mb-3">Gemini AI intelligence</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs">Gemini</span>
                  <span className="px-2 py-1 bg-rose-500/20 text-rose-300 rounded text-xs">Smart</span>
                </div>
              </div>
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
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
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
                  
                  {/* Additional Navigation */}
                  <div className="flex justify-center">
                    <Link href="/user-stories">
                      <Button variant="ghost" size="lg" className="text-blue-200 hover:text-white hover:bg-white/10 px-6 py-3 text-base">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate User Stories
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="py-16 px-6 border-t border-cyan-400/20 bg-gradient-to-b from-black via-gray-900 to-black">
          <div className="max-w-6xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    AI Project Planner
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Transform your project ideas into comprehensive plans with the power of artificial intelligence.
                </p>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                    <Globe className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                    <Code2 className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="w-8 h-8 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                    <Brain className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Platform Links */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm">Platform</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/start-over" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                      Project Planner
                    </Link>
                  </li>
                  <li>
                    <Link href="/start-over" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                      User Journey
                    </Link>
                  </li>
                  <li>
                    <Link href="/start-over" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                      User Stories
                    </Link>
                  </li>
                  <li>
                    <Link href="/start-over" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                      BPMN Editor
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm">Features</h3>
                <ul className="space-y-3">
                  <li className="text-gray-400 text-sm flex items-center">
                    <Zap className="h-3 w-3 mr-2 text-cyan-400" />
                    AI-Powered Planning
                  </li>
                  <li className="text-gray-400 text-sm flex items-center">
                    <GitBranch className="h-3 w-3 mr-2 text-blue-400" />
                    BPMN 2.0 Diagrams
                  </li>
                  <li className="text-gray-400 text-sm flex items-center">
                    <Users className="h-3 w-3 mr-2 text-purple-400" />
                    Stakeholder Workflows
                  </li>
                  <li className="text-gray-400 text-sm flex items-center">
                    <Download className="h-3 w-3 mr-2 text-green-400" />
                    Multi-Format Export
                  </li>
                </ul>
              </div>

              {/* Technology */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm">Technology</h3>
                <div className="space-y-3">
                  <div className="backdrop-blur-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-3 border border-cyan-400/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-cyan-400" />
                      <span className="text-white text-sm font-medium">Powered by</span>
                    </div>
                    <p className="text-cyan-300 text-xs">Google Gemini AI</p>
                  </div>
                  <div className="backdrop-blur-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-400/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code2 className="h-4 w-4 text-blue-400" />
                      <span className="text-white text-sm font-medium">Built with</span>
                    </div>
                    <p className="text-blue-300 text-xs">React & TypeScript</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent mb-8"></div>

            {/* Bottom Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>© 2025 AI Project Planner</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center">
                  <Shield className="h-3 w-3 mr-1 text-green-400" />
                  Enterprise Ready
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-blue-400" />
                  BPMN 2.0 Compliant
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-xs font-medium">Live & Ready</span>
                </div>
                <Link href="/start-over">
                  <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 text-xs rounded-lg shadow-lg shadow-blue-500/25">
                    <Rocket className="h-3 w-3 mr-1" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-8 pt-8 border-t border-gray-800">
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full text-xs border border-cyan-500/20">Gemini AI</span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full text-xs border border-blue-500/20">React</span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs border border-purple-500/20">TypeScript</span>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs border border-indigo-500/20">Vite</span>
              <span className="px-3 py-1 bg-green-500/10 text-green-300 rounded-full text-xs border border-green-500/20">BPMN.js</span>
              <span className="px-3 py-1 bg-pink-500/10 text-pink-300 rounded-full text-xs border border-pink-500/20">Tailwind CSS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}