import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Filter } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatStatus = (status?: string | null) => {
  if (!status) return 'PENDING';
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'COMPLETED';
  if (normalized === 'overdue') return 'OVERDUE';
  return 'PENDING';
};

type RecentTransaction = {
  id: string;
  amount: number;
  status: string | null;
  date: string | null;
  time: string | null;
  product: string | null;
};

type CatalogEntry = {
  id: string;
  name: string;
  material: string | null;
  quantity: number | null;
  price: number | null;
  making_cost: number | null;
  created_at: string | null;
};

export function Dashboard() {
  const { refreshKey } = useOutletContext<{ refreshKey: number }>();
  const [dashboardData, setDashboardData] = useState<{
    total_profit: number;
    total_expenses: number;
    due_amount: number;
    due_count: number;
    recent_transactions: RecentTransaction[];
    catalog_history: CatalogEntry[];
  }>({
    total_profit: 0,
    total_expenses: 0,
    due_amount: 0,
    due_count: 0,
    recent_transactions: [],
    catalog_history: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setLoadError('Sign in to view dashboard data.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard?user_id=${userId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Unable to load dashboard data.');
        }
        const data = await response.json();
        setDashboardData({
          total_profit: Number(data.total_profit) || 0,
          total_expenses: Number(data.total_expenses) || 0,
          due_amount: Number(data.due_amount) || 0,
          due_count: Number(data.due_count) || 0,
          recent_transactions: data.recent_transactions ?? [],
          catalog_history: data.catalog_history ?? [],
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Unable to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [refreshKey]);

  const recentTransactions = dashboardData.recent_transactions;
  const catalogHistory = dashboardData.catalog_history;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-medium text-[#8B3A1C]">Overview</h1>
        {/* Toggle (Week / Month) */}
        <div className="flex items-center text-sm font-medium">
          <button className="text-[#A04A25] border-b-2 border-[#A04A25] pb-1 px-1">WEEK</button>
          <button className="text-stone-400 hover:text-stone-600 pb-1 px-3">MONTH</button>
        </div>
      </div>

      {loadError && (
        <p className="text-sm text-red-600 mb-6" role="alert">
          {loadError}
        </p>
      )}
      {isLoading && !loadError && (
        <p className="text-sm text-stone-500 mb-6">Loading data...</p>
      )}
      
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold tracking-widest text-stone-600 uppercase">TOTAL PROFIT</h3>
            <TrendingUp className="w-5 h-5 text-stone-400" />
          </div>
          <div>
            <div className="text-4xl font-medium text-stone-900 mb-2">{formatCurrency(dashboardData.total_profit)}</div>
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">↑ 8.2%</span>
              <span className="text-xs text-stone-500">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold tracking-widest text-stone-600 uppercase">TOTAL EXPENSES</h3>
            <TrendingDown className="w-5 h-5 text-stone-400" />
          </div>
          <div>
            <div className="text-4xl font-medium text-stone-900 mb-2">{formatCurrency(dashboardData.total_expenses)}</div>
            <div className="flex items-center gap-2">
              <span className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">↓ 2.1%</span>
              <span className="text-xs text-stone-500">vs last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold tracking-widest text-stone-600 uppercase">IN-DUE PAYMENTS</h3>
            <AlertTriangle className="w-5 h-5 text-[#8B3A1C]" />
          </div>
          <div>
            <div className="text-4xl font-medium text-stone-900 mb-2">{formatCurrency(dashboardData.due_amount)}</div>
            <div className="flex items-center justify-between">
              <span className="bg-orange-100 text-[#A04A25] text-xs font-bold px-2 py-0.5 rounded">{dashboardData.due_count} Pending</span>
              <button className="text-xs font-bold tracking-widest uppercase text-[#8B3A1C] hover:underline">VIEW DETAILS</button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog History */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium text-stone-900 mb-1">Catalog History</h2>
            <p className="text-sm text-stone-500">Materials and production logs.</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900">
            FILTER
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-xs font-bold tracking-widest uppercase text-stone-500">
                <th className="px-6 py-4 font-bold">DATE</th>
                <th className="px-6 py-4 font-bold">MATERIAL USED</th>
                <th className="px-6 py-4 font-bold">QUANTITY</th>
                <th className="px-6 py-4 font-bold">NAME</th>
                <th className="px-6 py-4 font-bold">PRICE</th>
                <th className="px-6 py-4 font-bold">MAKING COST</th>
                <th className="px-6 py-4 font-bold text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {catalogHistory.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-stone-500" colSpan={7}>
                    No catalog entries yet.
                  </td>
                </tr>
              ) : (
                catalogHistory.map((entry) => (
                  <tr key={entry.id} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5">{formatDate(entry.created_at)}</td>
                    <td className="px-6 py-5 font-medium">{entry.material ?? '-'}</td>
                    <td className="px-6 py-5">{entry.quantity ?? '-'}</td>
                    <td className="px-6 py-5">{entry.name}</td>
                    <td className="px-6 py-5">{entry.price == null ? '-' : formatCurrency(entry.price)}</td>
                    <td className="px-6 py-5">{entry.making_cost == null ? '-' : formatCurrency(entry.making_cost)}</td>
                    <td className="px-6 py-5 text-right text-stone-500">{formatTime(entry.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium text-stone-900 mb-1">Payment History</h2>
            <p className="text-sm text-stone-500">Recent transactions across all products.</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900">
            FILTER
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-xs font-bold tracking-widest uppercase text-stone-500">
                <th className="px-6 py-4 font-bold">DATE</th>
                <th className="px-6 py-4 font-bold">PRODUCT</th>
                <th className="px-6 py-4 font-bold">AMOUNT</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-stone-500" colSpan={5}>
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const statusLabel = formatStatus(tx.status);
                  const statusClass = statusLabel === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : statusLabel === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800';

                  return (
                    <tr key={tx.id} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5">{formatDate(tx.date)}</td>
                      <td className="px-6 py-5 font-medium">{tx.product ?? '-'}</td>
                      <td className="px-6 py-5">{formatCurrency(Number(tx.amount) || 0)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-stone-500">{formatTime(tx.time)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}