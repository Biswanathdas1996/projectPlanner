import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationBar } from "@/components/navigation-bar";
import { WorkflowProgress } from "@/components/workflow-progress";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Layout,
  Code,
  Download,
  Eye,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface PageRequirement {
  id: string;
  pageName: string;
  purpose: string;
  targetAudience: string;
  keyFeatures: string[];
  content: string[];
  interactions: string[];
  deviceType: "mobile" | "tablet" | "desktop";
  priority: "low" | "medium" | "high";
}

interface WireframeAnalysisResult {
  id: string;
  pageName: string;
  deviceType: string;
  analysisNotes: string;
  components: any[];
}

export default function WireframeDesigner() {
  const [requirements, setRequirements] = useState<PageRequirement[]>([]);
  const [generatedWireframes, setGeneratedWireframes] = useState<WireframeAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("requirements");
  const [selectedWireframe, setSelectedWireframe] = useState<WireframeAnalysisResult | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedRequirements = localStorage.getItem('wireframe_requirements');
      const savedWireframes = localStorage.getItem('generated_wireframes');

      if (savedRequirements) {
        const parsed = JSON.parse(savedRequirements);
        setRequirements(Array.isArray(parsed) ? parsed : []);
      }
      if (savedWireframes) {
        const parsed = JSON.parse(savedWireframes);
        setGeneratedWireframes(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      setRequirements([]);
      setGeneratedWireframes([]);
    }
  }, []);

  const handleGenerateWireframes = async () => {
    if (requirements.length === 0) {
      toast({
        title: "No Requirements",
        description: "Please add some page requirements first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate wireframe generation
      const results: WireframeAnalysisResult[] = requirements.map(req => ({
        id: Date.now() + Math.random().toString(),
        pageName: req.pageName,
        deviceType: req.deviceType,
        analysisNotes: `Generated wireframe for ${req.pageName} targeting ${req.targetAudience}`,
        components: []
      }));

      setGeneratedWireframes(results);
      localStorage.setItem('generated_wireframes', JSON.stringify(results));
      
      toast({
        title: "Wireframes Generated",
        description: `Successfully generated ${results.length} wireframes.`,
      });
      
      setActiveTab("wireframes");
    } catch (error) {
      console.error('Error generating wireframes:', error);
      setError('Failed to generate wireframes. Please try again.');
      toast({
        title: "Generation Failed",
        description: "Failed to generate wireframes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addRequirement = () => {
    const newRequirement: PageRequirement = {
      id: Date.now().toString(),
      pageName: "",
      purpose: "",
      targetAudience: "",
      keyFeatures: [],
      content: [],
      interactions: [],
      deviceType: "mobile",
      priority: "medium"
    };
    
    const updatedRequirements = [...requirements, newRequirement];
    setRequirements(updatedRequirements);
    localStorage.setItem('wireframe_requirements', JSON.stringify(updatedRequirements));
  };

  const updateRequirement = (id: string, updates: Partial<PageRequirement>) => {
    const updatedRequirements = requirements.map(req => 
      req.id === id ? { ...req, ...updates } : req
    );
    setRequirements(updatedRequirements);
    localStorage.setItem('wireframe_requirements', JSON.stringify(updatedRequirements));
  };

  const removeRequirement = (id: string) => {
    const updatedRequirements = requirements.filter(req => req.id !== id);
    setRequirements(updatedRequirements);
    localStorage.setItem('wireframe_requirements', JSON.stringify(updatedRequirements));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <NavigationBar title="Wireframe Designer" showBackButton />
      <WorkflowProgress currentStep="wireframes" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Wireframe Designer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Transform your project requirements into professional wireframes with AI assistance.
            Generate responsive designs, enhance with brand guidelines, and export to multiple formats.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="wireframes" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Wireframes
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Code Generation
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Page Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requirements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No requirements added yet. Click "Add Requirement" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requirements.map((req) => (
                      <Card key={req.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Page Name</Label>
                              <Input
                                value={req.pageName}
                                onChange={(e) => updateRequirement(req.id, { pageName: e.target.value })}
                                placeholder="e.g., Home Page, Login Form"
                              />
                            </div>
                            <div>
                              <Label>Device Type</Label>
                              <Select
                                value={req.deviceType}
                                onValueChange={(value: "mobile" | "tablet" | "desktop") => 
                                  updateRequirement(req.id, { deviceType: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mobile">Mobile</SelectItem>
                                  <SelectItem value="tablet">Tablet</SelectItem>
                                  <SelectItem value="desktop">Desktop</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <Label>Purpose</Label>
                              <Textarea
                                value={req.purpose}
                                onChange={(e) => updateRequirement(req.id, { purpose: e.target.value })}
                                placeholder="Describe the main purpose of this page..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeRequirement(req.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <Button onClick={addRequirement} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Requirement
                  </Button>
                  <Button
                    onClick={handleGenerateWireframes}
                    disabled={isLoading || requirements.length === 0}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate Wireframes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wireframes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Generated Wireframes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedWireframes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No wireframes generated yet. Add requirements and generate wireframes first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedWireframes.map((wireframe) => (
                      <Card key={wireframe.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{wireframe.pageName}</CardTitle>
                          <Badge variant="outline">{wireframe.deviceType}</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {wireframe.analysisNotes}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setSelectedWireframe(wireframe)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Code generation features will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Export functionality will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}