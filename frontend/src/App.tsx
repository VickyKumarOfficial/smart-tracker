/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthLayout } from './components/AuthLayout';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { AIAssistant } from './pages/AIAssistant';
import { Account } from './pages/Account';

const ProtectedRoute = () => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  return isAuth ? <Layout /> : <Navigate to="/signin" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/settings" element={<div className="max-w-4xl mx-auto py-8"><h1 className="text-3xl font-medium text-stone-900 mb-8">Settings</h1><p className="text-stone-500 bg-white p-6 rounded-xl border border-stone-100 shadow-sm">Settings page coming soon.</p></div>} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
