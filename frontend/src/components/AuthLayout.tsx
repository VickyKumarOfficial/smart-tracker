import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#FCFBFA] flex md:flex-row flex-col font-sans">
      {/* Left Image Side (hidden on mobile usually, or shown differently) */}
      <div className="md:w-1/2 relative hidden md:block">
        <img 
          src="https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=2070&auto=format&fit=crop" 
          alt="Artisan Desk" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle overlay if needed */}
        <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply" />
      </div>
      
      {/* Right Content Side */}
      <div className="md:w-1/2 flex-1 flex flex-col pt-12 md:px-24 px-8 overflow-y-auto w-full max-w-2xl mx-auto md:mx-0 bg-white md:bg-transparent shadow-xl md:shadow-none min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
