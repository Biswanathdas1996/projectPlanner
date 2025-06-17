import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Plus, Edit, Trash2, Save, X, GripVertical } from 'lucide-react';

export interface ProjectSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  enabled: boolean;
  isCustom?: boolean;
}

interface ProjectSectionsSettingsProps {
  sections: ProjectSection[];
  onSectionsChange: (sections: ProjectSection[]) => void;
}

const DEFAULT_SECTIONS: ProjectSection[] = [
  { id: "executive-summary", title: "Executive Summary", description: "Project overview and objectives", icon: "📋", order: 1, enabled: true },
  { id: "technical-architecture", title: "Technical Architecture & Infrastructure", description: "System design and technology stack", icon: "🏗️", order: 2, enabled: true },
  { id: "feature-specifications", title: "Detailed Feature Specifications", description: "Complete feature breakdown", icon: "⚙️", order: 3, enabled: true },
  { id: "development-methodology", title: "Development Methodology & Timeline", description: "Project timeline and methodology", icon: "📅", order: 4, enabled: true },
  { id: "user-experience", title: "User Experience & Interface Design", description: "UX/UI design strategy", icon: "🎨", order: 5, enabled: true },
  { id: "quality-assurance", title: "Quality Assurance & Testing Strategy", description: "Testing and QA approach", icon: "🧪", order: 6, enabled: true },
  { id: "deployment-devops", title: "Deployment & DevOps Strategy", description: "Deployment and infrastructure", icon: "🚀", order: 7, enabled: true },
  { id: "risk-management", title: "Risk Management & Mitigation", description: "Risk assessment and planning", icon: "⚠️", order: 8, enabled: true },
  { id: "stakeholder-management", title: "Stakeholder Management", description: "Communication and stakeholder strategy", icon: "👥", order: 9, enabled: true },
  { id: "post-launch", title: "Post-Launch Strategy", description: "Launch and growth planning", icon: "📈", order: 10, enabled: true }
];

export function ProjectSectionsSettings({ sections, onSectionsChange }: ProjectSectionsSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSections, setLocalSections] = useState<ProjectSection[]>(sections);
  const [editingSection, setEditingSection] = useState<ProjectSection | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSection, setNewSection] = useState<Partial<ProjectSection>>({
    title: '',
    description: '',
    icon: '📄',
    enabled: true
  });

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const saveSettings = () => {
    // Save to localStorage
    localStorage.setItem('project_sections_settings', JSON.stringify(localSections));
    onSectionsChange(localSections);
    setIsOpen(false);
  };

  const resetToDefaults = () => {
    setLocalSections(DEFAULT_SECTIONS);
  };

  const toggleSectionEnabled = (id: string) => {
    setLocalSections(prev => prev.map(section => 
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  };

  const deleteSection = (id: string) => {
    setLocalSections(prev => prev.filter(section => section.id !== id));
  };

  const startEditing = (section: ProjectSection) => {
    setEditingSection({ ...section });
  };

  const saveEdit = () => {
    if (!editingSection) return;
    
    setLocalSections(prev => prev.map(section => 
      section.id === editingSection.id ? editingSection : section
    ));
    setEditingSection(null);
  };

  const cancelEdit = () => {
    setEditingSection(null);
  };

  const addNewSection = () => {
    if (!newSection.title?.trim()) return;

    const maxOrder = Math.max(...localSections.map(s => s.order), 0);
    const section: ProjectSection = {
      id: `custom-${Date.now()}`,
      title: newSection.title,
      description: newSection.description || '',
      icon: newSection.icon || '📄',
      order: maxOrder + 1,
      enabled: true,
      isCustom: true
    };

    setLocalSections(prev => [...prev, section]);
    setNewSection({ title: '', description: '', icon: '📄', enabled: true });
    setIsAddingNew(false);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...localSections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    // Update order numbers
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index + 1
    }));
    
    setLocalSections(updatedSections);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
          <Settings className="h-4 w-4 mr-2" />
          Section Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Plan Sections Settings
          </DialogTitle>
          <DialogDescription>
            Customize which sections appear in your project plan, reorder them, edit content, or add your own custom sections.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Configure Your Project Plan Sections</h3>
            <p className="text-sm text-blue-700">
              Customize which sections appear in your project plan, reorder them, edit content, or add your own custom sections.
              Enabled sections: {localSections.filter(s => s.enabled).length} / {localSections.length}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Reset to Defaults
            </Button>
          </div>

          {/* Add New Section */}
          {isAddingNew && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-green-800 text-lg">Add New Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Section Title</label>
                    <Input
                      value={newSection.title || ''}
                      onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Marketing Strategy"
                      className="border-green-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Icon (Emoji)</label>
                    <Input
                      value={newSection.icon || ''}
                      onChange={(e) => setNewSection(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="📊"
                      className="border-green-200"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Description</label>
                  <Textarea
                    value={newSection.description || ''}
                    onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this section covers"
                    className="border-green-200"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addNewSection} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                  <Button onClick={() => setIsAddingNew(false)} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections List */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Project Plan Sections</h3>
            {localSections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <Card key={section.id} className={`${section.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <CardContent className="p-4">
                    {editingSection?.id === section.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <Input
                              value={editingSection.title}
                              onChange={(e) => setEditingSection(prev => prev ? { ...prev, title: e.target.value } : null)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                            <Input
                              value={editingSection.icon}
                              onChange={(e) => setEditingSection(prev => prev ? { ...prev, icon: e.target.value } : null)}
                              maxLength={2}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <Textarea
                            value={editingSection.description}
                            onChange={(e) => setEditingSection(prev => prev ? { ...prev, description: e.target.value } : null)}
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={saveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={cancelEdit} variant="outline">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="cursor-move">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <Checkbox
                            checked={section.enabled}
                            onCheckedChange={() => toggleSectionEnabled(section.id)}
                          />
                          <div className="text-xl">{section.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {section.order}. {section.title}
                              {section.isCustom && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Custom</span>}
                            </h4>
                            <p className="text-sm text-gray-600">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEditing(section)}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {section.isCustom && (
                            <Button
                              onClick={() => deleteSection(section.id)}
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Save Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Changes will be saved to your browser and applied to all future project plans.
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility function to load settings from localStorage
export function loadProjectSectionsSettings(): ProjectSection[] {
  try {
    const saved = localStorage.getItem('project_sections_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading project sections settings:', error);
  }
  return DEFAULT_SECTIONS;
}