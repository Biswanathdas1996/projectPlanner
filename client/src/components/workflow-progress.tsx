import { useLocation } from 'wouter';
import { ArrowRight, CheckCircle, Sparkles, FileText, Users, BookOpen, Code } from 'lucide-react';

interface WorkflowProgressProps {
  currentStep?: 'input' | 'plan' | 'diagram' | 'stories' | 'code';
  completedSteps?: string[];
}

export function WorkflowProgress({ currentStep, completedSteps = [] }: WorkflowProgressProps) {
  const [location] = useLocation();

  // Determine step status based on current route and passed props
  const getStepStatus = (step: string) => {
    if (completedSteps.includes(step)) return 'completed';
    if (currentStep === step) return 'active';
    
    // Route-based determination
    switch (location) {
      case '/plan':
        if (step === 'input') return 'completed';
        if (step === 'plan') return 'active';
        break;
      case '/user-journey':
      case '/user-journey-enhanced':
        if (['input', 'plan'].includes(step)) return 'completed';
        if (step === 'diagram') return 'active';
        break;
      case '/user-stories':
        if (['input', 'plan', 'diagram'].includes(step)) return 'completed';
        if (step === 'stories') return 'active';
        break;
      default:
        if (step === 'input') return 'active';
        break;
    }
    
    return 'pending';
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          {/* Step 1: Input */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            getStepStatus('input') === 'active' ? 'bg-blue-100 shadow-md' :
            getStepStatus('input') === 'completed' ? 'bg-green-100' : 'bg-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              getStepStatus('input') === 'active' ? 'bg-blue-500 text-white' :
              getStepStatus('input') === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getStepStatus('input') === 'completed' ? <CheckCircle className="h-4 w-4" /> : 
               getStepStatus('input') === 'active' ? <Sparkles className="h-4 w-4" /> : '1'}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              getStepStatus('input') === 'active' ? 'text-blue-700' :
              getStepStatus('input') === 'completed' ? 'text-green-700' : 'text-gray-600'
            }`}>Describe Idea</span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 2: Plan */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            getStepStatus('plan') === 'active' ? 'bg-blue-100 shadow-md' :
            getStepStatus('plan') === 'completed' ? 'bg-green-100' : 'bg-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              getStepStatus('plan') === 'active' ? 'bg-blue-500 text-white' :
              getStepStatus('plan') === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getStepStatus('plan') === 'completed' ? <CheckCircle className="h-4 w-4" /> : 
               getStepStatus('plan') === 'active' ? <FileText className="h-4 w-4" /> : '2'}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              getStepStatus('plan') === 'active' ? 'text-blue-700' :
              getStepStatus('plan') === 'completed' ? 'text-green-700' : 'text-gray-600'
            }`}>Project Planning</span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 3: Process Mapping */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            getStepStatus('diagram') === 'active' ? 'bg-blue-100 shadow-md' :
            getStepStatus('diagram') === 'completed' ? 'bg-green-100' : 'bg-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              getStepStatus('diagram') === 'completed' ? 'bg-green-500 text-white' :
              getStepStatus('diagram') === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getStepStatus('diagram') === 'completed' ? <CheckCircle className="h-4 w-4" /> : 
               getStepStatus('diagram') === 'active' ? <Users className="h-4 w-4" /> : '3'}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              getStepStatus('diagram') === 'active' ? 'text-blue-700' :
              getStepStatus('diagram') === 'completed' ? 'text-green-700' : 'text-gray-600'
            }`}>Stakeholder & Process Mapping </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 4: User Stories */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            getStepStatus('stories') === 'active' ? 'bg-blue-100 shadow-md' :
            getStepStatus('stories') === 'completed' ? 'bg-green-100' : 'bg-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              getStepStatus('stories') === 'completed' ? 'bg-green-500 text-white' :
              getStepStatus('stories') === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getStepStatus('stories') === 'completed' ? <CheckCircle className="h-4 w-4" /> : 
               getStepStatus('stories') === 'active' ? <BookOpen className="h-4 w-4" /> : '4'}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              getStepStatus('stories') === 'active' ? 'text-blue-700' :
              getStepStatus('stories') === 'completed' ? 'text-green-700' : 'text-gray-600'
            }`}>
              Stories
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 5: Code */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            getStepStatus('code') === 'active' ? 'bg-blue-100 shadow-md' :
            getStepStatus('code') === 'completed' ? 'bg-green-100' : 'bg-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              getStepStatus('code') === 'completed' ? 'bg-green-500 text-white' :
              getStepStatus('code') === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {getStepStatus('code') === 'completed' ? <CheckCircle className="h-4 w-4" /> : 
               getStepStatus('code') === 'active' ? <Code className="h-4 w-4" /> : '5'}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              getStepStatus('code') === 'active' ? 'text-blue-700' :
              getStepStatus('code') === 'completed' ? 'text-green-700' : 'text-gray-600'
            }`}>
              Code
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}