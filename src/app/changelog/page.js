import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Changelog - Horizon",
  description: "Latest updates and improvements to Horizon",
};

export default function ChangelogPage() {
  const releases = [
    {
      version: "1.2.0",
      date: "2025-01-15",
      type: "feature",
      changes: [
        "Added project type templates for common deployment scenarios",
        "New drag-and-drop project reordering in dashboard",
        "Enhanced table view with better filtering options",
        "Team member tracking - see who updated each task",
      ],
    },
    {
      version: "1.1.0",
      date: "2025-01-01",
      type: "feature",
      changes: [
        "Introduced table view for task-centric management",
        "Added project archiving functionality",
        "Improved mobile responsiveness",
        "Performance optimizations for large project lists",
      ],
    },
    {
      version: "1.0.5",
      date: "2024-12-15",
      type: "fix",
      changes: [
        "Fixed issue with task status not syncing properly",
        "Resolved UI glitches in project cards",
        "Improved error handling for network issues",
      ],
    },
    {
      version: "1.0.0",
      date: "2024-12-01",
      type: "feature",
      changes: [
        "Initial release of Horizon",
        "Dashboard view with project cards",
        "Pre-configured deployment checklist with 18 tasks",
        "Custom task creation and editing",
        "Google OAuth authentication",
        "MySQL database integration",
      ],
    },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "feature":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "fix":
        return "bg-green-100 text-green-800 border-green-300";
      case "breaking":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <PageLayout title="Changelog">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-lg text-gray-600 mb-8">
            Track all updates, new features, and improvements to Horizon.
          </p>

          <div className="space-y-8">
            {releases.map((release) => (
              <div key={release.version} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-0">v{release.version}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(release.type)}`}>
                    {release.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {new Date(release.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {release.changes.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-700 mb-4">
              Here's what we're working on for future releases:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Team collaboration features</li>
              <li>Email notifications for task updates</li>
              <li>API access for integrations</li>
              <li>Custom deployment workflows</li>
              <li>Advanced reporting and analytics</li>
            </ul>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Want to suggest a feature?</strong> We'd love to hear from you! 
              Contact us at <span className="text-blue-600">feedback@horizon-app.com</span>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
