import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import LoginRegister from './pages/LoginRegister';
import Dashboard from './pages/Dashboard';

function Application() {
  const { isLoggedIn } = useApp();

  return isLoggedIn ? <Dashboard /> : <LoginRegister />;
}

export default function App() {
  return (
    <AppProvider>
      <DataProvider>
        <Application />
      </DataProvider>
    </AppProvider>
  );
}
