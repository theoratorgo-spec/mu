import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Expense } from '../types';

interface ExpenseChartsProps {
  expenses: Expense[];
}

const COLORS = ['#7aa2f7', '#2ac3de', '#9d7cd8', '#bb9af7', '#f7768e', '#e0af68', '#9ece6a', '#c0caf5'];

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; legend?: React.ReactNode }> = ({ title, children, legend }) => (
  <div className="bg-[#1e1e1e]/50 border border-gray-700/50 rounded-lg p-4">
    <h3 className="font-mono text-sm font-semibold text-blue-300 mb-4">
      <span className="text-green-400">$</span> {title}
    </h3>
    {children}
    {legend && <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center">{legend}</div>}
  </div>
);

export const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ expenses }) => {
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const weeklyData = useMemo(() => {
    const data = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { date: d.toISOString().split('T')[0], name: d.toLocaleDateString('en-US', { weekday: 'short' }), amount: 0 };
    }).reverse();
    
    expenses.forEach(e => {
      const item = data.find(d => d.date === e.date);
      if (item) item.amount += e.amount;
    });
    return data;
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <ChartContainer title="Expense Data">
        <div className="h-40 flex items-center justify-center text-gray-500 text-sm font-mono">
          [No expense data logged]
        </div>
      </ChartContainer>
    );
  }

  return (
    <div className="space-y-4">
      <ChartContainer 
        title="Spending by Category"
        legend={categoryData.map((entry, index) => (
          <div key={entry.name} className="flex items-center text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
            {entry.name}
          </div>
        ))}
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="#1e1e1e"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Amount']}
                contentStyle={{ 
                  background: '#24283b', 
                  border: '1px solid #414868', 
                  borderRadius: '4px',
                  color: '#c0caf5'
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <ChartContainer title="Last 7 Days Activity">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a829e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#7a829e' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(122, 162, 247, 0.1)' }}
                contentStyle={{ 
                  background: '#24283b', 
                  border: '1px solid #414868', 
                  borderRadius: '4px',
                  color: '#c0caf5'
                }}
                formatter={(value: number) => `৳${value.toFixed(2)}`}
              />
              <Bar dataKey="amount" fill="#7aa2f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>
    </div>
  );
};