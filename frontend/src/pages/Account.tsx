import { LogOut, User, Mail, Briefcase, MapPin, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function Account() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('avatar_url') || '');
  const storedUserName = localStorage.getItem('user_name') || 'Vendor';
  const initials = storedUserName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'V';
  const [formData, setFormData] = useState({
    name: localStorage.getItem('user_name') || 'Vendor',
    email: localStorage.getItem('user_email') || 'vendor@example.com',
    studioName: localStorage.getItem('vendor_name') || 'Master Studio',
    fields: 'Ceramist, Jeweller',
    location: localStorage.getItem('vendor_location') || '-',
  });

  useEffect(() => {
    let isMounted = true;

    const syncAvatar = async () => {
      const existingAvatar = localStorage.getItem('avatar_url') || '';
      if (existingAvatar) {
        setAvatarUrl(existingAvatar);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      const sessionUser = data.session?.user;
      if (!sessionUser) {
        return;
      }

      const googleAvatarUrl = sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture;
      if (googleAvatarUrl) {
        localStorage.setItem('avatar_url', googleAvatarUrl);
        setAvatarUrl(googleAvatarUrl);
      }
    };

    void syncAvatar();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Sign out failed:', error);
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

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-5xl font-medium text-stone-900">Account Details</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 text-[#A04A25] hover:text-[#8B3A1C] font-semibold px-6 py-3 bg-[#FAF5F2] hover:bg-[#F5E6E0] rounded-lg transition-colors"
        >
          <Edit2 className="w-5 h-5" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md border border-stone-100 overflow-hidden">
        <div className="p-12">
          <div className="flex items-center gap-8 mb-12">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-2 border-stone-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-2 border-stone-200 bg-stone-100 text-stone-700 text-3xl font-semibold flex items-center justify-center">
                {initials}
              </div>
            )}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-4xl font-medium text-stone-900 mb-3 border border-stone-300 rounded-lg px-4 py-2 w-full"
                />
              ) : (
                <h2 className="text-4xl font-medium text-stone-900 mb-3">{formData.name}</h2>
              )}
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-lg text-stone-600 border border-stone-300 rounded-lg px-4 py-2 w-full"
                />
              ) : (
                <p className="text-lg text-stone-600">{formData.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold tracking-widest text-stone-500 uppercase mb-8">Studio Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-stone-400 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">Studio Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.studioName}
                        onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                        className="w-full text-lg text-stone-900 font-medium border border-stone-300 rounded-lg px-4 py-2"
                      />
                    ) : (
                      <div className="text-lg text-stone-900 font-medium">{formData.studioName}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Briefcase className="w-6 h-6 text-stone-400 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">Field of Work</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.fields}
                        onChange={(e) => setFormData({ ...formData, fields: e.target.value })}
                        className="w-full text-lg text-stone-900 font-medium border border-stone-300 rounded-lg px-4 py-2"
                      />
                    ) : (
                      <div className="text-lg text-stone-900 font-medium">{formData.fields}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-stone-400 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-lg text-stone-900 font-medium border border-stone-300 rounded-lg px-4 py-2"
                      />
                    ) : (
                      <div className="text-lg text-stone-900 font-medium">{formData.email}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-stone-400 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full text-lg text-stone-900 font-medium border border-stone-300 rounded-lg px-4 py-2"
                      />
                    ) : (
                      <div className="text-lg text-stone-900 font-medium">{formData.location}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-stone-100 lg:pl-12 pt-12 lg:pt-0">
              <h3 className="text-lg font-bold tracking-widest text-stone-500 uppercase mb-8">Actions</h3>
              <div className="space-y-3">
                {isEditing && (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 text-white font-semibold px-6 py-3 bg-[#A04A25] hover:bg-[#8B3A1C] rounded-lg transition-colors w-full justify-center"
                    >
                      <Check className="w-5 h-5" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-stone-600 font-semibold px-6 py-3 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors w-full justify-center"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold px-6 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors w-full justify-center"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
