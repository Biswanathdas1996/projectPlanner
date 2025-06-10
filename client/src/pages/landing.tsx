import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import {
  Sparkles,
  Workflow,
  Users,
  FileText,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  Globe,
  Shield,
  Brain,
  Rocket,
  Clock,
  Download
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Planning",
      description: "Generate comprehensive project plans with 10-section structure using advanced AI",
      color: "bg-blue-500"
    },
    {
      icon: Workflow,
      title: "BPMN Diagram Generation",
      description: "Create stakeholder-specific workflow diagrams with automated BPMN 2.0 compliance",
      color: "bg-purple-500"
    },
    {
      icon: Users,
      title: "Stakeholder Journey Mapping",
      description: "Build persona-based user journeys with multiple flow types per stakeholder",
      color: "bg-green-500"
    },
    {
      icon: FileText,
      title: "User Stories & Gherkin",
      description: "Generate structured user stories with Gherkin scenarios for seamless development",
      color: "bg-orange-500"
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Interactive dashboards with flow diagrams, timelines, and progress tracking",
      color: "bg-indigo-500"
    },
    {
      icon: Download,
      title: "Export & Integration",
      description: "Export to JIRA, PDF reports, and feature files for your development workflow",
      color: "bg-pink-500"
    }
  ];

  const benefits = [
    "10x faster project planning with AI assistance",
    "Comprehensive stakeholder analysis and mapping",
    "BPMN 2.0 compliant workflow diagrams",
    "Automated user story generation",
    "Export to JIRA and development tools",
    "Visual project timelines and analytics"
  ];

  const stats = [
    { value: "10", label: "Structured Sections", description: "Comprehensive project plans" },
    { value: "100+", label: "BPMN Elements", description: "Professional diagrams" },
    { value: "5min", label: "Setup Time", description: "From idea to workflow" },
    { value: "99%", label: "Accuracy", description: "AI-generated content" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-lg border">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white h-5 w-5" />
                </div>
                <span className="font-semibold text-gray-900">AI BPMN Platform</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  V2.0
                </Badge>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Ideas into
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Intelligent Workflows
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The most advanced AI-powered BPMN platform for generating comprehensive project plans, 
              stakeholder journeys, and user stories with seamless integration to your development workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/plan">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/user-journey">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-gray-300 hover:bg-gray-50">
                  <Users className="mr-2 h-5 w-5" />
                  Explore Workflows
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg border">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-500">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for
              <span className="text-blue-600"> Intelligent Project Planning</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive suite of AI-powered tools designed to streamline your workflow from conception to delivery
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                    <feature.icon className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our
                <span className="text-purple-600"> AI Platform?</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Built for modern teams who need speed, accuracy, and comprehensive project documentation.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="text-white h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Target className="text-white h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-900">Project Planning</span>
                    <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Generated Sections:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Executive Summary</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Technical Architecture</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Feature Specifications</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Timeline & Methodology</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Users className="text-white h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-900">Stakeholder Analysis</span>
                    <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <FileText className="text-white h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-900">User Stories</span>
                    <Badge className="bg-gray-100 text-gray-600">Pending</Badge>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="text-white h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in
              <span className="text-blue-600"> 3 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600">
              From project idea to comprehensive workflow in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Describe Your Project</h3>
              <p className="text-gray-600">
                Enter your project description and let our AI generate a comprehensive plan with all required sections
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate Workflows</h3>
              <p className="text-gray-600">
                Create stakeholder-specific BPMN diagrams and user journey flows with automated persona analysis
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Export & Integrate</h3>
              <p className="text-gray-600">
                Export user stories to JIRA, download PDF reports, and integrate with your development tools
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/plan">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg">
                <Zap className="mr-2 h-5 w-5" />
                Start Your Project Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-white h-4 w-4" />
                </div>
                <span className="font-bold text-xl">AI BPMN</span>
              </div>
              <p className="text-gray-400 text-sm">
                The future of intelligent project planning and workflow automation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link href="/plan" className="block hover:text-white transition-colors">Project Planner</Link>
                <Link href="/user-journey" className="block hover:text-white transition-colors">User Journeys</Link>
                <Link href="/user-stories" className="block hover:text-white transition-colors">User Stories</Link>
                <Link href="/editor" className="block hover:text-white transition-colors">BPMN Editor</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-3 w-3" />
                  <span>API Integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-3 w-3" />
                  <span>Advanced Analytics</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <Link href="/plan" className="block hover:text-white transition-colors">Get Started</Link>
                <span className="block">Documentation</span>
                <span className="block">API Reference</span>
                <span className="block">Support</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 AI BPMN Platform. Built with advanced AI for intelligent workflow automation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}