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
  brand_compliant_layout?: any; // Flexible structure to handle various layouts
  brand_colors?: any; // Flexible structure for colors
  brand_typography?: any; // Flexible structure for typography
  brand_spacing?: any; // Flexible structure for spacing
  brand_assets?: any; // Flexible structure for assets
  [key: string]: any; // Allow any additional properties
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

    // Handle different data structures
    if (typeof layout === "string") {
      return (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 capitalize">{sectionName}</h4>
          <p className="text-sm text-gray-600">{layout}</p>
        </div>
      );
    }

    if (Array.isArray(layout)) {
      return (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 capitalize">{sectionName}</h4>
          <div className="space-y-2">
            {layout.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                {typeof item === "object" ? (
                  <div className="space-y-1">
                    {Object.entries(item).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="text-sm text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-600">{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof layout === "object") {
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 capitalize">{sectionName}</h4>
          <div className="grid gap-3">
            {Object.entries(layout).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-2 max-w-md">
                  {typeof value === "string" && value.startsWith("#") && (
                    <div
                      className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: value }}
                    />
                  )}
                  <span className="text-sm text-gray-600 text-right break-words">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderDynamicSection = (data: any, sectionName: string, icon?: React.ReactNode) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          {icon}
          {sectionName}
        </h4>
        {renderLayoutSection(data, sectionName)}
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
              
              {/* Display all other properties not in specific sections */}
              {Object.entries(data).map(([key, value]) => {
                if (!['brand', 'brand_url', 'brand_logo_url', 'brand_supported_images', 'brand_compliant_layout', 'brand_colors', 'brand_typography', 'brand_spacing', 'brand_assets'].includes(key)) {
                  return (
                    <div key={key}>
                      {renderDynamicSection(value, key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), <Type className="h-4 w-4" />)}
                    </div>
                  );
                }
                return null;
              })}
              
              {data.brand_typography && renderDynamicSection(data.brand_typography, "Typography", <Type className="h-4 w-4" />)}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            {data.brand_colors ? (
              renderDynamicSection(data.brand_colors, "Brand Colors", <Palette className="h-4 w-4" />)
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No specific color palette defined</p>
                <p className="text-sm">Colors may be embedded in layout specifications</p>
              </div>
            )}
            
            {/* Extract and display any color values from the entire data structure */}
            {(() => {
              const extractColors = (obj: any, path: string = ""): Array<{name: string, color: string, path: string}> => {
                const colors: Array<{name: string, color: string, path: string}> = [];
                
                if (typeof obj === "object" && obj !== null) {
                  Object.entries(obj).forEach(([key, value]) => {
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    if (typeof value === "string" && value.startsWith("#") && value.length === 7) {
                      colors.push({
                        name: key.replace(/_/g, " "),
                        color: value,
                        path: currentPath
                      });
                    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                      colors.push(...extractColors(value, currentPath));
                    }
                  });
                }
                
                return colors;
              };
              
              const allColors = extractColors(data);
              
              if (allColors.length > 0) {
                return (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Extracted Colors ({allColors.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allColors.map((colorItem, index) => (
                        <div key={index} className="space-y-2">
                          <div
                            className="w-full h-16 rounded-lg border border-gray-300 shadow-sm"
                            style={{ backgroundColor: colorItem.color }}
                          />
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700 capitalize">{colorItem.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{colorItem.color}</div>
                            <div className="text-xs text-gray-400">{colorItem.path}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            {data.brand_compliant_layout ? (
              renderDynamicSection(data.brand_compliant_layout, "Layout Specifications", <Layout className="h-4 w-4" />)
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Layout className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No layout specifications found</p>
              </div>
            )}
            
            {data.brand_spacing && renderDynamicSection(data.brand_spacing, "Spacing", <Layout className="h-4 w-4" />)}
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Brand Assets
              </h4>
              
              {data.brand_assets && renderDynamicSection(data.brand_assets, "Brand Assets", <Image className="h-4 w-4" />)}
              
              {data.brand_supported_images && data.brand_supported_images.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Supported Images ({data.brand_supported_images.length})</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.brand_supported_images.map((imageUrl, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={imageUrl}
                            alt={`Brand asset ${index + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><span>Image unavailable</span></div>';
                              }
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 break-all p-2 bg-gray-50 rounded">
                          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                            {imageUrl}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!data.brand_assets && (!data.brand_supported_images || data.brand_supported_images.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No brand assets found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}