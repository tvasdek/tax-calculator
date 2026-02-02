import React from 'react';
import { MonthlyStats } from '../types';

interface ThreeDBarChartProps {
  data: MonthlyStats[];
  showIncome: boolean;
  showExpenses: boolean;
}

const ThreeDBarChart: React.FC<ThreeDBarChartProps> = ({ data, showIncome, showExpenses }) => {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses))
  ) * 1.2 || 1000;

  return (
    <div className="w-full h-80 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-slate-50/50 pointer-events-none grid grid-cols-1 grid-rows-4 opacity-30">
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
      </div>
      
      <div className="chart-container-3d flex items-end justify-around w-full h-48 sm:h-64 px-8 space-x-4 sm:space-x-8 transform rotate-x-12">
        {data.map((item, index) => {
          const incomeHeight = (item.income / maxVal) * 100;
          const expenseHeight = (item.expenses / maxVal) * 100;

          return (
            <div key={item.month} className="relative flex flex-col items-center group w-full">
              {/* Tooltip */}
              <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs p-2 rounded z-20 whitespace-nowrap pointer-events-none">
                 <div className="font-bold">{item.month}</div>
                 <div>Inc: €{item.income.toFixed(0)}</div>
                 <div>Exp: €{item.expenses.toFixed(0)}</div>
              </div>

              <div className="relative w-full flex justify-center items-end space-x-1 sm:space-x-2 h-full bar-3d-group">
                
                {/* Income Bar */}
                {showIncome && (
                  <div
                    className="bar-3d w-3 sm:w-6 transition-all duration-700 ease-out text-emerald-500 hover:text-emerald-400"
                    style={{ height: `${incomeHeight}%` }}
                  >
                    <div className="bar-face face-front"></div>
                    <div className="bar-face face-back"></div>
                    <div className="bar-face face-right"></div>
                    <div className="bar-face face-left"></div>
                    <div className="bar-face face-top"></div>
                  </div>
                )}

                {/* Expense Bar */}
                {showExpenses && (
                  <div
                    className="bar-3d w-3 sm:w-6 transition-all duration-700 ease-out text-rose-500 hover:text-rose-400"
                    style={{ height: `${expenseHeight}%` }}
                  >
                     <div className="bar-face face-front"></div>
                     <div className="bar-face face-back"></div>
                     <div className="bar-face face-right"></div>
                     <div className="bar-face face-left"></div>
                     <div className="bar-face face-top"></div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-xs font-medium text-slate-500 transform translate-z-0">{item.month}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreeDBarChart;