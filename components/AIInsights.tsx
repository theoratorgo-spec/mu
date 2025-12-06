import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Expense, PrayerDay, AIInsightData } from '../types';
import { generateInsights } from '../services/geminiService';

interface AIInsightsProps {
  expenses: Expense[];
  prayers: PrayerDay[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ expenses, prayers }) => {
  const [data, setData] = useState<AIInsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateInsights(expenses, prayers);
      setData(result);
    } catch (e) {
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading && !error) {
    return (
      <button
        onClick={handleGenerate}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
      >
        <Sparkles size={20} />
        <span>Generate AI Insights</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
          <Sparkles className="text-indigo-600" size={20} />
          <h3>Daily Coach</h3>
        </div>
        <button 
            onClick={handleGenerate} 
            disabled={loading}
            className={`p-2 rounded-full hover:bg-indigo-100 text-indigo-600 transition-all ${loading ? 'animate-spin' : ''}`}
        >
            <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
            <div className="h-4 bg-indigo-200 rounded w-full"></div>
            <div className="h-4 bg-indigo-200 rounded w-5/6"></div>
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm text-center">{error}</p>
      ) : (
        <div className="space-y-5">
            <div className="bg-white/60 p-3 rounded-xl">
                <p className="text-sm text-gray-800 font-medium italic">"{data?.summary}"</p>
            </div>
            
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Finance</h4>
                <ul className="space-y-2">
                    {data?.financialAdvice.map((advice, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-indigo-500">•</span>
                            {advice}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2">Spirituality</h4>
                <ul className="space-y-2">
                    {data?.spiritualEncouragement.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-emerald-500">•</span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </div>
  );
};