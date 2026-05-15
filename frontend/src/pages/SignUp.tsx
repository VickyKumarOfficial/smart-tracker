import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import signupImage from '../assets/signup.webp';

export function SignUp() {
  const navigate = useNavigate();
  const fieldsOfWork = ['Ceramist', 'Jeweller', 'Weaving', 'Blacksmith', 'Carpenter', 'Other'];
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  const [name, setName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [location, setLocation] = useState('');
  const [otherField, setOtherField] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldToggle = (field: string) => {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field]
    );
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFields.length === 0) {
      setFieldError('Select at least one field of work.');
      return;
    }
    if (selectedFields.includes('Other') && !otherField.trim()) {
      setFieldError('Enter your other field of work.');
      return;
    }
    if (!name.trim() || !email.trim() || !dob || !location.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setFieldError('');
    setSubmitError('');

    const normalizedFields = selectedFields
      .filter((field) => field !== 'Other')
      .concat(selectedFields.includes('Other') ? [otherField.trim()] : [])
      .filter((field) => field);

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          dob,
          vendor_name: vendorName.trim() || null,
          field_of_work: normalizedFields,
          location: location.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Unable to create account.');
      }

      const data = await response.json();
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user_id', data.id);
      localStorage.setItem('user_name', data.name);
      localStorage.setItem('user_email', data.email);
      if (data.vendor_name) {
        localStorage.setItem('vendor_name', data.vendor_name);
      }
      navigate('/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-start">
        <div className="hidden lg:block">
          <div className="relative rounded-xl overflow-hidden bg-stone-100">
            <img
              src={signupImage}
              alt="Artisan tools and materials"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="text-[#8B3A1C] font-semibold text-xl tracking-tight mb-2">Artisan Ledger</div>
          <h1 className="text-3xl font-medium text-stone-900 mb-2">Create Account</h1>
          <p className="text-stone-500 text-sm">Establish your vendor's digital foundation.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignUp}>
          <div className="grid grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">FULL NAME
              <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
              {/* <span className="required-star" title="Required Field"></span> */}
             </label>
             <input type="text" placeholder="e.g. Eleanor Vance" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
           </div>
           <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">VENDOR NAME</label>
             <input type="text" placeholder="e.g. Master Vendor" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" />
           </div>
          </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">EMAIL ADDRESS</label>
              <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>

             <input type="email" placeholder="vendor@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">DATE OF BIRTH</label>
              <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
             <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
        </div>

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest uppercase text-stone-500">AVATAR URL</label>
            <input type="url" placeholder="https://example.com/avatar.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" />
          </div>

        <div className="space-y-2">
           <label className="text-xs font-bold tracking-widest uppercase text-stone-500">VENDOR ADDRESS</label>
           <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
           <textarea 
             placeholder="Street, City, Postal Code" 
             rows={3}
             value={location}
             onChange={(e) => setLocation(e.target.value)}
             className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 resize-none" 
             required
           />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold tracking-widest uppercase text-stone-500">FIELD OF WORK <span className="normal-case tracking-normal font-normal text-stone-400 ml-1">(Select All That Apply)</span></label>
          <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
          <div className="grid grid-cols-3 gap-3">
            {fieldsOfWork.map((field) => (
              <label key={field} className="border border-stone-200 rounded-sm px-4 py-3 text-sm text-center text-stone-600 bg-white hover:border-[#A04A25] hover:text-[#A04A25] cursor-pointer transition-colors has-[:checked]:border-[#A04A25] has-[:checked]:text-[#A04A25] has-[:checked]:bg-[#FAF5F2]">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => handleFieldToggle(field)}
                  className="sr-only"
                />
                {field}
              </label>
            ))}
          </div>
          {fieldError && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {fieldError}
            </p>
          )}
          {selectedFields.includes('Other') && (
            <div className="mt-4">
              <label className="text-xs font-bold tracking-widest uppercase text-stone-500">OTHER FIELD</label>
              <input
                type="text"
                placeholder="Describe your craft"
                value={otherField}
                onChange={(e) => setOtherField(e.target.value)}
                className="mt-2 w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
              />
            </div>
          )}
        </div>
        {submitError && (
          <p className="text-xs font-medium text-red-600" role="alert">
            {submitError}
          </p>
        )}

          <button disabled={isSubmitting} className="w-full max-w-sm mx-auto block bg-[#A04A25] hover:bg-[#8B3A1C] text-white py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-colors shadow-sm mt-8 disabled:opacity-70 disabled:cursor-not-allowed">
            {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>

        </form>
        
        <div className="mt-8 text-center text-sm text-stone-500">
          Already have an account? <Link to="/signin" className="text-[#8B3A1C] font-semibold hover:underline">Log in</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
