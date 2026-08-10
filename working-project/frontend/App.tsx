import React from 'react';
import Dashboard from './pages/Dashboard';
import { DataProvider } from './context/DataContext';
import './theme.css';

export default function App() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Dashboard />
      </div>
    </DataProvider>
  );
}
