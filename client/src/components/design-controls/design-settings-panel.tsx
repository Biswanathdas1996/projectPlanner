import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Palette, Layout, Smartphone, Monitor, Tablet } from "lucide-react";

interface DesignSettingsPanelProps {
  selectedColorScheme: string;
  onColorSchemeChange: (value: string) => void;
  selectedDesignType: string;
  onDesignTypeChange: (value: string) => void;
  selectedLayout: string;
  onLayoutChange: (value: string) => void;
  selectedDevice: string;
  onDeviceChange: (value: string) => void;
  onApplyToAll: () => void;
  className?: string;
}

const colorSchemes = [
  { value: "modern-blue", label: "Modern Blue" },
  { value: "corporate-gray", label: "Corporate Gray" },
  { value: "vibrant-green", label: "Vibrant Green" },
  { value: "elegant-purple", label: "Elegant Purple" },
  { value: "warm-orange", label: "Warm Orange" },
  { value: "minimalist-black", label: "Minimalist Black" }
];

const designTypes = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "minimalist", label: "Minimalist" },
  { value: "creative", label: "Creative" },
  { value: "corporate", label: "Corporate" },
  { value: "startup", label: "Startup" }
];

const layoutTypes = [
  { value: "standard-header", label: "Standard Header" },
  { value: "sidebar-navigation", label: "Sidebar Navigation" },
  { value: "top-navigation", label: "Top Navigation" },
  { value: "centered-content", label: "Centered Content" },
  { value: "full-width", label: "Full Width" },
  { value: "card-layout", label: "Card Layout" }
];

const deviceTypes = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone }
];

export function DesignSettingsPanel({
  selectedColorScheme,
  onColorSchemeChange,
  selectedDesignType,
  onDesignTypeChange,
  selectedLayout,
  onLayoutChange,
  selectedDevice,
  onDeviceChange,
  onApplyToAll,
  className = ""
}: DesignSettingsPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Design Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4" />
            Color Scheme
          </Label>
          <Select value={selectedColorScheme} onValueChange={onColorSchemeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select color scheme" />
            </SelectTrigger>
            <SelectContent>
              {colorSchemes.map((scheme) => (
                <SelectItem key={scheme.value} value={scheme.value}>
                  {scheme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Design Type</Label>
          <Select value={selectedDesignType} onValueChange={onDesignTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select design type" />
            </SelectTrigger>
            <SelectContent>
              {designTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Layout className="h-4 w-4" />
            Layout Style
          </Label>
          <Select value={selectedLayout} onValueChange={onLayoutChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {layoutTypes.map((layout) => (
                <SelectItem key={layout.value} value={layout.value}>
                  {layout.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Device Type</Label>
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map((device) => {
                const Icon = device.icon;
                return (
                  <SelectItem key={device.value} value={device.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {device.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={onApplyToAll}
          className="w-full"
          variant="outline"
        >
          Apply to All Pages
        </Button>
      </CardContent>
    </Card>
  );
}