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
  - Added comprehensive PDF export functionality to Flow & Wireframe Mapping page
  - PDF export includes ALL process flows with their exact flow diagrams and wireframes with precise colors and images
  - Enhanced export captures wireframes in hidden iframes to preserve exact HTML/CSS styling and color accuracy
  - Added loading state with spinner indicator during PDF generation process
  - Export button integrated into header with automatic date-based file naming
  - Fixed flow diagram visibility issues in PDF export with improved capture logic and debugging
  - Added comprehensive error handling and fallback text for flow diagram capture failures
  - Completely modernized Flow & Wireframe Mapping UI with contemporary design elements
  - Added gradient backgrounds, glass morphism effects, and smooth hover animations
  - Enhanced wireframe previews with browser-style chrome and proper aspect ratios
  - Improved statistics cards with animated progress bars and interactive hover effects
  - Enhanced TabsList with gradient backgrounds, scaling animations, and pulse effects
  - Upgraded TabsContent with realistic device frames and professional browser mockups
  - Added sophisticated hover effects, shadow systems, and depth animations throughout
  - Implemented comprehensive UX improvements including keyboard navigation, smart text truncation, and accessibility features
  - Enhanced visual hierarchy with dynamic color coding and progressive information disclosure
  - Optimized TabsList component for compact design while maintaining full functionality and accessibility
- June 22, 2025. Patient Healthcare WebApp Overview page created
  - Built dedicated patient-centered healthcare application overview replacing generic flow mapping
  - Structured presentation of patient account creation and mobile app usage flows
  - Added comprehensive feature breakdown including core functionality, user types, and platform support
  - Integrated security and compliance framework display (HIPAA, authentication, encryption)
  - Created categorized flow visualization with priority levels and detailed descriptions
  - Added wireframe gallery with device-specific preview modes and feature extraction
  - Implemented intelligent data parsing from localStorage with healthcare-focused categorization
  - Built comprehensive project analysis engine that evaluates ALL localStorage data sources
  - Added real-time project readiness assessment with completion scoring and readiness levels
  - Integrated intelligent gap analysis and strategic recommendations based on data quality
  - Created dynamic data quality metrics dashboard with visual progress indicators
  - Implemented automated next steps generation based on current project maturity level
- June 22, 2025. Comprehensive Project Plan Generator implemented for Replit development
  - Refactored /mapping page logic to analyze ALL localStorage data sources (flows, wireframes, brand guidelines, sections)
  - Built comprehensive project plan generator extracting brand guidelines and technical specifications
  - Added detailed PDF export functionality with complete development plan including:
    * Executive summary with project scope and timeline
    * Technical architecture breakdown (frontend, backend, database, infrastructure)
    * Development phases with deliverables and dependencies
    * Brand guidelines integration with color palette and typography
    * Feature implementation matrix (core, secondary, future)
    * Risk assessment and mitigation strategies
    * Testing strategy and deployment plan
    * Current project data quality analysis
  - Integrated brand-aware planning using extracted color schemes and typography
  - Created professional PDF export with comprehensive documentation for Replit development workflow
- June 22, 2025. AI-Powered Master Flow Consolidation feature added
  - Built consolidated flow generator that analyzes all individual flows using AI
  - Added new section on /mapping page for generating single comprehensive master flow diagram
  - Implemented AI analysis to merge multiple healthcare workflows into unified process
  - Created fallback flow generation system for reliable master flow creation
  - Added visual flow statistics showing process nodes, connections, and source flows consolidated
  - Integrated master flow with existing FlowDiagramViewer for seamless visualization
  - Enhanced master flow with detailed granular components (25+ nodes) covering all process steps:
    * Registration phase: patient arrival, personal info, contact details, insurance collection
    * Verification phase: ID verification, insurance verification, eligibility checking
    * Profile setup: medical history, medications, allergies, emergency contacts, consent forms
    * Platform selection: mobile app download, web portal access, dashboard setup
    * Core services: appointment search, provider selection, booking confirmation, reminders
    * Communication: secure messaging, video consultations, document sharing, test results
    * Post-service: rating, payment processing, follow-up scheduling, care plan updates
  - Implemented comprehensive color-coded workflow with logical positioning and flow connections
  - Created detailed AI prompts for generating 25-35 granular workflow components with specific healthcare process steps
- June 22, 2025. Generic Flow & Wireframe Mapping page created
  - Refactored /mapping page from patient-specific healthcare to generic project mapping
  - Removed all healthcare-specific terminology and instances to create universal application
  - Updated routing to use generic FlowWireframeMappingPage for /mapping route
  - Renamed file from patient-webapp-overview.tsx to flow-wireframe-mapping.tsx
  - Modified interfaces and data structures to support any project type (ProjectFlow, ProjectWireframe, ProjectOverview)
  - Updated master flow generation to create generic application workflows (user onboarding, core features, platform selection)
  - Maintained all existing functionality while making it applicable to any project domain
  - Fixed TypeScript type safety issues and removed deprecated patient-specific file
- June 22, 2025. AI-Generated Master Flow Diagram added to Code Generator page
  - Copied complete AI-Generated Master Flow Diagram section from /mapping page to /code page
  - Added necessary imports and interfaces (ProjectFlow, FlowDiagramViewer, Activity, Clock icons)
  - Implemented flow data loading from localStorage with error handling
  - Added helper functions: createFlowFromData, determineCategory, determinePriority
  - Created generateConsolidatedFlow function with fallback flow generation
  - Built comprehensive createFallbackConsolidatedFlow with simplified node structure
  - Integrated master flow visualization directly in code generation workflow
  - Users can now visualize consolidated workflows before generating code
- June 22, 2025. Enhanced AI-Generated Master Flow with Gemini AI integration
  - Replaced manual flow consolidation with Gemini AI-powered analysis using API key AIzaSyA9c-wEUNJiwCwzbMKt1KvxGkxwDK5EYXM
  - Implemented comprehensive localStorage workflow extraction capturing ALL flow-related data
  - Enhanced workflow detection to find flowDetails, flowDiagrams, bpmn-persona-flow-types, and bpmn-stakeholder-flows
  - Built generateAIConsolidatedFlow function with detailed prompt engineering for 25-35 granular nodes
  - Added color-coded node categorization and logical positioning requirements
  - System now loads 18+ workflows from localStorage and analyzes them with Gemini 1.5 Flash
  - AI creates comprehensive master flow diagrams with specific actionable labels and proper flow connections
  - Added fallback mechanism to manual consolidation if AI analysis fails
  - Enhanced error handling and JSON parsing for robust AI response processing
- June 22, 2025. Comprehensive 35+ Node Master Flow Implementation
  - Enhanced AI prompt engineering to require 30-40 detailed granular nodes across 6 phases
  - Built comprehensive fallback flow with 35+ nodes covering complete healthcare workflow:
    * Phase 1: Registration & Onboarding (7 nodes) - Patient arrival through initial profile
    * Phase 2: Authentication & Verification (7 nodes) - Credential setup through account activation
    * Phase 3: Platform Selection & Access (6 nodes) - Platform choice through notification setup
    * Phase 4: Core Healthcare Services (8 nodes) - Provider search through prescription management
    * Phase 5: Administrative & Billing (6 nodes) - Claim preparation through billing reconciliation
    * Phase 6: Communication & Support (5 nodes) - Secure messaging through process completion
  - Implemented detailed positioning with logical grid layout across 6 horizontal phases
  - Added color-coded categorization with 10 different colors for node types
  - Created 43 comprehensive edge connections including alternative pathways
  - Enhanced master flow covers complete end-to-end process from patient arrival to completion
- June 22, 2025. Generate All Flow Diagrams functionality added
  - Added "Generate All Flow Diagrams" button to user journey page alongside existing swimlane generation
  - Implemented generateAllFlowDiagrams function that processes all stakeholder flows sequentially
  - Added intelligent flow detection to skip existing diagrams and avoid duplicate generation
  - Built comprehensive error handling that continues processing even if individual flows fail
  - Added 500ms delay between generations to prevent API overload and ensure stable processing
  - Enhanced bulk generation capabilities for complete project workflow visualization
- June 22, 2025. AI-Generated Master Flow localStorage persistence implemented
  - Added automatic saving of consolidated master flow diagrams to localStorage ('consolidatedMasterFlow' key)
  - Implemented loading of stored master flows on component initialization for session persistence
  - Enhanced both AI-generated and fallback master flows with localStorage integration
  - Added comprehensive console logging for debugging save/load operations
  - Ensured master flow diagrams persist across browser sessions and page refreshes
- June 23, 2025. Project Flow Diagram Generator added to Project Planner page
  - Built comprehensive flow diagram generation section under Project Plan Sections
  - Added AI-powered workflow analysis using Gemini 1.5 Flash for detailed process flows
  - Implemented interactive FlowDiagramViewer with drag-and-drop editing capabilities
  - Created real-time flow updates with automatic localStorage persistence ('project-flow-diagram' key)
  - Added export functionality for downloading flow diagrams as JSON files
  - Integrated with existing project context to generate relevant workflow processes
  - Flow diagrams show user journeys, system processes, decision points, and integration touchpoints
  - Enhanced project planning workflow with visual process documentation capabilities
- June 23, 2025. Flow Diagram Regeneration and Enhanced Display
  - Added regenerate functionality to flow diagram generator with proper function scope handling
  - Implemented comprehensive enterprise-level flow details with 35+ advanced business components
  - Fixed function reference issues and proper state management for diagram regeneration
  - Enhanced flow diagram viewer height from 500px to 800px to accommodate large enterprise workflows
  - Added purple gradient styling for regenerate button matching existing design system
  - Regeneration clears existing diagrams and generates alternative workflow processes with enhanced components
- June 23, 2025. User Journey Focus Implementation
  - Transformed flow diagram generation from technical architecture to user-centered journeys
  - Updated AI prompts to focus on user interactions, onboarding, and goal achievement processes
  - Modified flow details to include user types (New Users, Returning Users, Admin Users, etc.)
  - Replaced technical activities with user-focused actions (discovery, exploration, task completion)
  - Updated decision points to reflect user choices rather than system validations
  - Enhanced additional elements to include user support, tutorials, and experience features
  - Updated UI labels and descriptions to reflect user journey focus throughout interface
- June 23, 2025. Detailed Stakeholder-Specific User Journey Implementation
  - Enhanced AI prompts to analyze project ideas and extract specific stakeholder types
  - Implemented detailed step-by-step user flows for each stakeholder (e.g., End User: register → verify email → login → view profile)
  - Updated fallback flows to include comprehensive stakeholder journeys with 10 detailed user types
  - Modified regenerate functionality to create alternative stakeholder scenarios and edge cases
  - Transformed flow diagram generator from enterprise architecture to user journey visualization
  - Updated node specifications to focus on user actions, decisions, and interface touchpoints
  - Enhanced layout requirements to use stakeholder swim lanes instead of technical layers
  - Flow generation now creates 25-35 nodes showing complete user progression from discovery to goal completion
- June 23, 2025. User Journey Page Refactored to Use Project Plan Flow Data
  - Completely refactored /user-journey page to use User Journey Flow data from /plan page as base source
  - Updated data loading logic to read from 'project-flow-diagram' localStorage key instead of generating independent flows
  - Implemented extractStakeholdersFromFlowData function to analyze flow nodes and extract stakeholder types
  - Added intelligent stakeholder detection from flow node labels (Admin, Premium, Mobile, Guest, Customer, etc.)
  - Created generateFlowTypesForStakeholder helper to assign appropriate flow types per stakeholder
  - Updated UI to display User Journey Flow data with node/edge statistics and interactive viewer
  - Added fallback message directing users to generate flow data from Project Plan page first
  - Maintained existing BPMN generation capabilities but now based on extracted stakeholder data
  - Streamlined workflow: Project Plan → User Journey Flow → Stakeholder Analysis → BPMN Generation
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```