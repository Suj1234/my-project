import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Users, FolderTree, Settings, Lock, Database,
  FileCheck, Bell, Link2, FileType, FileText,
  BarChart3, Building, LayoutDashboard,
  ChevronDown, ChevronRight, Menu, X,
  Network, Globe,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NavChild {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  disabled?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  disabled?: boolean;
  children?: NavChild[];
}

interface SidebarSection {
  heading: string;
  items: NavSection[];
}

// ─── Nav Config ─────────────────────────────────────────────────────────────

const NAV_CONFIG: SidebarSection[] = [
  {
    heading: 'Navigation',
    items: [
      {
        id: 'manage-tenants',
        label: 'Manage Tenants',
        icon: <Users size={18} />,
        path: '/manage-tenants',
        disabled: true,
      },
      {
        id: 'manage-program',
        label: 'Manage Program',
        icon: <FolderTree size={18} />,
        path: '/manage-programs',
      },
      {
        id: 'manage-actions',
        label: 'Manage Actions',
        icon: <Settings size={18} />,
        children: [
          { id: 'canvas', label: 'Canvas', icon: <Network size={15} />, path: '/manage-actions/canvas' },
          { id: 'api-integrations', label: 'API Integrations', icon: <Globe size={15} />, path: '/manage-actions/api-integrations' },
        ],
      },
      {
        id: 'access-control',
        label: 'Access Control',
        icon: <Lock size={18} />,
        path: '/access-control',
        disabled: true,
      },
      {
        id: 'bre',
        label: 'BRE',
        icon: <Database size={18} />,
        path: '/bre',
        disabled: true,
      },
    ],
  },
  {
    heading: 'Master Management',
    items: [
      { id: 'required-documents', label: 'Required Document', icon: <FileCheck size={18} />, path: '/required-documents' },
      { id: 'field-management', label: 'Field Management', icon: <Database size={18} />, path: '/field-management' },
      { id: 'manage-notification', label: 'Manage Notification', icon: <Bell size={18} />, path: '/manage-notification', disabled: true },
      { id: 'connector', label: 'Connector', icon: <Link2 size={18} />, path: '/connector', disabled: true },
      { id: 'template', label: 'Template', icon: <FileType size={18} />, path: '/template', disabled: true },
      { id: 'platform-docs', label: 'Platform Documentation', icon: <FileText size={18} />, path: '/platform-documentation', disabled: true },
      { id: 'analytics', label: 'Analytics & Reporting', icon: <BarChart3 size={18} />, path: '/analytics', disabled: true },
      { id: 'org-hierarchy', label: 'Organization Hierarchy', icon: <Building size={18} />, path: '/organization-hierarchy', disabled: true },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { id: 'ops-dashboard', label: 'Ops Dashboard', icon: <LayoutDashboard size={18} />, path: '/ops-dashboard' },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['manage-program', 'manage-actions']));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={`${open ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0 h-full`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        {open && (
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-blue-600 font-semibold text-base truncate">Perfios</span>
            <span className="text-gray-500 text-sm truncate">JourneyBuilder</span>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_CONFIG.map((section) => (
          <div key={section.heading} className="mb-4">
            {/* Section heading */}
            {open && (
              <p className="px-4 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.heading}
              </p>
            )}

            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const hasChildren = !!item.children?.length;
                const isExpanded = expanded.has(item.id);
                const active = !hasChildren && item.path ? isActive(item.path) : false;

                return (
                  <div key={item.id}>
                    {/* Parent row */}
                    <button
                      onClick={() => {
                        if (item.disabled) return;
                        if (hasChildren) { if (!open) setOpen(true); toggle(item.id); }
                        else if (item.path) navigate(item.path);
                      }}
                      disabled={item.disabled}
                      title={!open ? item.label : undefined}
                      className={[
                        'w-full flex items-center px-2 py-2 rounded-lg text-sm transition-colors',
                        open ? 'space-x-3' : 'justify-center',
                        item.disabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : active
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {open && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {hasChildren && !item.disabled && (
                            isExpanded
                              ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Children */}
                    {hasChildren && isExpanded && open && (
                      <div className="ml-4 mt-0.5 border-l-2 border-gray-100 pl-2 space-y-0.5">
                        {item.children!.map((child) => {
                          const childActive = isActive(child.path);
                          return (
                            <button
                              key={child.id}
                              onClick={() => !child.disabled && navigate(child.path)}
                              disabled={child.disabled}
                              className={[
                                'w-full flex items-center space-x-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                                child.disabled
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : childActive
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                              ].join(' ')}
                            >
                              <span className="flex-shrink-0">{child.icon}</span>
                              <span className="truncate">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
