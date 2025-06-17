import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Clock } from 'lucide-react';
import { ProjectPlanSection, ProjectPlanProgress } from '@/lib/enhanced-project-planner';

interface EnhancedProgressTrackerProps {
  progress: ProjectPlanProgress;
  sections: ProjectPlanSection[];
}

export function EnhancedProgressTracker({ progress, sections }: EnhancedProgressTrackerProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Project Plan Generation</h3>
              <span className="text-sm text-muted-foreground">
                {progress.currentSection}/{progress.totalSections} sections
              </span>
            </div>
            <Progress value={progress.overallProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {progress.isGenerating ? (
                <>
                  <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                  Generating: {progress.currentSectionTitle}
                </>
              ) : (
                "Generation complete"
              )}
            </p>
          </div>

          {/* Section Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border transition-colors
                  ${section.isCompleted 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : section.isGenerating 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
                  }
                `}
              >
                <div className="flex-shrink-0">
                  {section.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : section.isGenerating ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`
                    text-sm font-medium truncate
                    ${section.isCompleted 
                      ? 'text-green-900 dark:text-green-100' 
                      : section.isGenerating 
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {section.order}. {section.title}
                  </p>
                  <p className={`
                    text-xs
                    ${section.isCompleted 
                      ? 'text-green-600 dark:text-green-400' 
                      : section.isGenerating 
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-500'
                    }
                  `}>
                    {section.isCompleted 
                      ? 'Complete' 
                      : section.isGenerating 
                      ? 'Generating...'
                      : 'Pending'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Time Remaining */}
          {progress.isGenerating && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Estimated time remaining: {Math.max(1, 10 - progress.currentSection)} minutes
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}