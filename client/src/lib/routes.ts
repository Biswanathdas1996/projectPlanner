export const ROUTE_PREFIX = "/projectPlanner";

// Helper function to create routes with the prefix
export const createRoute = (path: string) => `${ROUTE_PREFIX}${path}`;

// Common routes used throughout the application
export const ROUTES = {
  HOME: createRoute("/"),
  PLAN: createRoute("/plan"),
  START_OVER: createRoute("/start-over"),
  LANDING: createRoute("/landing"),
  USER_JOURNEY: createRoute("/user-journey"),
  USER_JOURNEY_ENHANCED: createRoute("/user-journey-enhanced"),
  STAKEHOLDER_FLOWS: createRoute("/stakeholder-flows"),
  USER_STORIES: createRoute("/user-stories"),
  STORIES: createRoute("/stories"),
  GHERKIN: createRoute("/gherkin"),
  CODE_GENERATOR: createRoute("/code-generator"),
  CODE: createRoute("/code"),
  WIREFRAMES: createRoute("/wireframes"),
  WIREFRAME_DESIGNER: createRoute("/wireframe-designer"),
  DESIGN: createRoute("/design"),
  MARKET_RESEARCH: createRoute("/market-research"),
  RESEARCH: createRoute("/research"),
  COMPETITORS: createRoute("/competitors"),
  EDITOR: createRoute("/editor"),
  BPMN_EDITOR: createRoute("/bpmn-editor"),
  DIAGRAM: createRoute("/diagram"),
  HTML_EDITOR: createRoute("/html-editor"),
  HTML_EDITOR_WITH_ID: createRoute("/html-editor/:wireframeId"),
  FLOW_MAPPING: createRoute("/flow-mapping"),
  MAPPING: createRoute("/mapping"),
  FLOWS: createRoute("/flows"),
  AI_CONSULTANT: createRoute("/ai-consultant"),
  CONSULTANT: createRoute("/consultant"),
  CHAT: createRoute("/chat"),
} as const;
