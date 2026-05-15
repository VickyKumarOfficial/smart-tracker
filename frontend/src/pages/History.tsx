import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toInitials = (value: string) => {
  const parts = value.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const statusClassName = (status?: string | null) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'completed') return 'bg-green-100 text-green-800';
  if (normalized === 'overdue') return 'bg-red-100 text-red-800';
  return 'bg-orange-100 text-[#A04A25]';
};

const statusLabel = (status?: string | null) => {
  if (!status) return 'PENDING';
  return status.toUpperCase();
};

type TransactionRow = {
  id: string;
  product: string;
  initials: string;
  amount: number;
  date: string | null;
  status: string | null;
  badgeClass: string;
};

type ProductRecord = {
  id: string;
  name: string;
};

type TransactionRecord = {
  id: string;
  product_id: string;
  amount: number;
  transaction_date: string;
  payment_status: string;
};

export function History() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setLoadError('Sign in to view transactions.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadTransactions = async () => {
      try {
        const [transactionsResponse, productsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/transactions?user_id=${userId}`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/products?user_id=${userId}`, { signal: controller.signal }),
        ]);

        if (!transactionsResponse.ok) {
          const errorBody = await transactionsResponse.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Unable to load transactions.');
        }

        if (!productsResponse.ok) {
          const errorBody = await productsResponse.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Unable to load products.');
        }

        const transactionsData = (await transactionsResponse.json()) as TransactionRecord[];
        const productsData = (await productsResponse.json()) as ProductRecord[];
        const productMap = new Map<string, string>(
          (productsData || []).map((product) => [product.id, product.name])
        );

        const mapped = (transactionsData || []).map((tx) => {
          const productName = String(productMap.get(tx.product_id) ?? 'Product');
          return {
            id: tx.id,
            product: productName,
            initials: toInitials(productName),
            amount: Number(tx.amount) || 0,
            date: tx.transaction_date,
            status: statusLabel(tx.payment_status),
            badgeClass: statusClassName(tx.payment_status),
          };
        });

        setTransactions(mapped);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Unable to load transactions.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();

    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-medium text-stone-900 mb-8">Ledger History</h1>

      {loadError && (
        <p className="text-sm text-red-600 mb-6" role="alert">
          {loadError}
        </p>
      )}
      {isLoading && !loadError && (
        <p className="text-sm text-stone-500 mb-6">Loading transactions...</p>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-8 items-center gap-8">
        <button className="text-xs font-bold tracking-widest uppercase text-[#8B3A1C] border-b-2 border-[#8B3A1C] pb-3 px-2">PAYMENTS</button>
        <button className="text-xs font-bold tracking-widest uppercase text-stone-400 hover:text-stone-600 pb-3 px-2">CATALOG</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-stone-100">
          <h2 className="text-xl font-medium text-stone-900">Recent Transactions</h2>
          <button className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 border border-stone-200 rounded-md px-3 py-1.5 hover:bg-stone-50">
            <Filter className="w-4 h-4" />
            FILTER
          </button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-100 text-xs font-bold tracking-widest uppercase text-stone-500">
              <th className="px-6 py-4 font-bold">PRODUCT</th>
              <th className="px-6 py-4 font-bold">AMOUNT</th>
              <th className="px-6 py-4 font-bold">DATE</th>
              <th className="px-6 py-4 font-bold text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {transactions.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-stone-500" colSpan={4}>
                  No transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${tx.badgeClass}`}>
                      {tx.initials}
                    </div>
                    <span className="font-medium text-stone-700">{tx.product}</span>
                  </td>
                  <td className="px-6 py-5">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-5 text-stone-500">{formatDate(tx.date)}</td>
                  <td className="px-6 py-5 text-right">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${tx.badgeClass}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
