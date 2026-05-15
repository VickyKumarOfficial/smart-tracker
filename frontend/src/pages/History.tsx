import { Filter } from 'lucide-react';

const ledgerTransactions = [
  { initials: 'EW', color: 'bg-green-100 text-green-800', client: 'Eleanor Vance', amount: '$1,250.00', date: 'Oct 24, 2023', status: 'COMPLETED' },
  { initials: 'TR', color: 'bg-[#A04A25] text-white', client: 'Thomas Rye', amount: '$480.00', date: 'Oct 22, 2023', status: 'PENDING' },
  { initials: 'SL', color: 'bg-stone-200 text-stone-700', client: 'Sarah Lin', amount: '$890.50', date: 'Oct 18, 2023', status: 'COMPLETED' },
  { initials: 'MD', color: 'bg-red-100 text-red-800', client: 'Marcus Dean', amount: '$3,400.00', date: 'Oct 15, 2023', status: 'OVERDUE' },
  { initials: 'AB', color: 'bg-green-100 text-green-800', client: 'Anna Bates', amount: '$150.00', date: 'Oct 12, 2023', status: 'COMPLETED' },
];

export function History() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-medium text-stone-900 mb-8">Ledger History</h1>
      
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
              <th className="px-6 py-4 font-bold">CLIENT</th>
              <th className="px-6 py-4 font-bold">AMOUNT</th>
              <th className="px-6 py-4 font-bold">DATE</th>
              <th className="px-6 py-4 font-bold text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {ledgerTransactions.map((tx, i) => (
              <tr key={i} className="text-sm text-stone-900 hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${tx.color}`}>
                    {tx.initials}
                  </div>
                  <span className="font-medium text-stone-700">{tx.client}</span>
                </td>
                <td className="px-6 py-5">{tx.amount}</td>
                <td className="px-6 py-5 text-stone-500">{tx.date}</td>
                <td className="px-6 py-5 text-right">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                      tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      tx.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-[#A04A25]'
                    }`}>
                      {tx.status}
                    </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
