import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Layout, CheckCircle2 } from "lucide-react";

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

interface PageContentSelectorProps {
  availablePageContent: PageContentCard[];
  selectedPageContent: PageContentCard | null;
  onPageContentSelect: (content: PageContentCard) => void;
}

export function PageContentSelector({
  availablePageContent,
  selectedPageContent,
  onPageContentSelect
}: PageContentSelectorProps) {
  if (availablePageContent.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-medium mb-2">No Page Content Available</h3>
          <p className="text-sm">
            Generate a project plan first to get page content for wireframe creation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Page Content ({availablePageContent.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePageContent.map((content) => (
            <div
              key={content.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPageContent?.id === content.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => onPageContentSelect(content)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {content.pageName}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {content.pageType}
                  </Badge>
                </div>
                {selectedPageContent?.id === content.id && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                )}
                {content.isEdited && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    Edited
                  </Badge>
                )}
              </div>

              {/* Purpose */}
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {content.purpose}
              </p>

              {/* Stakeholders */}
              {content.stakeholders && content.stakeholders.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {content.stakeholders.length} stakeholder{content.stakeholders.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Content Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Layout className="h-3 w-3" />
                  <span>{content.headers?.length || 0} headers</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-300"></span>
                  <span>{content.buttons?.length || 0} buttons</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-300"></span>
                  <span>{content.forms?.length || 0} forms</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-300"></span>
                  <span>{content.navigation?.length || 0} nav items</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant={selectedPageContent?.id === content.id ? "default" : "outline"}
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onPageContentSelect(content);
                }}
              >
                {selectedPageContent?.id === content.id ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>

        {/* Selected Content Summary */}
        {selectedPageContent && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Selected: {selectedPageContent.pageName}
              </span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              {selectedPageContent.purpose}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedPageContent.stakeholders?.map((stakeholder, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {stakeholder}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}