// Global task templates for all projects
// Edit this file to customize the default checklist for new projects

export const DEPLOYMENT_CHECKLIST = [
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
    id: 'performance', 
    name: 'Performance Monitoring', 
    description: 'Configure performance monitoring and alerts',
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
    id: 'load-testing', 
    name: 'Load Testing', 
    description: 'Perform load testing and optimize',
    category: 'Testing',
  },
  { 
    id: 'seo-meta', 
    name: 'SEO & Meta Tags', 
    description: 'Configure SEO metadata, OpenGraph, Twitter cards',
    category: 'Marketing',
  },
  { 
    id: 'legal-docs', 
    name: 'Legal Documents', 
    description: 'Privacy Policy, Terms of Service, Cookie Policy',
    category: 'Legal',
  },
  { 
    id: 'cdn-setup', 
    name: 'CDN Configuration', 
    description: 'Setup CDN for static assets',
    category: 'Infrastructure',
  },
  { 
    id: 'email-service', 
    name: 'Email Service', 
    description: 'Configure transactional email service (SendGrid, etc)',
    category: 'Infrastructure',
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
];

// Helper function to create tasks from the checklist
export const createProjectTasks = () => {
  return DEPLOYMENT_CHECKLIST.map(task => ({
    id: task.id,
    name: task.name,
    category: task.category,
    status: 'Not Started',
    
    notes: ''
  }));
};
