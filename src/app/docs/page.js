import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Documentation - Horizon",
  description: "Learn how to use Horizon for production deployment management",
};

export default function DocsPage() {
  return (
    <PageLayout title="Documentation">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-6">
            Welcome to Horizon! This guide will help you get started with managing your production deployments.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Quick Start</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Sign in with your Google account</li>
            <li>Create your first project from the Dashboard</li>
            <li>Customize tasks or use our pre-configured deployment checklist</li>
            <li>Track your progress as you complete each task</li>
            <li>Deploy with confidence when all required tasks are complete</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Dashboard View</h3>
          <p className="text-gray-600 mb-4">
            The Dashboard provides a project-by-project view of your deployment checklists. Each project card shows:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Overall completion percentage</li>
            <li>Target deployment date</li>
            <li>Project status</li>
            <li>Individual task progress</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Table View</h3>
          <p className="text-gray-600 mb-4">
            The Table View offers a task-centric perspective, allowing you to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>See the same task across all projects</li>
            <li>Batch-complete tasks across multiple projects</li>
            <li>Filter tasks by category</li>
            <li>Search for specific tasks</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Task Categories</h3>
          <p className="text-gray-600 mb-4">
            Tasks are organized into eight categories:
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Infrastructure</h4>
              <p className="text-sm text-blue-700">Environment setup, DNS, domain configuration</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Security</h4>
              <p className="text-sm text-red-700">SSL certificates, security audits, authentication</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Monitoring</h4>
              <p className="text-sm text-purple-700">Analytics, error tracking, uptime monitoring</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-2">DevOps</h4>
              <p className="text-sm text-indigo-700">CI/CD pipelines, deployment automation</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Testing</h4>
              <p className="text-sm text-yellow-700">Load testing, smoke tests, staging validation</p>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h4 className="font-semibold text-pink-900 mb-2">Marketing</h4>
              <p className="text-sm text-pink-700">SEO optimization, meta tags, social sharing</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Legal</h4>
              <p className="text-sm text-orange-700">Terms of service, privacy policy, compliance</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Deployment</h4>
              <p className="text-sm text-green-700">Final checks, rollback plans, launch procedures</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Customization</h3>
          <p className="text-gray-600 mb-4">
            Every project is unique. You can:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Add custom tasks specific to your project</li>
            <li>Edit existing task descriptions</li>
            <li>Remove tasks that don't apply</li>
            <li>Reorder tasks by dragging and dropping</li>
            <li>Mark tasks as required or optional</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
