import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Support - Horizon",
  description: "Get help with Horizon deployment management",
};

export default function SupportPage() {
  return (
    <PageLayout title="Support">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-lg text-gray-600 mb-8">
            We're here to help! Get support for Horizon deployment management.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-6 mb-8">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get started?</h3>
              <p className="text-gray-600">
                Simply sign in with your Google account and you'll be taken to your dashboard. From there, 
                click "Create Project" to set up your first deployment checklist.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I customize the checklist?</h3>
              <p className="text-gray-600">
                Absolutely! You can add, edit, or remove tasks for each project. You can also choose to start 
                with our pre-configured checklist or create your own from scratch.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600">
                Yes! We use Google OAuth for authentication, and your data is stored securely in our MySQL database. 
                Your projects are completely isolated and private to your account.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can multiple team members collaborate?</h3>
              <p className="text-gray-600">
                Currently, each account has its own private workspace. We're working on team collaboration features 
                for future releases.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's the difference between Dashboard and Table view?</h3>
              <p className="text-gray-600">
                Dashboard view shows a project-by-project overview, great for seeing the big picture. Table view 
                shows a task-centric perspective, perfect for completing the same task across multiple projects.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Can't find what you're looking for? We're here to help!
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href="mailto:support@horizon-app.com" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email us at support@horizon-app.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
