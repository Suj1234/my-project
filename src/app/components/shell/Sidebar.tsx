import { useState } from 'react';
import {
  LayoutGrid,
  Settings2,
  ShieldCheck,
  Building2,
  Bell,
  ChevronDown,
  ChevronRight,
  Zap,
  Network,
  Globe,
} from 'lucide-react';

export type AppView = 'manage-programs' | 'canvas' | 'api-integration';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view?: AppView;
  disabled?: boolean;
  children?: {
    id: string;
    label: string;
    icon: React.ReactNode;
    view: AppView;
    disabled?: boolean;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'manage-programs',
    label: 'Manage Programs',
    icon: <LayoutGrid size={16} />,
    children: [
      {
        id: 'manage-programs-list',
        label: 'Manage Programs',
        icon: <LayoutGrid size={14} />,
        view: 'manage-programs',
      },
    ],
  },
  {
    id: 'master-management',
    label: 'Master Management',
    icon: <Settings2 size={16} />,
    disabled: true,
  },
  {
    id: 'manage-actions',
    label: 'Manage Actions',
    icon: <Zap size={16} />,
    children: [
      {
        id: 'canvas',
        label: 'Canvas',
        icon: <Network size={14} />,
        view: 'canvas',
      },
      {
        id: 'api-integration',
        label: 'API Integration',
        icon: <Globe size={14} />,
        view: 'api-integration',
      },
    ],
  },
  {
    id: 'access-control',
    label: 'Access Control',
    icon: <ShieldCheck size={16} />,
    disabled: true,
  },
  {
    id: 'org-hierarchy',
    label: 'Organization Hierarchy',
    icon: <Building2 size={16} />,
    disabled: true,
  },
  {
    id: 'notifications',
    label: 'Notification Management',
    icon: <Bell size={16} />,
    disabled: true,
  },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['manage-programs', 'manage-actions'])
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (view?: AppView) => view && view === currentView;

  return (
    <div className="w-[220px] flex-shrink-0 h-full flex flex-col" style={{ backgroundColor: '#0B6B5A' }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="text-white font-semibold text-sm leading-tight">
          <span className="text-white/70 font-normal">Perfios </span>
          JourneyBuilder
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const isExpanded = expandedSections.has(item.id);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.id}>
              {/* Parent row */}
              <button
                onClick={() => {
                  if (item.disabled) return;
                  if (hasChildren) toggleSection(item.id);
                  else if (item.view) onNavigate(item.view);
                }}
                disabled={item.disabled}
                className={[
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium transition-colors',
                  item.disabled
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/80 hover:text-white hover:bg-white/10 cursor-pointer',
                  !hasChildren && isActive(item.view)
                    ? 'bg-white/15 text-white'
                    : '',
                ].join(' ')}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {hasChildren && !item.disabled && (
                  isExpanded
                    ? <ChevronDown size={12} className="text-white/50" />
                    : <ChevronRight size={12} className="text-white/50" />
                )}
              </button>

              {/* Children */}
              {hasChildren && isExpanded && !item.disabled && (
                <div className="ml-3 border-l border-white/10 pl-1">
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => !child.disabled && onNavigate(child.view)}
                      disabled={child.disabled}
                      className={[
                        'w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors rounded-sm',
                        child.disabled
                          ? 'text-white/30 cursor-not-allowed'
                          : 'text-white/70 hover:text-white hover:bg-white/10 cursor-pointer',
                        isActive(child.view)
                          ? 'bg-white/15 text-white font-medium'
                          : '',
                      ].join(' ')}
                    >
                      <span className="flex-shrink-0">{child.icon}</span>
                      <span className="truncate">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            RK
          </div>
          <div className="text-white/60 text-xs truncate">Admin</div>
        </div>
      </div>
    </div>
  );
}
