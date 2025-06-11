import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NavigationBar } from '@/components/navigation-bar';
import { Link } from 'wouter';
import {
  Sparkles,
  FileText,
  ArrowRight,
  Users,
  Code,
  Workflow,
  Brain,
  GitBranch,
  Database,
  Zap,
  Shield,
  Globe,
  CheckCircle,
  Star,
  BookOpen,
  Settings,
  Download,
  BarChart3,
  Target,
  Layers
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NavigationBar title="BPMN AI Studio" />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Business Process Design</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Ideas into
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Complete Applications</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Revolutionary AI platform that converts your business ideas into BPMN diagrams, user stories, and production-ready code. 
            From concept to deployment in minutes, not months.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/project-planner">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Start Building Now
              </Button>
            </Link>
            <Link href="/bpmn-editor">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                <Workflow className="h-5 w-5 mr-2" />
                Explore BPMN Editor
              </Button>
            </Link>
          </div>
          
          {/* Feature Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">AI-Powered Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">100+</div>
              <div className="text-sm text-gray-600">BPMN Elements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Auto</div>
              <div className="text-sm text-gray-600">Code Generation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">JIRA</div>
              <div className="text-sm text-gray-600">Compatible</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Development Workflow
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform guides you through every step from initial idea to production-ready code
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <Card className="h-full border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">1. Describe Idea</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Simply describe your business idea or process in natural language
                  </p>
                </CardContent>
              </Card>
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <Card className="h-full border-2 border-indigo-200 hover:border-indigo-300 transition-colors">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">2. AI Planning</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    AI analyzes requirements and creates comprehensive project plans
                  </p>
                </CardContent>
              </Card>
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300" />
            </div>

            {/* Step 3 */}
            <div className="relative">
              <Card className="h-full border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Workflow className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">3. Process Mapping</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Generate BPMN diagrams with stakeholder flows and interactions
                  </p>
                </CardContent>
              </Card>
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300" />
            </div>

            {/* Step 4 */}
            <div className="relative">
              <Card className="h-full border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">4. User Stories</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Auto-generate JIRA-compliant user stories with acceptance criteria
                  </p>
                </CardContent>
              </Card>
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-300" />
            </div>

            {/* Step 5 */}
            <div>
              <Card className="h-full border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">5. Code Generation</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Generate complete React applications with backend and database
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Every Stage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced AI capabilities combined with industry-standard tools for professional development
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Analysis */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Advanced Gemini AI integration for intelligent project planning and stakeholder analysis
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Smart Requirements</Badge>
                  <Badge variant="secondary">Auto-Planning</Badge>
                </div>
              </CardContent>
            </Card>

            {/* BPMN 2.0 Editor */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Workflow className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>BPMN 2.0 Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Professional-grade BPMN editor with drag-and-drop interface and real-time collaboration
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Visual Editor</Badge>
                  <Badge variant="secondary">Export Options</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stakeholder Mapping */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Stakeholder Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Intelligent stakeholder identification and flow assignment with role-based permissions
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Role Analysis</Badge>
                  <Badge variant="secondary">Flow Assignment</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Code Generation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Full-Stack Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Generate complete React applications with Express backend, database schemas, and deployment configs
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">React + TypeScript</Badge>
                  <Badge variant="secondary">API Generation</Badge>
                </div>
              </CardContent>
            </Card>

            {/* JIRA Integration */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>JIRA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Generate JIRA-compliant user stories with acceptance criteria and epic organization
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">User Stories</Badge>
                  <Badge variant="secondary">Epic Structure</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Ready */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Enterprise Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Production-ready features with error handling, authentication, and scalable architecture
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Security</Badge>
                  <Badge variant="secondary">Scalability</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powered by cutting-edge AI and industry-standard development tools
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">AI</span>
              </div>
              <h3 className="font-semibold text-gray-900">Gemini AI</h3>
              <p className="text-sm text-gray-600">Advanced Language Model</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">⚛️</span>
              </div>
              <h3 className="font-semibold text-gray-900">React</h3>
              <p className="text-sm text-gray-600">Modern Frontend</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">TS</span>
              </div>
              <h3 className="font-semibold text-gray-900">TypeScript</h3>
              <p className="text-sm text-gray-600">Type Safety</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Workflow className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">BPMN.js</h3>
              <p className="text-sm text-gray-600">Process Modeling</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Drizzle ORM</h3>
              <p className="text-sm text-gray-600">Database Management</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Vite</h3>
              <p className="text-sm text-gray-600">Build Tool</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Ideas?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and business analysts who are building faster with AI-powered process design.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/project-planner">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Start Your Project
              </Button>
            </Link>
            <Link href="/user-journey-enhanced">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                <Users className="h-5 w-5 mr-2" />
                Explore User Journeys
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No Setup Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Production Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">BPMN AI Studio</h3>
              <p className="text-sm">
                Transform business ideas into production-ready applications with AI-powered process design.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>AI Project Planning</li>
                <li>BPMN 2.0 Editor</li>
                <li>User Story Generation</li>
                <li>Code Generation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li>Stakeholder Mapping</li>
                <li>Process Visualization</li>
                <li>JIRA Integration</li>
                <li>Export Options</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-sm">
                <li>Gemini AI Integration</li>
                <li>React + TypeScript</li>
                <li>Modern UI Components</li>
                <li>Enterprise Architecture</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 BPMN AI Studio. Built with AI-powered innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}