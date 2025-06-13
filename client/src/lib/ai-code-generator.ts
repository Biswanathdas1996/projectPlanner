import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CodeGenerationConfig {
  projectName: string;
  framework: string;
  backend: string;
  database: string;
  styling: string;
  features: string[];
  deployment: string;
}

export interface ProjectStructure {
  folderStructure: string;
  frontendFiles: { [key: string]: string };
  backendFiles: { [key: string]: string };
  databaseSchema: string;
  packageJson: string;
  readme: string;
  techStack: string[];
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: string;
  currentTask: string;
}

export class AICodeGenerator {
  private gemini: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor() {
    try {
      const genAI = new GoogleGenerativeAI(
        "AIzaSyDgcDMg-20A1C5a0y9dZ12fH79q4PXki6E"
      );
      this.gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("AI Code Generator initialized with Gemini successfully");

      // Test the API connection
      this.testApiConnection();
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
      throw new Error(
        "Failed to initialize Gemini AI model. Please check your API key."
      );
    }
  }

  private async testApiConnection() {
    try {
      console.log("Testing Gemini API connection...");
      const result = await this.gemini.generateContent("Say hello");
      const response = await result.response;
      const text = response.text();
      console.log("Gemini API test successful:", text);
    } catch (error: any) {
      console.error("Gemini API test failed:", {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        name: error?.name,
      });
    }
  }

  async generateCompleteProject(
    projectPlan: string,
    stakeholderFlows: string,
    config: CodeGenerationConfig,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ProjectStructure> {
    const tasks = [
      "Analyzing Requirements",
      "Generating Folder Structure",
      "Creating Frontend Files",
      "Building Backend Files",
      "Designing Database Schema",
      "Setting up Configuration",
      "Finalizing Documentation",
    ];

    try {
      // Step 1: Analyze requirements
      onProgress?.({
        current: 1,
        total: tasks.length,
        status: "Analyzing project requirements and stakeholder flows...",
        currentTask: tasks[0],
      });

      const requirements = await this.analyzeRequirements(
        projectPlan,
        stakeholderFlows,
        config
      );

      // Step 2: Generate folder structure
      onProgress?.({
        current: 2,
        total: tasks.length,
        status: "Creating optimal folder structure...",
        currentTask: tasks[1],
      });

      const folderStructure = await this.generateFolderStructure(
        requirements,
        config
      );

      // Step 3: Generate frontend files
      onProgress?.({
        current: 3,
        total: tasks.length,
        status: "Building frontend components and pages...",
        currentTask: tasks[2],
      });

      const frontendFiles = await this.generateFrontendFiles(
        requirements,
        config
      );

      // Step 4: Generate backend files
      onProgress?.({
        current: 4,
        total: tasks.length,
        status: "Creating backend API and services...",
        currentTask: tasks[3],
      });

      const backendFiles = await this.generateBackendFiles(
        requirements,
        config
      );

      // Step 5: Generate database schema
      onProgress?.({
        current: 5,
        total: tasks.length,
        status: "Designing database schema and relationships...",
        currentTask: tasks[4],
      });

      const databaseSchema = await this.generateDatabaseSchema(
        requirements,
        config
      );

      // Step 6: Generate configuration files
      onProgress?.({
        current: 6,
        total: tasks.length,
        status: "Setting up package.json and configuration...",
        currentTask: tasks[5],
      });

      const packageJson = await this.generatePackageJson(requirements, config);

      // Step 7: Generate documentation
      onProgress?.({
        current: 7,
        total: tasks.length,
        status: "Creating project documentation...",
        currentTask: tasks[6],
      });

      const readme = await this.generateReadme(requirements, config);

      return {
        folderStructure,
        frontendFiles,
        backendFiles,
        databaseSchema,
        packageJson,
        readme,
        techStack: this.getTechStack(config),
      };
    } catch (error) {
      console.error("Error generating project:", error);
      throw new Error(
        "Failed to generate project code. Please check your API key and try again."
      );
    }
  }

  private async analyzeRequirements(
    projectPlan: string,
    stakeholderFlows: string,
    config: CodeGenerationConfig
  ): Promise<any> {
    const prompt = `
Analyze this project plan and stakeholder flows to extract key requirements:

PROJECT PLAN:
${projectPlan}

STAKEHOLDER FLOWS:
${stakeholderFlows}

TECH CONFIGURATION:
- Framework: ${config.framework}
- Backend: ${config.backend}
- Database: ${config.database}
- Styling: ${config.styling}

Extract and return JSON with:
1. Core features needed
2. User roles and permissions
3. Database entities and relationships
4. API endpoints required
5. UI components needed
6. Business logic requirements

Respond with valid JSON only.
    `;

    const result = await this.retryableRequest(() =>
      this.gemini.generateContent(prompt)
    );
    const response = await result.response;
    const text = response.text();

    try {
      // Clean markdown formatting from response
      const cleanedText = this.extractJsonFromResponse(text);
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Failed to parse JSON response:", text);
      return {
        coreFeatures: ["Authentication", "Dashboard", "Data Management"],
        userRoles: ["admin", "user"],
        entities: ["User", "Project"],
        apiEndpoints: ["/api/auth", "/api/users", "/api/projects"],
        uiComponents: ["Header", "Sidebar", "Dashboard"],
        businessLogic: ["User management", "Data processing"],
      };
    }
  }

  private async generateFolderStructure(
    requirements: any,
    config: CodeGenerationConfig
  ): Promise<string> {
    const prompt = `
Create a comprehensive folder structure for a ${
      config.framework
    } project with ${config.backend} backend.

Requirements: ${JSON.stringify(requirements)}

Include:
- Source code organization
- Component structure
- Asset management
- Configuration files
- Documentation
- Testing structure
- Deployment files

Return only the folder structure in tree format.
    `;

    const result = await this.retryableRequest(() =>
      this.gemini.generateContent(prompt)
    );
    const response = await result.response;
    return response.text();
  }

  private async generateFrontendFiles(
    requirements: any,
    config: CodeGenerationConfig
  ): Promise<{ [key: string]: string }> {
    const files: { [key: string]: string } = {};

    const filePrompts = [
      {
        name: "App.tsx",
        prompt: `Create the main App component for a ${
          config.framework
        } application with routing and layout based on these requirements: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
      {
        name: "components/Dashboard.tsx",
        prompt: `Create a Dashboard component that displays key metrics and data based on stakeholder needs: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
      {
        name: "hooks/useAuth.tsx",
        prompt: `Create an authentication hook with login, logout, and user state management for: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
      {
        name: "lib/api.ts",
        prompt: `Create an API utility library with HTTP methods and error handling for: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
    ];

    for (const filePrompt of filePrompts) {
      try {
        const result = await this.gemini.generateContent(filePrompt.prompt);
        const response = await result.response;
        files[filePrompt.name] = response.text();
      } catch (error) {
        console.error(`Error generating ${filePrompt.name}:`, error);
        files[
          filePrompt.name
        ] = `// Error generating ${filePrompt.name}\n// Please implement manually`;
      }
    }

    return files;
  }

  private async generateBackendFiles(
    requirements: any,
    config: CodeGenerationConfig
  ): Promise<{ [key: string]: string }> {
    const files: { [key: string]: string } = {};

    const filePrompts = [
      {
        name: "server.js",
        prompt: `Create the main server file for a ${
          config.backend
        } application with middleware, routing, and error handling based on: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
      {
        name: "routes/api.js",
        prompt: `Create API routes with CRUD operations for the entities identified in: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
      {
        name: "middleware/auth.js",
        prompt: `Create authentication middleware for ${
          config.backend
        } based on: ${JSON.stringify(
          requirements
        )}. Return only the complete file content.`,
      },
    ];

    for (const filePrompt of filePrompts) {
      try {
        const result = await this.gemini.generateContent(filePrompt.prompt);
        const response = await result.response;
        files[filePrompt.name] = response.text();
      } catch (error) {
        console.error(`Error generating ${filePrompt.name}:`, error);
        files[
          filePrompt.name
        ] = `// Error generating ${filePrompt.name}\n// Please implement manually`;
      }
    }

    return files;
  }

  private async generateDatabaseSchema(
    requirements: any,
    config: CodeGenerationConfig
  ): Promise<string> {
    const prompt = `
Create a comprehensive ${
      config.database
    } database schema based on these requirements:

${JSON.stringify(requirements)}

Include:
- Table definitions with proper data types
- Primary and foreign key relationships
- Indexes for performance
- Constraints for data integrity
- Sample data or seed queries

Return only the SQL schema code.
    `;

    const result = await this.gemini.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generatePackageJson(
    requirements: any,
    config: CodeGenerationConfig
  ): Promise<string> {
    const prompt = `
Create a package.json file for a ${config.framework} project with ${
      config.backend
    } backend.

Requirements: ${JSON.stringify(requirements)}
Project Name: ${config.projectName}

Include:
- All necessary dependencies
- Development dependencies
- Scripts for development, build, test, and deployment
- Proper metadata

Return only the JSON content.
    `;

    const result = await this.gemini.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async generateReadme(
    requirements: any,
    config: CodeGenerationConfig
  ): Promise<string> {
    const prompt = `
Create a comprehensive README.md file for the ${config.projectName} project.

Tech Stack: ${config.framework}, ${config.backend}, ${config.database}
Requirements: ${JSON.stringify(requirements)}

Include:
- Project description
- Installation instructions
- Usage examples
- API documentation
- Deployment guide
- Contributing guidelines

Return only the markdown content.
    `;

    const result = await this.gemini.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async retryableRequest(requestFn: () => Promise<any>): Promise<any> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`API attempt ${attempt}/${this.maxRetries}`);
        const result = await requestFn();
        console.log(`API request successful on attempt ${attempt}`);
        return result;
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, {
          message: error?.message,
          status: error?.status,
          statusText: error?.statusText,
          name: error?.name,
          cause: error?.cause,
        });

        if (attempt === this.maxRetries) {
          throw new Error(
            `Gemini API failed after ${this.maxRetries} attempts: ${
              error?.message || "Unknown error"
            }`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  private extractJsonFromResponse(response: string): string {
    // Remove markdown code block formatting
    let cleaned = response.trim();

    // Remove ```json and ``` wrappers
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "");
    }
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "");
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.replace(/\s*```$/, "");
    }

    // Find JSON object boundaries
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim();
  }

  private getTechStack(config: CodeGenerationConfig): string[] {
    const stack = [
      config.framework,
      config.backend,
      config.database,
      config.styling,
    ];

    // Add common dependencies based on framework
    if (config.framework.toLowerCase().includes("react")) {
      stack.push("React Router", "Axios");
    }
    if (config.framework.toLowerCase().includes("next")) {
      stack.push("Next.js", "Vercel");
    }
    if (config.backend.toLowerCase().includes("node")) {
      stack.push("Express.js", "JWT");
    }
    if (config.backend.toLowerCase().includes("python")) {
      stack.push("Flask/FastAPI", "SQLAlchemy");
    }

    return Array.from(new Set(stack));
  }
}

export function createAICodeGenerator(): AICodeGenerator {
  return new AICodeGenerator();
}
