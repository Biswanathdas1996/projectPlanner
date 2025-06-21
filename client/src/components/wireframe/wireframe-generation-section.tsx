import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wand2, Smartphone, Monitor, Palette } from "lucide-react";

interface WireframeGenerationSectionProps {
  selectedDevice: string;
  selectedColorScheme: string;
  selectedDesignType: string;
  selectedLayout: string;
  isGenerating: boolean;
  brandGuidelines: any;
  onDeviceChange: (device: string) => void;
  onColorSchemeChange: (scheme: string) => void;
  onDesignTypeChange: (type: string) => void;
  onLayoutChange: (layout: string) => void;
  onGenerateWireframe: () => void;
}

export function WireframeGenerationSection({
  selectedDevice,
  selectedColorScheme,
  selectedDesignType,
  selectedLayout,
  isGenerating,
  brandGuidelines,
  onDeviceChange,
  onColorSchemeChange,
  onDesignTypeChange,
  onLayoutChange,
  onGenerateWireframe
}: WireframeGenerationSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Wireframe Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brand Guidelines Status */}
        {brandGuidelines && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-700">
              <Palette className="h-4 w-4" />
              <span className="font-medium">Brand Guidelines Active</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Wireframes will be generated using your brand colors, fonts, and design principles.
            </p>
          </div>
        )}

        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Device Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Device Type</label>
            <Select value={selectedDevice} onValueChange={onDeviceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </div>
                </SelectItem>
                <SelectItem value="tablet">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Tablet
                  </div>
                </SelectItem>
                <SelectItem value="desktop">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Color Scheme</label>
            <Select value={selectedColorScheme} onValueChange={onColorSchemeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern-blue">Modern Blue</SelectItem>
                <SelectItem value="minimal-gray">Minimal Gray</SelectItem>
                <SelectItem value="warm-orange">Warm Orange</SelectItem>
                <SelectItem value="cool-green">Cool Green</SelectItem>
                <SelectItem value="elegant-purple">Elegant Purple</SelectItem>
                <SelectItem value="professional-navy">Professional Navy</SelectItem>
                <SelectItem value="brand-colors">Brand Colors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Design Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Design Style</label>
            <Select value={selectedDesignType} onValueChange={onDesignTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Layout Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Layout</label>
            <Select value={selectedLayout} onValueChange={onLayoutChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard-header">Standard Header</SelectItem>
                <SelectItem value="side-navigation">Side Navigation</SelectItem>
                <SelectItem value="top-navigation">Top Navigation</SelectItem>
                <SelectItem value="centered-layout">Centered Layout</SelectItem>
                <SelectItem value="full-width">Full Width</SelectItem>
                <SelectItem value="dashboard-style">Dashboard Style</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium text-sm mb-2">Current Settings</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{selectedDevice}</Badge>
            <Badge variant="outline">{selectedColorScheme}</Badge>
            <Badge variant="outline">{selectedDesignType}</Badge>
            <Badge variant="outline">{selectedLayout}</Badge>
            {brandGuidelines && <Badge variant="default">Brand Guidelines</Badge>}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerateWireframe}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Generating Wireframe...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Wireframe
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}