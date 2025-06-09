import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Hand,
  Move,
  MousePointer,
  ArrowRight,
  Circle,
  CircleDot,
  CircleX,
  Diamond,
  Square,
  FileText,
  Database,
  Monitor,
  MoreHorizontal,
  Zap
} from 'lucide-react';

interface ElementSidebarProps {
  visible: boolean;
  onElementSelect: (elementType: string) => void;
}

const elementGroups = [
  {
    title: 'Selection Tools',
    elements: [
      { id: 'hand-tool', icon: Hand, label: 'Hand Tool', action: 'hand-tool' },
      { id: 'lasso-tool', icon: Move, label: 'Lasso Tool', action: 'lasso-tool' },
      { id: 'space-tool', icon: MousePointer, label: 'Space Tool', action: 'space-tool' },
    ]
  },
  {
    title: 'Flow Objects',
    elements: [
      { id: 'create.start-event', icon: Circle, label: 'Start Event', action: 'create.start-event' },
      { id: 'create.intermediate-event', icon: CircleDot, label: 'Intermediate Event', action: 'create.intermediate-event' },
      { id: 'create.end-event', icon: CircleX, label: 'End Event', action: 'create.end-event' },
      { id: 'create.exclusive-gateway', icon: Diamond, label: 'Exclusive Gateway', action: 'create.exclusive-gateway' },
      { id: 'create.task', icon: Square, label: 'Task', action: 'create.task' },
      { id: 'create.subprocess-expanded', icon: FileText, label: 'Subprocess', action: 'create.subprocess-expanded' },
    ]
  },
  {
    title: 'Connecting',
    elements: [
      { id: 'create.sequence-flow', icon: ArrowRight, label: 'Sequence Flow', action: 'create.sequence-flow' },
    ]
  },
  {
    title: 'Artifacts',
    elements: [
      { id: 'create.data-object', icon: Database, label: 'Data Object', action: 'create.data-object' },
      { id: 'create.data-store', icon: Monitor, label: 'Data Store', action: 'create.data-store' },
      { id: 'create.text-annotation', icon: FileText, label: 'Text Annotation', action: 'create.text-annotation' },
    ]
  }
];

export function ElementSidebar({ visible, onElementSelect }: ElementSidebarProps) {
  if (!visible) return null;

  return (
    <div className="w-16 bg-white border-r border-gray-200 shadow-sm h-full flex flex-col py-4">
      <div className="flex flex-col space-y-1 px-2">
        {elementGroups.map((group, groupIndex) => (
          <div key={group.title}>
            {groupIndex > 0 && <Separator className="my-2" />}
            
            {group.elements.map((element) => {
              const IconComponent = element.icon;
              
              return (
                <Tooltip key={element.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-12 h-12 p-0 hover:bg-blue-50 hover:text-blue-600 text-gray-600 transition-colors"
                      onClick={() => onElementSelect(element.action)}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{element.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
        
        <Separator className="my-2" />
        
        {/* More options */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 p-0 hover:bg-gray-50 text-gray-400 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>More Elements</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}