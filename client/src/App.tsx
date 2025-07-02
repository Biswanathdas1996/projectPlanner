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
import AIConsultant from "@/pages/ai-consultant";

import Landing from "@/pages/landing";
import HomeLanding from "@/pages/home-landing";
import NotFound from "@/pages/not-found";
import { ROUTES } from "@/lib/routes";

function Router() {
  return (
    <Switch>
      <Route path={ROUTES.HOME} component={HomeLanding} />
      <Route path={ROUTES.PLAN} component={ProjectPlanner} />
      <Route path={ROUTES.START_OVER} component={Landing} />
      <Route path={ROUTES.LANDING} component={Landing} />
      <Route path={ROUTES.USER_JOURNEY} component={UserJourneyEnhanced} />
      <Route
        path={ROUTES.USER_JOURNEY_ENHANCED}
        component={UserJourneyEnhanced}
      />
      <Route path={ROUTES.STAKEHOLDER_FLOWS} component={UserJourneyEnhanced} />
      <Route path={ROUTES.USER_STORIES} component={UserStoryGenerator} />
      <Route path={ROUTES.STORIES} component={UserStoryGenerator} />
      <Route path={ROUTES.GHERKIN} component={UserStoryGenerator} />
      <Route path={ROUTES.CODE_GENERATOR} component={CodeGenerator} />
      <Route path={ROUTES.CODE} component={CodeGenerator} />
      <Route path={ROUTES.WIREFRAMES} component={WireframeDesigner} />
      <Route path={ROUTES.WIREFRAME_DESIGNER} component={WireframeDesigner} />
      <Route path={ROUTES.DESIGN} component={WireframeDesigner} />
      <Route path={ROUTES.MARKET_RESEARCH} component={MarketResearch} />
      <Route path={ROUTES.RESEARCH} component={MarketResearch} />
      <Route path={ROUTES.COMPETITORS} component={MarketResearch} />
      <Route path={ROUTES.EDITOR} component={BpmnEditor} />
      <Route path={ROUTES.BPMN_EDITOR} component={BpmnEditor} />
      <Route path={ROUTES.DIAGRAM} component={BpmnEditor} />
      <Route path={ROUTES.HTML_EDITOR} component={HTMLEditor} />
      <Route path={ROUTES.HTML_EDITOR_WITH_ID} component={HTMLEditor} />
      <Route path={ROUTES.FLOW_MAPPING} component={FlowWireframeMappingPage} />
      <Route path={ROUTES.MAPPING} component={FlowWireframeMappingPage} />
      <Route path={ROUTES.FLOWS} component={FlowWireframeMappingPage} />
      <Route path={ROUTES.AI_CONSULTANT} component={AIConsultant} />
      <Route path={ROUTES.CONSULTANT} component={AIConsultant} />
      <Route path={ROUTES.CHAT} component={AIConsultant} />
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
