import React, { useState } from 'react';

interface Staff {
  id: string;
  name: string;
  role: 'Manager' | 'Staff' | 'Security';
  status: 'Active' | 'Blocked';
  attendance: 'Present' | 'Absent';
}

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([
    { id: '1', name: 'Rahul Sharma', role: 'Manager', status: 'Active', attendance: 'Present' },
    { id: '2', name: 'Amit Kumar', role: 'Staff', status: 'Active', attendance: 'Present' },
    { id: '3', name: 'Vikram Singh', role: 'Security', status: 'Blocked', attendance: 'Absent' },
  ]);

  const toggleBlockStatus = (id: string) => {
    setStaffList(prev => prev.map(member => {
      if (member.id === id) {
        return {
          ...member,
          status: member.status === 'Active' ? 'Blocked' : 'Active'
        };
      }
      return member;
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">👨‍💼 Staff Hazari & Access Control</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage staff attendance and ID access status</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200">
            <tr>
              <th className="p-3">Staff Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Attendance</th>
              <th className="p-3">Access Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((member) => (
              <tr key={member.id} className="border-b border-slate-200 dark:border-slate-700">
                <td className="p-3 font-medium text-slate-900 dark:text-white">{member.name}</td>
                <td className="p-3">{member.role}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    member.attendance === 'Present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'
                  }`}>
                    {member.attendance}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    member.status === 'Active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleBlockStatus(member.id)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      member.status === 'Active' 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {member.status === 'Active' ? 'Block ID' : 'Unblock ID'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManagement;
