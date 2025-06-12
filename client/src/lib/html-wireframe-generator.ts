export interface DetailedPageContent {
  pageName: string;
  pageType: string;
  purpose: string;
  stakeholders: string[];
  htmlContent: string;
  cssStyles: string;
  contentDetails: {
    headers: string[];
    texts: string[];
    buttons: { label: string; action: string }[];
    forms: { label: string; fields: string[] }[];
    lists: { title: string; items: string[] }[];
    images: { alt: string; placeholder: string }[];
  };
}

export class HTMLWireframeGenerator {
  
  async generateDetailedWireframes(stakeholderData: any, flowTypes: any, projectDescription: string): Promise<DetailedPageContent[]> {
    const wireframes: DetailedPageContent[] = [];
    
    // Extract stakeholders and their flows
    const stakeholders = Object.keys(flowTypes);
    
    // Generate comprehensive pages based on stakeholder roles and flows
    for (const stakeholder of stakeholders) {
      const flows = flowTypes[stakeholder] || [];
      
      // Generate dashboard for each stakeholder
      wireframes.push(this.generateStakeholderDashboard(stakeholder, flows, projectDescription));
      
      // Generate specific flow pages
      for (const flow of flows) {
        wireframes.push(this.generateFlowPage(stakeholder, flow, projectDescription));
      }
    }
    
    // Add common pages
    wireframes.push(this.generateLoginPage(stakeholders));
    wireframes.push(this.generateProfilePage());
    wireframes.push(this.generateSettingsPage());
    
    return wireframes;
  }
  
  private generateStakeholderDashboard(stakeholder: string, flows: string[], projectDescription: string): DetailedPageContent {
    const contentDetails = {
      headers: [`${stakeholder} Dashboard`, 'Overview', 'Recent Activities'],
      texts: [
        `Welcome back, ${stakeholder}`,
        `Manage your ${flows.join(', ').toLowerCase()} activities`,
        projectDescription.substring(0, 100) + '...'
      ],
      buttons: [
        { label: 'New Task', action: 'create_task' },
        { label: 'View Reports', action: 'view_reports' },
        { label: 'Settings', action: 'open_settings' }
      ],
      forms: [],
      lists: [
        {
          title: 'Active Tasks',
          items: flows.map(flow => `${flow} - In Progress`)
        },
        {
          title: 'Recent Updates',
          items: [
            'Project milestone completed',
            'New team member added',
            'System update available'
          ]
        }
      ],
      images: [
        { alt: `${stakeholder} Avatar`, placeholder: 'profile-image' },
        { alt: 'Dashboard Chart', placeholder: 'analytics-chart' }
      ]
    };
    
    const htmlContent = this.generateDashboardHTML(stakeholder, contentDetails);
    const cssStyles = this.generateModernCSS();
    
    return {
      pageName: `${stakeholder} Dashboard`,
      pageType: 'dashboard',
      purpose: `Main interface for ${stakeholder} to manage tasks and view key metrics`,
      stakeholders: [stakeholder],
      htmlContent,
      cssStyles,
      contentDetails
    };
  }
  
  private generateFlowPage(stakeholder: string, flow: string, projectDescription: string): DetailedPageContent {
    const contentDetails = {
      headers: [`${flow} Management`, `${stakeholder} Workflow`],
      texts: [
        `Manage ${flow.toLowerCase()} processes`,
        `Complete your ${flow.toLowerCase()} tasks efficiently`
      ],
      buttons: [
        { label: `Start ${flow}`, action: `start_${flow.toLowerCase().replace(' ', '_')}` },
        { label: 'Save Progress', action: 'save_progress' },
        { label: 'Submit', action: 'submit_form' }
      ],
      forms: [
        {
          label: `${flow} Details`,
          fields: ['Title', 'Description', 'Priority', 'Deadline', 'Assigned To']
        }
      ],
      lists: [
        {
          title: `${flow} Steps`,
          items: [
            'Initialize process',
            'Review requirements',
            'Execute workflow',
            'Validate results',
            'Complete and report'
          ]
        }
      ],
      images: [
        { alt: `${flow} Process Diagram`, placeholder: 'process-diagram' }
      ]
    };
    
    const htmlContent = this.generateWorkflowHTML(flow, stakeholder, contentDetails);
    const cssStyles = this.generateModernCSS();
    
    return {
      pageName: `${flow} Page`,
      pageType: 'workflow',
      purpose: `Handle ${flow.toLowerCase()} process for ${stakeholder}`,
      stakeholders: [stakeholder],
      htmlContent,
      cssStyles,
      contentDetails
    };
  }
  
  private generateLoginPage(stakeholders: string[]): DetailedPageContent {
    const contentDetails = {
      headers: ['Welcome Back', 'Sign In to Continue'],
      texts: [
        'Access your account to manage your tasks',
        'Secure login for all stakeholders'
      ],
      buttons: [
        { label: 'Sign In', action: 'submit_login' },
        { label: 'Forgot Password?', action: 'reset_password' },
        { label: 'Sign Up', action: 'create_account' }
      ],
      forms: [
        {
          label: 'Login Form',
          fields: ['Email', 'Password']
        }
      ],
      lists: [],
      images: [
        { alt: 'Company Logo', placeholder: 'company-logo' },
        { alt: 'Login Illustration', placeholder: 'login-graphic' }
      ]
    };
    
    const htmlContent = this.generateLoginHTML(contentDetails);
    const cssStyles = this.generateModernCSS();
    
    return {
      pageName: 'Login Page',
      pageType: 'authentication',
      purpose: 'User authentication and system access',
      stakeholders,
      htmlContent,
      cssStyles,
      contentDetails
    };
  }
  
  private generateProfilePage(): DetailedPageContent {
    const contentDetails = {
      headers: ['Profile Settings', 'Personal Information'],
      texts: [
        'Manage your account information',
        'Update your preferences and settings'
      ],
      buttons: [
        { label: 'Save Changes', action: 'save_profile' },
        { label: 'Change Password', action: 'change_password' },
        { label: 'Upload Photo', action: 'upload_avatar' }
      ],
      forms: [
        {
          label: 'Profile Information',
          fields: ['Full Name', 'Email', 'Phone', 'Department', 'Role']
        }
      ],
      lists: [
        {
          title: 'Recent Activities',
          items: [
            'Profile updated',
            'Password changed',
            'Settings modified'
          ]
        }
      ],
      images: [
        { alt: 'Profile Avatar', placeholder: 'user-avatar' }
      ]
    };
    
    const htmlContent = this.generateProfileHTML(contentDetails);
    const cssStyles = this.generateModernCSS();
    
    return {
      pageName: 'Profile Page',
      pageType: 'profile',
      purpose: 'User profile management and settings',
      stakeholders: [],
      htmlContent,
      cssStyles,
      contentDetails
    };
  }
  
  private generateSettingsPage(): DetailedPageContent {
    const contentDetails = {
      headers: ['System Settings', 'Preferences'],
      texts: [
        'Configure your application preferences',
        'Manage notifications and display options'
      ],
      buttons: [
        { label: 'Save Settings', action: 'save_settings' },
        { label: 'Reset to Default', action: 'reset_settings' },
        { label: 'Export Data', action: 'export_data' }
      ],
      forms: [
        {
          label: 'Notification Settings',
          fields: ['Email Notifications', 'Push Notifications', 'SMS Alerts']
        },
        {
          label: 'Display Preferences',
          fields: ['Theme', 'Language', 'Timezone', 'Date Format']
        }
      ],
      lists: [
        {
          title: 'Privacy Options',
          items: [
            'Profile visibility',
            'Data sharing preferences',
            'Activity tracking'
          ]
        }
      ],
      images: []
    };
    
    const htmlContent = this.generateSettingsHTML(contentDetails);
    const cssStyles = this.generateModernCSS();
    
    return {
      pageName: 'Settings Page',
      pageType: 'settings',
      purpose: 'Application configuration and user preferences',
      stakeholders: [],
      htmlContent,
      cssStyles,
      contentDetails
    };
  }
  
  private generateDashboardHTML(stakeholder: string, content: any): string {
    return `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="user-info">
            <img src="/api/placeholder/40/40" alt="${content.images[0]?.alt}" class="avatar">
            <div>
              <h1>${content.headers[0]}</h1>
              <span class="user-role">${stakeholder}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-icon" data-action="notifications">
              <span class="notification-badge">3</span>
              🔔
            </button>
            <button class="btn-icon" data-action="settings">⚙️</button>
          </div>
        </div>
      </header>

      <main class="dashboard-main">
        <section class="stats-grid">
          <div class="stat-card">
            <h3>Active Tasks</h3>
            <span class="stat-number">12</span>
          </div>
          <div class="stat-card">
            <h3>Completed</h3>
            <span class="stat-number">84</span>
          </div>
          <div class="stat-card">
            <h3>Pending</h3>
            <span class="stat-number">7</span>
          </div>
        </section>

        <section class="content-grid">
          <div class="card">
            <h3>${content.lists[0]?.title}</h3>
            <ul class="task-list">
              ${content.lists[0]?.items.map((item: string) => `<li class="task-item">${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="card">
            <h3>Quick Actions</h3>
            <div class="action-buttons">
              ${content.buttons.map((btn: any) => `<button class="btn-primary" data-action="${btn.action}">${btn.label}</button>`).join('')}
            </div>
          </div>
        </section>
      </main>
    </div>`;
  }
  
  private generateWorkflowHTML(flow: string, stakeholder: string, content: any): string {
    return `
    <div class="workflow-container">
      <header class="page-header">
        <button class="btn-back">← Back</button>
        <h1>${content.headers[0]}</h1>
        <button class="btn-help">?</button>
      </header>

      <main class="workflow-main">
        <div class="workflow-form">
          <form class="form-card">
            <h2>${content.forms[0]?.label}</h2>
            ${content.forms[0]?.fields.map((field: string) => `
              <div class="form-group">
                <label for="${field.toLowerCase().replace(' ', '_')}">${field}</label>
                <input type="text" id="${field.toLowerCase().replace(' ', '_')}" name="${field.toLowerCase().replace(' ', '_')}" placeholder="Enter ${field.toLowerCase()}">
              </div>
            `).join('')}
            
            <div class="form-actions">
              ${content.buttons.map((btn: any) => `<button type="button" class="btn-${btn.action.includes('submit') ? 'primary' : 'secondary'}" data-action="${btn.action}">${btn.label}</button>`).join('')}
            </div>
          </form>
        </div>

        <div class="workflow-steps">
          <h3>${content.lists[0]?.title}</h3>
          <ol class="steps-list">
            ${content.lists[0]?.items.map((step: string, index: number) => `
              <li class="step-item ${index === 0 ? 'active' : ''}">${step}</li>
            `).join('')}
          </ol>
        </div>
      </main>
    </div>`;
  }
  
  private generateLoginHTML(content: any): string {
    return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img src="/api/placeholder/80/80" alt="${content.images[0]?.alt}" class="login-logo">
          <h1>${content.headers[0]}</h1>
          <p>${content.texts[0]}</p>
        </div>
        
        <form class="login-form">
          ${content.forms[0]?.fields.map((field: string) => `
            <div class="form-group">
              <label for="${field.toLowerCase()}">${field}</label>
              <input type="${field.toLowerCase() === 'password' ? 'password' : 'email'}" id="${field.toLowerCase()}" name="${field.toLowerCase()}" placeholder="Enter your ${field.toLowerCase()}">
            </div>
          `).join('')}
          
          <button type="submit" class="btn-login">${content.buttons[0]?.label}</button>
        </form>
        
        <div class="login-footer">
          ${content.buttons.slice(1).map((btn: any) => `<a href="#" class="link" data-action="${btn.action}">${btn.label}</a>`).join(' | ')}
        </div>
      </div>
    </div>`;
  }
  
  private generateProfileHTML(content: any): string {
    return `
    <div class="profile-container">
      <header class="profile-header">
        <div class="profile-avatar">
          <img src="/api/placeholder/120/120" alt="${content.images[0]?.alt}" class="avatar-large">
          <button class="btn-upload" data-action="${content.buttons[2]?.action}">${content.buttons[2]?.label}</button>
        </div>
        <div class="profile-info">
          <h1>John Doe</h1>
          <p>Senior Project Manager</p>
          <span class="status online">Online</span>
        </div>
      </header>
      
      <main class="profile-main">
        <div class="profile-form">
          <h2>${content.forms[0]?.label}</h2>
          <form class="form-grid">
            ${content.forms[0]?.fields.map((field: string) => `
              <div class="form-group">
                <label for="${field.toLowerCase().replace(' ', '_')}">${field}</label>
                <input type="text" id="${field.toLowerCase().replace(' ', '_')}" name="${field.toLowerCase().replace(' ', '_')}" value="Sample ${field}">
              </div>
            `).join('')}
          </form>
          
          <div class="form-actions">
            ${content.buttons.slice(0, 2).map((btn: any) => `<button class="btn-${btn.action.includes('save') ? 'primary' : 'secondary'}" data-action="${btn.action}">${btn.label}</button>`).join('')}
          </div>
        </div>
        
        <aside class="profile-sidebar">
          <h3>${content.lists[0]?.title}</h3>
          <ul class="activity-list">
            ${content.lists[0]?.items.map((item: string) => `<li class="activity-item">${item}</li>`).join('')}
          </ul>
        </aside>
      </main>
    </div>`;
  }
  
  private generateSettingsHTML(content: any): string {
    return `
    <div class="settings-container">
      <header class="settings-header">
        <h1>${content.headers[0]}</h1>
        <p>${content.texts[0]}</p>
      </header>
      
      <main class="settings-main">
        <div class="settings-tabs">
          <button class="tab-button active" data-tab="notifications">Notifications</button>
          <button class="tab-button" data-tab="display">Display</button>
          <button class="tab-button" data-tab="privacy">Privacy</button>
        </div>
        
        <div class="settings-content">
          <div class="settings-section" data-section="notifications">
            <h2>${content.forms[0]?.label}</h2>
            ${content.forms[0]?.fields.map((field: string) => `
              <div class="setting-item">
                <label class="setting-label">${field}</label>
                <input type="checkbox" class="toggle" checked>
              </div>
            `).join('')}
          </div>
          
          <div class="settings-section" data-section="display">
            <h2>${content.forms[1]?.label}</h2>
            ${content.forms[1]?.fields.map((field: string) => `
              <div class="setting-item">
                <label class="setting-label">${field}</label>
                <select class="setting-select">
                  <option>Default</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="settings-actions">
          ${content.buttons.map(btn => `<button class="btn-${btn.action.includes('save') ? 'primary' : 'secondary'}" data-action="${btn.action}">${btn.label}</button>`).join('')}
        </div>
      </main>
    </div>`;
  }
  
  private generateModernCSS(): string {
    return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8fafc;
    }
    
    .dashboard-container, .workflow-container, .login-container, .profile-container, .settings-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .dashboard-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      color: white;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
    }
    
    .avatar-large {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid #e2e8f0;
    }
    
    .user-role {
      opacity: 0.8;
      font-size: 14px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      display: block;
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    
    .card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #374151;
    }
    
    .form-group input, .form-group select {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .task-list, .activity-list, .steps-list {
      list-style: none;
    }
    
    .task-item, .activity-item {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .step-item {
      padding: 12px;
      border-left: 3px solid #e2e8f0;
      margin-bottom: 8px;
      padding-left: 16px;
    }
    
    .step-item.active {
      border-left-color: #667eea;
      background: #f0f4ff;
    }
    
    .login-card {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .login-logo {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
    }
    
    .btn-login {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      margin-bottom: 16px;
    }
    
    .settings-tabs {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }
    
    .tab-button {
      padding: 12px 24px;
      border: none;
      background: none;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
    }
    
    .tab-button.active {
      color: #667eea;
      border-bottom: 2px solid #667eea;
    }
    
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .toggle {
      width: 44px;
      height: 24px;
      background: #e2e8f0;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      position: relative;
    }
    
    .toggle:checked {
      background: #667eea;
    }
    
    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .dashboard-container, .workflow-container, .profile-container, .settings-container {
        padding: 12px;
      }
    }`;
  }
}

export function createHTMLWireframeGenerator(): HTMLWireframeGenerator {
  return new HTMLWireframeGenerator();
}