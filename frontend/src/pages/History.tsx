import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

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
  makingCost: number | null;
  date: string | null;
  status: string | null;
  badgeClass: string;
};

type ProductRecord = {
  id: string;
  name: string;
  making_cost: number | null;
};

type TransactionRecord = {
  id: string;
  product_id: string;
  amount: number;
  transaction_date: string;
  payment_status: string;
};

type CatalogRow = {
  id: string;
  name: string;
  type: string | null;
  quantity: number;
  price: number | null;
  makingCost: number | null;
  dueDate: string | null;
};

export function History() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'catalog'>('payments');
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
    let subscription: any = null;

    const loadTransactions = async () => {
      setIsLoading(true);
      setLoadError('');
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
        const productMap = new Map<string, ProductRecord>(
          (productsData || []).map((product) => [product.id, product])
        );

        const mapped = (transactionsData || []).map((tx) => {
          const product = productMap.get(tx.product_id);
          const productName = String(product?.name ?? 'Product');
          return {
            id: tx.id,
            product: productName,
            initials: toInitials(productName),
            amount: Number(tx.amount) || 0,
            makingCost: product?.making_cost ?? null,
            date: tx.transaction_date,
            status: statusLabel(tx.payment_status),
            badgeClass: statusClassName(tx.payment_status),
          };
        });

        setTransactions(mapped);

        // Build catalog from products
        const catalogRows = (productsData || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          type: product.type,
          quantity: Number(product.quantity) || 0,
          price: product.price ? Number(product.price) : null,
          makingCost: product.making_cost ? Number(product.making_cost) : null,
          dueDate: product.due_date,
        }));

        setCatalog(catalogRows);

        // Setup real-time subscriptions
        const productsSubscription = supabase
          .channel(`products:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'products',
              filter: `user_id=eq.${userId}`,
            },
            async () => {
              // Refetch products on any change
              try {
                const response = await fetch(`${API_BASE_URL}/api/products?user_id=${userId}`);
                if (response.ok) {
                  const updatedProducts = (await response.json()) as ProductRecord[];
                  const updatedCatalogRows = (updatedProducts || []).map((product: any) => ({
                    id: product.id,
                    name: product.name,
                    type: product.type,
                    quantity: Number(product.quantity) || 0,
                    price: product.price ? Number(product.price) : null,
                    makingCost: product.making_cost ? Number(product.making_cost) : null,
                    dueDate: product.due_date,
                  }));
                  setCatalog(updatedCatalogRows);
                }
              } catch (error) {
                console.error('Error updating catalog on realtime change:', error);
              }
            }
          )
          .subscribe();

        const transactionsSubscription = supabase
          .channel(`transactions:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions',
              filter: `user_id=eq.${userId}`,
            },
            async () => {
              // Refetch both transactions and products on transaction changes
              try {
                const [txResponse, prodResponse] = await Promise.all([
                  fetch(`${API_BASE_URL}/api/transactions?user_id=${userId}`),
                  fetch(`${API_BASE_URL}/api/products?user_id=${userId}`),
                ]);

                if (txResponse.ok && prodResponse.ok) {
                  const updatedTransactions = (await txResponse.json()) as TransactionRecord[];
                  const updatedProducts = (await prodResponse.json()) as ProductRecord[];
                  const productMap = new Map<string, ProductRecord>(
                    (updatedProducts || []).map((product) => [product.id, product])
                  );

                  const mappedTransactions = (updatedTransactions || []).map((tx) => {
                    const product = productMap.get(tx.product_id);
                    const productName = String(product?.name ?? 'Product');
                    return {
                      id: tx.id,
                      product: productName,
                      initials: toInitials(productName),
                      amount: Number(tx.amount) || 0,
                      makingCost: product?.making_cost ?? null,
                      date: tx.transaction_date,
                      status: statusLabel(tx.payment_status),
                      badgeClass: statusClassName(tx.payment_status),
                    };
                  });

                  setTransactions(mappedTransactions);
                }
              } catch (error) {
                console.error('Error updating transactions on realtime change:', error);
              }
            }
          )
          .subscribe();

        subscription = { productsSubscription, transactionsSubscription };
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

    return () => {
      controller.abort();
      if (subscription) {
        subscription.productsSubscription?.unsubscribe();
        subscription.transactionsSubscription?.unsubscribe();
      }
    };
  }, [refreshKey]);

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
        <button 
          onClick={() => setActiveTab('payments')}
          className={`text-xs font-bold tracking-widest uppercase pb-3 px-2 ${
            activeTab === 'payments'
              ? 'text-[#8B3A1C] border-b-2 border-[#8B3A1C]'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          PAYMENTS
        </button>
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`text-xs font-bold tracking-widest uppercase pb-3 px-2 ${
            activeTab === 'catalog'
              ? 'text-[#8B3A1C] border-b-2 border-[#8B3A1C]'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          CATALOG
        </button>
      </div>

      {/* Payments Table */}
      {activeTab === 'payments' && (
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
                <th className="px-6 py-4 font-bold">MAKING COST</th>
                <th className="px-6 py-4 font-bold">DATE</th>
                <th className="px-6 py-4 font-bold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-stone-500" colSpan={5}>
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
                    <td className="px-6 py-5">{tx.makingCost == null ? '-' : formatCurrency(tx.makingCost)}</td>
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
      )}

      {/* Catalog Table */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-stone-100">
            <h2 className="text-xl font-medium text-stone-900">Product Catalog</h2>
            <button className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 border border-stone-200 rounded-md px-3 py-1.5 hover:bg-stone-50">
              <Filter className="w-4 h-4" />
              FILTER
            </button>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-xs font-bold tracking-widest uppercase text-stone-500">
                <th className="px-6 py-4 font-bold">PRODUCT NAME</th>
                <th className="px-6 py-4 font-bold">TYPE</th>
                <th className="px-6 py-4 font-bold">QUANTITY</th>
                <th className="px-6 py-4 font-bold">PRICE</th>
                <th className="px-6 py-4 font-bold">MAKING COST</th>
                <th className="px-6 py-4 font-bold">DUE DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {catalog.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-stone-500" colSpan={6}>
                    No products in catalog yet.
                  </td>
                </tr>
              ) : (
                catalog.map((product) => (
                  <tr key={product.id} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5 font-medium text-stone-700">{product.name}</td>
                    <td className="px-6 py-5 text-stone-600">{product.type || '-'}</td>
                    <td className="px-6 py-5">{product.quantity}</td>
                    <td className="px-6 py-5">{product.price == null ? '-' : formatCurrency(product.price)}</td>
                    <td className="px-6 py-5">{product.makingCost == null ? '-' : formatCurrency(product.makingCost)}</td>
                    <td className="px-6 py-5 text-stone-500">{formatDate(product.dueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
