import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BpmnEditor from "@/pages/bpmn-editor";
import ProjectPlanner from "@/pages/project-planner";
import UserJourneyEnhanced from "@/pages/user-journey-enhanced";
import UserStoryGenerator from "@/pages/user-story-generator";
import CodeGenerator from "@/pages/code-generator";
import MarketResearch from "@/pages/market-research";
import WireframeDesigner from "@/pages/wireframe-designer";
import HTMLEditor from "@/pages/html-editor";
import { FlowWireframeMappingPage } from "@/pages/flow-wireframe-mapping";
import { PatientWebappOverviewPage } from "@/pages/patient-webapp-overview";
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
      <Route path="/user-journey-enhanced" component={UserJourneyEnhanced} />
      <Route path="/stakeholder-flows" component={UserJourneyEnhanced} />
      <Route path="/user-stories" component={UserStoryGenerator} />
      <Route path="/stories" component={UserStoryGenerator} />
      <Route path="/gherkin" component={UserStoryGenerator} />
      <Route path="/code-generator" component={CodeGenerator} />
      <Route path="/code" component={CodeGenerator} />
      <Route path="/wireframes" component={WireframeDesigner} />
      <Route path="/wireframe-designer" component={WireframeDesigner} />
      <Route path="/design" component={WireframeDesigner} />
      <Route path="/market-research" component={MarketResearch} />
      <Route path="/research" component={MarketResearch} />
      <Route path="/competitors" component={MarketResearch} />
      <Route path="/editor" component={BpmnEditor} />
      <Route path="/bpmn-editor" component={BpmnEditor} />
      <Route path="/diagram" component={BpmnEditor} />
      <Route path="/html-editor" component={HTMLEditor} />
      <Route path="/html-editor/:wireframeId" component={HTMLEditor} />
      <Route path="/flow-mapping" component={FlowWireframeMappingPage} />
      <Route path="/mapping" component={PatientWebappOverviewPage} />
      <Route path="/flows" component={FlowWireframeMappingPage} />
      <Route path="/patient-app" component={PatientWebappOverviewPage} />
      <Route path="/healthcare" component={PatientWebappOverviewPage} />
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
