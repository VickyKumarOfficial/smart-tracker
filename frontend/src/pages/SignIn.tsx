import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function SignIn() {
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-center">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-16">
        <div className="w-6 h-6 bg-[#A04A25] rounded-[4px] rotate-12 flex items-center justify-center text-white">
          <BookOpen className="w-3.5 h-3.5 -rotate-12" />
        </div>
        <span className="text-[#8B3A1C] font-semibold text-xl tracking-tight">Artisan Ledger</span>
        <div className="ml-auto text-xs font-semibold tracking-widest text-stone-400 uppercase flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          SECURE LOGIN
        </div>
      </div>

      <h1 className="text-4xl font-medium text-stone-900 mb-4 tracking-tight">Welcome back</h1>
      <p className="text-stone-600 mb-10 leading-relaxed">
        Enter your details to access your vendor workspace and manage your ledger.
      </p>

      <form className="space-y-6" onSubmit={handleSignIn}>
        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-stone-500">EMAIL OR USERNAME</label>
          <input 
            type="text" 
            placeholder="vendor@example.com"
            className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-stone-500">PASSWORD</label>
          <input 
            type="password" 
            placeholder="••••••••"
            className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-stone-300 text-[#A04A25] focus:ring-[#A04A25]" />
            <span className="text-sm text-stone-600">Remember me</span>
          </label>
          <a href="#" className="text-sm text-[#A04A25] hover:text-[#8B3A1C] font-medium">Forgot password?</a>
        </div>

        <button 
          className="w-full bg-[#A04A25] hover:bg-[#8B3A1C] text-white py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-colors shadow-sm flex justify-center items-center gap-2 mt-4"
        >
          SIGN IN <span className="text-lg leading-none">→</span>
        </button>
      </form>

      <div className="mt-auto pt-16 pb-8 text-center text-sm text-stone-500">
        Don't have a workspace yet? <Link to="/signup" className="text-[#A04A25] font-semibold hover:text-[#8B3A1C] uppercase tracking-wider ml-1">SIGN UP</Link>
      </div>
    </div>
  );
}
