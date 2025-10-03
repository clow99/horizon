// Project Type Templates with different preset tasks for different types of projects
// Edit this file to customize project types and their default checklists

export const PROJECT_TYPES = {
  deployment: {
    id: 'deployment',
    name: 'Production Deployment',
    description: 'Deploy application to production environment',
    icon: '🚀',
    tasks: [
      { 
        id: 'env-setup', 
        name: 'Environment Setup', 
        description: 'Configure production environment variables and secrets',
        category: 'Infrastructure',
      },
      { 
        id: 'domain-dns', 
        name: 'Domain & DNS Configuration', 
        description: 'Setup custom domain and configure DNS records',
        category: 'Infrastructure',
      },
      { 
        id: 'ssl-cert', 
        name: 'SSL Certificate', 
        description: 'Install and configure SSL/TLS certificate',
        category: 'Security',
      },
      { 
        id: 'analytics', 
        name: 'Analytics Integration', 
        description: 'Connect Google Analytics, Mixpanel, or similar',
        category: 'Monitoring',
      },
      { 
        id: 'error-tracking', 
        name: 'Error Tracking', 
        description: 'Setup Sentry, Rollbar, or similar error monitoring',
        category: 'Monitoring',
      },
      { 
        id: 'db-backup', 
        name: 'Database Backup', 
        description: 'Setup automated database backups',
        category: 'Infrastructure',
      },
      { 
        id: 'ci-cd', 
        name: 'CI/CD Pipeline', 
        description: 'Configure automated deployment pipeline',
        category: 'DevOps',
      },
      { 
        id: 'security-audit', 
        name: 'Security Audit', 
        description: 'Run security scan and fix vulnerabilities',
        category: 'Security',
      },
      { 
        id: 'staging-test', 
        name: 'Staging Environment Test', 
        description: 'Full testing on staging environment',
        category: 'Testing',
      },
      { 
        id: 'prod-deploy', 
        name: 'Production Deployment', 
        description: 'Deploy application to production',
        category: 'Deployment',
      },
      { 
        id: 'smoke-test', 
        name: 'Post-Deploy Smoke Test', 
        description: 'Verify critical functionality after deployment',
        category: 'Testing',
      },
      { 
        id: 'monitoring-alerts', 
        name: 'Monitoring & Alerts', 
        description: 'Setup uptime monitoring and alert notifications',
        category: 'Monitoring',
      }
    ]
  },

  website: {
    id: 'website',
    name: 'Website Launch',
    description: 'Launch a new marketing or company website',
    icon: '🌐',
    tasks: [
      {
        id: 'domain-purchase',
        name: 'Domain Purchase',
        description: 'Purchase and register domain name',
        category: 'Infrastructure',
      },
      {
        id: 'hosting-setup',
        name: 'Hosting Setup',
        description: 'Configure hosting environment (Vercel, Netlify, etc)',
        category: 'Infrastructure',
      },
      {
        id: 'ssl-setup',
        name: 'SSL Certificate',
        description: 'Enable HTTPS with SSL certificate',
        category: 'Security',
      },
      {
        id: 'seo-meta',
        name: 'SEO & Meta Tags',
        description: 'Configure SEO metadata, OpenGraph, Twitter cards',
        category: 'Marketing',
      },
      {
        id: 'analytics-setup',
        name: 'Analytics Setup',
        description: 'Setup Google Analytics or similar',
        category: 'Monitoring',
      },
      {
        id: 'contact-form',
        name: 'Contact Form',
        description: 'Setup and test contact form functionality',
        category: 'Features',
      },
      {
        id: 'legal-pages',
        name: 'Legal Pages',
        description: 'Create Privacy Policy, Terms of Service, Cookie Policy',
        category: 'Legal',
      },
      {
        id: 'performance-test',
        name: 'Performance Testing',
        description: 'Test page speed and optimize',
        category: 'Testing',
      },
      {
        id: 'browser-test',
        name: 'Cross-Browser Testing',
        description: 'Test on Chrome, Firefox, Safari, Edge',
        category: 'Testing',
      },
      {
        id: 'mobile-test',
        name: 'Mobile Responsiveness',
        description: 'Test on mobile devices and tablets',
        category: 'Testing',
      }
    ]
  },

  api: {
    id: 'api',
    name: 'API Service',
    description: 'Deploy REST or GraphQL API service',
    icon: '⚡',
    tasks: [
      {
        id: 'api-env-setup',
        name: 'Environment Configuration',
        description: 'Setup environment variables and secrets',
        category: 'Infrastructure',
      },
      {
        id: 'database-setup',
        name: 'Database Setup',
        description: 'Configure production database',
        category: 'Infrastructure',
      },
      {
        id: 'api-auth',
        name: 'Authentication & Authorization',
        description: 'Implement API authentication (JWT, OAuth, etc)',
        category: 'Security',
      },
      {
        id: 'rate-limiting',
        name: 'Rate Limiting',
        description: 'Implement API rate limiting',
        category: 'Security',
      },
      {
        id: 'api-docs',
        name: 'API Documentation',
        description: 'Generate API documentation (Swagger, etc)',
        category: 'Documentation',
      },
      {
        id: 'api-versioning',
        name: 'API Versioning',
        description: 'Implement API versioning strategy',
        category: 'DevOps',
      },
      {
        id: 'error-handling',
        name: 'Error Handling',
        description: 'Standardize error responses and logging',
        category: 'DevOps',
      },
      {
        id: 'api-monitoring',
        name: 'API Monitoring',
        description: 'Setup API performance and uptime monitoring',
        category: 'Monitoring',
      },
      {
        id: 'load-test',
        name: 'Load Testing',
        description: 'Perform load testing and capacity planning',
        category: 'Testing',
      },
      {
        id: 'api-backup',
        name: 'Backup Strategy',
        description: 'Implement database backup and recovery',
        category: 'Infrastructure',
      }
    ]
  },

  mobile: {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Launch iOS or Android mobile application',
    icon: '📱',
    tasks: [
      {
        id: 'app-store-account',
        name: 'App Store Account',
        description: 'Setup Apple Developer / Google Play Console account',
        category: 'Infrastructure',
      },
      {
        id: 'app-signing',
        name: 'App Signing',
        description: 'Configure app signing certificates',
        category: 'Security',
      },
      {
        id: 'push-notifications',
        name: 'Push Notifications',
        description: 'Setup push notification service',
        category: 'Features',
      },
      {
        id: 'crash-reporting',
        name: 'Crash Reporting',
        description: 'Integrate Firebase Crashlytics or similar',
        category: 'Monitoring',
      },
      {
        id: 'app-analytics',
        name: 'App Analytics',
        description: 'Setup app analytics tracking',
        category: 'Monitoring',
      },
      {
        id: 'device-testing',
        name: 'Device Testing',
        description: 'Test on multiple devices and OS versions',
        category: 'Testing',
      },
      {
        id: 'app-store-listing',
        name: 'App Store Listing',
        description: 'Create app store description, screenshots, keywords',
        category: 'Marketing',
      },
      {
        id: 'privacy-policy-mobile',
        name: 'Privacy Policy',
        description: 'Create mobile app privacy policy',
        category: 'Legal',
      },
      {
        id: 'beta-testing',
        name: 'Beta Testing',
        description: 'TestFlight / Internal Testing track',
        category: 'Testing',
      },
      {
        id: 'app-submission',
        name: 'App Store Submission',
        description: 'Submit app for review',
        category: 'Deployment',
      }
    ]
  },

  saas: {
    id: 'saas',
    name: 'SaaS Product',
    description: 'Launch a SaaS web application',
    icon: '💼',
    tasks: [
      {
        id: 'saas-infrastructure',
        name: 'Cloud Infrastructure',
        description: 'Setup scalable cloud infrastructure',
        category: 'Infrastructure',
      },
      {
        id: 'user-auth',
        name: 'User Authentication',
        description: 'Implement user registration and login',
        category: 'Security',
      },
      {
        id: 'payment-integration',
        name: 'Payment Integration',
        description: 'Integrate Stripe, PayPal, or similar',
        category: 'Features',
      },
      {
        id: 'subscription-management',
        name: 'Subscription Management',
        description: 'Implement subscription tiers and billing',
        category: 'Features',
      },
      {
        id: 'email-service',
        name: 'Email Service',
        description: 'Setup transactional emails (SendGrid, etc)',
        category: 'Infrastructure',
      },
      {
        id: 'onboarding-flow',
        name: 'User Onboarding',
        description: 'Create user onboarding flow',
        category: 'Features',
      },
      {
        id: 'saas-analytics',
        name: 'Product Analytics',
        description: 'Setup product usage analytics',
        category: 'Monitoring',
      },
      {
        id: 'customer-support',
        name: 'Customer Support',
        description: 'Setup help desk or chat support',
        category: 'Features',
      },
      {
        id: 'terms-saas',
        name: 'Terms of Service',
        description: 'Draft SaaS terms of service',
        category: 'Legal',
      },
      {
        id: 'gdpr-compliance',
        name: 'GDPR Compliance',
        description: 'Ensure GDPR/privacy compliance',
        category: 'Legal',
      },
      {
        id: 'backup-recovery',
        name: 'Backup & Recovery',
        description: 'Implement automated backups',
        category: 'Infrastructure',
      },
      {
        id: 'security-audit-saas',
        name: 'Security Audit',
        description: 'Conduct security penetration testing',
        category: 'Security',
      }
    ]
  },

  custom: {
    id: 'custom',
    name: 'Custom Project',
    description: 'Start with a blank slate',
    icon: '✨',
    tasks: []
  }
};

// Helper function to get all project types
export const getProjectTypes = () => {
  return Object.values(PROJECT_TYPES);
};

// Helper function to get a specific project type
export const getProjectType = (typeId) => {
  return PROJECT_TYPES[typeId] || PROJECT_TYPES.custom;
};

// Helper function to create tasks from a project type
export const createTasksFromProjectType = (typeId) => {
  const projectType = getProjectType(typeId);
  return projectType.tasks.map(task => ({
    id: task.id,
    name: task.name,
    description: task.description || '',
    category: task.category,
    status: 'Not Started',
    notes: ''
  }));
};
