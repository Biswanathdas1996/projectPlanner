import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Plus, Wand2, Loader2 } from "lucide-react";

interface PageContent {
  id: string;
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  headers: string[];
  buttons: { label: string; action: string; style: string }[];
  forms: { title: string; fields: string[]; submitAction: string }[];
  lists: { title: string; items: string[]; type: string }[];
  navigation: string[];
  additionalContent: string[];
  isEdited: boolean;
}

interface WireframeGenerationPanelProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  projectDescription: string;
  onProjectDescriptionChange: (description: string) => void;
  pageContents: PageContent[];
  onPageContentsChange: (contents: PageContent[]) => void;
  onGenerateWireframes: () => void;
  isGeneratingWireframes: boolean;
  wireframeProgress: { current: number; total: number; currentPage: string };
  className?: string;
}

export function WireframeGenerationPanel({
  projectName,
  onProjectNameChange,
  projectDescription,
  onProjectDescriptionChange,
  pageContents,
  onPageContentsChange,
  onGenerateWireframes,
  isGeneratingWireframes,
  wireframeProgress,
  className = ""
}: WireframeGenerationPanelProps) {
  const [newPageName, setNewPageName] = useState("");

  const addNewPage = () => {
    if (!newPageName.trim()) return;
    
    const newPage: PageContent = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pageName: newPageName,
      pageType: "standard",
      purpose: "",
      stakeholders: [],
      headers: [],
      buttons: [],
      forms: [],
      lists: [],
      navigation: [],
      additionalContent: [],
      isEdited: false
    };
    
    onPageContentsChange([...pageContents, newPage]);
    setNewPageName("");
  };

  const updatePageContent = (pageId: string, field: keyof PageContent, value: any) => {
    const updatedPages = pageContents.map(page => 
      page.id === pageId 
        ? { ...page, [field]: value, isEdited: true }
        : page
    );
    onPageContentsChange(updatedPages);
  };

  const removePage = (pageId: string) => {
    onPageContentsChange(pageContents.filter(page => page.id !== pageId));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Wireframe Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Enter your project name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <Textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => onProjectDescriptionChange(e.target.value)}
              placeholder="Describe your project and its main features"
              rows={3}
            />
          </div>
        </div>

        {/* Page Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Pages to Generate</h3>
            <span className="text-xs text-gray-500">{pageContents.length} pages</span>
          </div>
          
          {/* Add New Page */}
          <div className="flex gap-2">
            <Input
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              placeholder="Enter page name"
              onKeyPress={(e) => e.key === 'Enter' && addNewPage()}
            />
            <Button onClick={addNewPage} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Page List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pageContents.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <Input
                    value={page.pageName}
                    onChange={(e) => updatePageContent(page.id, 'pageName', e.target.value)}
                    className="text-sm h-8"
                  />
                </div>
                <Button
                  onClick={() => removePage(page.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Progress */}
        {isGeneratingWireframes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Generating Wireframes</span>
            </div>
            <Progress 
              value={wireframeProgress.total > 0 ? (wireframeProgress.current / wireframeProgress.total) * 100 : 0}
              className="h-2"
            />
            <p className="text-xs text-gray-600">
              {wireframeProgress.currentPage && `Processing: ${wireframeProgress.currentPage}`}
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={onGenerateWireframes}
          disabled={isGeneratingWireframes || pageContents.length === 0 || !projectName.trim()}
          className="w-full"
        >
          {isGeneratingWireframes ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Wireframes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}