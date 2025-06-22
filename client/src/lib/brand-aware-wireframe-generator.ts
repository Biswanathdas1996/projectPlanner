export interface BrandedWireframeRequest {
    pageContent: any;
    designStyle: string;
    deviceType: string;
    brandGuidelines: any; // External API JSON structure
}

export interface BrandedWireframeResponse {
    html: string;
    css: string;
    brandNotes: string[];
}

export interface ExternalBrandData {
    brand: string;
    guide_date?: string;
    guide_title?: string;
    sections: Array<{
        title?: string;
        content?: Array<{
            subtitle: string;
            details: string;
            colors?: { [key: string]: { HEX: string; CMYK?: string; RGB?: string } };
            fonts?: Array<{ name: string; type?: string; weight?: string }>;
        }>;
        items?: Array<{
            title: string;
            description: string;
            colors?: { [key: string]: { HEX: string; CMYK?: string; RGB?: string } };
            fonts?: Array<{ name: string; type?: string; weight?: string }>;
        }>;
        assets?: Array<{
            name: string;
            url: string;
        }>;
    }>;
}

export class BrandAwareWireframeGenerator {
    constructor() {
        // No AI dependencies needed - pure template-based generation
    }

    async generateBrandedWireframe(
        request: BrandedWireframeRequest,
    ): Promise<BrandedWireframeResponse> {
        try {
            console.log(
                "Generating branded wireframe for:",
                request.pageContent.pageName,
            );

            const brandData = this.extractBrandData(request.brandGuidelines);
            const html = this.generateHTML(request.pageContent, brandData);
            const css = this.generateCSS(brandData, request.deviceType);
            const brandNotes = this.generateBrandNotes(brandData);

            return {
                html,
                css,
                brandNotes
            };
        } catch (error) {
            console.error("Error generating branded wireframe:", error);
            throw error;
        }
    }

    private extractBrandData(guidelines: any): ExternalBrandData {
        // Handle the external API JSON structure
        if (!guidelines) {
            throw new Error("No brand guidelines provided");
        }

        return {
            brand: guidelines.brand || "Brand",
            guide_date: guidelines.guide_date || new Date().toISOString(),
            guide_title: guidelines.guide_title,
            sections: guidelines.sections || []
        };
    }

    private generateHTML(pageContent: any, brandData: ExternalBrandData): string {
        const {
            pageName = "Page",
            pageType = "general",
            purpose = "",
            headers = [],
            buttons = [],
            forms = [],
            lists = [],
            navigation = [],
            additionalContent = []
        } = pageContent;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName} - ${brandData.brand}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="page-container">
        <!-- Header -->
        <header class="brand-header">
            <div class="logo">${brandData.brand}</div>
            ${navigation.length > 0 ? this.generateNavigation(navigation) : ''}
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <div class="content-wrapper">
                <h1 class="page-title">${pageName}</h1>
                ${purpose ? `<p class="page-purpose">${purpose}</p>` : ''}
                
                <!-- Headers Section -->
                ${headers.length > 0 ? this.generateHeaders(headers) : ''}
                
                <!-- Forms Section -->
                ${forms.length > 0 ? this.generateForms(forms) : ''}
                
                <!-- Buttons Section -->
                ${buttons.length > 0 ? this.generateButtons(buttons) : ''}
                
                <!-- Lists Section -->
                ${lists.length > 0 ? this.generateLists(lists) : ''}
                
                <!-- Additional Content -->
                ${additionalContent.length > 0 ? this.generateAdditionalContent(additionalContent) : ''}
            </div>
        </main>

        <!-- Footer -->
        <footer class="brand-footer">
            <p>&copy; ${new Date().getFullYear()} ${brandData.brand}. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>`;
    }

    private generateNavigation(navigation: string[]): string {
        return `
            <nav class="brand-navigation">
                <ul class="nav-list">
                    ${navigation.map(item => `<li class="nav-item"><a href="#" class="nav-link">${item}</a></li>`).join('')}
                </ul>
            </nav>
        `;
    }

    private generateHeaders(headers: string[]): string {
        return `
            <section class="headers-section">
                ${headers.map((header, index) => {
                    const level = Math.min(index + 2, 6); // h2-h6
                    return `<h${level} class="content-header">${header}</h${level}>`;
                }).join('')}
            </section>
        `;
    }

    private generateForms(forms: any[]): string {
        return `
            <section class="forms-section">
                ${forms.map(form => `
                    <div class="form-container">
                        <h3 class="form-title">${form.title || 'Form'}</h3>
                        <form class="brand-form">
                            ${(form.fields || []).map((field: string) => `
                                <div class="form-field">
                                    <label class="field-label" for="${field.toLowerCase().replace(/\s+/g, '-')}">${field}</label>
                                    <input class="field-input" type="text" id="${field.toLowerCase().replace(/\s+/g, '-')}" name="${field.toLowerCase().replace(/\s+/g, '-')}" />
                                </div>
                            `).join('')}
                            <button type="submit" class="form-submit">${form.submitAction || 'Submit'}</button>
                        </form>
                    </div>
                `).join('')}
            </section>
        `;
    }

    private generateButtons(buttons: any[]): string {
        return `
            <section class="buttons-section">
                ${buttons.map(button => `
                    <button class="brand-button ${button.style || 'primary'}">${button.label || 'Button'}</button>
                `).join('')}
            </section>
        `;
    }

    private generateLists(lists: any[]): string {
        return `
            <section class="lists-section">
                ${lists.map(list => `
                    <div class="list-container">
                        <h3 class="list-title">${list.title || 'List'}</h3>
                        <${list.type === 'ordered' ? 'ol' : 'ul'} class="brand-list">
                            ${(list.items || []).map((item: string) => `<li class="list-item">${item}</li>`).join('')}
                        </${list.type === 'ordered' ? 'ol' : 'ul'}>
                    </div>
                `).join('')}
            </section>
        `;
    }

    private generateAdditionalContent(content: string[]): string {
        return `
            <section class="additional-content">
                ${content.map(item => `<p class="content-text">${item}</p>`).join('')}
            </section>
        `;
    }

    private generateCSS(brandData: ExternalBrandData, deviceType: string): string {
        const colors = this.extractColors(brandData);
        const fonts = this.extractFonts(brandData);
        
        const primaryColor = colors.primary || '#000000';
        const secondaryColor = colors.secondary || '#666666';
        const backgroundColor = colors.background || '#ffffff';
        const primaryFont = fonts.primary || 'Arial, sans-serif';

        return `/* Brand-Aware Wireframe Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: ${primaryColor};
    --secondary-color: ${secondaryColor};
    --background-color: ${backgroundColor};
    --primary-font: ${primaryFont};
    --spacing-unit: ${deviceType === 'mobile' ? '12px' : '16px'};
    --container-width: ${deviceType === 'mobile' ? '100%' : '1200px'};
}

body {
    font-family: var(--primary-font);
    color: var(--primary-color);
    background-color: var(--background-color);
    line-height: 1.6;
    font-size: ${deviceType === 'mobile' ? '14px' : '16px'};
}

.page-container {
    max-width: var(--container-width);
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: ${deviceType === 'mobile' ? '10px' : '20px'};
}

/* Header Styles */
.brand-header {
    background-color: var(--primary-color);
    color: var(--background-color);
    padding: calc(var(--spacing-unit) * 2) var(--spacing-unit);
    border-radius: 8px;
    margin-bottom: calc(var(--spacing-unit) * 2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: ${deviceType === 'mobile' ? 'wrap' : 'nowrap'};
}

.logo {
    font-size: ${deviceType === 'mobile' ? '20px' : '24px'};
    font-weight: bold;
    letter-spacing: 1px;
}

.brand-navigation {
    ${deviceType === 'mobile' ? 'width: 100%; margin-top: 10px;' : ''}
}

.nav-list {
    display: flex;
    list-style: none;
    gap: var(--spacing-unit);
    flex-wrap: wrap;
}

.nav-link {
    color: var(--background-color);
    text-decoration: none;
    padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
    border-radius: 4px;
    transition: background-color 0.3s;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* Main Content */
.main-content {
    flex: 1;
    padding: var(--spacing-unit);
}

.content-wrapper {
    background-color: var(--background-color);
    border: 2px solid var(--secondary-color);
    border-radius: 12px;
    padding: calc(var(--spacing-unit) * 2);
}

.page-title {
    font-size: ${deviceType === 'mobile' ? '24px' : '32px'};
    color: var(--primary-color);
    margin-bottom: var(--spacing-unit);
    text-align: center;
}

.page-purpose {
    color: var(--secondary-color);
    text-align: center;
    margin-bottom: calc(var(--spacing-unit) * 2);
    font-style: italic;
}

/* Content Sections */
.headers-section,
.forms-section,
.buttons-section,
.lists-section,
.additional-content {
    margin-bottom: calc(var(--spacing-unit) * 2);
    padding: var(--spacing-unit);
    border: 1px solid var(--secondary-color);
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.02);
}

.content-header {
    color: var(--primary-color);
    margin-bottom: var(--spacing-unit);
    border-bottom: 2px solid var(--secondary-color);
    padding-bottom: calc(var(--spacing-unit) / 2);
}

/* Form Styles */
.form-container {
    margin-bottom: calc(var(--spacing-unit) * 2);
}

.form-title {
    color: var(--primary-color);
    margin-bottom: var(--spacing-unit);
}

.brand-form {
    display: grid;
    gap: var(--spacing-unit);
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing-unit) / 2);
}

.field-label {
    font-weight: 600;
    color: var(--primary-color);
}

.field-input {
    padding: var(--spacing-unit);
    border: 2px solid var(--secondary-color);
    border-radius: 6px;
    font-family: var(--primary-font);
    font-size: inherit;
}

.field-input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.form-submit {
    background-color: var(--primary-color);
    color: var(--background-color);
    border: none;
    padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
    border-radius: 6px;
    font-family: var(--primary-font);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.form-submit:hover {
    background-color: var(--secondary-color);
}

/* Button Styles */
.buttons-section {
    display: flex;
    gap: var(--spacing-unit);
    flex-wrap: wrap;
    justify-content: center;
}

.brand-button {
    padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
    border: 2px solid var(--primary-color);
    border-radius: 6px;
    font-family: var(--primary-font);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.brand-button.primary {
    background-color: var(--primary-color);
    color: var(--background-color);
}

.brand-button.secondary {
    background-color: transparent;
    color: var(--primary-color);
}

.brand-button:hover {
    background-color: var(--secondary-color);
    color: var(--background-color);
    border-color: var(--secondary-color);
}

/* List Styles */
.list-container {
    margin-bottom: calc(var(--spacing-unit) * 2);
}

.list-title {
    color: var(--primary-color);
    margin-bottom: var(--spacing-unit);
}

.brand-list {
    padding-left: calc(var(--spacing-unit) * 2);
}

.list-item {
    margin-bottom: calc(var(--spacing-unit) / 2);
    color: var(--secondary-color);
}

/* Additional Content */
.content-text {
    margin-bottom: var(--spacing-unit);
    color: var(--secondary-color);
    line-height: 1.8;
}

/* Footer */
.brand-footer {
    background-color: var(--secondary-color);
    color: var(--background-color);
    text-align: center;
    padding: calc(var(--spacing-unit) * 2);
    border-radius: 8px;
    margin-top: calc(var(--spacing-unit) * 2);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .page-container {
        padding: 10px;
    }
    
    .brand-header {
        flex-direction: column;
        text-align: center;
    }
    
    .nav-list {
        justify-content: center;
    }
    
    .buttons-section {
        flex-direction: column;
        align-items: center;
    }
    
    .brand-button {
        width: 100%;
        max-width: 300px;
    }
}`;
    }

    private extractColors(brandData: ExternalBrandData): { primary: string; secondary: string; background: string } {
        const colors = {
            primary: '#000000',
            secondary: '#666666',
            background: '#ffffff'
        };

        // Extract colors from sections - handle both old and new API formats
        for (const section of brandData.sections) {
            // Check content array (new format)
            if (section.content) {
                for (const contentItem of section.content) {
                    if (contentItem.colors) {
                        const colorEntries = Object.entries(contentItem.colors);
                        if (colorEntries.length > 0) {
                            // Find primary color (first non-white color)
                            const primaryColorEntry = colorEntries.find(([name, colorData]) => 
                                colorData.HEX && colorData.HEX.toLowerCase() !== '#ffffff' && colorData.HEX.toLowerCase() !== '#fff'
                            );
                            if (primaryColorEntry) {
                                colors.primary = primaryColorEntry[1].HEX;
                            }
                            
                            // Find secondary color (second color)
                            if (colorEntries.length > 1) {
                                const secondaryColorEntry = colorEntries[1];
                                if (secondaryColorEntry && secondaryColorEntry[1].HEX) {
                                    colors.secondary = secondaryColorEntry[1].HEX;
                                }
                            }
                            
                            // Find background color (white color)
                            const bgColorEntry = colorEntries.find(([name, colorData]) => 
                                colorData.HEX && (colorData.HEX.toLowerCase() === '#ffffff' || colorData.HEX.toLowerCase() === '#fff')
                            );
                            if (bgColorEntry) {
                                colors.background = bgColorEntry[1].HEX;
                            }
                            
                            break; // Use first color set found
                        }
                    }
                }
            }
            
            // Check items array (old format compatibility)
            if (section.items) {
                for (const item of section.items) {
                    if (item.colors) {
                        const colorEntries = Object.entries(item.colors);
                        if (colorEntries.length > 0) {
                            const primaryColorEntry = colorEntries.find(([name, colorData]) => 
                                colorData.HEX && colorData.HEX.toLowerCase() !== '#ffffff' && colorData.HEX.toLowerCase() !== '#fff'
                            );
                            if (primaryColorEntry) {
                                colors.primary = primaryColorEntry[1].HEX;
                            }
                            
                            if (colorEntries.length > 1) {
                                const secondaryColorEntry = colorEntries[1];
                                if (secondaryColorEntry && secondaryColorEntry[1].HEX) {
                                    colors.secondary = secondaryColorEntry[1].HEX;
                                }
                            }
                            
                            const bgColorEntry = colorEntries.find(([name, colorData]) => 
                                colorData.HEX && (colorData.HEX.toLowerCase() === '#ffffff' || colorData.HEX.toLowerCase() === '#fff')
                            );
                            if (bgColorEntry) {
                                colors.background = bgColorEntry[1].HEX;
                            }
                            
                            break;
                        }
                    }
                }
            }
        }

        return colors;
    }

    private extractFonts(brandData: ExternalBrandData): { primary: string; secondary: string } {
        const fonts = {
            primary: 'Arial, sans-serif',
            secondary: 'Arial, sans-serif'
        };

        // Extract fonts from sections - handle both old and new API formats
        for (const section of brandData.sections) {
            // Check content array (new format)
            if (section.content) {
                for (const contentItem of section.content) {
                    if (contentItem.fonts && contentItem.fonts.length > 0) {
                        const fontList = contentItem.fonts;
                        
                        if (fontList[0] && fontList[0].name) {
                            fonts.primary = `"${fontList[0].name}", sans-serif`;
                        }
                        
                        if (fontList.length > 1 && fontList[1].name) {
                            fonts.secondary = `"${fontList[1].name}", sans-serif`;
                        }
                        
                        break; // Use first font set found
                    }
                }
            }
            
            // Check items array (old format compatibility)
            if (section.items) {
                for (const item of section.items) {
                    if (item.fonts && item.fonts.length > 0) {
                        const fontList = item.fonts;
                        
                        if (fontList[0] && fontList[0].name) {
                            fonts.primary = `"${fontList[0].name}", sans-serif`;
                        }
                        
                        if (fontList.length > 1 && fontList[1].name) {
                            fonts.secondary = `"${fontList[1].name}", sans-serif`;
                        }
                        
                        break; // Use first font set found
                    }
                }
            }
        }

        return fonts;
    }

    private generateBrandNotes(brandData: ExternalBrandData): string[] {
        const notes: string[] = [];
        
        notes.push(`Generated wireframe for ${brandData.brand}`);
        if (brandData.guide_title) {
            notes.push(`Based on ${brandData.guide_title}`);
        }
        
        // Extract brand guidelines notes from both formats
        for (const section of brandData.sections) {
            if (section.title) {
                notes.push(`${section.title} guidelines applied`);
            }
            
            // Handle new format (content array)
            if (section.content) {
                for (const contentItem of section.content) {
                    if (contentItem.details) {
                        notes.push(`${contentItem.subtitle}: ${contentItem.details.substring(0, 100)}...`);
                    }
                }
            }
            
            // Handle old format (items array)
            if (section.items) {
                for (const item of section.items) {
                    if (item.description) {
                        notes.push(`${item.title}: ${item.description.substring(0, 100)}...`);
                    }
                }
            }
        }
        
        return notes;
    }
}

export function createBrandAwareWireframeGenerator(): BrandAwareWireframeGenerator {
    return new BrandAwareWireframeGenerator();
}