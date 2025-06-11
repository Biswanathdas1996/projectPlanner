import { useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  FileText,
  Users,
  BookOpen,
  Code,
  TrendingUp,
} from "lucide-react";

interface WorkflowProgressProps {
  currentStep?: "input" | "research" | "plan" | "diagram" | "stories" | "code";
  completedSteps?: string[];
}

export function WorkflowProgress({
  currentStep,
  completedSteps = [],
}: WorkflowProgressProps) {
  const [location, navigate] = useLocation();

  // Navigation mapping for each step
  const stepRoutes = {
    input: "/",
    research: "/market-research",
    plan: "/plan",
    diagram: "/user-journey",
    stories: "/user-stories",
    code: "/code",
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
    if (currentStep === step) return "active";

    // Route-based determination
    switch (location) {
      case "/plan":
        if (step === "input") return "completed";
        if (step === "plan") return "active";
        break;
      case "/user-journey":
      case "/user-journey-enhanced":
        if (["input", "plan"].includes(step)) return "completed";
        if (step === "diagram") return "active";
        break;
      case "/user-stories":
        if (["input", "plan", "diagram"].includes(step)) return "completed";
        if (step === "stories") return "active";
        break;
      default:
        if (step === "input") return "active";
        break;
    }

    return "pending";
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-center gap-3 lg:gap-4">
          {/* Step 1: Input */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("input") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("input") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("input")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("input") === "active"
                  ? "bg-blue-500 text-white"
                  : getStepStatus("input") === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("input") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("input") === "active" ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                "1"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("input") === "active"
                  ? "text-blue-700"
                  : getStepStatus("input") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Describe Idea
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 2: Market Research */}
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
              Market Research
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 3: Plan */}
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
                "3"
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
              Project Planning
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 4: Process Mapping */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("diagram") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("diagram") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("diagram")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("diagram") === "completed"
                  ? "bg-green-500 text-white"
                  : getStepStatus("diagram") === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("diagram") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("diagram") === "active" ? (
                <Users className="h-4 w-4" />
              ) : (
                "4"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("diagram") === "active"
                  ? "text-blue-700"
                  : getStepStatus("diagram") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              Stakeholder & Process Mapping{" "}
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-gray-300" />

          {/* Step 5: User Stories */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              getStepStatus("stories") === "active"
                ? "bg-blue-100 shadow-md"
                : getStepStatus("stories") === "completed"
                ? "bg-green-100"
                : "bg-white"
            }`}
            onClick={() => handleStepClick("stories")}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                getStepStatus("stories") === "completed"
                  ? "bg-green-500 text-white"
                  : getStepStatus("stories") === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {getStepStatus("stories") === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : getStepStatus("stories") === "active" ? (
                <BookOpen className="h-4 w-4" />
              ) : (
                "5"
              )}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                getStepStatus("stories") === "active"
                  ? "text-blue-700"
                  : getStepStatus("stories") === "completed"
                  ? "text-green-700"
                  : "text-gray-600"
              }`}
            >
              User Stories
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
