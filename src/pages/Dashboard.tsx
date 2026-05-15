import { TrendingUp, TrendingDown, AlertTriangle, Filter } from 'lucide-react';

const recentTransactions = [
  { date: 'Oct 24, 2023', time: '14:30 PM', product: 'Custom Oak Table', amount: '₹1,200.00', status: 'PAID' },
  { date: 'Oct 22, 2023', time: '09:15 AM', product: 'Ceramic Vase Set', amount: '₹350.00', status: 'PAID' },
  { date: 'Oct 15, 2023', time: '16:45 PM', product: 'Leather Briefcase', amount: '₹850.00', status: 'OVERDUE' },
  { date: 'Oct 10, 2023', time: '11:00 AM', product: 'Silver Pendant', amount: '₹220.00', status: 'PENDING' },
];

const catalogHistory = [
  { date: 'Oct 26, 2023', time: '10:10 AM', material: 'Walnut Wood', quantity: '12 pcs', name: 'Dining Chair Set', price: '₹980.00' },
  { date: 'Oct 21, 2023', time: '15:20 PM', material: 'Stoneware Clay', quantity: '24 kg', name: 'Vase Batch', price: '₹420.00' },
  { date: 'Oct 14, 2023', time: '09:05 AM', material: 'Sterling Silver', quantity: '8 oz', name: 'Pendant Series', price: '₹760.00' },
  { date: 'Oct 08, 2023', time: '18:40 PM', material: 'Full-Grain Leather', quantity: '14 sq ft', name: 'Briefcase Run', price: '₹1,150.00' },
];

export function Dashboard() {
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
      
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold tracking-widest text-stone-600 uppercase">TOTAL PROFIT</h3>
            <TrendingUp className="w-5 h-5 text-stone-400" />
          </div>
          <div>
            <div className="text-4xl font-medium text-stone-900 mb-2">₹12,450.00</div>
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
            <div className="text-4xl font-medium text-stone-900 mb-2">₹3,120.50</div>
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
            <div className="text-4xl font-medium text-stone-900 mb-2">₹1,850.00</div>
            <div className="flex items-center justify-between">
              <span className="bg-orange-100 text-[#A04A25] text-xs font-bold px-2 py-0.5 rounded">4 Pending</span>
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
                <th className="px-6 py-4 font-bold text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {catalogHistory.map((entry, i) => (
                <tr key={i} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-5">{entry.date}</td>
                  <td className="px-6 py-5 font-medium">{entry.material}</td>
                  <td className="px-6 py-5">{entry.quantity}</td>
                  <td className="px-6 py-5">{entry.name}</td>
                  <td className="px-6 py-5">{entry.price}</td>
                  <td className="px-6 py-5 text-right text-stone-500">{entry.time}</td>
                </tr>
              ))}
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
              {recentTransactions.map((tx, i) => (
                <tr key={i} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-5">{tx.date}</td>
                  <td className="px-6 py-5 font-medium">{tx.product}</td>
                  <td className="px-6 py-5">{tx.amount}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      tx.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      tx.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-stone-500">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}