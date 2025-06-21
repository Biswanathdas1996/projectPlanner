import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Download, Edit, Trash2, ExternalLink } from "lucide-react";

interface WireframeItem {
  id: string;
  pageName: string;
  html: string;
  css: string;
  timestamp: number;
  deviceType: string;
  designStyle: string;
  isEnhanced?: boolean;
}

interface WireframeGalleryProps {
  wireframes: WireframeItem[];
  onPreview: (wireframe: WireframeItem) => void;
  onEdit: (wireframe: WireframeItem) => void;
  onDelete: (wireframeId: string) => void;
  onDownload: (wireframe: WireframeItem) => void;
  className?: string;
}

export function WireframeGallery({
  wireframes,
  onPreview,
  onEdit,
  onDelete,
  onDownload,
  className = ""
}: WireframeGalleryProps) {
  const [previewWireframe, setPreviewWireframe] = useState<WireframeItem | null>(null);

  const handlePreview = (wireframe: WireframeItem) => {
    setPreviewWireframe(wireframe);
    onPreview(wireframe);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '🖥️';
      default: return '🖥️';
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated Wireframes</span>
            <Badge variant="secondary">{wireframes.length} wireframes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wireframes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No wireframes generated yet</p>
              <p className="text-sm">Generate wireframes to see them here</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {wireframes.map((wireframe) => (
                  <div
                    key={wireframe.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{getDeviceIcon(wireframe.deviceType)}</span>
                        <h4 className="font-medium text-sm truncate">{wireframe.pageName}</h4>
                        {wireframe.isEnhanced && (
                          <Badge variant="outline" className="text-xs">Enhanced</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{wireframe.designStyle}</span>
                        <span>•</span>
                        <span>{formatDate(wireframe.timestamp)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handlePreview(wireframe)}
                        variant="ghost"
                        size="sm"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onEdit(wireframe)}
                        variant="ghost"
                        size="sm"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onDownload(wireframe)}
                        variant="ghost"
                        size="sm"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onDelete(wireframe.id)}
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewWireframe} onOpenChange={() => setPreviewWireframe(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{getDeviceIcon(previewWireframe?.deviceType || 'desktop')}</span>
              {previewWireframe?.pageName} Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewWireframe && (
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>${previewWireframe.css}</style>
                    </head>
                    <body>
                      ${previewWireframe.html}
                    </body>
                  </html>
                `}
                className="w-full h-96 border rounded"
                title={`${previewWireframe.pageName} Preview`}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => previewWireframe && onDownload(previewWireframe)}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={() => previewWireframe && onEdit(previewWireframe)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}