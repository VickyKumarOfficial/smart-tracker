const recentChats = [
  { title: 'Material Sourcing: Copper', abstract: 'I need a local supplier for 18-gauge...', time: '10:30 AM' },
  { title: 'Q3 Inventory Audit', abstract: 'Can you summarize the discrepancies...', time: 'Yesterday' },
  { title: 'Kiln Maintenance', abstract: 'Schedule a checkup for the Skutt 12...', time: 'Oct 20' },
  { title: 'Client X Commission', abstract: 'Draft an invoice for the custom walnu...', time: 'Oct 15' },
];

export function AIAssistant() {
  return (
    <div className="flex bg-white rounded-xl shadow-sm border border-stone-100 mt-8 h-[calc(100vh-140px)] overflow-hidden">
      {/* Left Pane - Recent Chats */}
      <div className="w-80 border-r border-[#F0EBE6] flex flex-col">
        <div className="p-6 border-b border-[#F0EBE6]">
          <h2 className="text-xl font-medium text-stone-900">Recent Chats</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {recentChats.map((chat, i) => (
            <div 
              key={i} 
              className={`p-4 border-b border-[#F0EBE6] cursor-pointer transition-colors ${
                i === 0 ? 'bg-[#FAF5F2] border-l-2 border-l-[#8B3A1C]' : 'hover:bg-stone-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className={`text-sm font-semibold truncate pr-2 ${i === 0 ? 'text-[#8B3A1C]' : 'text-stone-800'}`}>
                  {chat.title}
                </h3>
                <span className="text-[10px] text-stone-400 whitespace-nowrap mt-0.5">{chat.time}</span>
              </div>
              <p className="text-xs text-stone-500 truncate">{chat.abstract}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Chat Window (Empty state matching screenshot) */}
      <div className="flex-1 bg-[#FCFBFA] flex items-center justify-center">
        {/* Placeholder for actual chat interface */}
      </div>
    </div>
  );
}
