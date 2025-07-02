import { useLocation } from "wouter";
import { hasMarketResearchData } from "@/lib/storage-utils";
import { ROUTES } from "@/lib/routes";
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  FileText,
  Users,
  BookOpen,
  Code,
  TrendingUp,
  Layout,
  MessageCircle,
} from "lucide-react";

interface WorkflowProgressProps {
  currentStep?:
    | "input"
    | "research"
    | "plan"
    | "diagram"
    | "wireframes"
    | "stories"
    | "code"
    | "chat";
  completedSteps?: string[];
}

export function WorkflowProgress({
  currentStep,
  completedSteps = [],
}: WorkflowProgressProps) {
  const [location, navigate] = useLocation();

  // Navigation mapping for each step
  const stepRoutes = {
    chat: ROUTES.AI_CONSULTANT,
    input: ROUTES.START_OVER,
    research: ROUTES.MARKET_RESEARCH,
    plan: ROUTES.PLAN,
    diagram: ROUTES.USER_JOURNEY,
    wireframes: ROUTES.WIREFRAMES,
    stories: ROUTES.USER_STORIES,
    code: ROUTES.CODE,
  };

  const handleStepClick = (step: string) => {
    const route = stepRoutes[step as keyof typeof stepRoutes];
    if (route) {
      navigate(route);
    }
  };

  // Determine step status based on current route and passed props
  const getStepStatus = (step: string) => {
    if (completedSteps.includes(step)) return "completed";

    // Check for completed steps based on available data
    const hasResearchData = hasMarketResearchData();

    // Route-based determination - explicit handling for each route
    switch (location) {
      case ROUTES.START_OVER:
        if (step === "input") return "active";
        return "pending";
      case ROUTES.MARKET_RESEARCH:
        if (step === "input") return "completed";
        if (step === "research") return "active";
        return "pending";
      case ROUTES.PLAN:
        if (step === "input") return "completed";
        if (step === "research")
          return hasResearchData ? "completed" : "pending";
        if (step === "plan") return "active";
        return "pending";
      case ROUTES.USER_JOURNEY:
      case ROUTES.USER_JOURNEY_ENHANCED:
        if (step === "input") return "completed";
        if (step === "research")
          return hasResearchData ? "completed" : "pending";
        if (step === "plan") return "completed";
        if (step === "diagram") return "active";
        return "pending";
      case ROUTES.WIREFRAMES:
      case ROUTES.WIREFRAME_DESIGNER:
        if (step === "input") return "completed";
        if (step === "research")
          return hasResearchData ? "completed" : "pending";
        if (step === "plan") return "completed";
        if (step === "diagram") return "completed";
        if (step === "wireframes") return "active";
        return "pending";
      case ROUTES.USER_STORIES:
        if (step === "input") return "completed";
        if (step === "research")
          return hasResearchData ? "completed" : "pending";
        if (step === "plan") return "completed";
        if (step === "diagram") return "completed";
        if (step === "wireframes") return "completed";
        if (step === "stories") return "active";
        return "pending";
      case ROUTES.CODE:
        if (step === "input") return "completed";
        if (step === "research")
          return hasResearchData ? "completed" : "pending";
        if (step === "plan") return "completed";
        if (step === "diagram") return "completed";
        if (step === "wireframes") return "completed";
        if (step === "stories") return "completed";
        if (step === "code") return "active";
        return "pending";
      default:
        // Handle currentStep prop if provided
        if (currentStep === step) return "active";

        // Default logic for home page or other routes
        if (step === "input") return "active";
        if (step === "research")
          return hasResearchData ? "completed" : "pending";
        return "pending";
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          {/* Step 1: AI Chat */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("chat") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("chat") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("chat")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("chat") === "active"
                  ? "bg-blue-500 text-white"
                  : getStepStatus("chat") === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("chat") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("chat") === "active" ? (
                <MessageCircle className="h-4 w-4" />
              ) : (
                "1"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("chat") === "active"
                  ? "text-blue-700"
                  : getStepStatus("chat") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              AI Consultant
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 2: Input */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("input") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("input")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("input") === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("input") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                "2"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("input") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Idea
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 3: Market Research */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("research") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("research") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("research")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("research") === "active"
                  ? "bg-blue-500 text-white"
                  : getStepStatus("research") === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("research") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("research") === "active" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                "2"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("research") === "active"
                  ? "text-blue-700"
                  : getStepStatus("research") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Research
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 4: Plan */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("plan") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("plan") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("plan")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("plan") === "active"
                  ? "bg-blue-500 text-white"
                  : getStepStatus("plan") === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("plan") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("plan") === "active" ? (
                <FileText className="h-4 w-4" />
              ) : (
                "4"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("plan") === "active"
                  ? "text-blue-700"
                  : getStepStatus("plan") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Stakeholders & Process
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 5: Wireframes */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("wireframes") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("wireframes") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("wireframes")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("wireframes") === "completed"
                  ? "bg-green-500 text-white"
                  : getStepStatus("wireframes") === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("wireframes") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("wireframes") === "active" ? (
                <Layout className="h-4 w-4" />
              ) : (
                "5"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("wireframes") === "active"
                  ? "text-blue-700"
                  : getStepStatus("wireframes") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Wireframes
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 6: Code */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("code") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("code") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("code")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("code") === "completed"
                  ? "bg-green-500 text-white"
                  : getStepStatus("code") === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("code") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("code") === "active" ? (
                <Code className="h-4 w-4" />
              ) : (
                "6"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("code") === "active"
                  ? "text-blue-700"
                  : getStepStatus("code") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Code
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
