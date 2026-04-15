import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, Mail, Trash2, LogOut } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left — breadcrumb / title can be injected here later */}
      <div />

      {/* Right — profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">RK</span>
          </div>
          <ChevronDown
            size={15}
            className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* Email */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Mail size={17} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">admin@perfios.com</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>

            {/* Application Management */}
            <button
              onClick={() => { setDropdownOpen(false); navigate('/application-management'); }}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Trash2 size={17} className="text-orange-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">Application Management</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => { setDropdownOpen(false); alert('Logout clicked (prototype)'); }}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-t border-gray-100 text-left"
            >
              <LogOut size={17} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
