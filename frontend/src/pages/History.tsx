import { useEffect, useMemo, useState } from 'react';
import { Filter, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { FilterModal } from '../components/FilterModal';
import {
  countActiveFilters,
  createEmptyFilterValues,
  type FilterValues,
} from '../lib/filterUtils';

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

const matchesSearch = (values: Array<string | null | undefined>, search: string) => {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;
  return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch));
};

const parseFilterNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const matchesNumberRange = (
  value: number | null | undefined,
  minValue: string,
  maxValue: string
) => {
  const min = parseFilterNumber(minValue);
  const max = parseFilterNumber(maxValue);
  if (min == null && max == null) return true;
  if (value == null) return false;

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return false;
  if (min != null && numericValue < min) return false;
  if (max != null && numericValue > max) return false;
  return true;
};

const matchesDateRange = (value: string | null | undefined, from: string, to: string) => {
  if (!from && !to) return true;
  if (!value) return false;

  const current = new Date(value).getTime();
  if (Number.isNaN(current)) return false;

  const start = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

  if (start != null && current < start) return false;
  if (end != null && current > end) return false;
  return true;
};

const getTimeValue = (value: string | null | undefined) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const uniqueValues = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));

type TransactionRow = {
  id: string;
  productId: string;
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
  type: string | null;
  quantity: number | string | null;
  price: number | string | null;
  making_cost: number | null;
  due_date: string | null;
  created_at: string | null;
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
  createdAt: string | null;
};

type HistoryFilterTarget = 'payments' | 'catalog' | null;

export function History() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'catalog'>('payments');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deletingTransactionId, setDeletingTransactionId] = useState('');
  const [deletingProductId, setDeletingProductId] = useState('');
  const [activeFilterTarget, setActiveFilterTarget] = useState<HistoryFilterTarget>(null);
  const [paymentFilters, setPaymentFilters] = useState<FilterValues>(() => createEmptyFilterValues());
  const [catalogFilters, setCatalogFilters] = useState<FilterValues>(() => createEmptyFilterValues());
  const userId = localStorage.getItem('user_id');
  const authError = userId ? '' : 'Sign in to view transactions.';

  useEffect(() => {
    if (!userId) {
      return;
    }

    const controller = new AbortController();
    let subscription: {
      productsSubscription: RealtimeChannel;
      transactionsSubscription: RealtimeChannel;
    } | null = null;

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
            productId: tx.product_id,
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
        const catalogRows = (productsData || []).map((product) => ({
          id: product.id,
          name: product.name,
          type: product.type,
          quantity: Number(product.quantity) || 0,
          price: product.price ? Number(product.price) : null,
          makingCost: product.making_cost ? Number(product.making_cost) : null,
          dueDate: product.due_date,
          createdAt: product.created_at,
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
                  const updatedCatalogRows = (updatedProducts || []).map((product) => ({
                    id: product.id,
                    name: product.name,
                    type: product.type,
                    quantity: Number(product.quantity) || 0,
                    price: product.price ? Number(product.price) : null,
                    makingCost: product.making_cost ? Number(product.making_cost) : null,
                    dueDate: product.due_date,
                    createdAt: product.created_at,
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
                      productId: tx.product_id,
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
  }, [refreshKey, userId]);

  const catalogTypeOptions = useMemo(
    () => uniqueValues(catalog.map((product) => product.type)),
    [catalog]
  );
  const paymentFilterCount = countActiveFilters(paymentFilters, 'payments');
  const catalogFilterCount = countActiveFilters(catalogFilters, 'catalog');

  const filteredTransactions = useMemo(
    () => {
      const filtered = transactions.filter((tx) => {
        const statusMatches =
          paymentFilters.status === 'all' ||
          String(tx.status ?? '').toLowerCase() === paymentFilters.status;

        return (
          statusMatches &&
          matchesSearch([tx.product], paymentFilters.search) &&
          matchesDateRange(tx.date, paymentFilters.dateFrom, paymentFilters.dateTo) &&
          matchesNumberRange(tx.amount, paymentFilters.amountMin, paymentFilters.amountMax) &&
          matchesNumberRange(tx.makingCost, paymentFilters.makingCostMin, paymentFilters.makingCostMax)
        );
      });

      return [...filtered].sort((first, second) => {
        if (paymentFilters.sortBy === 'oldest') {
          return getTimeValue(first.date) - getTimeValue(second.date);
        }
        if (paymentFilters.sortBy === 'amount_high') {
          return (Number(second.amount) || 0) - (Number(first.amount) || 0);
        }
        if (paymentFilters.sortBy === 'amount_low') {
          return (Number(first.amount) || 0) - (Number(second.amount) || 0);
        }
        return getTimeValue(second.date) - getTimeValue(first.date);
      });
    },
    [transactions, paymentFilters]
  );

  const filteredCatalog = useMemo(
    () => {
      const filtered = catalog.filter((product) => {
        const typeMatches = catalogFilters.type === 'all' || product.type === catalogFilters.type;

        return (
          typeMatches &&
          matchesSearch([product.name, product.type], catalogFilters.search) &&
          matchesDateRange(product.dueDate, catalogFilters.dateFrom, catalogFilters.dateTo) &&
          matchesNumberRange(product.quantity, catalogFilters.quantityMin, catalogFilters.quantityMax) &&
          matchesNumberRange(product.price, catalogFilters.priceMin, catalogFilters.priceMax) &&
          matchesNumberRange(product.makingCost, catalogFilters.makingCostMin, catalogFilters.makingCostMax)
        );
      });

      return [...filtered].sort((first, second) => {
        if (catalogFilters.sortBy === 'oldest') {
          return getTimeValue(first.createdAt) - getTimeValue(second.createdAt);
        }
        if (catalogFilters.sortBy === 'name') {
          return first.name.localeCompare(second.name);
        }
        if (catalogFilters.sortBy === 'price_high') {
          return (Number(second.price) || 0) - (Number(first.price) || 0);
        }
        if (catalogFilters.sortBy === 'price_low') {
          return (Number(first.price) || 0) - (Number(second.price) || 0);
        }
        return getTimeValue(second.createdAt) - getTimeValue(first.createdAt);
      });
    },
    [catalog, catalogFilters]
  );
  const visibleLoadError = loadError || authError;

  const handleDeleteProduct = async (product: CatalogRow) => {
    if (!userId) {
      setLoadError('Sign in before deleting an item.');
      return;
    }

    const shouldDelete = window.confirm(`Delete "${product.name}" from history? This will also remove its payment records.`);
    if (!shouldDelete) {
      return;
    }

    setDeletingProductId(product.id);
    setLoadError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${product.id}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Unable to delete item.');
      }

      setCatalog((current) => current.filter((entry) => entry.id !== product.id));
      setTransactions((current) => current.filter((entry) => entry.productId !== product.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to delete item.');
    } finally {
      setDeletingProductId('');
    }
  };

  const handleDeleteTransaction = async (transaction: TransactionRow) => {
    if (!userId) {
      setLoadError('Sign in before deleting a payment.');
      return;
    }

    const shouldDelete = window.confirm(`Delete the payment record for "${transaction.product}"?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingTransactionId(transaction.id);
    setLoadError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${transaction.id}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Unable to delete payment.');
      }

      setTransactions((current) => current.filter((entry) => entry.id !== transaction.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to delete payment.');
    } finally {
      setDeletingTransactionId('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-medium text-stone-900 mb-8">Ledger History</h1>

      {visibleLoadError && (
        <p className="text-sm text-red-600 mb-6" role="alert">
          {visibleLoadError}
        </p>
      )}
      {isLoading && !visibleLoadError && (
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
        <div className="overflow-visible rounded-xl border border-stone-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <h2 className="text-xl font-medium text-stone-900">Recent Transactions</h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveFilterTarget((current) => current === 'payments' ? null : 'payments')}
                className="flex w-fit items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              >
                <Filter className="w-4 h-4" />
                FILTER
                {paymentFilterCount > 0 && (
                  <span className="rounded-full bg-[#A04A25] px-2 py-0.5 text-xs font-semibold text-white">
                    {paymentFilterCount}
                  </span>
                )}
              </button>
              {activeFilterTarget === 'payments' && (
                <FilterModal
                  mode="payments"
                  value={paymentFilters}
                  onChange={setPaymentFilters}
                  onClose={() => setActiveFilterTarget(null)}
                />
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-xs font-bold tracking-widest uppercase text-stone-500">
                <th className="px-6 py-4 font-bold">PRODUCT</th>
                <th className="px-6 py-4 font-bold">AMOUNT</th>
                <th className="px-6 py-4 font-bold">MAKING COST</th>
                <th className="px-6 py-4 font-bold">DATE</th>
                <th className="px-6 py-4 font-bold text-right">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-stone-500" colSpan={6}>
                    {transactions.length === 0 ? 'No transactions yet.' : 'No transactions match these filters.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
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
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx)}
                        disabled={deletingTransactionId === tx.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Delete payment for ${tx.product}`}
                        title="Delete payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      {activeTab === 'catalog' && (
        <div className="overflow-visible rounded-xl border border-stone-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <h2 className="text-xl font-medium text-stone-900">Product Catalog</h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveFilterTarget((current) => current === 'catalog' ? null : 'catalog')}
                className="flex w-fit items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
              >
                <Filter className="w-4 h-4" />
                FILTER
                {catalogFilterCount > 0 && (
                  <span className="rounded-full bg-[#A04A25] px-2 py-0.5 text-xs font-semibold text-white">
                    {catalogFilterCount}
                  </span>
                )}
              </button>
              {activeFilterTarget === 'catalog' && (
                <FilterModal
                  mode="catalog"
                  value={catalogFilters}
                  onChange={setCatalogFilters}
                  onClose={() => setActiveFilterTarget(null)}
                  typeOptions={catalogTypeOptions}
                />
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-xs font-bold tracking-widest uppercase text-stone-500">
                  <th className="px-6 py-4 font-bold">PRODUCT NAME</th>
                  <th className="px-6 py-4 font-bold">TYPE</th>
                  <th className="px-6 py-4 font-bold">QUANTITY</th>
                  <th className="px-6 py-4 font-bold">PRICE</th>
                  <th className="px-6 py-4 font-bold">MAKING COST</th>
                  <th className="px-6 py-4 font-bold">DUE DATE</th>
                  <th className="px-6 py-4 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-sm text-stone-500" colSpan={7}>
                      {catalog.length === 0 ? 'No products in catalog yet.' : 'No products match these filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((product) => (
                    <tr key={product.id} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5 font-medium text-stone-700">{product.name}</td>
                      <td className="px-6 py-5 text-stone-600">{product.type || '-'}</td>
                      <td className="px-6 py-5">{product.quantity}</td>
                      <td className="px-6 py-5">{product.price == null ? '-' : formatCurrency(product.price)}</td>
                      <td className="px-6 py-5">{product.makingCost == null ? '-' : formatCurrency(product.makingCost)}</td>
                      <td className="px-6 py-5 text-stone-500">{formatDate(product.dueDate)}</td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          disabled={deletingProductId === product.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${product.name}`}
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
