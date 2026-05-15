import { LogOut, User, Mail, Briefcase, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function Account() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('vendor_name');
    localStorage.removeItem('vendor_location');
    localStorage.removeItem('avatar_url');
    navigate('/signin');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-medium text-stone-900 mb-8">Account Details</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-6 mb-8">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces" 
              alt="Avatar" 
              className="w-24 h-24 rounded-full object-cover border border-stone-200"
            />
            <div>
              <h2 className="text-2xl font-medium text-stone-900">Eleanor Vance</h2>
              <p className="text-stone-500">vendor@example.com</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-4">Vendor Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-stone-400" />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Vendor Name</label>
                    <div className="text-stone-900 text-sm font-medium">Master Vendor</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-stone-400" />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Field of Work</label>
                    <div className="text-stone-900 text-sm font-medium">Ceramist, Jeweller</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-stone-400" />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Email Address</label>
                    <div className="text-stone-900 text-sm font-medium">vendor@example.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-stone-400" />
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Location</label>
                    <div className="text-stone-900 text-sm font-medium">123 Artisan Way, Portland, OR</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t md:border-t-0 md:border-l border-stone-100 md:pl-8 pt-8 md:pt-0">
              <h3 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-4">Actions</h3>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 bg-red-50 hover:bg-red-100 rounded-md transition-colors w-full md:w-auto justify-center"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
