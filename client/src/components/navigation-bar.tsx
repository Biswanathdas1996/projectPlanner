import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Home } from "lucide-react";
import { useLocation } from "wouter";
import { STORAGE_KEYS } from "@/lib/bpmn-utils";
import { ROUTES } from "@/lib/routes";

interface NavigationBarProps {
  title?: string;
  showBackButton?: boolean;
  showStartOverButton?: boolean;
}

export function NavigationBar({
  title,
  showBackButton = true,
  showStartOverButton = true,
}: NavigationBarProps) {
  const [location, setLocation] = useLocation();

  const handleBack = () => {
    window.history.back();
  };

  const handleStartOver = () => {
    // Clear all localStorage data
    const keysToKeep = ["theme"]; // Keep theme preference
    const allKeys = Object.keys(localStorage);

    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Clear specific storage keys
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear additional user story data
    localStorage.removeItem("user_stories");

    // Navigate to start-over page
    setLocation(ROUTES.START_OVER);
  };

  const handleHome = () => {
    setLocation(ROUTES.HOME);
  };

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          <Button
            onClick={handleHome}
            variant="ghost"
            size="sm"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>

          {title && (
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {showStartOverButton && (
            <Button
              onClick={handleStartOver}
              variant="outline"
              size="sm"
              className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
