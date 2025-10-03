import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "API Documentation - Horizon",
  description: "API documentation for Horizon deployment management",
};

export default function APIDocsPage() {
  return (
    <PageLayout title="API Documentation">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">API Coming Soon</h3>
                <p className="text-yellow-800 mb-0">
                  We're currently working on a public API for Horizon. This will allow you to integrate 
                  Horizon with your existing tools and workflows. Stay tuned for updates!
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Planned API Endpoints</h2>
          <p className="text-gray-600 mb-6">
            Here's a preview of what will be available when the API launches:
          </p>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">GET</span>
                <code className="text-sm font-mono text-gray-900">/api/v1/projects</code>
              </div>
              <p className="text-gray-600 text-sm">
                Retrieve all projects for the authenticated user
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">POST</span>
                <code className="text-sm font-mono text-gray-900">/api/v1/projects</code>
              </div>
              <p className="text-gray-600 text-sm">
                Create a new project with custom tasks
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">GET</span>
                <code className="text-sm font-mono text-gray-900">/api/v1/projects/:id</code>
              </div>
              <p className="text-gray-600 text-sm">
                Get details for a specific project including all tasks
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">PATCH</span>
                <code className="text-sm font-mono text-gray-900">/api/v1/projects/:id</code>
              </div>
              <p className="text-gray-600 text-sm">
                Update project details or task statuses
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">DELETE</span>
                <code className="text-sm font-mono text-gray-900">/api/v1/projects/:id</code>
              </div>
              <p className="text-gray-600 text-sm">
                Delete a project and all associated tasks
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">GET</span>
                <code className="text-sm font-mono text-gray-900">/api/v1/tasks</code>
              </div>
              <p className="text-gray-600 text-sm">
                Get all tasks across all projects
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Authentication</h2>
          <p className="text-gray-600 mb-4">
            The API will use API key authentication. You'll be able to generate API keys from your account settings.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
            <span className="text-gray-500">Authorization:</span> <span className="text-gray-900">Bearer YOUR_API_KEY</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Rate Limits</h2>
          <p className="text-gray-600 mb-4">
            To ensure fair usage, the API will have the following rate limits:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Free tier:</strong> 1,000 requests per hour</li>
            <li><strong>Pro tier:</strong> 10,000 requests per hour</li>
            <li><strong>Enterprise:</strong> Custom limits available</li>
          </ul>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Updated</h3>
            <p className="text-gray-700 mb-4">
              Want to be notified when the API launches?
            </p>
            <a 
              href="mailto:api@horizon-app.com?subject=API%20Early%20Access" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Request Early Access
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
