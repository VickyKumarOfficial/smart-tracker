import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#FCFBFA] flex md:flex-row flex-col font-sans">
      {/* Left Image Side (hidden on mobile usually, or shown differently) */}
      <div className="md:w-1/2 relative hidden md:block">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2RbCj0E5PXuKnW9Abda3TB2e2dakpnplawOh6X3O3dphM0x4axIdquUytSrFVY9cTO8l8aluxiSBA5LKZtwlIoPsR8qaFPaN5NUkrAwdaWGi4W1iDsrbmgIuyty2_-sErDshz7DS3bflCW-UzsJRyi24HzjpMnFyEjzwbR0KAoor-SwhAp7oTHME-NhE48tnT-RRCLLF3oSw23c0OvbeY7K5b2sd8ueKxpCfrORrfYpg3m1dB9-KQrv1QPjnreetrfNDJimJBUc_9" 
          alt="signup imaage" 
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
