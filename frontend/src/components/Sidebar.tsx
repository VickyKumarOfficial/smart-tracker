import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Bot, Settings, User, HelpCircle, Plus } from 'lucide-react';

interface SidebarProps {
  onAddItem: () => void;
}

export function Sidebar({ onAddItem }: SidebarProps) {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-[#F0EBE6] flex flex-col h-screen font-sans">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <img 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces" 
          alt="Vendor Owner" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h1 className="font-semibold text-[#8B3A1C] text-lg leading-tight">Artisan<br/>Ledger</h1>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Master Vendor</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 mt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive 
                  ? 'text-[#8B3A1C] bg-[#FAF5F2]' 
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#8B3A1C] rounded-l-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-4">
        {/* ADD ITEM is handled globally usually, but in sidebar on some views? Actually screenshot shows "Add Item" in sidebar and top bar. I will add it here too. */}
        <button 
          onClick={onAddItem}
          className="w-full bg-[#A04A25] hover:bg-[#8B3A1C] text-white flex items-center justify-center gap-2 py-2.5 rounded-md font-medium transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          ADD ITEM
        </button>

        <div className="pt-4 border-t border-[#F0EBE6] space-y-1">
           <NavLink to="/account" className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
             <User className="w-4 h-4" />
             Account
           </NavLink>
           <button className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:text-stone-900 w-full text-left">
             <HelpCircle className="w-4 h-4" />
             Help
           </button>
        </div>
      </div>
    </div>
  );
}
