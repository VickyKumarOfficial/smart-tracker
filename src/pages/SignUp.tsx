import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function SignUp() {
  const navigate = useNavigate();
  const fieldsOfWork = ['Ceramist', 'Jeweller', 'Weaving', 'Blacksmith', 'Carpenter', 'Other'];
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState('');

  const handleFieldToggle = (field: string) => {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field]
    );
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFields.length === 0) {
      setFieldError('Select at least one field of work.');
      return;
    }
    setFieldError('');
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-lg mx-auto py-12">
      <div className="text-center mb-10">
        <div className="text-[#8B3A1C] font-semibold text-xl tracking-tight mb-2">Artisan Ledger</div>
        <h1 className="text-3xl font-medium text-stone-900 mb-2">Create Account</h1>
        <p className="text-stone-500 text-sm">Establish your studio's digital foundation.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSignUp}>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">FULL NAME
              <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
              {/* <span className="required-star" title="Required Field"></span> */}
             </label>
             <input type="text" placeholder="e.g. Eleanor Vance" className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">PHONE NUMBER</label>
               <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>

             <input type="tel" placeholder="+1 (555) 000-0000" className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">EMAIL ADDRESS</label>
              <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>

             <input type="email" placeholder="studio@example.com" className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold tracking-widest uppercase text-stone-500">DATE OF BIRTH</label>
              <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
             <input type="date" className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50" required />
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold tracking-widest uppercase text-stone-500">STUDIO ADDRESS</label>
           <span className = "required-star" title="Required Field"style={{ color: 'red' }}>  * </span>
           <textarea 
             placeholder="Street, City, Postal Code" 
             rows={3}
             className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 resize-none" 
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
                className="mt-2 w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
              />
            </div>
          )}
        </div>

        <button className="w-full max-w-sm mx-auto block bg-[#A04A25] hover:bg-[#8B3A1C] text-white py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-colors shadow-sm mt-8">
          CREATE ACCOUNT
        </button>

      </form>
      
      <div className="mt-8 text-center text-sm text-stone-500">
        Already have an account? <Link to="/signin" className="text-[#8B3A1C] font-semibold hover:underline">Log in</Link>
      </div>
    </div>
  );
}
