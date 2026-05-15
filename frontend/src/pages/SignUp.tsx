import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function SignUp() {
  const navigate = useNavigate();
  const fieldsOfWork = ['Ceramist', 'Jeweller', 'Weaving', 'Blacksmith', 'Carpenter', 'Metalworker', 'Glassblower', 'Other'];
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  const [name, setName] = useState(() => localStorage.getItem('user_name') ?? '');
  const [vendorName, setVendorName] = useState(() => localStorage.getItem('vendor_name') ?? '');
  const [email, setEmail] = useState(() => localStorage.getItem('user_email') ?? '');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [location, setLocation] = useState(() => localStorage.getItem('vendor_location') ?? '');
  const [otherField, setOtherField] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitNotice, setSubmitNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldToggle = (field: string) => {
    setSelectedFields((current) => {
      if (current.includes(field)) {
        return current.filter((item) => item !== field);
      }
      if (field === 'Other') {
        return ['Other'];
      }
      if (current.includes('Other')) {
        return [field];
      }
      return [...current, field];
    });
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
    if (!name.trim() || !email.trim() || !dob || !location.trim() || !password.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setFieldError('');
    setSubmitError('');
    setSubmitNotice('');

    const normalizedFields = selectedFields
      .filter((field) => field !== 'Other')
      .concat(selectedFields.includes('Other') ? [otherField.trim()] : [])
      .filter((field) => field);

    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('Unable to create account.');
      }

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email: email.trim(),
          name: name.trim(),
          dob,
          vendor_name: vendorName.trim() || null,
          field_of_work: normalizedFields,
          location: location.trim(),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Unable to create vendor profile.');
      }

      if (authData.session) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user_id', userId);
        localStorage.setItem('user_name', name.trim());
        localStorage.setItem('user_email', email.trim());
        if (vendorName.trim()) {
          localStorage.setItem('vendor_name', vendorName.trim());
        }
        localStorage.setItem('vendor_location', location.trim());
        navigate('/dashboard');
        return;
      }

      setSubmitNotice('Account created. Please check your email to confirm, then sign in.');
      navigate('/signin');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
        <div className="w-full max-w-xl">
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
             <input type="text" placeholder="e.g. Eleanor Vance" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-stone-200 rounded-sm px-5 py-4 text-base focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">VENDOR NAME</label>
               <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
             <input type="text" placeholder="e.g. Master Vendor" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="w-full border border-stone-200 rounded-sm px-5 py-4 text-base focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" />
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
            <label className="text-xs font-bold tracking-widest uppercase text-stone-500">PASSWORD</label>
            <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
            <input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
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
          <label className="text-xs font-bold tracking-widest uppercase text-stone-500">FIELD OF WORK <span className="normal-case tracking-normal font-normal text-stone-400 ml-1">(Select All That Apply or Only Other)</span></label>
          <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
          <div className="grid grid-cols-4 gap-3">
            {fieldsOfWork.map((field) => (
              <label key={field} className="border border-stone-200 rounded-sm px-5 py-4 text-base text-center text-stone-600 bg-white hover:border-[#A04A25] hover:text-[#A04A25] cursor-pointer transition-colors has-[:checked]:border-[#A04A25] has-[:checked]:text-[#A04A25] has-[:checked]:bg-[#FAF5F2]">
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
        {submitNotice && (
          <p className="text-xs font-medium text-green-700" role="status">
            {submitNotice}
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
    </>
  );
}
