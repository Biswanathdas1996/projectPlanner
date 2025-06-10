import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BpmnEditor from "@/pages/bpmn-editor";
import ProjectPlanner from "@/pages/project-planner";
import UserJourney from "@/pages/user-journey";
import UserJourneyEnhanced from "@/pages/user-journey-enhanced";
import UserStoryGenerator from "@/pages/user-story-generator";
import Landing from "@/pages/landing";
import HomeLanding from "@/pages/home-landing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeLanding} />
      <Route path="/plan" component={ProjectPlanner} />
      <Route path="/start-over" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/user-journey" component={UserJourneyEnhanced} />
      <Route path="/user-journey-legacy" component={UserJourney} />
      <Route path="/stakeholder-flows" component={UserJourneyEnhanced} />
      <Route path="/user-stories" component={UserStoryGenerator} />
      <Route path="/stories" component={UserStoryGenerator} />
      <Route path="/gherkin" component={UserStoryGenerator} />
      <Route path="/editor" component={BpmnEditor} />
      <Route path="/bpmn-editor" component={BpmnEditor} />
      <Route path="/diagram" component={BpmnEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
