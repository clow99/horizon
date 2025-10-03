import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Privacy Policy - Horizon",
  description: "Privacy policy for Horizon deployment management",
};

export default function PrivacyPage() {
  return (
    <PageLayout title="Privacy Policy">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p className="text-gray-600 mb-6">
            At Horizon, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            When you use Horizon, we collect the following information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li><strong>Account Information:</strong> When you sign in with Google, we collect your name, email address, and profile picture.</li>
            <li><strong>Project Data:</strong> Information about your projects, tasks, completion status, and notes you create.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the application, including pages visited and features used.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use your information to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Provide and maintain the Horizon service</li>
            <li>Authenticate your account and ensure security</li>
            <li>Store and sync your project data</li>
            <li>Improve our service and develop new features</li>
            <li>Communicate with you about updates and support</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
          <p className="text-gray-600 mb-6">
            We implement appropriate security measures to protect your data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>All data is transmitted over encrypted HTTPS connections</li>
            <li>We use Google OAuth for secure authentication</li>
            <li>Your project data is stored in a secure MySQL database</li>
            <li>Access to your data is restricted to authorized personnel only</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Sharing</h2>
          <p className="text-gray-600 mb-6">
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights, privacy, safety, or property</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Your Rights</h2>
          <p className="text-gray-600 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your project data</li>
            <li>Opt-out of non-essential communications</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Cookies and Tracking</h2>
          <p className="text-gray-600 mb-6">
            We use essential cookies to maintain your session and provide the service. We do not use third-party tracking or advertising cookies.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to This Policy</h2>
          <p className="text-gray-600 mb-6">
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated date.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-blue-600 font-medium">privacy@horizon-app.com</p>
        </div>
      </div>
    </PageLayout>
  );
}
