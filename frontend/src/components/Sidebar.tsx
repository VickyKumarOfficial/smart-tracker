import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Bot, Settings, User, HelpCircle, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarProps {
  onAddItem: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ onAddItem, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const avatarUrl = localStorage.getItem('avatar_url') || '';
  const userName = localStorage.getItem('user_name') || 'Vendor';
  const vendorName = localStorage.getItem('vendor_name') || 'Master Vendor';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'V';
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-[#F0EBE6] flex flex-col h-screen font-sans relative transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-md border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center justify-center"
      >
        {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>

      {/* Logo */}
      <div className={`flex items-center px-6 py-8 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Vendor Owner"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-700 font-semibold text-sm flex items-center justify-center">
            {initials}
          </div>
        )}
        <div className={`transition-all duration-200 origin-left ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-2 overflow-hidden' : 'max-w-[12rem] opacity-100 translate-x-0'}`}>
          <h1 className="font-semibold text-[#8B3A1C] text-lg leading-tight">Artisan<br/>Ledger</h1>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">{vendorName}</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isActive 
                  ? 'text-[#8B3A1C] bg-[#FAF5F2]' 
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              } ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 -translate-x-1 overflow-hidden' : 'w-auto opacity-100 translate-x-0'}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8B3A1C] rounded-l-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-4">
        {/* ADD ITEM is handled globally usually, but in sidebar on some views? Actually screenshot shows "Add Item" in sidebar and top bar. I will add it here too. */}
        <button 
          onClick={onAddItem}
          title={isCollapsed ? 'Add Item' : undefined}
          className={`w-full bg-[#A04A25] hover:bg-[#8B3A1C] text-white flex items-center justify-center py-2.5 rounded-md font-medium transition-all duration-200 text-sm shadow-sm ${isCollapsed ? 'gap-0 px-0' : 'gap-2 px-3'}`}
        >
          <Plus className="w-4 h-4" />
          <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            ADD ITEM
          </span>
        </button>

        <div className="pt-4 border-t border-[#F0EBE6] space-y-1">
           <NavLink
             to="/account"
             title={isCollapsed ? 'Account' : undefined}
             className={`flex items-center px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-all duration-200 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
           >
             <User className="w-4 h-4" />
             <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
               Account
             </span>
           </NavLink>
           <button
             title={isCollapsed ? 'Help' : undefined}
             className={`flex items-center px-4 py-2 text-sm text-stone-600 hover:text-stone-900 w-full text-left transition-all duration-200 ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
           >
             <HelpCircle className="w-4 h-4" />
             <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
               Help
             </span>
           </button>
        </div>
      </div>
    </aside>
  );
}
