// Global task templates for all projects
// Edit this file to customize the default checklist for new projects

export const DEPLOYMENT_CHECKLIST = [
  { 
    id: 'env-setup', 
    name: 'Environment Setup', 
    description: 'Configure production environment variables and secrets',
    category: 'Infrastructure',
    required: true
  },
  { 
    id: 'domain-dns', 
    name: 'Domain & DNS Configuration', 
    description: 'Setup custom domain and configure DNS records',
    category: 'Infrastructure',
    required: true
  },
  { 
    id: 'ssl-cert', 
    name: 'SSL Certificate', 
    description: 'Install and configure SSL/TLS certificate',
    category: 'Security',
    required: true
  },
  { 
    id: 'analytics', 
    name: 'Analytics Integration', 
    description: 'Connect Google Analytics, Mixpanel, or similar',
    category: 'Monitoring',
    required: true
  },
  { 
    id: 'error-tracking', 
    name: 'Error Tracking', 
    description: 'Setup Sentry, Rollbar, or similar error monitoring',
    category: 'Monitoring',
    required: true
  },
  { 
    id: 'performance', 
    name: 'Performance Monitoring', 
    description: 'Configure performance monitoring and alerts',
    category: 'Monitoring',
    required: false
  },
  { 
    id: 'db-backup', 
    name: 'Database Backup', 
    description: 'Setup automated database backups',
    category: 'Infrastructure',
    required: true
  },
  { 
    id: 'ci-cd', 
    name: 'CI/CD Pipeline', 
    description: 'Configure automated deployment pipeline',
    category: 'DevOps',
    required: true
  },
  { 
    id: 'security-audit', 
    name: 'Security Audit', 
    description: 'Run security scan and fix vulnerabilities',
    category: 'Security',
    required: true
  },
  { 
    id: 'load-testing', 
    name: 'Load Testing', 
    description: 'Perform load testing and optimize',
    category: 'Testing',
    required: false
  },
  { 
    id: 'seo-meta', 
    name: 'SEO & Meta Tags', 
    description: 'Configure SEO metadata, OpenGraph, Twitter cards',
    category: 'Marketing',
    required: true
  },
  { 
    id: 'legal-docs', 
    name: 'Legal Documents', 
    description: 'Privacy Policy, Terms of Service, Cookie Policy',
    category: 'Legal',
    required: true
  },
  { 
    id: 'cdn-setup', 
    name: 'CDN Configuration', 
    description: 'Setup CDN for static assets',
    category: 'Infrastructure',
    required: false
  },
  { 
    id: 'email-service', 
    name: 'Email Service', 
    description: 'Configure transactional email service (SendGrid, etc)',
    category: 'Infrastructure',
    required: false
  },
  { 
    id: 'staging-test', 
    name: 'Staging Environment Test', 
    description: 'Full testing on staging environment',
    category: 'Testing',
    required: true
  },
  { 
    id: 'prod-deploy', 
    name: 'Production Deployment', 
    description: 'Deploy application to production',
    category: 'Deployment',
    required: true
  },
  { 
    id: 'smoke-test', 
    name: 'Post-Deploy Smoke Test', 
    description: 'Verify critical functionality after deployment',
    category: 'Testing',
    required: true
  },
  { 
    id: 'monitoring-alerts', 
    name: 'Monitoring & Alerts', 
    description: 'Setup uptime monitoring and alert notifications',
    category: 'Monitoring',
    required: true
  }
];

// Helper function to create tasks from the checklist
export const createProjectTasks = () => {
  return DEPLOYMENT_CHECKLIST.map(task => ({
    id: task.id,
    name: task.name,
    category: task.category,
    status: 'Not Started',
    required: task.required,
    notes: ''
  }));
};
