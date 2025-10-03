"use client";
import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/Toast";

export default function ProfileClient({ user }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
  });
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      showToast("Profile updated successfully!", "success");
      setIsEditing(false);
      
      // Refresh the page to get updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast("Failed to update profile. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Horizon
                  </h1>
                  <p className="text-xs text-gray-600">Deployment Management</p>
                </div>
              </div>
              <nav className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/table"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Table View
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-16">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name || "User avatar"}
                  width={128}
                  height={128}
                  unoptimized
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
              )}
              <div className="flex-1 mt-16">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600 mt-1">{user.email}</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          </div>

          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {user.name || 'Not set'}
                </div>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600 flex items-center justify-between">
                <span>{user.email}</span>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  Cannot be changed
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your email is linked to your Google account and cannot be modified here.
              </p>
            </div>

            {/* Account Information */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono">
                    {user.id}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 mt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h3>
              <p className="text-gray-600 mb-4">
                Sign out of your account. You'll need to sign in again to access your projects.
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </main>
  );
}
