import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Layout } from "lucide-react";

interface PageContentCard {
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

interface PageContentEditorProps {
  selectedPageContent: PageContentCard | null;
  onPageContentUpdate: (updatedContent: PageContentCard) => void;
}

export function PageContentEditor({
  selectedPageContent,
  onPageContentUpdate
}: PageContentEditorProps) {
  if (!selectedPageContent) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center text-gray-500">
          <Layout className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select a page from your project plan to edit its content</p>
        </CardContent>
      </Card>
    );
  }

  const updatePageContent = (field: keyof PageContentCard, value: any) => {
    const updatedContent = {
      ...selectedPageContent,
      [field]: value,
      isEdited: true
    };
    onPageContentUpdate(updatedContent);
  };

  const addToArray = (field: keyof PageContentCard, newItem: any) => {
    const currentArray = (selectedPageContent[field] as any[]) || [];
    updatePageContent(field, [...currentArray, newItem]);
  };

  const removeFromArray = (field: keyof PageContentCard, index: number) => {
    const currentArray = (selectedPageContent[field] as any[]) || [];
    updatePageContent(field, currentArray.filter((_: any, i: number) => i !== index));
  };

  const updateArrayItem = (field: keyof PageContentCard, index: number, newValue: any) => {
    const currentArray = (selectedPageContent[field] as any[]) || [];
    const updatedArray = currentArray.map((item: any, i: number) => i === index ? newValue : item);
    updatePageContent(field, updatedArray);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Page Content Editor - {selectedPageContent.pageName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pageName">Page Name</Label>
            <Input
              id="pageName"
              value={selectedPageContent.pageName}
              onChange={(e) => updatePageContent('pageName', e.target.value)}
              placeholder="Enter page name"
            />
          </div>
          <div>
            <Label htmlFor="pageType">Page Type</Label>
            <Input
              id="pageType"
              value={selectedPageContent.pageType}
              onChange={(e) => updatePageContent('pageType', e.target.value)}
              placeholder="e.g., Dashboard, Form, Landing"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            value={selectedPageContent.purpose}
            onChange={(e) => updatePageContent('purpose', e.target.value)}
            placeholder="Describe the purpose of this page"
            rows={3}
          />
        </div>

        {/* Stakeholders */}
        <div>
          <Label>Stakeholders</Label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedPageContent.stakeholders?.map((stakeholder, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {stakeholder}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFromArray('stakeholders', index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add stakeholder"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    addToArray('stakeholders', e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                  if (input?.value.trim()) {
                    addToArray('stakeholders', input.value.trim());
                    input.value = '';
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Headers */}
        <div>
          <Label>Headers</Label>
          <div className="space-y-2">
            {selectedPageContent.headers?.map((header, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={header}
                  onChange={(e) => updateArrayItem('headers', index, e.target.value)}
                  placeholder="Header text"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFromArray('headers', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addToArray('headers', '')}
            >
              <Plus className="h-4 w-4" />
              Add Header
            </Button>
          </div>
        </div>

        {/* Buttons */}
        <div>
          <Label>Buttons</Label>
          <div className="space-y-3">
            {selectedPageContent.buttons?.map((button, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded">
                <Input
                  value={button.label}
                  onChange={(e) => updateArrayItem('buttons', index, { ...button, label: e.target.value })}
                  placeholder="Button label"
                />
                <Input
                  value={button.action}
                  onChange={(e) => updateArrayItem('buttons', index, { ...button, action: e.target.value })}
                  placeholder="Button action"
                />
                <div className="flex gap-2">
                  <Input
                    value={button.style}
                    onChange={(e) => updateArrayItem('buttons', index, { ...button, style: e.target.value })}
                    placeholder="Button style"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromArray('buttons', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addToArray('buttons', { label: '', action: '', style: 'primary' })}
            >
              <Plus className="h-4 w-4" />
              Add Button
            </Button>
          </div>
        </div>

        {/* Forms */}
        <div>
          <Label>Forms</Label>
          <div className="space-y-3">
            {selectedPageContent.forms?.map((form, index) => (
              <div key={index} className="p-3 border rounded space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={form.title}
                    onChange={(e) => updateArrayItem('forms', index, { ...form, title: e.target.value })}
                    placeholder="Form title"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromArray('forms', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={form.submitAction}
                  onChange={(e) => updateArrayItem('forms', index, { ...form, submitAction: e.target.value })}
                  placeholder="Submit action"
                />
                <div className="space-y-1">
                  <Label className="text-sm">Form Fields</Label>
                  {form.fields?.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex gap-2">
                      <Input
                        value={field}
                        onChange={(e) => {
                          const updatedFields = form.fields.map((f, fi) => fi === fieldIndex ? e.target.value : f);
                          updateArrayItem('forms', index, { ...form, fields: updatedFields });
                        }}
                        placeholder="Field name"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updatedFields = form.fields.filter((_, fi) => fi !== fieldIndex);
                          updateArrayItem('forms', index, { ...form, fields: updatedFields });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedFields = [...(form.fields || []), ''];
                      updateArrayItem('forms', index, { ...form, fields: updatedFields });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addToArray('forms', { title: '', fields: [], submitAction: '' })}
            >
              <Plus className="h-4 w-4" />
              Add Form
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <Label>Navigation Items</Label>
          <div className="space-y-2">
            {selectedPageContent.navigation?.map((navItem, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={navItem}
                  onChange={(e) => updateArrayItem('navigation', index, e.target.value)}
                  placeholder="Navigation item"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFromArray('navigation', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addToArray('navigation', '')}
            >
              <Plus className="h-4 w-4" />
              Add Navigation Item
            </Button>
          </div>
        </div>

        {/* Additional Content */}
        <div>
          <Label>Additional Content</Label>
          <div className="space-y-2">
            {selectedPageContent.additionalContent?.map((content, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={content}
                  onChange={(e) => updateArrayItem('additionalContent', index, e.target.value)}
                  placeholder="Additional content description"
                  rows={2}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFromArray('additionalContent', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addToArray('additionalContent', '')}
            >
              <Plus className="h-4 w-4" />
              Add Content Section
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}