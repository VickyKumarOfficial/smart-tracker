import { Search, Bell} from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onAddItem: () => void;
}

export function Header({ onAddItem }: HeaderProps) {
  const location = useLocation();
  const avatarUrl = localStorage.getItem('avatar_url') || '';
  const userName = localStorage.getItem('user_name') || 'Vendor';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'V';
  
  // Very simple title logic based on route

  // Show large title only on certain pages if needed, but the screenshot shows "Overview" as a main page title *below* the header.
  // Actually, looking at the screenshots:
  // "Artisan Ledger" logo text is sometimes in the top left if there's no sidebar (auth).
  // In Dashboard, the header has WEEK/MONTH, Notifs, Calendar, Add Item. AND it has a Search bar in the History view.
  // Let's make a combined adaptive header.

  const isHistory = location.pathname.includes('/history');

  return (
    <header className="h-[72px] px-8 flex items-center justify-between border-b border-transparent bg-transparent">
      {/* Left side */}
      <div className="flex-1 flex items-center">
        {isHistory ? (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#A04A25] focus:border-transparent transition-all shadow-sm"
            />
          </div>
        ) : (
          <h2 className="text-[#8B3A1C] text-xl font-semibold hidden md:block">
            {/* If there was a title needed here, it would go here. But mostly the right side is populated. */}
          </h2>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Toggle (Week / Month) */}
        {/* <div className="flex items-center text-sm font-medium">
          <button className="text-[#A04A25] border-b-2 border-[#A04A25] pb-1 px-1">WEEK</button>
          <button className="text-stone-400 hover:text-stone-600 pb-1 px-3">MONTH</button>
        </div> */}

        {/* Icons */}
        <div className="flex items-center gap-4 text-stone-500">
          <button className="hover:text-stone-800 transition-colors"><Bell className="w-5 h-5" /></button>
          {/* <button className="hover:text-stone-800 transition-colors"><Calendar className="w-5 h-5" /></button> */}
        </div>

        <button 
          onClick={onAddItem}
          className="bg-[#A04A25] hover:bg-[#8B3A1C] text-white px-5 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          Add Item
        </button>

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-8 h-8 rounded-full ml-2 object-cover border border-stone-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full ml-2 border border-stone-200 bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center">
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
