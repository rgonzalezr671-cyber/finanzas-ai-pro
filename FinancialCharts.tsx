import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { FinancialSummary } from '../types';
import { PieChart as PieIcon, BarChart as BarIcon } from 'lucide-react';

interface FinancialChartsProps {
  summary: FinancialSummary;
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ summary }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const barData = [
    {
      name: 'Ingresos',
      amount: summary.totalIncome,
      fill: '#10b981', // Emerald 500
    },
    {
      name: 'Egresos',
      amount: summary.totalExpense,
      fill: '#ef4444', // Red 500
    },
  ];

  const pieData = [
    { name: 'Ingresos', value: summary.totalIncome },
    { name: 'Egresos', value: summary.totalExpense },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  // Custom tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-gray-700 p-2 rounded shadow-lg">
          <p className="text-gray-200 font-medium">{`${label || payload[0].name}: $${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-dark-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Análisis Visual</h2>
        <div className="flex space-x-2 bg-dark-900 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-md transition-colors ${
              chartType === 'bar'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            aria-label="Ver gráfico de barras"
          >
            <BarIcon size={20} />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-md transition-colors ${
              chartType === 'pie'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            aria-label="Ver gráfico circular"
          >
            <PieIcon size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} />
              <YAxis stroke="#9ca3af" tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} animationDuration={1500}>
                {barData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialCharts;