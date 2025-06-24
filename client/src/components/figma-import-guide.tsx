import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Download,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  FileText,
  Layers,
  Palette,
  Upload,
  PlayCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FigmaImportGuideProps {
  isOpen: boolean;
  onClose: () => void;
  exportedFileName?: string;
}

export function FigmaImportGuide({ isOpen, onClose, exportedFileName }: FigmaImportGuideProps) {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
    toast({
      title: "Copied",
      description: "Instructions copied to clipboard",
    });
  };

  const figmaPlugins = [
    {
      name: "JSON to Figma",
      description: "Direct JSON import with layout preservation",
      url: "https://www.figma.com/community/plugin/789839703871161985",
      recommended: true,
    },
    {
      name: "HTML to Design",
      description: "Convert HTML structures to Figma components",
      url: "https://www.figma.com/community/plugin/1159123024924461424",
      recommended: false,
    },
    {
      name: "Design Tokens",
      description: "Import color and typography tokens",
      url: "https://www.figma.com/community/plugin/888356646278934516",
      recommended: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            How to Import Your Wireframes to Figma
          </DialogTitle>
          <DialogDescription>
            Step-by-step guide to importing your exported wireframes into Figma
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto">
          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="direct" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Direct Import
              </TabsTrigger>
              <TabsTrigger value="plugin" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Plugin Method
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Setup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Method 1: Direct JSON Import (Recommended)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Best for:</strong> Quick import with preserved structure and styling
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Open Figma in your browser (figma.com) or desktop app",
                      "Create a new file or open an existing project",
                      "Go to File → Import in the top menu",
                      `Select your downloaded file: ${exportedFileName || 'wireframes-figma-[date].fig'}`,
                      "Figma will automatically create pages for each wireframe",
                      "Review and adjust layouts as needed"
                    ].map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 min-w-[24px] h-6 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <p className="text-sm flex-1">{step}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(step, `direct-${index}`)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedStep === `direct-${index}` ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Organized pages for each wireframe</li>
                      <li>• Proper frame structures and layouts</li>
                      <li>• Text elements with correct content</li>
                      <li>• Color styles extracted from your designs</li>
                      <li>• Typography specifications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plugin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-600" />
                    Method 2: Using Figma Plugins
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      <strong>Best for:</strong> Advanced customization and specific import needs
                    </p>
                  </div>

                  <div className="space-y-4">
                    {figmaPlugins.map((plugin, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {plugin.name}
                              {plugin.recommended && (
                                <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{plugin.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(plugin.url, '_blank')}
                            className="ml-4"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Install
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="plugin-steps">
                      <AccordionTrigger>Step-by-step plugin usage</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {[
                            "Install a recommended plugin from the Figma Community",
                            "Open your Figma file and run the plugin (Plugins → [Plugin Name])",
                            "Upload your exported JSON file through the plugin interface",
                            "Configure import settings (layout, styling, etc.)",
                            "Click 'Import' and review the generated components",
                            "Make manual adjustments as needed"
                          ].map((step, index) => (
                            <div key={index} className="flex items-start gap-3 p-2">
                              <Badge variant="outline" className="min-w-[24px] h-6 flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              <p className="text-sm">{step}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Method 3: Manual Recreation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                      <strong>Best for:</strong> Full creative control and custom design systems
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Using the JSON Structure:</h4>
                      <ul className="text-sm space-y-2">
                        <li>• Extract layout dimensions from JSON</li>
                        <li>• Copy text content from wireframes</li>
                        <li>• Use color values for design system</li>
                        <li>• Reference font specifications</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Manual Steps:</h4>
                      <ul className="text-sm space-y-2">
                        <li>• Create frames matching wireframe sizes</li>
                        <li>• Add text and UI elements manually</li>
                        <li>• Apply extracted colors and fonts</li>
                        <li>• Set up auto-layout and constraints</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="common-issues">
                  <AccordionTrigger>Common Import Issues</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 border-l-4 border-red-400 bg-red-50">
                        <strong>Issue:</strong> "File format not supported"<br />
                        <strong>Solution:</strong> Try using Method 2 with plugins, or rename file extension to .json
                      </div>
                      <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                        <strong>Issue:</strong> "Elements appear misaligned"<br />
                        <strong>Solution:</strong> Use Figma's auto-layout feature to fix positioning
                      </div>
                      <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                        <strong>Issue:</strong> "Colors don't match original"<br />
                        <strong>Solution:</strong> Import the design tokens file separately for accurate colors
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Guide
          </Button>
          <Button 
            onClick={() => window.open('https://help.figma.com/hc/en-us/articles/360041003114-Import-files-into-Figma', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Figma Official Docs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}