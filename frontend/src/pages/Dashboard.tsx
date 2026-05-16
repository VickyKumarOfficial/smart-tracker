import { useEffect, useMemo, useState } from 'react';
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

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

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
type ChartTransaction = {
  id: string;
  amount: number;
  transaction_date: string | null;
  created_at: string | null;
};

type ChartProduct = {
  id: string;
  making_cost: number | null;
  transaction_date: string | null;
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
  const [activeRange, setActiveRange] = useState<'week' | 'month'>('month');
  const [showLiquidityChart, setShowLiquidityChart] = useState(false);
  const [activeReport, setActiveReport] = useState<'profit' | 'expenses'>('profit');
  const [chartTransactions, setChartTransactions] = useState<ChartTransaction[]>([]);
  const [chartProducts, setChartProducts] = useState<ChartProduct[]>([]);

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
        const [dashboardResponse, transactionsResponse, productsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dashboard?user_id=${userId}`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/transactions?user_id=${userId}`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/products?user_id=${userId}`, { signal: controller.signal }),
        ]);

        if (!dashboardResponse.ok) {
          const errorBody = await dashboardResponse.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Unable to load dashboard data.');
        }

        if (!transactionsResponse.ok) {
          const errorBody = await transactionsResponse.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Unable to load transactions.');
        }

        if (!productsResponse.ok) {
          const errorBody = await productsResponse.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Unable to load products.');
        }

        const data = await dashboardResponse.json();
        const transactionsData = (await transactionsResponse.json()) as ChartTransaction[];
        const productsData = (await productsResponse.json()) as ChartProduct[];
        setDashboardData({
          total_profit: Number(data.total_profit) || 0,
          total_expenses: Number(data.total_expenses) || 0,
          due_amount: Number(data.due_amount) || 0,
          due_count: Number(data.due_count) || 0,
          recent_transactions: data.recent_transactions ?? [],
          catalog_history: data.catalog_history ?? [],
        });
        setChartTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        setChartProducts(Array.isArray(productsData) ? productsData : []);
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
  const liquiditySeries = useMemo(() => {
    const now = new Date();
    const buckets =
      activeRange === 'month'
        ? Array.from({ length: 12 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
            return {
              key: getMonthKey(date),
              label: date.toLocaleDateString('en-IN', { month: 'short' }),
            };
          })
        : Array.from({ length: 7 }, (_, index) => {
            const date = new Date(now);
            date.setDate(now.getDate() - (6 - index));
            return {
              key: getLocalDateKey(date),
              label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
            };
          });

    const totals = new Map(buckets.map((bucket) => [bucket.key, 0]));
    const addToBucket = (date: Date, amount: number) => {
      const key = activeRange === 'month' ? getMonthKey(date) : getLocalDateKey(date);
      if (!totals.has(key)) return;
      totals.set(key, (totals.get(key) ?? 0) + amount);
    };

    if (activeReport === 'profit') {
      chartTransactions.forEach((tx) => {
        const date = normalizeDate(tx.transaction_date ?? tx.created_at);
        if (!date) return;
        addToBucket(date, Number(tx.amount) || 0);
      });
    }

    chartProducts.forEach((entry) => {
      const date = normalizeDate(entry.transaction_date ?? entry.created_at);
      if (!date) return;
      addToBucket(date, -Number(entry.making_cost) || 0);
    });

    const points = buckets.map((bucket) => ({
      label: bucket.label,
      value: totals.get(bucket.key) ?? 0,
    }));
    const maxAbs = Math.max(...points.map((point) => Math.abs(point.value)), 1);

    return { points, maxAbs };
  }, [activeRange, chartProducts, chartTransactions, activeReport]);
  const chartMaxAbs = liquiditySeries.maxAbs;
  const axisTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, index) => {
      const ratio = 1 - index / steps;
      return chartMaxAbs * (ratio * 2 - 1);
    });
  }, [chartMaxAbs]);
  const hasLiquidityData = liquiditySeries.points.some((point) => point.value !== 0);
  const isProfit = dashboardData.total_profit > 0;
  const profitPercentage =
    dashboardData.total_expenses > 0
      ? (dashboardData.total_profit / dashboardData.total_expenses) * 100
      : dashboardData.total_profit > 0
        ? 100
        : 0;
  const formattedProfitPercentage = `${profitPercentage > 0 ? '+' : ''}${profitPercentage.toFixed(1)}%`;
  const isProfitReportOpen = showLiquidityChart && activeReport === 'profit';
  const isExpenseReportOpen = showLiquidityChart && activeReport === 'expenses';
  const profitDetailsLabel = isProfitReportOpen ? 'HIDE DETAILS' : 'VIEW DETAILS';
  const expenseDetailsLabel = isExpenseReportOpen ? 'HIDE DETAILS' : 'VIEW DETAILS';
  const reportTitle = activeReport === 'expenses' ? 'Expense Report' : 'Liquidity Report';
  const reportDescription =
    activeReport === 'expenses'
      ? `Total making costs for the selected ${activeRange}.`
      : `Net payments minus making costs for the selected ${activeRange}.`;
  const axisLabel = activeReport === 'expenses' ? 'TOTAL EXPENSES (INR)' : 'NET LIQUIDITY (INR)';
  const chartMotionStyle = {
    maxHeight: showLiquidityChart ? '900px' : '0px',
    opacity: showLiquidityChart ? 1 : 0,
    transform: showLiquidityChart ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'max-height 500ms ease, opacity 350ms ease, transform 500ms ease',
  };
  const handleReportToggle = (report: 'profit' | 'expenses') => {
    setShowLiquidityChart((previous) => !(previous && activeReport === report));
    setActiveReport(report);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-medium text-[#8B3A1C]">Overview</h1>
        {/* Toggle (Week / Month) */}
        <div className="flex items-center text-sm font-medium">
          <button
            className={`pb-1 px-1 border-b-2 ${
              activeRange === 'week'
                ? 'text-[#A04A25] border-[#A04A25]'
                : 'text-stone-400 border-transparent hover:text-stone-600'
            }`}
            onClick={() => setActiveRange('week')}
            type="button"
          >
            WEEK
          </button>
          <button
            className={`pb-1 px-3 border-b-2 ${
              activeRange === 'month'
                ? 'text-[#A04A25] border-[#A04A25]'
                : 'text-stone-400 border-transparent hover:text-stone-600'
            }`}
            onClick={() => setActiveRange('month')}
            type="button"
          >
            MONTH
          </button>
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
      <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-3">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold tracking-widest text-stone-600 uppercase">TOTAL PROFIT</h3>
            <TrendingUp className="w-5 h-5 text-stone-400" />
          </div>
          <div>
            <div className="text-4xl font-medium text-stone-900 mb-2">{formatCurrency(dashboardData.total_profit)}</div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {formattedProfitPercentage}
              </span>
              <span className={`text-xs font-semibold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                {isProfit ? 'PROFIT' : 'LOSS'}
              </span>
            </div>
            <button
              className="mt-4 text-xs font-bold tracking-widest uppercase text-[#8B3A1C] hover:underline"
              onClick={() => handleReportToggle('profit')}
              type="button"
              aria-expanded={isProfitReportOpen}
              aria-controls="liquidity-report"
            >
              {profitDetailsLabel}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold tracking-widest text-stone-600 uppercase">TOTAL EXPENSES</h3>
            <TrendingDown className="w-5 h-5 text-stone-400" />
          </div>
          <div>
            <div className="text-4xl font-medium text-stone-900 mb-2">{formatCurrency(dashboardData.total_expenses)}</div>
            <span className="text-xs text-stone-500">Calculated from total making cost.</span>
            <button
              className="mt-4 text-xs font-bold tracking-widest uppercase text-[#8B3A1C] hover:underline"
              onClick={() => handleReportToggle('expenses')}
              type="button"
              aria-expanded={isExpenseReportOpen}
              aria-controls="liquidity-report"
            >
              {expenseDetailsLabel}
            </button>
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

      <div
        aria-hidden={!showLiquidityChart}
        className={`overflow-hidden ${showLiquidityChart ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={chartMotionStyle}
      >
        <div className="pb-12">
          <div
            id="liquidity-report"
            className="bg-white rounded-xl p-6 shadow-sm border border-stone-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-medium text-stone-900 mb-1">{reportTitle}</h2>
                <p className="text-sm text-stone-500">{reportDescription}</p>
              </div>
              <button
                className="text-xs font-bold tracking-widest uppercase text-[#8B3A1C] hover:underline"
                onClick={() => setShowLiquidityChart(false)}
                type="button"
              >
                HIDE
              </button>
            </div>

            {!hasLiquidityData ? (
              <div className="rounded-lg border border-dashed border-stone-200 px-6 py-10 text-center text-sm text-stone-500">
                No liquidity data available for the selected range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="flex gap-4">
                    <div className="flex min-w-[80px] flex-col justify-between text-[11px] font-medium text-stone-400">
                      {axisTicks.map((tick, index) => (
                        <span key={`tick-${index}`} className="text-right">
                          {formatCurrency(tick)}
                        </span>
                      ))}
                    </div>

                    <div className="flex-1">
                      <div className="relative h-64">
                        <div className="absolute inset-0">
                          {Array.from({ length: 5 }, (_, index) => (
                            <div
                              key={`grid-${index}`}
                              className={`absolute left-0 right-0 border-t ${index === 2 ? 'border-stone-200' : 'border-stone-100'}`}
                              style={{ top: `${(index / 4) * 100}%` }}
                            />
                          ))}
                        </div>

                        <div
                          className={`grid h-full ${
                            activeRange === 'month' ? 'grid-cols-12' : 'grid-cols-7'
                          } items-stretch`}
                        >
                          {liquiditySeries.points.map((point, index) => {
                            const heightPercent =
                              point.value === 0
                                ? 0
                                : Math.max((Math.abs(point.value) / chartMaxAbs) * 50, 2);
                            const isPositive = point.value >= 0;

                            return (
                              <div key={`${point.label}-${index}`} className="relative flex items-center justify-center">
                                <div
                                  className={`absolute left-1/2 w-5 -translate-x-1/2 sm:w-7 ${
                                    isPositive
                                      ? 'bottom-1/2 rounded-t-md bg-emerald-500'
                                      : 'top-1/2 rounded-b-md bg-red-500'
                                  }`}
                                  style={{ height: `${heightPercent}%`, transition: 'height 700ms ease' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className={`mt-3 grid ${
                          activeRange === 'month' ? 'grid-cols-12' : 'grid-cols-7'
                        } text-xs font-medium text-stone-500`}
                      >
                        {liquiditySeries.points.map((point, index) => (
                          <span key={`${point.label}-label-${index}`} className="text-center">
                            {point.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-[11px] font-semibold tracking-[0.2em] text-stone-400">
                    {axisLabel}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 mt-6 text-xs font-medium text-stone-600">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                Negative Liquidity
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Positive Liquidity
              </span>
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