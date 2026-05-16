import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AddItemModal } from './AddItemModal';

export function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex bg-[#FCFBFA] min-h-screen font-sans text-stone-900">
      <Sidebar onAddItem={() => setIsModalOpen(true)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onAddItem={() => setIsModalOpen(true)} />
        <main className="flex-1 overflow-y-auto px-8 pb-12">
          <Outlet context={{ refreshKey }} />
        </main>
      </div>
      
      {isModalOpen && (
        <AddItemModal
          onClose={() => setIsModalOpen(false)}
          onItemAdded={() => setRefreshKey((current) => current + 1)}
        />
      )}
    </div>
  );
}
