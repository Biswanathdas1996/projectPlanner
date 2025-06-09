import { forwardRef } from 'react';

interface BpmnCanvasProps {
  isLoading: boolean;
}

export const BpmnCanvas = forwardRef<HTMLDivElement, BpmnCanvasProps>(
  ({ isLoading }, ref) => {
    return (
      <div className="flex-1 relative bg-white">
        <div ref={ref} className="bpmn-container w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="loading-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading BPMN Modeler...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

BpmnCanvas.displayName = 'BpmnCanvas';
