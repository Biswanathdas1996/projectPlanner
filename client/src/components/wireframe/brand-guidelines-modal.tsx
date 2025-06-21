import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Palette, Type, Layout, Image, Lightbulb, Shield } from "lucide-react";
import type { BrandGuideline } from "@/lib/brand-guideline-extractor";

interface BrandGuidelinesModalProps {
  showBrandModal: boolean;
  setShowBrandModal: (show: boolean) => void;
  brandGuidelines: BrandGuideline | null;
}

export function BrandGuidelinesModal({
  showBrandModal,
  setShowBrandModal,
  brandGuidelines
}: BrandGuidelinesModalProps) {
  if (!brandGuidelines) return null;

  return (
    <Dialog open={showBrandModal} onOpenChange={setShowBrandModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Guidelines Extracted
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => setShowBrandModal(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Color Palette */}
          {brandGuidelines.colors && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Primary Colors */}
                {brandGuidelines.colors.primary && brandGuidelines.colors.primary.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Primary Colors</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandGuidelines.colors.primary.map((color: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secondary Colors */}
                {brandGuidelines.colors.secondary && brandGuidelines.colors.secondary.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Secondary Colors</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandGuidelines.colors.secondary.map((color: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Colors */}
                {brandGuidelines.colors.text && brandGuidelines.colors.text.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Text Colors</h4>
                    <div className="flex flex-wrap gap-2">
                      {brandGuidelines.colors.text.map((color: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Typography */}
          {brandGuidelines.typography && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Font Families */}
                {brandGuidelines.typography.fonts && brandGuidelines.typography.fonts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Font Families</h4>
                    <div className="space-y-1">
                      {brandGuidelines.typography.fonts.map((font: string, index: number) => (
                        <Badge key={index} variant="outline">{font}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Font Weights */}
                {brandGuidelines.typography.weights && brandGuidelines.typography.weights.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Font Weights</h4>
                    <div className="space-y-1">
                      {brandGuidelines.typography.weights.map((weight: string, index: number) => (
                        <Badge key={index} variant="outline">{weight}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logo Guidelines */}
          {brandGuidelines.logos && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo Guidelines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Logo */}
                {brandGuidelines.logos.primary && (
                  <div>
                    <h4 className="font-medium mb-2">Primary Logo</h4>
                    <p className="text-sm text-gray-600">{brandGuidelines.logos.primary}</p>
                  </div>
                )}

                {/* Logo Variations */}
                {brandGuidelines.logos.variations && brandGuidelines.logos.variations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Logo Variations</h4>
                    <div className="space-y-1">
                      {brandGuidelines.logos.variations.map((variation: string, index: number) => (
                        <Badge key={index} variant="outline">{variation}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Brand Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-xs text-gray-500">Colors</div>
                <div className="text-sm font-medium">
                  {(brandGuidelines.colors?.primary?.length || 0) + 
                   (brandGuidelines.colors?.secondary?.length || 0) + 
                   (brandGuidelines.colors?.accent?.length || 0)}
                </div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-xs text-gray-500">Typography</div>
                <div className="text-sm font-medium">{brandGuidelines.typography?.fonts?.length || 0} fonts</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-xs text-gray-500">Components</div>
                <div className="text-sm font-medium">{Object.keys(brandGuidelines.components || {}).length}</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-xs text-gray-500">Logos</div>
                <div className="text-sm font-medium">{brandGuidelines.logos?.variations?.length || 0}</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <div className="text-xs text-gray-500">Tone</div>
                <div className="text-sm font-medium">{brandGuidelines.tone?.personality?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}