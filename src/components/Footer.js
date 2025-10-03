export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* Brand Section */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
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
              <span className="font-bold text-gray-900 text-lg">Horizon</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Professional deployment management for modern development teams.
            </p>
          </div>

          {/* Features Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Dashboard View</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Table View</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Drag & Drop</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Team Tracking</li>
            </ul>
          </div>

          {/* Categories Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Categories</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Infrastructure</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Security</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Monitoring</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">DevOps</li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Documentation</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Support</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {currentYear} Horizon. Built with Next.js, MySQL & ❤️
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              Status
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              API
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
              Changelog
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
