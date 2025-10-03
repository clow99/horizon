"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function PageLayout({ children, title }) {
  const { data: session } = useSession();

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-3">
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
                  <h1 className="text-xl font-bold text-gray-900">Horizon</h1>
                  <p className="text-xs text-gray-600">Deployment Management</p>
                </div>
              </Link>

              {session && (
                <div className="flex items-center gap-4">
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
                      Table
                    </Link>
                  </nav>

                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    {session.user?.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {title && (
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{title}</h1>
          )}
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}
