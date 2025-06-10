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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header */}
        <header className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Project Planner
              </h1>
              <p className="text-xs text-gray-500">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/start-over">
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Start Planning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full mb-6">
              <Star className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">AI-Powered Project Planning Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> Ideas </span>
              Into Reality
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Generate comprehensive project plans, stakeholder workflows, and user stories with AI-powered insights in minutes, not weeks.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link href="/start-over">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 text-lg">
                  <Rocket className="h-5 w-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/start-over">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 border-blue-200 hover:bg-blue-50">
                  <MonitorSpeaker className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">10+</div>
                <div className="text-sm text-gray-600">Project Sections</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">BPMN 2.0</div>
                <div className="text-sm text-gray-600">Compliant Diagrams</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-1">100%</div>
                <div className="text-sm text-gray-600">AI Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">∞</div>
                <div className="text-sm text-gray-600">Customizable</div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Flow Infographic */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Four simple steps to transform your project idea into a comprehensive plan with stakeholder workflows
              </p>
            </div>

            <div className="relative">
              {/* Connection Lines */}
              <div className="hidden lg:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Step 1 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Edit className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">Describe Your Project</h3>
                    <p className="text-gray-600 mb-4">
                      Simply describe your project idea, features, and requirements. Our AI understands natural language.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-blue-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Natural language input
                      </div>
                      <div className="flex items-center text-sm text-blue-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Smart suggestions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">AI Analysis & Planning</h3>
                    <p className="text-gray-600 mb-4">
                      Advanced AI generates comprehensive project plans with 10 mandatory sections and visual elements.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-purple-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Technical architecture
                      </div>
                      <div className="flex items-center text-sm text-purple-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Visual diagrams
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">Stakeholder Workflows</h3>
                    <p className="text-gray-600 mb-4">
                      Generate BPMN 2.0 compliant diagrams for each stakeholder persona with customizable flows.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-indigo-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        BPMN 2.0 compliant
                      </div>
                      <div className="flex items-center text-sm text-indigo-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Multi-persona support
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Download className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">Export & Collaborate</h3>
                    <p className="text-gray-600 mb-4">
                      Export to PDF, JIRA, or Gherkin feature files. Share with your team and start development.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Multiple formats
                      </div>
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Team collaboration
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