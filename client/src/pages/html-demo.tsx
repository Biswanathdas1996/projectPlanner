import { useState } from 'react';
import { HtmlIframe } from '@/components/html-iframe';
import { NavigationBar } from '@/components/navigation-bar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, FileText, Table, Layout } from 'lucide-react';

export default function HtmlDemo() {
  const [customHtml, setCustomHtml] = useState(`
<div style="padding: 20px; font-family: Arial, sans-serif;">
  <h1 style="color: #2563eb; margin-bottom: 20px;">Sample HTML Content</h1>
  <p>This is a demonstration of how HTML content renders inside an iframe without affecting the parent container's styling.</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background: #f3f4f6;">
        <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Feature</th>
        <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Status</th>
        <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left;">Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 12px; border: 1px solid #d1d5db;">Isolation</td>
        <td style="padding: 12px; border: 1px solid #d1d5db; color: #059669;">✓ Active</td>
        <td style="padding: 12px; border: 1px solid #d1d5db;">Styles don't leak</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #d1d5db;">Responsive</td>
        <td style="padding: 12px; border: 1px solid #d1d5db; color: #059669;">✓ Active</td>
        <td style="padding: 12px; border: 1px solid #d1d5db;">Auto-sizing enabled</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #d1d5db;">Security</td>
        <td style="padding: 12px; border: 1px solid #d1d5db; color: #059669;">✓ Active</td>
        <td style="padding: 12px; border: 1px solid #d1d5db;">Sandboxed environment</td>
      </tr>
    </tbody>
  </table>
  
  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h3 style="color: #1e40af; margin: 0 0 8px 0;">Information</h3>
    <p style="margin: 0; color: #1e3a8a;">This content is completely isolated from the parent page's CSS and JavaScript.</p>
  </div>
  
  <button style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;" onclick="alert('Interactive elements work!')">
    Click Me
  </button>
</div>
  `);

  const sampleHtmlExamples = [
    {
      title: "Simple Table",
      icon: Table,
      html: `
<table style="width: 100%; border-collapse: collapse;">
  <tr style="background: #f8fafc;">
    <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Name</th>
    <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Value</th>
  </tr>
  <tr>
    <td style="padding: 12px; border: 1px solid #e2e8f0;">Project Status</td>
    <td style="padding: 12px; border: 1px solid #e2e8f0; color: #059669;">Active</td>
  </tr>
  <tr>
    <td style="padding: 12px; border: 1px solid #e2e8f0;">Completion</td>
    <td style="padding: 12px; border: 1px solid #e2e8f0;">75%</td>
  </tr>
</table>
      `
    },
    {
      title: "Card Layout",
      icon: Layout,
      html: `
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 16px;">
  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h3 style="margin: 0 0 8px 0; color: #1f2937;">Feature A</h3>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">Description of feature A</p>
  </div>
  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h3 style="margin: 0 0 8px 0; color: #1f2937;">Feature B</h3>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">Description of feature B</p>
  </div>
</div>
      `
    },
    {
      title: "Form Elements",
      icon: FileText,
      html: `
<form style="max-width: 400px; margin: 0 auto; padding: 20px;">
  <div style="margin-bottom: 16px;">
    <label style="display: block; margin-bottom: 4px; font-weight: 600;">Name:</label>
    <input type="text" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" placeholder="Enter your name">
  </div>
  <div style="margin-bottom: 16px;">
    <label style="display: block; margin-bottom: 4px; font-weight: 600;">Message:</label>
    <textarea style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; height: 80px;" placeholder="Enter your message"></textarea>
  </div>
  <button type="button" style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
</form>
      `
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavigationBar title="HTML Iframe Demo" showBackButton />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HTML Iframe Component</h1>
              <p className="text-gray-600">Safely render HTML content without affecting container styles</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Custom HTML Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Custom HTML Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Enter your HTML content here..."
                />
                <div className="flex gap-2">
                  <Badge variant="outline">Live Preview</Badge>
                  <Badge variant="secondary">Sandboxed</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Sample Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {sampleHtmlExamples.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto p-3"
                      onClick={() => setCustomHtml(example.html)}
                    >
                      <example.icon className="h-4 w-4 mr-2" />
                      <span>{example.title}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <HtmlIframe
              htmlContent={customHtml}
              title="Live Preview"
              height="500px"
              showControls={true}
              allowFullscreen={true}
            />

            {/* Features List */}
            <Card>
              <CardHeader>
                <CardTitle>Component Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">✓</Badge>
                    Complete style isolation from parent container
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">✓</Badge>
                    Auto-resizing based on content height
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">✓</Badge>
                    Fullscreen mode for better viewing
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">✓</Badge>
                    Copy and download HTML functionality
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">✓</Badge>
                    Sandboxed environment for security
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">✓</Badge>
                    Responsive and mobile-friendly
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Usage Example */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { HtmlIframe } from '@/components/html-iframe';

// Basic usage
<HtmlIframe
  htmlContent={yourHtmlString}
  title="My HTML Content"
  height="400px"
/>

// With all features
<HtmlIframe
  htmlContent={yourHtmlString}
  title="Advanced Example"
  height="500px"
  showControls={true}
  allowFullscreen={true}
  className="custom-class"
/>`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}