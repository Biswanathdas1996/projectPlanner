import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Keyboard, Mouse, Zap } from 'lucide-react';

interface HelpPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpPanel({ visible, onClose }: HelpPanelProps) {
  if (!visible) return null;

  const shortcuts = [
    { key: 'Ctrl/Cmd + S', action: 'Save diagram' },
    { key: 'Ctrl/Cmd + N', action: 'New diagram' },
    { key: 'Ctrl/Cmd + O', action: 'Import diagram' },
    { key: 'Ctrl/Cmd + L', action: 'Toggle connection mode' },
  ];

  const mouseActions = [
    { action: 'Click element', result: 'Select element' },
    { action: 'Drag element', result: 'Move element' },
    { action: 'Connection mode + click', result: 'Connect elements' },
    { action: 'Right-click', result: 'Context menu' },
    { action: 'Mouse wheel', result: 'Zoom in/out' },
  ];

  const tips = [
    'Use the sidebar to quickly add common BPMN elements',
    'Click "Connect" button or use Ctrl+L to connect elements',
    'Properties panel shows details for selected elements',
    'All changes are automatically saved to browser storage',
    'Export your diagrams as BPMN XML files',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Help
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-blue-600" />
              Keyboard Shortcuts
            </h3>
            <div className="grid gap-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {shortcut.key}
                  </span>
                  <span className="text-gray-600">{shortcut.action}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Mouse Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Mouse className="h-4 w-4 text-blue-600" />
              Mouse Actions
            </h3>
            <div className="grid gap-2">
              {mouseActions.map((action, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-700">{action.action}</span>
                  <span className="text-gray-600">{action.result}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tips */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Tips & Tricks
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Connection Instructions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              How to Connect Elements
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Click the "Connect" button or press Ctrl+L</li>
                <li>2. Click on the first element you want to connect</li>
                <li>3. Click on the second element to create the connection</li>
                <li>4. Click "Connect" again or press Ctrl+L to exit connection mode</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}