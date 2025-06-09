import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BpmnCanvas } from '@/components/bpmn-canvas';
import { ElementSidebar } from '@/components/element-sidebar';
import { PropertiesPanel } from '@/components/properties-panel';
import { NotificationSystem } from '@/components/notification-system';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { HelpPanel } from '@/components/help-panel';
import { ContextualToolbar } from '@/components/contextual-toolbar';
import { useBpmn } from '@/hooks/use-bpmn';
import { validateBpmnFile } from '@/lib/bpmn-utils';
import { Link } from 'wouter';
import {
  Plus,
  Save,
  FolderOpen,
  Upload,
  Download,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Workflow,
  Sidebar,
  ArrowRightLeft,
  HelpCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export default function BpmnEditor() {
  const [panelVisible, setPanelVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    containerRef,
    selectedElement,
    diagramJson,
    isLoading,
    notifications,
    status,
    showNotification,
    removeNotification,
    saveToStorage,
    loadFromStorage,
    createNew,
    exportDiagram,
    importDiagram,
    zoomIn,
    zoomOut,
    zoomFit,
    updateElementProperties,
    copyJsonToClipboard,
    handleElementSelect,
    connectElements,
  } = useBpmn();

  const handleCreateNew = () => {
    setConfirmationModal({
      open: true,
      title: 'Create New Diagram',
      message: 'Are you sure you want to create a new diagram? Unsaved changes will be lost.',
      onConfirm: () => {
        createNew();
        setConfirmationModal(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValid = await validateBpmnFile(file);
    if (!isValid) {
      showNotification('Invalid file format. Please select a valid BPMN or XML file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        importDiagram(content);
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  const togglePanel = () => {
    setPanelVisible(!panelVisible);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const toggleHelp = () => {
    setHelpVisible(!helpVisible);
  };

  // Keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          saveToStorage();
          break;
        case 'n':
          event.preventDefault();
          handleCreateNew();
          break;
        case 'o':
          event.preventDefault();
          handleImport();
          break;
        case 'l':
          event.preventDefault();
          connectElements();
          break;
      }
    }
  };

  return (
    <div className="h-screen bg-gray-50 font-roboto" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Workflow className="text-white h-4 w-4" />
            </div>
            <h1 className="text-xl font-medium text-gray-900">BPMN Designer</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateNew} className="flex items-center space-x-2 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="font-medium">New</span>
            </Button>

            <Button 
              onClick={saveToStorage} 
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span className="font-medium">Save</span>
            </Button>

            <Button 
              onClick={loadFromStorage} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="font-medium">Load</span>
            </Button>

            <Button 
              onClick={connectElements} 
              variant="outline"
              className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="font-medium">Connect</span>
            </Button>

            <Link href="/">
              <Button 
                variant="outline"
                className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">AI Planner</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleImport} 
              variant="ghost"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Import</span>
            </Button>

            <Button 
              onClick={exportDiagram} 
              variant="ghost"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </Button>

            <div className="w-px h-6 bg-gray-300" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={toggleSidebar} 
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Sidebar className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Element Sidebar</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={togglePanel} 
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Properties Panel</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={toggleHelp} 
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show Help & Shortcuts</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 font-medium">{status}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex h-screen pt-16">
        {/* Element Sidebar */}
        <ElementSidebar 
          visible={sidebarVisible} 
          onElementSelect={handleElementSelect}
        />
        
        <BpmnCanvas ref={containerRef} isLoading={isLoading} />

        {/* Canvas Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col space-y-2 z-40">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={zoomIn}
                size="sm"
                className="w-12 h-12 bg-white shadow-lg rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                variant="outline"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom In</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={zoomOut}
                size="sm"
                className="w-12 h-12 bg-white shadow-lg rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                variant="outline"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom Out</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={zoomFit}
                size="sm"
                className="w-12 h-12 bg-white shadow-lg rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                variant="outline"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fit to Screen</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          visible={panelVisible}
          selectedElement={selectedElement}
          diagramJson={diagramJson}
          onClose={togglePanel}
          onUpdateElement={updateElementProperties}
          onCopyJson={copyJsonToClipboard}
        />
      </div>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmationModal.open}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, open: false }))}
      />

      {/* Help Panel */}
      <HelpPanel
        visible={helpVisible}
        onClose={toggleHelp}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bpmn,.xml,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
