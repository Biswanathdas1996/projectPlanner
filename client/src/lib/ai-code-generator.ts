import { GoogleGenerativeAI } from '@google/generative-ai';

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
  private openai: OpenAI;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required. Please set VITE_OPENAI_API_KEY in your environment variables.");
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateCompleteProject(
    projectPlan: string,
    stakeholderFlows: string,
    config: CodeGenerationConfig,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ProjectStructure> {
    const tasks = [
      "Analyzing project requirements",
      "Generating folder structure", 
      "Creating frontend components",
      "Building backend API",
      "Designing database schema",
      "Setting up configuration files",
      "Finalizing project structure"
    ];

    try {
      // Step 1: Analyze requirements
      onProgress?.({
        current: 1,
        total: tasks.length,
        status: "Analyzing project requirements and stakeholder flows...",
        currentTask: tasks[0]
      });

      const requirements = await this.analyzeRequirements(projectPlan, stakeholderFlows, config);

      // Step 2: Generate folder structure
      onProgress?.({
        current: 2,
        total: tasks.length,
        status: "Creating optimal folder structure...",
        currentTask: tasks[1]
      });

      const folderStructure = await this.generateFolderStructure(requirements, config);

      // Step 3: Generate frontend files
      onProgress?.({
        current: 3,
        total: tasks.length,
        status: "Building frontend components and pages...",
        currentTask: tasks[2]
      });

      const frontendFiles = await this.generateFrontendFiles(requirements, config);

      // Step 4: Generate backend files
      onProgress?.({
        current: 4,
        total: tasks.length,
        status: "Creating backend API and services...",
        currentTask: tasks[3]
      });

      const backendFiles = await this.generateBackendFiles(requirements, config);

      // Step 5: Generate database schema
      onProgress?.({
        current: 5,
        total: tasks.length,
        status: "Designing database schema and relationships...",
        currentTask: tasks[4]
      });

      const databaseSchema = await this.generateDatabaseSchema(requirements, config);

      // Step 6: Generate configuration files
      onProgress?.({
        current: 6,
        total: tasks.length,
        status: "Setting up package.json and configuration...",
        currentTask: tasks[5]
      });

      const packageJson = await this.generatePackageJson(requirements, config);
      const readme = await this.generateReadme(requirements, config);

      // Step 7: Finalize
      onProgress?.({
        current: 7,
        total: tasks.length,
        status: "Project generation completed successfully!",
        currentTask: tasks[6]
      });

      return {
        folderStructure,
        frontendFiles,
        backendFiles,
        databaseSchema,
        packageJson,
        readme,
        techStack: this.getTechStack(config)
      };

    } catch (error) {
      console.error("Error generating project:", error);
      throw new Error("Failed to generate project code. Please check your API key and try again.");
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

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert software architect. Analyze requirements and return structured JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  private async generateFolderStructure(requirements: any, config: CodeGenerationConfig): Promise<string> {
    const prompt = `
Create a comprehensive folder structure for a ${config.framework} project with ${config.backend} backend.

Requirements: ${JSON.stringify(requirements, null, 2)}

Generate a detailed folder structure that includes:
- Frontend structure optimized for ${config.framework}
- Backend structure for ${config.backend}
- Database migrations and seeds
- Configuration files
- Documentation
- Testing structure
- Deployment files

Return only the folder structure in tree format.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in project structure design. Create well-organized, scalable folder structures."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    return response.choices[0].message.content || "";
  }

  private async generateFrontendFiles(requirements: any, config: CodeGenerationConfig): Promise<{ [key: string]: string }> {
    const files: { [key: string]: string } = {};

    // Generate key frontend files based on requirements
    const filePrompts = [
      {
        name: "App.tsx",
        prompt: `Create the main App component for a ${config.framework} application with routing and layout based on these requirements: ${JSON.stringify(requirements)}`
      },
      {
        name: "components/Dashboard.tsx",
        prompt: `Create a Dashboard component that displays key metrics and data based on stakeholder needs: ${JSON.stringify(requirements)}`
      },
      {
        name: "hooks/useAuth.tsx",
        prompt: `Create an authentication hook with login, logout, and user state management for: ${JSON.stringify(requirements)}`
      },
      {
        name: "lib/api.ts",
        prompt: `Create an API utility library with HTTP methods and error handling for: ${JSON.stringify(requirements)}`
      },
      {
        name: "types/index.ts",
        prompt: `Create TypeScript type definitions based on the project requirements: ${JSON.stringify(requirements)}`
      }
    ];

    for (const filePrompt of filePrompts) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are an expert ${config.framework} developer. Write production-ready, well-documented code with proper TypeScript types, error handling, and best practices.`
            },
            {
              role: "user",
              content: filePrompt.prompt + "\n\nReturn only the complete file content, no explanations."
            }
          ],
          temperature: 0.1
        });

        files[filePrompt.name] = response.choices[0].message.content || "";
      } catch (error) {
        console.error(`Error generating ${filePrompt.name}:`, error);
        files[filePrompt.name] = `// Error generating ${filePrompt.name}\n// Please implement manually`;
      }
    }

    return files;
  }

  private async generateBackendFiles(requirements: any, config: CodeGenerationConfig): Promise<{ [key: string]: string }> {
    const files: { [key: string]: string } = {};

    const filePrompts = [
      {
        name: "server.js",
        prompt: `Create the main server file for a ${config.backend} application with middleware, routing, and error handling based on: ${JSON.stringify(requirements)}`
      },
      {
        name: "routes/api.js",
        prompt: `Create API routes with CRUD operations for the entities identified in: ${JSON.stringify(requirements)}`
      },
      {
        name: "middleware/auth.js",
        prompt: `Create authentication middleware with JWT handling and role-based access control for: ${JSON.stringify(requirements)}`
      },
      {
        name: "models/User.js",
        prompt: `Create a User model with validation and methods based on: ${JSON.stringify(requirements)}`
      },
      {
        name: "services/database.js",
        prompt: `Create database connection and query utilities for ${config.database} based on: ${JSON.stringify(requirements)}`
      }
    ];

    for (const filePrompt of filePrompts) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are an expert ${config.backend} backend developer. Write secure, scalable, production-ready code with proper error handling, validation, and database integration.`
            },
            {
              role: "user",
              content: filePrompt.prompt + "\n\nReturn only the complete file content, no explanations."
            }
          ],
          temperature: 0.1
        });

        files[filePrompt.name] = response.choices[0].message.content || "";
      } catch (error) {
        console.error(`Error generating ${filePrompt.name}:`, error);
        files[filePrompt.name] = `// Error generating ${filePrompt.name}\n// Please implement manually`;
      }
    }

    return files;
  }

  private async generateDatabaseSchema(requirements: any, config: CodeGenerationConfig): Promise<string> {
    const prompt = `
Create a comprehensive ${config.database} database schema based on these requirements:

${JSON.stringify(requirements, null, 2)}

Include:
- All necessary tables with proper relationships
- Indexes for performance
- Constraints and validations
- Initial seed data structure
- Migration scripts structure

Return only the SQL schema, no explanations.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert database architect specializing in ${config.database}. Create efficient, normalized schemas with proper indexing.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1
    });

    return response.choices[0].message.content || "";
  }

  private async generatePackageJson(requirements: any, config: CodeGenerationConfig): Promise<string> {
    const prompt = `
Create a comprehensive package.json for a ${config.framework} + ${config.backend} project.

Requirements: ${JSON.stringify(requirements)}
Configuration: ${JSON.stringify(config)}

Include:
- All necessary dependencies for the tech stack
- Development dependencies
- Scripts for development, build, test, and deployment
- Proper project metadata

Return only valid JSON, no explanations.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in JavaScript project configuration. Create comprehensive, production-ready package.json files."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    return response.choices[0].message.content || "{}";
  }

  private async generateReadme(requirements: any, config: CodeGenerationConfig): Promise<string> {
    const prompt = `
Create a comprehensive README.md for a ${config.projectName} project.

Tech Stack: ${JSON.stringify(config)}
Requirements: ${JSON.stringify(requirements)}

Include:
- Project description and purpose
- Tech stack overview
- Installation instructions
- Development setup
- API documentation overview
- Deployment instructions
- Contributing guidelines
- License information

Return only the markdown content, no explanations.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert technical writer. Create clear, comprehensive documentation that helps developers understand and contribute to projects."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    return response.choices[0].message.content || "";
  }

  private getTechStack(config: CodeGenerationConfig): string[] {
    const stack = [];
    
    // Frontend
    if (config.framework === "react") stack.push("React", "TypeScript");
    if (config.framework === "nextjs") stack.push("Next.js", "React", "TypeScript");
    if (config.framework === "vue") stack.push("Vue.js", "TypeScript");
    
    // Styling
    if (config.styling === "tailwind") stack.push("Tailwind CSS");
    if (config.styling === "styled") stack.push("Styled Components");
    if (config.styling === "css") stack.push("CSS Modules");
    
    // Backend
    if (config.backend === "node") stack.push("Node.js", "Express");
    if (config.backend === "python") stack.push("Python", "FastAPI");
    if (config.backend === "go") stack.push("Go", "Gin");
    
    // Database
    if (config.database === "postgresql") stack.push("PostgreSQL");
    if (config.database === "mysql") stack.push("MySQL");
    if (config.database === "mongodb") stack.push("MongoDB");
    
    // Deployment
    if (config.deployment === "vercel") stack.push("Vercel");
    if (config.deployment === "netlify") stack.push("Netlify");
    if (config.deployment === "aws") stack.push("AWS");
    
    return stack;
  }

  private async retryableRequest(requestFn: () => Promise<any>): Promise<any> {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        console.warn(`Request attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }
}

export function createAICodeGenerator(): AICodeGenerator {
  return new AICodeGenerator();
}