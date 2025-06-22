# AI Project Planner - BPMN Process Designer

## Overview

This is a comprehensive AI-powered project planning and business process modeling application that transforms project ideas into visual BPMN workflows. The application uses Google's Gemini AI to generate project plans, create business process diagrams, analyze stakeholder flows, generate wireframes, and produce working code from natural language descriptions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: wouter for client-side routing
- **State Management**: @tanstack/react-query for server state, React hooks for local state
- **Business Process Modeling**: bpmn-js library for interactive BPMN diagram editing and viewing

### Backend Architecture
- **Server**: Express.js with TypeScript
- **AI Integration**: Google Gemini 1.5 Flash model for content generation
- **Development**: Cross-env for environment management, tsx for TypeScript execution
- **Build**: esbuild for production bundling

### Database Strategy
- **ORM**: Drizzle with PostgreSQL dialect configured
- **Schema**: Defined in `shared/schema.ts` for type safety across client/server
- **Current State**: Using in-memory storage with interface for future PostgreSQL integration

## Key Components

### AI-Powered Generators
1. **Project Planning Agent** - Converts project descriptions into structured plans
2. **BPMN Generation Engine** - Creates valid BPMN 2.0 XML from structured workflow data
3. **Stakeholder Flow Analyzer** - Extracts and maps stakeholder journeys
4. **Wireframe Designer** - Generates HTML/CSS wireframes from requirements
5. **Code Generator** - Produces full-stack applications from project specifications
6. **Market Research Agent** - Analyzes competitive landscape and market opportunities

### Core Features
- **Interactive BPMN Editor** - Full-featured diagram editor with element properties
- **Multi-format Export** - PNG, SVG, XML, PDF generation
- **Responsive Design** - Mobile-first approach with device-specific wireframes
- **Brand Guidelines Integration** - PDF extraction and brand-aware design generation
- **User Story Generation** - Converts requirements into Gherkin format test scenarios

### UI Component System
- **Design System**: shadcn/ui with customized theme
- **Component Library**: Comprehensive set including dialogs, forms, navigation, charts
- **Accessibility**: Full ARIA support and keyboard navigation
- **Theming**: CSS custom properties with light/dark mode support

## Data Flow

1. **User Input** → Project description entered via natural language
2. **AI Processing** → Gemini analyzes and structures the requirements
3. **Content Generation** → Multiple specialized agents generate different deliverables:
   - Project plans with phases and timelines
   - BPMN diagrams with proper XML structure
   - Stakeholder journey maps
   - Wireframes and HTML prototypes
   - Full application code
4. **Interactive Editing** → Users can modify generated content through rich editors
5. **Export/Download** → Multiple output formats for various use cases

## External Dependencies

### Core Dependencies
- **@google/generative-ai**: Google Gemini API integration
- **bpmn-js**: Business process modeling toolkit
- **@neondatabase/serverless**: Database connectivity (prepared for PostgreSQL)
- **@radix-ui/react-**: Comprehensive UI primitive components
- **@tanstack/react-query**: Server state management
- **html2canvas & jsPDF**: Client-side PDF generation

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the application
- **Tailwind CSS**: Utility-first styling
- **Drizzle**: Type-safe database toolkit
- **@replit/vite-plugin-runtime-error-modal**: Enhanced debugging

## Deployment Strategy

### Replit Deployment
- **Target**: Autoscale deployment on Replit
- **Build Process**: `npm run build` creates optimized production bundle
- **Runtime**: Node.js 20 with ES modules
- **Port Configuration**: Port 5000 mapped to external port 80
- **Environment**: Production/development environment detection

### Build Configuration
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Assets**: Static files served from built frontend
- **Development**: Hot module replacement with proxy setup

### Environment Variables
- **VITE_GEMINI_API_KEY**: Google Gemini API key for AI features
- **DATABASE_URL**: PostgreSQL connection string (for future database integration)
- **NODE_ENV**: Environment detection for development/production features

## Changelog
```
Changelog:
- June 21, 2025. Initial setup
- June 21, 2025. Migration from Replit Agent to Replit environment completed
  - Fixed API key configuration for Gemini AI integration
  - Enhanced PDF brand guidelines extraction with better error handling
  - Improved fallback mechanisms for reliable content generation
  - Verified all core features working properly in Replit environment
- June 22, 2025. Brand Guidelines Upload component refactored
  - Replaced Gemini-based PDF extraction with external API call to http://127.0.0.1:5001/extract-guidelines
  - Updated brand-guidelines-upload.tsx to use FormData and fetch for external service
  - Modified view to display raw JSON response instead of processed brand guideline structure
  - Simplified extraction workflow to rely on external Python service for PDF processing
- June 22, 2025. Brand-aware wireframe generator refactored
  - Completely rebuilt brand-aware-wireframe-generator.ts to work with external API JSON structure
  - Removed AI dependencies in favor of template-based HTML/CSS generation
  - Added proper parsing of colors, fonts, and brand elements from external API response
  - Implemented responsive design with mobile/desktop variants based on extracted brand guidelines
  - Generator now produces complete HTML wireframes with brand-consistent styling
- June 22, 2025. Gemini-powered wireframe generation implemented
  - Refactored brand wireframe generation to use Gemini AI directly
  - Combines page content with brand guidelines JSON in single prompt
  - Generates complete HTML with embedded CSS and JavaScript
  - Added local storage functionality for brand guidelines persistence
  - System now creates fully functional, brand-aware wireframes with interactivity
  - Added progress bar loader showing real-time generation status for each wireframe
  - Progress tracking includes current/total count and current page being processed
  - Fixed undefined length errors with comprehensive null checks and optional chaining
  - Fixed "sections is not iterable" error by handling object/array data structure variations
  - Updated regenerateWireframe function to use same Gemini-based logic as Generate Brand Wireframes
  - Both generation methods now use identical AI prompting and response parsing for consistency
  - Enhanced prompts with strict color contrast requirements (minimum 4.5:1 ratio for accessibility)
  - Added explicit instructions to prevent same-color text/background combinations
- June 22, 2025. Brand Guidelines Upload UI redesigned for improved UX
  - Redesigned upload section with more compact layout and better visual hierarchy
  - Consolidated status indicators with cleaner progress bars and state messages
  - Improved button grouping and spacing for better user experience
  - Enhanced visual feedback with color-coded status indicators (purple for extraction, indigo for processing, emerald for ready)
  - Streamlined action buttons with primary/secondary styling hierarchy
  - Redesigned stored guidelines modal with modern card-based layout and improved information density
  - Added inline color previews and compact metadata display for better brand guideline overview
  - Enhanced empty state with better visual hierarchy and clearer messaging
- June 22, 2025. Flow & Wireframe Mapping page created for consolidated workflow visualization
  - Built comprehensive mapping system connecting process flows with corresponding wireframes
  - Added intelligent content similarity matching to auto-map flows to related wireframes
  - Implemented dual-view system with desktop/mobile wireframe preview modes
  - Created unified dashboard showing flow diagrams alongside their UI implementations
  - Added download and preview functionality for wireframes directly from flow context
  - Integrated mapping statistics and summary analytics for project oversight
  - Fixed localStorage data loading to properly parse flowDiagrams (object structure) and generated_wireframes (nested data structure)
  - Successfully connecting real stored data: Patient-Account Creation Flow with Mobile App Usage Flow Page wireframe
  - Enhanced debugging with comprehensive localStorage key inspection and proper data structure handling
  - Modernized Flow & Wireframe Mapping page design with compact, contemporary styling
  - Reduced spacing, streamlined components, added colored borders and gradients for better visual hierarchy
  - Improved information density while maintaining excellent readability and user experience
  - Added WorkflowProgress component to Flow & Wireframe Mapping page for clear project development guidance
  - Implemented intelligent workflow step detection based on available localStorage data (flows, wireframes, user stories)
  - Progress tracker shows completed steps and suggests next logical development phase
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```