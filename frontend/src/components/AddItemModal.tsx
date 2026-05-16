import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface AddItemModalProps {
  onClose: () => void;
  onItemAdded?: () => void;
}

export function AddItemModal({ onClose, onItemAdded }: AddItemModalProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  const [name, setName] = useState('');
  const [type, setType] = useState('Leather Goods');
  const [customType, setCustomType] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('0.00');
  const [makingCost, setMakingCost] = useState('0.00');
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
    const parsedMakingCost = Number(makingCost) || 0;
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
          making_cost: parsedMakingCost,
          transaction_date: transactionDate,
          due_date: dueDate || null,
          status,
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

      onItemAdded?.();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-xl bg-white font-sans shadow-2xl animation-fade-in-up sm:max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6">
          <h3 className="text-lg font-medium text-stone-900 sm:text-xl">Add New Item</h3>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label="Close add item modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
          {/* Upload Area */}
          <div className="mb-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#D5B5A8] bg-[#FDFBF9] px-4 py-8 text-center transition-colors hover:bg-[#FAF5F2] sm:mb-8 sm:py-12">
            <ImagePlus className="mb-4 h-8 w-8 text-[#A04A25]" />
            <p className="mb-1 text-sm font-medium text-stone-700">Click to upload or drag and drop</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">SVG, PNG, JPG OR GIF (MAX. 800x400PX)</p>
          </div>

          {/* Form */}
          <form id="add-item-form" className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
                <label className="text-xs font-bold tracking-wider uppercase text-stone-500">MAKING COST ($)</label>
                <input
                  type="text"
                  value={makingCost}
                  onChange={(e) => setMakingCost(e.target.value)}
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-stone-50/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button 
            onClick={onClose}
            className="w-full rounded-md px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-stone-600 transition hover:bg-stone-100 sm:w-auto"
          >
            CANCEL
          </button>
          <button 
            form="add-item-form"
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md border border-transparent bg-[#A04A25] px-6 py-2.5 text-sm font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#8B3A1C] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
