import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Type, Layout, Image } from "lucide-react";
import type { BrandGuideline } from "@/lib/brand-guideline-extractor";

interface BrandDisplayPanelProps {
  brandGuidelines: BrandGuideline;
  className?: string;
}

export function BrandDisplayPanel({ brandGuidelines, className = "" }: BrandDisplayPanelProps) {
  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Brand Guidelines Applied
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-white/60 rounded-lg">
            <div className="text-xs text-gray-500">Colors</div>
            <div className="text-sm font-medium">
              {brandGuidelines.colors.primary.length + brandGuidelines.colors.secondary.length}
            </div>
          </div>
          <div className="text-center p-2 bg-white/60 rounded-lg">
            <div className="text-xs text-gray-500">Typography</div>
            <div className="text-sm font-medium">
              {brandGuidelines.typography.fonts.length} fonts
            </div>
          </div>
          <div className="text-center p-2 bg-white/60 rounded-lg">
            <div className="text-xs text-gray-500">Components</div>
            <div className="text-sm font-medium">
              {Object.keys(brandGuidelines.components || {}).length}
            </div>
          </div>
          <div className="text-center p-2 bg-white/60 rounded-lg">
            <div className="text-xs text-gray-500">Guidelines</div>
            <div className="text-sm font-medium">
              {brandGuidelines.brandRules?.length || 0}
            </div>
          </div>
        </div>

        {/* Brand Colors Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Primary Colors
          </h4>
          <div className="flex flex-wrap gap-2">
            {brandGuidelines.colors.primary.slice(0, 6).map((color, index) => (
              <div key={index} className="flex items-center gap-1">
                <div 
                  className="w-4 h-4 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{color}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </h4>
          <div className="flex flex-wrap gap-1">
            {brandGuidelines.typography.fonts.slice(0, 3).map((font, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {font}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}