import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Frame, 
  Edit3, 
  RefreshCw, 
  Trash2, 
  Download,
  Copy,
  Eye,
  Code,
  Smartphone,
  Tablet,
  Monitor
} from "lucide-react";

interface WireframeData {
  id: string;
  pageName: string;
  htmlCode: string;
  cssCode: string;
  jsCode?: string;
  isEnhanced?: boolean;
  lastUpdated?: string;
  lastEnhancedElement?: string;
  enhancementExplanation?: string;
  lastEditorSync?: string;
}

interface WireframeGalleryProps {
  wireframes: WireframeData[];
  isRefreshing: boolean;
  onWireframeEdit: (wireframe: WireframeData) => void;
  onWireframeDelete: (wireframe: WireframeData) => void;
  onWireframeRefresh: (wireframe: WireframeData) => void;
  onWireframeDownload: (wireframe: WireframeData) => void;
  onWireframeCopy: (wireframe: WireframeData) => void;
  onWireframePreview: (wireframe: WireframeData) => void;
  onWireframeViewCode: (wireframe: WireframeData) => void;
  selectedDeviceType: 'mobile' | 'tablet' | 'desktop';
}

export function WireframeGallery({
  wireframes,
  isRefreshing,
  onWireframeEdit,
  onWireframeDelete,
  onWireframeRefresh,
  onWireframeDownload,
  onWireframeCopy,
  onWireframePreview,
  onWireframeViewCode,
  selectedDeviceType
}: WireframeGalleryProps) {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const DeviceIcon = getDeviceIcon(selectedDeviceType);

  if (wireframes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Frame className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Wireframes Generated</h3>
        <p className="text-gray-500">Generate your first wireframe to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <DeviceIcon className="h-5 w-5" />
          Generated Wireframes ({wireframes.length})
        </h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {selectedDeviceType.charAt(0).toUpperCase() + selectedDeviceType.slice(1)} View
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wireframes.map((wireframe) => (
          <Card key={wireframe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-600 truncate font-mono ml-2">
                    {wireframe.pageName.toLowerCase().replace(/\s+/g, '-')}.html
                  </div>
                  {isRefreshing && (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs ml-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Updating</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative h-80 bg-white">
                <iframe
                  key={`${wireframe.id}-${wireframe.lastUpdated || Date.now()}`}
                  srcDoc={wireframe.htmlCode}
                  className="w-full h-full border-0 transform scale-[0.4] origin-top-left"
                  style={{ 
                    width: '250%', 
                    height: '250%',
                    overflow: 'hidden'
                  }}
                  title={`Preview of ${wireframe.pageName}`}
                  sandbox="allow-same-origin"
                  scrolling="no"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800 truncate">{wireframe.pageName}</h4>
                  {wireframe.isEnhanced && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Enhanced
                    </Badge>
                  )}
                </div>
                
                {wireframe.lastEnhancedElement && (
                  <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    Last enhanced: {wireframe.lastEnhancedElement}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                    onClick={() => onWireframePreview(wireframe)}
                  >
                    <Frame className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                    onClick={() => onWireframeEdit(wireframe)}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => onWireframeViewCode(wireframe)}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Code
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => onWireframeCopy(wireframe)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => onWireframeDownload(wireframe)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2"
                    onClick={() => onWireframeDelete(wireframe)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}