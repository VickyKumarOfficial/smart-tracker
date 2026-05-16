import { Languages } from 'lucide-react';
import { useState } from 'react';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'bn', label: 'Bengali' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
];

export function Settings() {
  const [language, setLanguage] = useState(() => localStorage.getItem('preferred_language') || 'en');

  const handleLanguageChange = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    localStorage.setItem('preferred_language', nextLanguage);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-medium text-stone-900">Settings</h1>

      <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FAF5F2] text-[#8B3A1C]">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Language</h2>
              <p className="mt-1 text-sm text-stone-500">Choose your preferred language.</p>
            </div>
          </div>

          <select
            value={language}
            onChange={(event) => handleLanguageChange(event.target.value)}
            className="w-full rounded-md border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm font-medium text-stone-800 focus:border-[#A04A25] focus:outline-none focus:ring-1 focus:ring-[#A04A25] sm:w-64"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
