import React from 'react';
import { Transaction } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  return (
    <div className="bg-dark-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-700 shrink-0">
        <h3 className="text-lg font-bold text-white">Historial Reciente</h3>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <p>No hay transacciones aún.</p>
          </div>
        ) : (
          transactions.slice().reverse().map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50 hover:bg-dark-900 border border-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{t.description}</p>
                  <p className="text-xs text-gray-500">{t.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Borrar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;