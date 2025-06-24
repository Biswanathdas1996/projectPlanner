import { Request, Response } from 'express';

// For this implementation, we'll create a simulated conversational AI system
// that doesn't require external APIs but provides intelligent responses

// Chat endpoint for conversational AI
export async function chat(req: Request, res: Response) {
  try {
    const { message, conversation, stage } = req.body;

    // Generate contextual response based on conversation stage
    const response = await generateContextualResponse(message, conversation, stage);

    res.json({
      text: response.text,
      shouldGeneratePlan: response.shouldGeneratePlan
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
}

// Text-to-speech endpoint using ElevenLabs
export async function textToSpeech(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Check if ElevenLabs API key is available
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    // Use fetch to call ElevenLabs API directly
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength.toString(),
    });

    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ error: 'Speech generation failed' });
  }
}

// Speech-to-text endpoint (placeholder - browser will handle this)
export async function speechToText(req: Request, res: Response) {
  try {
    // Speech-to-text will be handled by the browser's Web Speech API
    res.status(501).json({ 
      error: 'Use browser speech recognition', 
      message: 'Please use the browser\'s built-in speech recognition' 
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({ error: 'Speech processing failed' });
  }
}

// Generate project plan endpoint
export async function generateProjectPlan(req: Request, res: Response) {
  try {
    const { conversation } = req.body;

    const plan = await createProjectPlanFromConversation(conversation);

    res.json(plan);
  } catch (error) {
    console.error('Project plan generation error:', error);
    res.status(500).json({ error: 'Project plan generation failed' });
  }
}

// Helper function to generate contextual responses
async function generateContextualResponse(message: string, conversation: any[], stage: string) {
  const conversationContext = conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  
  let shouldGeneratePlan = false;

  // Check if we should generate a plan
  if (stage === 'planning' && conversation.length >= 8) {
    shouldGeneratePlan = true;
  }

  // Generate response based on context and stage
  const response = generateResponseBasedOnContext(message, stage, conversationContext);
  
  return {
    text: response,
    shouldGeneratePlan
  };
}

// Helper function to generate responses based on context
function generateResponseBasedOnContext(message: string, stage: string, context: string): string {
  const messageWords = message.toLowerCase();
  
  // Analyze the message for key topics
  const isWebsite = messageWords.includes('website') || messageWords.includes('web') || messageWords.includes('site');
  const isApp = messageWords.includes('app') || messageWords.includes('mobile') || messageWords.includes('application');
  const isDatabase = messageWords.includes('database') || messageWords.includes('data') || messageWords.includes('storage');
  const isEcommerce = messageWords.includes('ecommerce') || messageWords.includes('shop') || messageWords.includes('store') || messageWords.includes('sell');
  const isAuth = messageWords.includes('login') || messageWords.includes('auth') || messageWords.includes('user') || messageWords.includes('account');
  const isAPI = messageWords.includes('api') || messageWords.includes('integration') || messageWords.includes('connect');
  
  if (stage === 'initial') {
    if (isWebsite) {
      return "Great! I'd love to help you with your website project. Can you tell me more about what kind of website you're building? Is it for a business, portfolio, blog, or something else? What's the main purpose you want it to serve?";
    } else if (isApp) {
      return "An app project sounds exciting! Are you thinking of a mobile app, web app, or both? What's the main problem your app will solve for users? And who is your target audience?";
    } else if (isDatabase) {
      return "Data management is crucial for success. What kind of data are you working with? Are you looking to store customer information, product data, analytics, or something else? What do you need to do with this data?";
    } else if (isEcommerce) {
      return "An e-commerce project! That's a great business opportunity. What types of products will you be selling? Do you need features like inventory management, payment processing, or shipping integration?";
    }
    
    return "I'm here to help you solve your tech challenge! Could you tell me more about what you're trying to build or accomplish? What's the main problem you're looking to solve?";
  }
  
  if (stage === 'gathering') {
    const questions = [
      "That's helpful context. What's your timeline for this project? Do you have a target launch date in mind?",
      "Good information. What's your budget range for this project? This will help me recommend the right approach and technologies.",
      "I'm getting a clearer picture. Do you or your team have any technical experience, or will you be working with developers?",
      "Thanks for those details. Who are the main users who will be using this solution? Can you describe them?",
      "Excellent. Are there any existing systems or tools that this solution needs to work with or replace?",
      "That makes sense. What would success look like for this project? What are your key goals and metrics?"
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  if (stage === 'analyzing') {
    return `Based on our conversation, I'm starting to see a clear picture of your needs. Let me summarize what I understand:

From what you've shared, this sounds like a ${isWebsite ? 'web-based' : isApp ? 'application' : 'digital'} solution that needs to ${isDatabase ? 'handle data efficiently' : isEcommerce ? 'support online sales' : 'serve your users effectively'}.

I'm thinking we could approach this with a modern tech stack that balances functionality, performance, and maintainability. 

A few key questions to finalize my recommendation:
- Do you have any preferences for specific technologies or platforms?
- Are there any constraints I should know about (hosting, compliance, integrations)?
- What's most important to you: speed to market, scalability, or cost efficiency?`;
  }
  
  if (stage === 'planning') {
    return `Perfect! I have all the information I need to create a comprehensive project plan for you. 

Based on our discussion, I'll generate a detailed plan that includes:
- Technical architecture and technology recommendations
- Project phases with specific deliverables and timelines
- Resource requirements and budget estimates
- Risk assessment and mitigation strategies
- Implementation roadmap

Let me put together your customized project plan now. This will give you a clear roadmap to bring your vision to life!`;
  }
  
  return "I understand. Could you tell me more about that aspect of your project? I want to make sure I have all the details to give you the best recommendations.";
}

// Helper function to create project plan from conversation
async function createProjectPlanFromConversation(conversation: any[]) {
  // Extract key information from conversation
  const userMessages = conversation.filter(msg => msg.role === 'user').map(msg => msg.content);
  const fullContext = userMessages.join(' ').toLowerCase();
  
  // Determine project type and characteristics
  let projectType = 'Custom Digital Solution';
  let technologies = ['React', 'Node.js', 'PostgreSQL', 'AWS'];
  let timeline = '10-14 weeks';
  let budget = '$20,000 - $35,000';
  
  if (fullContext.includes('website') || fullContext.includes('web')) {
    projectType = 'Modern Web Application';
    technologies = ['React', 'Next.js', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Vercel'];
    timeline = '8-12 weeks';
    budget = '$15,000 - $25,000';
  } else if (fullContext.includes('app') || fullContext.includes('mobile')) {
    projectType = 'Mobile Application';
    technologies = ['React Native', 'Expo', 'Node.js', 'Firebase', 'Redux', 'App Store'];
    timeline = '12-16 weeks';
    budget = '$25,000 - $40,000';
  } else if (fullContext.includes('ecommerce') || fullContext.includes('shop') || fullContext.includes('store')) {
    projectType = 'E-commerce Platform';
    technologies = ['Next.js', 'Stripe', 'Shopify API', 'PostgreSQL', 'Redis', 'AWS'];
    timeline = '14-18 weeks';
    budget = '$30,000 - $50,000';
  } else if (fullContext.includes('database') || fullContext.includes('data')) {
    projectType = 'Data Management Platform';
    technologies = ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'AWS'];
    timeline = '10-14 weeks';
    budget = '$20,000 - $35,000';
  }
  
  // Adjust timeline and budget based on complexity indicators
  const complexityFactors = [
    fullContext.includes('integration'),
    fullContext.includes('payment'),
    fullContext.includes('auth'),
    fullContext.includes('api'),
    fullContext.includes('real-time'),
    fullContext.includes('analytics')
  ].filter(Boolean).length;
  
  if (complexityFactors > 3) {
    timeline = timeline.replace(/(\d+)-(\d+)/, (match, start, end) => `${parseInt(start) + 2}-${parseInt(end) + 4}`);
    budget = budget.replace(/\$(\d+),(\d+) - \$(\d+),(\d+)/, (match, s1, s2, e1, e2) => 
      `$${parseInt(s1) + 5},${s2} - $${parseInt(e1) + 10},${e2}`);
  }
  
  const plan = {
    title: `${projectType} Development Project`,
    description: `A comprehensive ${projectType.toLowerCase()} tailored to your specific requirements, built with modern technologies and best practices for scalability, security, and user experience.`,
    timeline,
    budget,
    technologies,
    phases: [
      {
        name: 'Discovery & Planning',
        duration: '2-3 weeks',
        tasks: [
          'Detailed requirements analysis and documentation',
          'User experience research and persona development',
          'Technical architecture design and planning',
          'Project roadmap and milestone definition',
          'Technology stack finalization',
          'Risk assessment and mitigation planning'
        ]
      },
      {
        name: 'Design & Prototyping',
        duration: '2-3 weeks',
        tasks: [
          'User interface design and wireframing',
          'Interactive prototype development',
          'Design system and component library creation',
          'User flow mapping and optimization',
          'Accessibility and responsive design planning',
          'Stakeholder review and approval process'
        ]
      },
      {
        name: 'Core Development',
        duration: '4-6 weeks',
        tasks: [
          'Backend API development and database setup',
          'Frontend application development',
          'Core feature implementation',
          'Authentication and security implementation',
          'Data integration and management',
          'Performance optimization and caching'
        ]
      },
      {
        name: 'Integration & Testing',
        duration: '2-3 weeks',
        tasks: [
          'Third-party service integration',
          'Comprehensive testing (unit, integration, e2e)',
          'Performance testing and optimization',
          'Security audit and vulnerability assessment',
          'User acceptance testing',
          'Bug fixes and refinements'
        ]
      },
      {
        name: 'Deployment & Launch',
        duration: '1-2 weeks',
        tasks: [
          'Production environment setup and configuration',
          'Deployment automation and CI/CD pipeline',
          'Data migration and system configuration',
          'Go-live deployment and monitoring setup',
          'Post-launch support and monitoring',
          'Documentation and handover'
        ]
      }
    ],
    risks: [
      'Scope creep due to changing requirements - Mitigation: Clear change management process',
      'Integration complexity with existing systems - Mitigation: Early integration testing',
      'Performance issues with scale - Mitigation: Load testing and optimization',
      'Security vulnerabilities - Mitigation: Regular security audits and best practices',
      'User adoption challenges - Mitigation: User training and change management',
      'Timeline delays due to technical challenges - Mitigation: Buffer time and agile approach'
    ]
  };
  
  return plan;
}