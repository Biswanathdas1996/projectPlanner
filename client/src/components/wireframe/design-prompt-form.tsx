import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Plus, 
  X,
  Sparkles
} from "lucide-react";

interface DesignPrompt {
  projectType: string;
  targetAudience: string;
  primaryFeatures: string[];
  colorPreference: string;
  designStyle: string;
  deviceType: string;
  screenTypes: string[];
}

interface DesignPromptFormProps {
  designPrompt: DesignPrompt;
  onDesignPromptChange: (prompt: DesignPrompt) => void;
  onAnalyzeRequirements: () => void;
  isAnalyzing: boolean;
  error: string;
}

const commonFeatures = [
  "User Authentication", "Search Functionality", "Notifications", "User Profile",
  "Settings/Preferences", "Data Visualization", "File Upload", "Social Sharing",
  "Comments/Reviews", "Favorites/Bookmarks", "Chat/Messaging", "Payment Integration",
  "Multi-language Support", "Dark Mode", "Offline Support", "Push Notifications"
];

export function DesignPromptForm({
  designPrompt,
  onDesignPromptChange,
  onAnalyzeRequirements,
  isAnalyzing,
  error
}: DesignPromptFormProps) {
  const [newFeature, setNewFeature] = useState("");

  const handleAddFeature = () => {
    if (newFeature.trim() && !designPrompt.primaryFeatures.includes(newFeature.trim())) {
      onDesignPromptChange({
        ...designPrompt,
        primaryFeatures: [...designPrompt.primaryFeatures, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (feature: string) => {
    onDesignPromptChange({
      ...designPrompt,
      primaryFeatures: designPrompt.primaryFeatures.filter(f => f !== feature)
    });
  };

  const handleAddCommonFeature = (feature: string) => {
    if (!designPrompt.primaryFeatures.includes(feature)) {
      onDesignPromptChange({
        ...designPrompt,
        primaryFeatures: [...designPrompt.primaryFeatures, feature]
      });
    }
  };

  const handleScreenTypeToggle = (screenType: string) => {
    const updatedScreenTypes = designPrompt.screenTypes.includes(screenType)
      ? designPrompt.screenTypes.filter(type => type !== screenType)
      : [...designPrompt.screenTypes, screenType];
    
    onDesignPromptChange({
      ...designPrompt,
      screenTypes: updatedScreenTypes
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Project Requirements
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Describe your project to generate tailored wireframes and content
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="projectType" className="text-sm font-medium text-gray-700">
              Project Type
            </Label>
            <Input
              id="projectType"
              placeholder="e.g., E-commerce Platform, Social Media App"
              value={designPrompt.projectType}
              onChange={(e) => onDesignPromptChange({ ...designPrompt, projectType: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="text-sm font-medium text-gray-700">
              Target Audience
            </Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Young professionals, Small businesses"
              value={designPrompt.targetAudience}
              onChange={(e) => onDesignPromptChange({ ...designPrompt, targetAudience: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Primary Features</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {designPrompt.primaryFeatures.map((feature) => (
              <Badge 
                key={feature} 
                variant="secondary" 
                className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
              >
                {feature}
                <X 
                  className="h-3 w-3 ml-1" 
                  onClick={() => handleRemoveFeature(feature)}
                />
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add custom feature"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
              className="flex-1"
            />
            <Button onClick={handleAddFeature} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {commonFeatures.filter(feature => !designPrompt.primaryFeatures.includes(feature)).map((feature) => (
              <Badge 
                key={feature} 
                variant="outline" 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleAddCommonFeature(feature)}
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="colorPreference" className="text-sm font-medium text-gray-700">
              Color Preference
            </Label>
            <Select value={designPrompt.colorPreference} onValueChange={(value) => onDesignPromptChange({ ...designPrompt, colorPreference: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose color scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="neutral">Neutral/Gray</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="designStyle" className="text-sm font-medium text-gray-700">
              Design Style
            </Label>
            <Select value={designPrompt.designStyle} onValueChange={(value) => onDesignPromptChange({ ...designPrompt, designStyle: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose design style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Device Type</Label>
          <div className="flex gap-4">
            {[
              { value: 'mobile', label: 'Mobile', icon: Smartphone },
              { value: 'tablet', label: 'Tablet', icon: Tablet },
              { value: 'desktop', label: 'Desktop', icon: Monitor }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onDesignPromptChange({ ...designPrompt, deviceType: value })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  designPrompt.deviceType === value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Screen Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              "Home/Landing", "Product List", "Product Detail", "Shopping Cart",
              "User Profile", "Settings", "Login/Register", "Dashboard",
              "Search Results", "Contact/About", "Blog/News", "FAQ/Help"
            ].map((screenType) => (
              <button
                key={screenType}
                onClick={() => handleScreenTypeToggle(screenType)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  designPrompt.screenTypes.includes(screenType)
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {screenType}
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={onAnalyzeRequirements}
          disabled={isAnalyzing || !designPrompt.projectType.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing Requirements...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Analyze Requirements
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}