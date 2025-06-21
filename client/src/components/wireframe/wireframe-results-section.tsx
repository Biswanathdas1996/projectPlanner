import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Eye, Edit, Trash2, Search, ExternalLink } from "lucide-react";

interface GeneratedWireframe {
  id: string;
  pageName: string;
  content: string;
  generatedAt: Date;
  deviceType: string;
  designStyle: string;
  colorScheme: string;
  layout: string;
}

interface WireframeResultsSectionProps {
  generatedWireframes: GeneratedWireframe[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onViewWireframe: (wireframe: GeneratedWireframe) => void;
  onEditWireframe: (wireframe: GeneratedWireframe) => void;
  onDeleteWireframe: (wireframeId: string) => void;
  onDownloadWireframe: (wireframe: GeneratedWireframe) => void;
}

export function WireframeResultsSection({
  generatedWireframes,
  searchTerm,
  onSearchChange,
  onViewWireframe,
  onEditWireframe,
  onDeleteWireframe,
  onDownloadWireframe
}: WireframeResultsSectionProps) {
  const filteredWireframes = generatedWireframes.filter(wireframe =>
    wireframe.pageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wireframe.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wireframe.designStyle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (generatedWireframes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium mb-2">No Wireframes Generated Yet</h3>
          <p className="text-sm">
            Select page content and configure your settings to generate your first wireframe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Generated Wireframes ({generatedWireframes.length})</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search wireframes..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWireframes.map((wireframe) => (
            <div key={wireframe.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Wireframe Preview */}
              <div className="aspect-video bg-gray-50 rounded border mb-3 overflow-hidden">
                <div 
                  className="w-full h-full p-2 text-xs overflow-auto"
                  dangerouslySetInnerHTML={{ __html: wireframe.content.slice(0, 200) + '...' }}
                />
              </div>

              {/* Wireframe Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm truncate" title={wireframe.pageName}>
                  {wireframe.pageName}
                </h3>
                
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {wireframe.deviceType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {wireframe.designStyle}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {wireframe.colorScheme}
                  </Badge>
                </div>

                <p className="text-xs text-gray-500">
                  Generated {wireframe.generatedAt.toLocaleDateString()} at{' '}
                  {wireframe.generatedAt.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-1 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => onViewWireframe(wireframe)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => onEditWireframe(wireframe)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadWireframe(wireframe)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteWireframe(wireframe.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredWireframes.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-900 mb-2">No wireframes found</h3>
            <p className="text-gray-600 text-sm">
              Try adjusting your search terms or generate new wireframes.
            </p>
          </div>
        )}

        {/* Bulk Actions */}
        {generatedWireframes.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredWireframes.length} of {generatedWireframes.length} wireframes shown
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    filteredWireframes.forEach(wireframe => onDownloadWireframe(wireframe));
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}