import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  Save,
  Palette,
  Type,
  Link,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JsonEditorProps {
  data: any;
  onDataChange: (newData: any) => void;
  storageKey?: string;
  title?: string;
  className?: string;
}

interface EditingState {
  path: string;
  value: string;
  originalValue: any;
}

export function JsonEditor({
  data,
  onDataChange,
  storageKey,
  title = "JSON Data",
  className = "",
}: JsonEditorProps) {
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Auto-expand first level on mount
  useEffect(() => {
    if (data && typeof data === "object") {
      const firstLevelPaths = Object.keys(data).map((key) => key);
      setExpandedPaths(new Set(firstLevelPaths));
    }
  }, []);

  const updateValue = (path: string, newValue: any) => {
    const pathArray = path.split(".");
    const newData = JSON.parse(JSON.stringify(data));
    
    let current = newData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = pathArray[pathArray.length - 1];
    current[lastKey] = newValue;
    
    onDataChange(newData);
    
    // Update localStorage if storageKey is provided
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    }
    
    toast({
      title: "Updated",
      description: `Successfully updated ${path}`,
    });
  };

  const deleteProperty = (path: string) => {
    const pathArray = path.split(".");
    const newData = JSON.parse(JSON.stringify(data));
    
    let current = newData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    const lastKey = pathArray[pathArray.length - 1];
    delete current[lastKey];
    
    onDataChange(newData);
    
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    }
    
    toast({
      title: "Deleted",
      description: `Successfully deleted ${path}`,
    });
  };

  const addProperty = (path: string, key: string, value: any) => {
    const pathArray = path ? path.split(".") : [];
    const newData = JSON.parse(JSON.stringify(data));
    
    let current = newData;
    for (const pathKey of pathArray) {
      current = current[pathKey];
    }
    
    current[key] = value;
    
    onDataChange(newData);
    
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    }
    
    toast({
      title: "Added",
      description: `Successfully added ${key}`,
    });
  };

  const startEditing = (path: string, value: any) => {
    setEditingState({
      path,
      value: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      originalValue: value,
    });
  };

  const saveEdit = () => {
    if (!editingState) return;
    
    try {
      let newValue: any;
      
      // Try to parse as JSON first
      try {
        newValue = JSON.parse(editingState.value);
      } catch {
        // If not valid JSON, treat as string
        newValue = editingState.value;
      }
      
      updateValue(editingState.path, newValue);
      setEditingState(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingState(null);
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (expandedPaths.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const getValueIcon = (value: any) => {
    if (typeof value === "string") {
      if (value.startsWith("#") && value.length === 7) return <Palette className="h-4 w-4 text-purple-500" />;
      if (value.startsWith("http")) return <Link className="h-4 w-4 text-blue-500" />;
      if (/font|typeface/i.test(value)) return <Type className="h-4 w-4 text-green-500" />;
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
    return null;
  };

  const renderColorPreview = (value: string) => {
    if (typeof value === "string" && value.startsWith("#") && value.length === 7) {
      return (
        <div
          className="w-6 h-6 rounded border border-gray-300 ml-2 flex-shrink-0"
          style={{ backgroundColor: value }}
          title={value}
        />
      );
    }
    return null;
  };

  const filterBySearch = (obj: any, path: string = ""): boolean => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if current path matches
    if (path.toLowerCase().includes(searchLower)) return true;
    
    // Check if value matches
    if (typeof obj === "string" && obj.toLowerCase().includes(searchLower)) return true;
    
    // Check nested objects
    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).some(([key, value]) =>
        filterBySearch(value, path ? `${path}.${key}` : key)
      );
    }
    
    return false;
  };

  const renderValue = (value: any, path: string = "", level: number = 0): React.ReactNode => {
    const isEditing = editingState?.path === path;
    const isExpanded = expandedPaths.has(path);
    
    if (!filterBySearch(value, path)) return null;

    if (isEditing) {
      return (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-blue-800">
              Editing: {path}
            </Label>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} className="h-8 px-3">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-3">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            value={editingState.value}
            onChange={(e) =>
              setEditingState({ ...editingState, value: e.target.value })
            }
            className="min-h-[100px] font-mono text-sm"
            placeholder="Enter value or valid JSON..."
          />
        </div>
      );
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span className="text-gray-400 italic">Empty object</span>;

      return (
        <div className={level > 0 ? "ml-4" : ""}>
          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(path)}>
            <div className="flex items-center justify-between group hover:bg-gray-50 rounded p-2 -m-2">
              <CollapsibleTrigger className="flex items-center gap-2 text-left">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium text-gray-700">
                  {path.split(".").pop() || "Root"} ({entries.length} items)
                </span>
              </CollapsibleTrigger>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const key = prompt("Property name:");
                    if (key) {
                      const value = prompt("Property value:");
                      if (value !== null) {
                        addProperty(path, key, value);
                      }
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <CollapsibleContent>
              <div className="space-y-1 ml-6 mt-2">
                {entries.map(([key, val]) => {
                  const childPath = path ? `${path}.${key}` : key;
                  return (
                    <div key={key} className="group flex items-start gap-2 py-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-600">{key}:</span>
                          {getValueIcon(val)}
                        </div>
                        {renderValue(val, childPath, level + 1)}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(childPath, val)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete "${key}"?`)) {
                              deleteProperty(childPath);
                            }
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between group hover:bg-gray-50 rounded p-2 -m-2">
            <span className="text-sm text-gray-600">Array ({value.length} items)</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(path, value)}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
          <div className="ml-4 space-y-1">
            {value.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {index}
                </Badge>
                <span className="text-sm text-gray-700">
                  {typeof item === "object" ? JSON.stringify(item) : String(item)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Primitive values
    return (
      <div className="flex items-center gap-2 group hover:bg-gray-50 rounded p-2 -m-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-gray-900 break-all">
            {String(value)}
          </span>
          {renderColorPreview(String(value))}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(String(value))}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEditing(path, value)}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const saveToFile = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "JSON data saved to file",
    });
  };

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={saveToFile}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <div className="flex gap-2 text-xs text-gray-500">
            <span>Objects: {Object.keys(data).length}</span>
            <span>•</span>
            <span>Storage: {storageKey || "Memory only"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-auto">
        {renderValue(data)}
      </CardContent>
    </Card>
  );
}