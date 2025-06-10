import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { NavigationBar } from '@/components/navigation-bar';
import {
  Sparkles,
  Users,
  FileText,
  Edit,
  BookOpen,
  ArrowRight,
  Workflow,
  Zap,
  Target,
  Shield
} from 'lucide-react';

export default function Landing() {
  const tools = [
    {
      title: 'AI Project Planner',
      description: 'Transform ideas into comprehensive project plans with AI-powered insights, visual diagrams, and structured workflows.',
      icon: Sparkles,
      href: '/plan',
      color: 'from-blue-500 to-purple-600',
      features: ['10-section structure', 'Visual diagrams', 'Timeline charts', 'PDF export']
    },
    {
      title: 'Stakeholder Journey Builder',
      description: 'Generate AI-powered BPMN diagrams for each stakeholder persona based on your project requirements.',
      icon: Users,
      href: '/user-journey',
      color: 'from-green-500 to-teal-600',
      features: ['Persona-based flows', 'BPMN generation', 'Custom prompts', 'XML export']
    },
    {
      title: 'User Story Generator',
      description: 'Create user stories in Gherkin format from BPMN workflows with JIRA export capabilities.',
      icon: BookOpen,
      href: '/user-stories',
      color: 'from-orange-500 to-red-600',
      features: ['Gherkin format', 'JIRA export', 'Acceptance criteria', 'BDD scenarios']
    },
    {
      title: 'BPMN Editor',
      description: 'Professional BPMN 2.0 diagram editor with advanced features and collaborative capabilities.',
      icon: Edit,
      href: '/editor',
      color: 'from-purple-500 to-pink-600',
      features: ['BPMN 2.0 standard', 'Real-time editing', 'Element properties', 'XML validation']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <NavigationBar title="BPMN Platform" showBackButton={false} />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
              <Workflow className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            AI-Powered BPMN Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Complete workflow management suite combining AI project planning, stakeholder journey mapping, 
            user story generation, and professional BPMN editing capabilities.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              BPMN 2.0 Standard
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Enterprise Ready
            </Badge>
          </div>
          <Link href="/plan">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Link href={tool.href}>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    {tool.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tool.features.map((feature, featureIndex) => (
                      <Badge key={featureIndex} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Link href={tool.href}>
                    <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      Launch Tool
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">Leverage advanced AI to generate comprehensive project plans, workflows, and user stories automatically.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Workflow className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">BPMN 2.0 Standard</h3>
              <p className="text-gray-600">Full compliance with BPMN 2.0 standards for professional workflow modeling and enterprise integration.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Export & Integration</h3>
              <p className="text-gray-600">Export to multiple formats including PDF, JIRA, XML, and Gherkin for seamless tool integration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}