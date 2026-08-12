import React from 'react';

interface StageProps {
  title: string;
  count: number;
  amount: string;
  color: string;
}

const PipelineStage: React.FC<StageProps> = ({ title, count, amount, color }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-w-[200px]">
    <div className="flex justify-between items-center mb-2">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{title}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{count} Deals</span>
    </div>
    <div className="text-lg font-bold text-slate-800 dark:text-white">{amount}</div>
  </div>
);

export const SalesPipeline: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">📈 Sales Pipeline & Deals</h2>
      
      <div className="flex flex-wrap gap-4">
        <PipelineStage 
          title="New Leads" 
          count={12} 
          amount="₹4,50,000" 
          color="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
        />
        <PipelineStage 
          title="In Discussion" 
          count={5} 
          amount="₹8,20,000" 
          color="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" 
        />
        <PipelineStage 
          title="Proposal Sent" 
          count={3} 
          amount="₹3,10,000" 
          color="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" 
        />
        <PipelineStage 
          title="Closed / Won" 
          count={8} 
          amount="₹12,40,000" 
          color="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" 
        />
      </div>
    </div>
  );
};

export default SalesPipeline;
