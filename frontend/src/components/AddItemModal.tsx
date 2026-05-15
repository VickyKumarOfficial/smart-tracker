import { useState } from 'react';
import { X, ImagePlus } from 'lucide-react';

interface AddItemModalProps {
  onClose: () => void;
}

export function AddItemModal({ onClose }: AddItemModalProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Leather Goods');
  const [customType, setCustomType] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('0.00');
  const [status, setStatus] = useState('not_sold');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setSubmitError('Please sign in before adding an item.');
      return;
    }
    if (!name.trim()) {
      setSubmitError('Product name is required.');
      return;
    }
    if (!transactionDate) {
      setSubmitError('Transaction date is required.');
      return;
    }

    if (type === 'Other' && !customType.trim()) {
      setSubmitError('Please describe the product type.');
      return;
    }

    const parsedQuantity = Number(quantity) || 1;
    const parsedPrice = Number(price) || 0;
    const resolvedType = type === 'Other' ? (customType.trim() || 'Other') : type;

    setIsSubmitting(true);
    try {
      const productResponse = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: name.trim(),
          type: resolvedType,
          quantity: parsedQuantity,
          price: parsedPrice,
          status,
          image_url: imageUrl.trim() || null,
        }),
      });

      if (!productResponse.ok) {
        const errorBody = await productResponse.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Unable to save product.');
      }

      const product = await productResponse.json();

      const transactionResponse = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: product.id,
          amount: parsedPrice,
          payment_status: paymentStatus,
          transaction_date: transactionDate,
          due_date: dueDate || null,
        }),
      });

      if (!transactionResponse.ok) {
        const errorBody = await transactionResponse.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Unable to save transaction.');
      }

      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <form id="add-item-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wider uppercase text-stone-500">IMAGE URL</label>
              <input 
                type="url" 
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">PRODUCT NAME <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Handcrafted Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">TYPE</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 appearance-none bg-no-repeat bg-[right_1rem_center]"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")' }}>
                  <option value="">Select a type</option>
                  <option value="Leather Goods">Leather Goods</option>
                  <option value="Ceramics">Ceramics</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Other">Other</option>
                </select>
                {type === 'Other' && (
                  <input
                    type="text"
                    placeholder="Describe your type"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
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
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">PRICE ($)</label>
                <input 
                  type="text" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 appearance-none bg-no-repeat bg-[right_1rem_center]" style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")' }}>
                  <option value="not_sold">Not sold</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">PAYMENT STATUS</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50 appearance-none bg-no-repeat bg-[right_1rem_center]" style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")' }}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">TRANSACTION DATE</label>
                <input 
                  type="date" 
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">DUE DATE</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-stone-200 rounded-md px-4 py-2.5 text-sm text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
                />
              </div>
            </div>
            {submitError && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {submitError}
              </p>
            )}
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
            form="add-item-form"
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold tracking-wide border border-transparent bg-[#A04A25] text-white rounded-md hover:bg-[#8B3A1C] shadow-sm transition"
          >
            {isSubmitting ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
