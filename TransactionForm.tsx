import React, { useState } from 'react';
import { PlusCircle, MinusCircle, DollarSign, Tag } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TransactionFormProps {
  onAddTransaction: (transaction: Transaction) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTransaction: Transaction = {
      id: uuidv4(),
      description,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString().split('T')[0],
    };

    onAddTransaction(newTransaction);
    setDescription('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-dark-800 p-6 rounded-xl shadow-lg border border-gray-700 h-full">
      <h3 className="text-lg font-bold text-white mb-6">Nueva Transacción</h3>
      
      <div className="space-y-4">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-4 p-1 bg-dark-900 rounded-lg border border-gray-700">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <PlusCircle size={18} />
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MinusCircle size={18} />
            Gasto
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 ml-1">Monto</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={16} className="text-gray-500" />
            </div>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 ml-1">Descripción</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Salario, Supermercado..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 mt-4 rounded-lg font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
            type === 'income' 
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' 
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
          }`}
        >
          Agregar {type === 'income' ? 'Ingreso' : 'Gasto'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;