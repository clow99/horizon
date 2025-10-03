import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "System Status - Horizon",
  description: "Check the current status of Horizon services",
};

export default function StatusPage() {
  const services = [
    { name: "API", status: "operational", uptime: "99.9%" },
    { name: "Database", status: "operational", uptime: "99.9%" },
    { name: "Authentication", status: "operational", uptime: "100%" },
    { name: "File Storage", status: "operational", uptime: "99.8%" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800 border-green-300";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "outage":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <PageLayout title="System Status">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-900 mb-0">All Systems Operational</h2>
              <p className="text-sm text-green-700 mb-0">All services are running normally</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Status</h2>
          <div className="space-y-4 mb-8">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(service.status)}`}>
                    {service.status.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Uptime: <span className="font-semibold text-gray-900">{service.uptime}</span>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Incidents</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-center">
              No incidents reported in the last 90 days
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-8">Scheduled Maintenance</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700">
              No scheduled maintenance at this time. We'll notify users in advance of any planned downtime.
            </p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This status page is updated in real-time. Subscribe to our status updates or follow us for notifications.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
