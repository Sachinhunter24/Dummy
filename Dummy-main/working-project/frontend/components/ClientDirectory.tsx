import React, { useState } from 'react';

interface Client {
  id: string;
  name: string;
  phone: string;
  status: 'Active' | 'VIP' | 'Inactive';
  category: string;
}

export const ClientDirectory: React.FC = () => {
  const [search, setSearch] = useState('');
  
  const sampleClients: Client[] = [
    { id: '1', name: 'Sharma Logistics', phone: '+91 9876543210', status: 'VIP', category: 'Logistics' },
    { id: '2', name: 'Verma Legal Associates', phone: '+91 9123456789', status: 'Active', category: 'Lawyer' },
    { id: '3', name: 'Apex Pharmacy', phone: '+91 9988776655', status: 'Inactive', category: 'Pharmacy' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">📑 Client Directory & Khata</h2>
        <input
          type="text"
          placeholder="Search client, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-lg dark:bg-slate-700 dark:text-white border-slate-300 dark:border-slate-600 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleClients.map((client) => (
              <tr key={client.id} className="border-b border-slate-200 dark:border-slate-700">
                <td className="p-3 font-medium text-slate-900 dark:text-white">{client.name}</td>
                <td className="p-3">{client.phone}</td>
                <td className="p-3">{client.category}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    client.status === 'VIP' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' :
                    client.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientDirectory;
