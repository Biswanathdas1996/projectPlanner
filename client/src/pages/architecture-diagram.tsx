import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NavigationBar } from "@/components/navigation-bar";
import { BpmnJSViewer } from "@/components/bpmn-js-viewer";
import { Download, Layers, Database, Server, Globe, Shield, Zap } from "lucide-react";

export default function ArchitectureDiagram() {
  const [bpmnXml, setBpmnXml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const modernArchitectureBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/bpmn/2.0"
                  xmlns:bpmndi="http://www.omg.org/bpmn/2.0/bpmndi"
                  xmlns:dc="http://www.omg.org/dc/elements/1.1/"
                  xmlns:di="http://www.omg.org/di/1.0/"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  id="modern-architecture-diagram">

  <bpmn:collaboration id="ModernArchitecture">
    <bpmn:participant id="PresentationLayer" name="Presentation Layer" processRef="PresentationProcess" />
    <bpmn:participant id="APILayer" name="API Gateway Layer" processRef="APIProcess" />
    <bpmn:participant id="ServiceLayer" name="Service Layer" processRef="ServiceProcess" />
    <bpmn:participant id="DataLayer" name="Data Layer" processRef="DataProcess" />
    
    <bpmn:messageFlow id="Flow_Frontend_API" sourceRef="Frontend" targetRef="APIGateway" />
    <bpmn:messageFlow id="Flow_API_LoadBalancer" sourceRef="APIGateway" targetRef="LoadBalancer" />
    <bpmn:messageFlow id="Flow_LoadBalancer_ServiceA" sourceRef="LoadBalancer" targetRef="ServiceA" />
    <bpmn:messageFlow id="Flow_LoadBalancer_ServiceB" sourceRef="LoadBalancer" targetRef="ServiceB" />
    <bpmn:messageFlow id="Flow_ServiceA_Database" sourceRef="ServiceA" targetRef="Database" />
    <bpmn:messageFlow id="Flow_ServiceB_Database" sourceRef="ServiceB" targetRef="Database" />
    <bpmn:messageFlow id="Flow_ServiceA_Cache" sourceRef="ServiceA" targetRef="CacheLayer" />
    <bpmn:messageFlow id="Flow_ServiceB_Cache" sourceRef="ServiceB" targetRef="CacheLayer" />
  </bpmn:collaboration>

  <bpmn:process id="PresentationProcess" isExecutable="false">
    <bpmn:startEvent id="UserRequest" name="User Request" />
    <bpmn:task id="Frontend" name="Frontend&#10;React/Vue/Angular" />
    <bpmn:sequenceFlow id="Flow_Start_Frontend" sourceRef="UserRequest" targetRef="Frontend" />
  </bpmn:process>

  <bpmn:process id="APIProcess" isExecutable="false">
    <bpmn:task id="APIGateway" name="API Gateway&#10;Authentication&#10;Rate Limiting&#10;Routing" />
  </bpmn:process>

  <bpmn:process id="ServiceProcess" isExecutable="false">
    <bpmn:task id="LoadBalancer" name="Load Balancer&#10;Traffic Distribution&#10;Health Checks" />
    <bpmn:parallelGateway id="Gateway_Split" />
    <bpmn:task id="ServiceA" name="Service A&#10;Microservice&#10;Business Logic" />
    <bpmn:task id="ServiceB" name="Service B&#10;Microservice&#10;Business Logic" />
    <bpmn:parallelGateway id="Gateway_Join" />
    <bpmn:sequenceFlow id="Flow_LB_Split" sourceRef="LoadBalancer" targetRef="Gateway_Split" />
    <bpmn:sequenceFlow id="Flow_Split_ServiceA" sourceRef="Gateway_Split" targetRef="ServiceA" />
    <bpmn:sequenceFlow id="Flow_Split_ServiceB" sourceRef="Gateway_Split" targetRef="ServiceB" />
    <bpmn:sequenceFlow id="Flow_ServiceA_Join" sourceRef="ServiceA" targetRef="Gateway_Join" />
    <bpmn:sequenceFlow id="Flow_ServiceB_Join" sourceRef="ServiceB" targetRef="Gateway_Join" />
  </bpmn:process>

  <bpmn:process id="DataProcess" isExecutable="false">
    <bpmn:task id="CacheLayer" name="Cache Layer&#10;Redis/Memcached&#10;Fast Access" />
    <bpmn:task id="Database" name="Database&#10;PostgreSQL/MongoDB&#10;Persistent Storage" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="ModernArchitecture">
      
      <!-- Presentation Layer Pool -->
      <bpmndi:BPMNShape id="Participant_PresentationLayer_di" bpmnElement="PresentationLayer" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="800" height="120" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Event_UserRequest_di" bpmnElement="UserRequest">
        <dc:Bounds x="212" y="132" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="200" y="175" width="64" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_Frontend_di" bpmnElement="Frontend">
        <dc:Bounds x="300" y="110" width="120" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Flow_Start_Frontend_di" bpmnElement="Flow_Start_Frontend">
        <di:waypoint x="248" y="150" />
        <di:waypoint x="300" y="150" />
      </bpmndi:BPMNEdge>

      <!-- API Layer Pool -->
      <bpmndi:BPMNShape id="Participant_APILayer_di" bpmnElement="APILayer" isHorizontal="true">
        <dc:Bounds x="160" y="220" width="800" height="120" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_APIGateway_di" bpmnElement="APIGateway">
        <dc:Bounds x="300" y="250" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Service Layer Pool -->
      <bpmndi:BPMNShape id="Participant_ServiceLayer_di" bpmnElement="ServiceLayer" isHorizontal="true">
        <dc:Bounds x="160" y="360" width="800" height="160" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_LoadBalancer_di" bpmnElement="LoadBalancer">
        <dc:Bounds x="300" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Gateway_Split_di" bpmnElement="Gateway_Split">
        <dc:Bounds x="475" y="405" width="50" height="50" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_ServiceA_di" bpmnElement="ServiceA">
        <dc:Bounds x="580" y="370" width="120" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_ServiceB_di" bpmnElement="ServiceB">
        <dc:Bounds x="580" y="450" width="120" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Gateway_Join_di" bpmnElement="Gateway_Join">
        <dc:Bounds x="745" y="405" width="50" height="50" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="Flow_LB_Split_di" bpmnElement="Flow_LB_Split">
        <di:waypoint x="420" y="430" />
        <di:waypoint x="475" y="430" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_Split_ServiceA_di" bpmnElement="Flow_Split_ServiceA">
        <di:waypoint x="500" y="405" />
        <di:waypoint x="500" y="390" />
        <di:waypoint x="580" y="390" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_Split_ServiceB_di" bpmnElement="Flow_Split_ServiceB">
        <di:waypoint x="500" y="455" />
        <di:waypoint x="500" y="470" />
        <di:waypoint x="580" y="470" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_ServiceA_Join_di" bpmnElement="Flow_ServiceA_Join">
        <di:waypoint x="700" y="410" />
        <di:waypoint x="720" y="410" />
        <di:waypoint x="720" y="420" />
        <di:waypoint x="745" y="420" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_ServiceB_Join_di" bpmnElement="Flow_ServiceB_Join">
        <di:waypoint x="700" y="490" />
        <di:waypoint x="720" y="490" />
        <di:waypoint x="720" y="440" />
        <di:waypoint x="745" y="440" />
      </bpmndi:BPMNEdge>

      <!-- Data Layer Pool -->
      <bpmndi:BPMNShape id="Participant_DataLayer_di" bpmnElement="DataLayer" isHorizontal="true">
        <dc:Bounds x="160" y="540" width="800" height="120" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_CacheLayer_di" bpmnElement="CacheLayer">
        <dc:Bounds x="450" y="570" width="120" height="80" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Activity_Database_di" bpmnElement="Database">
        <dc:Bounds x="620" y="570" width="120" height="80" />
      </bpmndi:BPMNShape>

      <!-- Message Flows -->
      <bpmndi:BPMNEdge id="Flow_Frontend_API_di" bpmnElement="Flow_Frontend_API">
        <di:waypoint x="360" y="190" />
        <di:waypoint x="360" y="250" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_API_LoadBalancer_di" bpmnElement="Flow_API_LoadBalancer">
        <di:waypoint x="360" y="330" />
        <di:waypoint x="360" y="390" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_ServiceA_Database_di" bpmnElement="Flow_ServiceA_Database">
        <di:waypoint x="640" y="450" />
        <di:waypoint x="640" y="510" />
        <di:waypoint x="680" y="510" />
        <di:waypoint x="680" y="570" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_ServiceB_Database_di" bpmnElement="Flow_ServiceB_Database">
        <di:waypoint x="640" y="530" />
        <di:waypoint x="640" y="550" />
        <di:waypoint x="680" y="550" />
        <di:waypoint x="680" y="570" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_ServiceA_Cache_di" bpmnElement="Flow_ServiceA_Cache">
        <di:waypoint x="580" y="410" />
        <di:waypoint x="520" y="410" />
        <di:waypoint x="520" y="570" />
      </bpmndi:BPMNEdge>
      
      <bpmndi:BPMNEdge id="Flow_ServiceB_Cache_di" bpmnElement="Flow_ServiceB_Cache">
        <di:waypoint x="580" y="490" />
        <di:waypoint x="500" y="490" />
        <di:waypoint x="500" y="570" />
      </bpmndi:BPMNEdge>

    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  useEffect(() => {
    setBpmnXml(modernArchitectureBpmn);
  }, []);

  const downloadDiagram = () => {
    const blob = new Blob([bpmnXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modern-architecture-diagram.bpmn';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const architectureLayers = [
    {
      name: "Presentation Layer",
      description: "User interface and client-side logic",
      icon: <Globe className="h-5 w-5" />,
      components: ["Frontend (React/Vue/Angular)", "Mobile Apps", "Web Portals"],
      color: "bg-blue-50 border-blue-200 text-blue-800"
    },
    {
      name: "API Gateway Layer", 
      description: "Request routing, authentication, and rate limiting",
      icon: <Shield className="h-5 w-5" />,
      components: ["API Gateway", "Authentication", "Rate Limiting", "Request Routing"],
      color: "bg-green-50 border-green-200 text-green-800"
    },
    {
      name: "Service Layer",
      description: "Business logic and microservices",
      icon: <Server className="h-5 w-5" />,
      components: ["Load Balancer", "Service A", "Service B", "Business Logic"],
      color: "bg-purple-50 border-purple-200 text-purple-800"
    },
    {
      name: "Data Layer",
      description: "Data storage and caching",
      icon: <Database className="h-5 w-5" />,
      components: ["Database (PostgreSQL/MongoDB)", "Cache Layer (Redis)", "Data Storage"],
      color: "bg-orange-50 border-orange-200 text-orange-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <NavigationBar 
        title="Modern Architecture Flow Diagram" 
        showBackButton={true}
      />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <Layers className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Architecture</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Modern Layered Architecture
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Interactive BPMN diagram showing a modern microservices architecture with proper layer separation and data flow visualization.
          </p>
        </div>

        {/* Architecture Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {architectureLayers.map((layer, index) => (
            <Card key={index} className={`border-2 ${layer.color} hover:shadow-lg transition-all duration-200`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  {layer.icon}
                  <CardTitle className="text-lg">{layer.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {layer.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {layer.components.map((component, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs mr-1 mb-1">
                      {component}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* BPMN Diagram Section */}
        <Card className="border-0 shadow-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Interactive Flow Diagram
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Click and explore the layered architecture components and their relationships
                </CardDescription>
              </div>
              <Button 
                onClick={downloadDiagram}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download BPMN
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bpmnXml && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <BpmnJSViewer 
                  bpmnXml={bpmnXml}
                  height="600px"
                  title="Modern Architecture Flow"
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Flow Information */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-200 dark:border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="h-5 w-5 text-blue-600" />
              Data Flow & Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Request Flow</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>• User initiates request through Frontend</li>
                  <li>• API Gateway handles authentication & routing</li>
                  <li>• Load Balancer distributes traffic to services</li>
                  <li>• Services process business logic</li>
                  <li>• Data accessed through Cache or Database</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Key Benefits</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>• Scalable microservices architecture</li>
                  <li>• Efficient caching for performance</li>
                  <li>• Load balancing for high availability</li>
                  <li>• Secure API gateway protection</li>
                  <li>• Clear separation of concerns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}