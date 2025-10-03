import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Terms of Service - Horizon",
  description: "Terms of service for Horizon deployment management",
};

export default function TermsPage() {
  return (
    <PageLayout title="Terms of Service">
      <div className="prose prose-blue max-w-none">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p className="text-gray-600 mb-6">
            Welcome to Horizon. By using our service, you agree to these Terms of Service. Please read them carefully.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Acceptance of Terms</h2>
          <p className="text-gray-600 mb-6">
            By accessing or using Horizon, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
            If you do not agree with any part of these terms, you may not use our service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Description of Service</h2>
          <p className="text-gray-600 mb-6">
            Horizon is a production deployment management tool that helps development teams track and manage deployment checklists. 
            We provide the platform for you to create, manage, and track your deployment projects and tasks.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">User Accounts</h2>
          <p className="text-gray-600 mb-4">
            To use Horizon, you must:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Sign in using a valid Google account</li>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Be responsible for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Acceptable Use</h2>
          <p className="text-gray-600 mb-4">
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Interfere with or disrupt the service or servers</li>
            <li>Upload malicious code or harmful content</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Impersonate any person or entity</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">User Content</h2>
          <p className="text-gray-600 mb-6">
            You retain all rights to the content you create in Horizon (projects, tasks, notes, etc.). By using our service, 
            you grant us a license to store, process, and display your content solely for the purpose of providing the service to you.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Service Availability</h2>
          <p className="text-gray-600 mb-6">
            We strive to provide a reliable service, but we do not guarantee that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>The service will be available at all times</li>
            <li>The service will be error-free or uninterrupted</li>
            <li>Defects will be corrected immediately</li>
            <li>The service will meet your specific requirements</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Intellectual Property</h2>
          <p className="text-gray-600 mb-6">
            The Horizon service, including its design, features, and functionality, is owned by us and protected by copyright, 
            trademark, and other intellectual property laws. You may not copy, modify, or reverse engineer any part of our service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Limitation of Liability</h2>
          <p className="text-gray-600 mb-6">
            To the maximum extent permitted by law, Horizon and its affiliates shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Termination</h2>
          <p className="text-gray-600 mb-6">
            We reserve the right to suspend or terminate your access to Horizon at any time, with or without notice, for any reason, 
            including violation of these Terms of Service. You may also terminate your account at any time by contacting us.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to Terms</h2>
          <p className="text-gray-600 mb-6">
            We may modify these Terms of Service at any time. We will notify you of any material changes by posting the new terms 
            on this page with an updated date. Your continued use of the service after such changes constitutes acceptance of the new terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Governing Law</h2>
          <p className="text-gray-600 mb-6">
            These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have questions about these Terms of Service, please contact us at:
          </p>
          <p className="text-blue-600 font-medium">legal@horizon-app.com</p>
        </div>
      </div>
    </PageLayout>
  );
}
