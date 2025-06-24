import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Palette,
  Type,
  Layout,
  Image,
  Link,
  ChevronDown,
  ChevronRight,
  Edit3,
  Save,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrandGuidelinesData {
  brand: string;
  brand_url?: string;
  brand_logo_url?: string;
  brand_supported_images?: string[];
  brand_compliant_layout?: {
    navbar?: {
      height?: string;
      background_color?: string;
      text_color?: string;
      logo_alignment?: string;
      navigation_alignment?: string;
      padding?: string;
    };
    footer?: {
      background_color?: string;
      text_color?: string;
      padding?: string;
    };
    content?: {
      background_color?: string;
      text_color?: string;
      max_width?: string;
      padding?: string;
    };
  };
  brand_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
  brand_typography?: {
    primary_font?: string;
    secondary_font?: string;
    heading_font?: string;
    body_font?: string;
    [key: string]: string | undefined;
  };
  brand_spacing?: {
    small?: string;
    medium?: string;
    large?: string;
    [key: string]: string | undefined;
  };
  brand_assets?: {
    logo?: string;
    icon?: string;
    [key: string]: string | undefined;
  };
}

interface BrandGuidelinesViewerProps {
  data: BrandGuidelinesData;
  onDataChange: (newData: BrandGuidelinesData) => void;
  className?: string;
}

export function BrandGuidelinesViewer({
  data,
  onDataChange,
  className = "",
}: BrandGuidelinesViewerProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const { toast } = useToast();

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditingValue(value || "");
  };

  const saveEdit = () => {
    if (!editingField) return;

    const fieldPath = editingField.split(".");
    const newData = JSON.parse(JSON.stringify(data));
    
    let current = newData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = fieldPath[fieldPath.length - 1];
    current[lastKey] = editingValue;
    
    onDataChange(newData);
    setEditingField(null);
    setEditingValue("");
    
    toast({
      title: "Updated",
      description: `Successfully updated ${editingField}`,
    });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Value copied to clipboard",
    });
  };

  const renderEditableField = (label: string, value: string | undefined, fieldPath: string, icon?: React.ReactNode) => {
    const isEditing = editingField === fieldPath;
    
    if (isEditing) {
      return (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
              {icon}
              {label}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} className="h-8 px-3">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-3">
                Cancel
              </Button>
            </div>
          </div>
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="w-full"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group hover:bg-gray-50 rounded p-2 -m-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700">{label}</div>
            <div className="text-sm text-gray-600 break-all">{value || "Not set"}</div>
          </div>
          {value && value.startsWith("#") && (
            <div
              className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: value }}
              title={value}
            />
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(value)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEditing(fieldPath, value || "")}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const renderColorPalette = (colors: Record<string, string | undefined>) => {
    const colorEntries = Object.entries(colors).filter(([_, value]) => value);
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {colorEntries.map(([name, color]) => (
          <div key={name} className="space-y-2">
            <div
              className="w-full h-16 rounded-lg border border-gray-300 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 capitalize">{name.replace(/_/g, " ")}</div>
              <div className="text-xs text-gray-500 font-mono">{color}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLayoutSection = (layout: any, sectionName: string) => {
    if (!layout) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 capitalize">{sectionName}</h4>
        <div className="grid gap-3">
          {Object.entries(layout).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-2">
                {typeof value === "string" && value.startsWith("#") && (
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: value }}
                  />
                )}
                <span className="text-sm text-gray-600 font-mono">{String(value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {data.brand} Brand Guidelines
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {data.brand_url && (
            <a
              href={data.brand_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <ExternalLink className="h-4 w-4" />
              Website
            </a>
          )}
          {data.brand_logo_url && (
            <a
              href={data.brand_logo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <Image className="h-4 w-4" />
              Logo
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              {renderEditableField("Brand Name", data.brand, "brand", <Type className="h-4 w-4" />)}
              {renderEditableField("Website URL", data.brand_url, "brand_url", <Link className="h-4 w-4" />)}
              {renderEditableField("Logo URL", data.brand_logo_url, "brand_logo_url", <Image className="h-4 w-4" />)}
              
              {data.brand_typography && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Typography
                  </h4>
                  <div className="grid gap-3">
                    {Object.entries(data.brand_typography).map(([key, value]) => (
                      <div key={key}>
                        {renderEditableField(
                          key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                          value,
                          `brand_typography.${key}`,
                          <Type className="h-4 w-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            {data.brand_colors && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Brand Colors
                </h4>
                {renderColorPalette(data.brand_colors)}
              </div>
            )}
            
            {data.brand_compliant_layout && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Layout Colors</h4>
                <div className="grid gap-4">
                  {Object.entries(data.brand_compliant_layout).map(([section, sectionData]) => {
                    if (typeof sectionData === "object" && sectionData) {
                      const colors = Object.entries(sectionData).filter(([key, value]) => 
                        key.includes("color") && typeof value === "string" && value.startsWith("#")
                      );
                      
                      if (colors.length > 0) {
                        return (
                          <div key={section} className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-700 capitalize">{section}</h5>
                            <div className="flex gap-2">
                              {colors.map(([colorKey, colorValue]) => (
                                <div key={colorKey} className="text-center">
                                  <div
                                    className="w-12 h-12 rounded border border-gray-300"
                                    style={{ backgroundColor: colorValue }}
                                  />
                                  <div className="text-xs text-gray-500 mt-1">{colorKey.replace(/_/g, " ")}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            {data.brand_compliant_layout && (
              <div className="space-y-6">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout Specifications
                </h4>
                {Object.entries(data.brand_compliant_layout).map(([section, sectionData]) => (
                  <div key={section}>
                    {renderLayoutSection(sectionData, section)}
                  </div>
                ))}
              </div>
            )}
            
            {data.brand_spacing && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Spacing</h4>
                <div className="grid gap-3">
                  {Object.entries(data.brand_spacing).map(([key, value]) => (
                    <div key={key}>
                      {renderEditableField(
                        key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                        value,
                        `brand_spacing.${key}`
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Brand Assets
              </h4>
              
              {data.brand_assets && (
                <div className="grid gap-3">
                  {Object.entries(data.brand_assets).map(([key, value]) => (
                    <div key={key}>
                      {renderEditableField(
                        key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                        value,
                        `brand_assets.${key}`,
                        <Image className="h-4 w-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {data.brand_supported_images && data.brand_supported_images.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Supported Images</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.brand_supported_images.map((imageUrl, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Brand asset ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 break-all">{imageUrl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}