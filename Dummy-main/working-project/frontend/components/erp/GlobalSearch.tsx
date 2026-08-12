import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface GlobalSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  onSearch, 
  placeholder = "Search across invoices, clients, inventory, GST..." 
}) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
      />
    </div>
  );
};

export default GlobalSearch;
