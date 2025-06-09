import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  ArrowLeft, 
  Move3D, 
  Trash2, 
  Copy, 
  Settings,
  Link,
  Diamond,
  Circle,
  Square,
  Triangle,
  ArrowRightLeft,
  Clock
} from 'lucide-react';
import { ElementProperties } from '@shared/schema';

interface ContextualToolbarProps {
  selectedElement: ElementProperties | null;
  visible: boolean;
  position: { x: number; y: number };
  onCreateConnection: (direction: 'right' | 'down' | 'up' | 'left') => void;
  onDeleteElement: () => void;
  onCopyElement: () => void;
  onShowProperties: () => void;
  onCreateElement: (elementType: string) => void;
  onActivateConnectionMode: () => void;
}

export function ContextualToolbar({
  selectedElement,
  visible,
  position,
  onCreateConnection,
  onDeleteElement,
  onCopyElement,
  onShowProperties,
  onCreateElement,
  onActivateConnectionMode
}: ContextualToolbarProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowCreateMenu(false);
  }, [selectedElement]);

  if (!visible || !selectedElement) {
    return null;
  }

  const connectionTools = [
    { icon: ArrowRight, direction: 'right' as const, label: 'Connect Right' },
    { icon: ArrowDown, direction: 'down' as const, label: 'Connect Down' },
    { icon: ArrowUp, direction: 'up' as const, label: 'Connect Up' },
    { icon: ArrowLeft, direction: 'left' as const, label: 'Connect Left' }
  ];

  const createTools = [
    { icon: Circle, type: 'bpmn:StartEvent', label: 'Start Event' },
    { icon: Square, type: 'bpmn:Task', label: 'Task' },
    { icon: Diamond, type: 'bpmn:ExclusiveGateway', label: 'Decision (Yes/No)' },
    { icon: Move3D, type: 'bpmn:ParallelGateway', label: 'Parallel Gateway' },
    { icon: Triangle, type: 'bpmn:EndEvent', label: 'End Event' }
  ];

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.max(position.y - 60, 10),
        maxWidth: '280px'
      }}
    >
      {/* Connection Tools */}
      <div className="flex gap-1 border-r border-gray-200 pr-2">
        {/* Interactive Connection Tool */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-orange-50"
          onClick={onActivateConnectionMode}
          title="Connect to Any Element - Click to activate, then click target element"
        >
          <ArrowRightLeft className="h-4 w-4 text-orange-600" />
        </Button>
        
        {/* Quick Direction Tools */}
        {connectionTools.map(({ icon: Icon, direction, label }) => (
          <Button
            key={direction}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-50"
            onClick={() => onCreateConnection(direction)}
            title={label}
          >
            <Icon className="h-4 w-4 text-blue-600" />
          </Button>
        ))}
      </div>

      {/* Create Element Tools */}
      <div className="flex gap-1 border-r border-gray-200 pr-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-green-50"
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            title="Create Element"
          >
            <Move3D className="h-4 w-4 text-green-600" />
          </Button>
          
          {showCreateMenu && (
            <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-60">
              {createTools.map(({ icon: Icon, type, label }) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start text-xs hover:bg-gray-50"
                  onClick={() => {
                    onCreateElement(type);
                    setShowCreateMenu(false);
                  }}
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Element Actions */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-indigo-50"
          onClick={onShowProperties}
          title="Add Time Duration"
        >
          <Clock className="h-4 w-4 text-indigo-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-yellow-50"
          onClick={onCopyElement}
          title="Copy Element"
        >
          <Copy className="h-4 w-4 text-yellow-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-purple-50"
          onClick={onShowProperties}
          title="Properties"
        >
          <Settings className="h-4 w-4 text-purple-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50"
          onClick={onDeleteElement}
          title="Delete Element"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>

      {/* Element Info */}
      <div className="w-full mt-2 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-600 truncate">
          <span className="font-medium">{selectedElement.name || selectedElement.id}</span>
          <span className="ml-2 text-gray-400">
            {selectedElement.type.replace('bpmn:', '')}
          </span>
        </div>
        {selectedElement.duration && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              {selectedElement.duration} {selectedElement.durationUnit || 'minutes'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}