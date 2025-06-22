import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Palette, 
  Layout, 
  Grid
} from "lucide-react";

interface WireframeCustomizationPanelProps {
  selectedDeviceType: 'mobile' | 'tablet' | 'desktop';
  selectedColorScheme: string;
  selectedDesignType: string;
  selectedLayout: string;
  onDeviceTypeChange: (deviceType: 'mobile' | 'tablet' | 'desktop') => void;
  onColorSchemeChange: (scheme: string) => void;
  onDesignTypeChange: (type: string) => void;
  onLayoutChange: (layout: string) => void;
}

const colorSchemes = [
  { value: 'modern-blue', label: 'Modern Blue', colors: ['#3B82F6', '#EFF6FF'] },
  { value: 'elegant-purple', label: 'Elegant Purple', colors: ['#8B5CF6', '#F3E8FF'] },
  { value: 'fresh-green', label: 'Fresh Green', colors: ['#10B981', '#ECFDF5'] },
  { value: 'warm-orange', label: 'Warm Orange', colors: ['#F59E0B', '#FEF3C7'] },
  { value: 'professional-gray', label: 'Professional Gray', colors: ['#6B7280', '#F9FAFB'] },
  { value: 'vibrant-red', label: 'Vibrant Red', colors: ['#EF4444', '#FEF2F2'] }
];

const designTypes = [
  { value: 'modern', label: 'Modern', description: 'Clean, contemporary design' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, focused layouts' },
  { value: 'corporate', label: 'Corporate', description: 'Professional business style' },
  { value: 'creative', label: 'Creative', description: 'Artistic, unique designs' },
  { value: 'material', label: 'Material', description: 'Google Material Design' },
  { value: 'ios', label: 'iOS Style', description: 'Apple design principles' }
];

const layoutOptions = [
  { value: 'standard-header', label: 'Standard Header', description: 'Traditional top navigation' },
  { value: 'sidebar-left', label: 'Left Sidebar', description: 'Navigation on the left' },
  { value: 'sidebar-right', label: 'Right Sidebar', description: 'Navigation on the right' },
  { value: 'centered', label: 'Centered Layout', description: 'Content in the center' },
  { value: 'full-width', label: 'Full Width', description: 'Edge-to-edge content' },
  { value: 'card-based', label: 'Card Layout', description: 'Card-based sections' }
];

export function WireframeCustomizationPanel({
  selectedDeviceType,
  selectedColorScheme,
  selectedDesignType,
  selectedLayout,
  onDeviceTypeChange,
  onColorSchemeChange,
  onDesignTypeChange,
  onLayoutChange
}: WireframeCustomizationPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-indigo-600" />
          Wireframe Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Target Device</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'mobile' as const, label: 'Mobile', icon: Smartphone },
              { value: 'tablet' as const, label: 'Tablet', icon: Tablet },
              { value: 'desktop' as const, label: 'Desktop', icon: Monitor }
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={selectedDeviceType === value ? "default" : "outline"}
                size="sm"
                onClick={() => onDeviceTypeChange(value)}
                className="flex flex-col items-center gap-1 h-16"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Color Scheme Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Palette className="h-4 w-4" />
            Color Scheme
          </Label>
          <Select value={selectedColorScheme} onValueChange={onColorSchemeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose color scheme" />
            </SelectTrigger>
            <SelectContent>
              {colorSchemes.map((scheme) => (
                <SelectItem key={scheme.value} value={scheme.value}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {scheme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {scheme.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Design Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Design Style</Label>
          <Select value={selectedDesignType} onValueChange={onDesignTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose design style" />
            </SelectTrigger>
            <SelectContent>
              {designTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col items-start">
                    <span>{type.label}</span>
                    <span className="text-xs text-gray-500">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Layout Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Layout className="h-4 w-4" />
            Layout Structure
          </Label>
          <Select value={selectedLayout} onValueChange={onLayoutChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose layout structure" />
            </SelectTrigger>
            <SelectContent>
              {layoutOptions.map((layout) => (
                <SelectItem key={layout.value} value={layout.value}>
                  <div className="flex flex-col items-start">
                    <span>{layout.label}</span>
                    <span className="text-xs text-gray-500">{layout.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview of Current Settings */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Current Configuration</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Device:</span>
              <span className="ml-1 font-medium capitalize">{selectedDeviceType}</span>
            </div>
            <div>
              <span className="text-gray-500">Style:</span>
              <span className="ml-1 font-medium capitalize">{selectedDesignType}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Color:</span>
              <span className="ml-1 font-medium">
                {colorSchemes.find(s => s.value === selectedColorScheme)?.label || 'Default'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}