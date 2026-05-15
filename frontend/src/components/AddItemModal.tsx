import { X, ImagePlus } from 'lucide-react';
import { useState } from 'react';

interface AddItemModalProps {
  onClose: () => void;
}

export function AddItemModal({ onClose }: AddItemModalProps) {
  const [typeValue, setTypeValue] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans animation-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="text-xl font-medium text-stone-900">Add New Item</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Upload Area */}
          <div className="border border-dashed border-[#D5B5A8] rounded-xl bg-[#FDFBF9] flex flex-col items-center justify-center py-12 text-center cursor-pointer transition-colors hover:bg-[#FAF5F2]">
            <ImagePlus className="w-8 h-8 text-[#A04A25] mb-4" />
            <p className="text-sm text-stone-700 font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">SVG, PNG, JPG OR GIF (MAX. 800x400PX)</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">PRODUCT NAME <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Handcrafted Wallet"
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">TYPE</label>
                <select
                  value={typeValue}
                  onChange={(e) => {
                    setTypeValue(e.target.value);
                    setShowOtherInput(e.target.value === 'Other');
                  }}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 appearance-none bg-no-repeat bg-[right_1rem_center]"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")' }}>
                  <option value="">Select a type</option>
                  <option value="Leather Goods">Leather Goods</option>
                  <option value="Ceramics">Ceramics</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Other">Other</option>
                </select>
                {showOtherInput && (
                  <input
                    type="text"
                    placeholder="Describe your type"
                    className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 mt-2"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider uppercase text-stone-500">MATERIALS <span style={{ color: 'red' }}>*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Full-grain leather, brass rivets"
                className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">QTY</label>
                <input 
                  type="number" 
                  defaultValue="1"
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">PRICE ($)</label>
                <input 
                  type="text" 
                  defaultValue="0.00"
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">PAYMENT STATUS</label>
                <select className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 appearance-none bg-no-repeat bg-[right_1rem_center]" style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")' }}>
                  <option>In-progress</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-3 bg-stone-50/30">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold tracking-wide uppercase text-stone-600 hover:bg-stone-100 rounded-md transition"
          >
            CANCEL
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold tracking-wide border border-transparent bg-[#A04A25] text-white rounded-md hover:bg-[#8B3A1C] shadow-sm transition"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
