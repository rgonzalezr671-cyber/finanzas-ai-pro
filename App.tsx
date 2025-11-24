import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, FinancialSummary } from './types';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import FinancialCharts from './components/FinancialCharts';
import AiAdvisor from './components/AiAdvisor';
import { Wallet, TrendingUp, TrendingDown, Trash2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  // Initial state loaded from localStorage or empty
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Default mock data for demonstration
    return [
      { id: '1', description: 'Sueldo Mensual', amount: 2500, type: 'income', date: '2023-10-01' },
      { id: '2', description: 'Alquiler', amount: 900, type: 'expense', date: '2023-10-05' },
      { id: '3', description: 'Supermercado', amount: 350, type: 'expense', date: '2023-10-08' },
      { id: '4', description: 'Freelance Project', amount: 600, type: 'income', date: '2023-10-15' },
    ];
  });

  // State to force re-render of Advisor when data is cleared
  const [advisorKey, setAdvisorKey] = useState(0);
  
  // State for delete confirmation button
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleClearAll = () => {
    if (isConfirmingDelete) {
      // Acción confirmada: borrar todo
      setTransactions([]);
      setAdvisorKey(prev => prev + 1); // Forces AiAdvisor to reset its internal state
      localStorage.removeItem('transactions'); // Force explicit clear
      setIsConfirmingDelete(false);
    } else {
      // Solicitar confirmación
      setIsConfirmingDelete(true);
      
      // Resetear el estado de confirmación después de 3 segundos si no se confirma
      setTimeout(() => {
        setIsConfirmingDelete(false);
      }, 3000);
    }
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // 1. Ordenar cronológicamente (más antiguo primero) para que el saldo acumulado tenga sentido
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;

    // 2. Preparar datos con estructura de columnas separadas y saldo acumulado
    const dataToExport = sortedTransactions.map(t => {
      const isIncome = t.type === 'income';
      const amount = t.amount;

      // Calcular saldo acumulado
      if (isIncome) {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      // Formatear fecha de YYYY-MM-DD a DD/MM/AAAA
      const [year, month, day] = t.date.split('-');
      const formattedDate = `${day}/${month}/${year}`;

      return {
        "Fecha": formattedDate,
        "Descripción": t.description,
        "Ingresos": isIncome ? amount : "", // Dejar vacío si no es ingreso
        "Egresos": !isIncome ? amount : "", // Dejar vacío si no es egreso
        "Saldo": runningBalance
      };
    });

    // 3. Crear Hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // 4. Ajustar ancho de columnas
    const wscols = [
      { wch: 12 }, // Fecha
      { wch: 35 }, // Descripción
      { wch: 15 }, // Ingresos
      { wch: 15 }, // Egresos
      { wch: 15 }  // Saldo
    ];
    ws['!cols'] = wscols;

    // 5. Aplicar Formatos de Moneda y Colores (Usando códigos de formato de Excel)
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];

        if (!cell) continue;

        // Fila 0 es encabezado, saltarla
        if (R === 0) continue;

        // Columna C (2) = Ingresos, D (3) = Egresos
        if (C === 2 || C === 3) {
           if (typeof cell.v === 'number') {
             cell.z = '"$"#,##0.00'; // Formato moneda simple
           }
        }

        // Columna E (4) = Saldo
        // Aquí aplicamos el formato condicional nativo de Excel: [Green] para positivo, [Red] para negativo
        if (C === 4) {
           cell.z = '[Green]"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'; 
        }
      }
    }

    // 6. Crear Libro y Descargar
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial Financiero");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `historial_financiero_${dateStr}.xlsx`);
  };

  // Calculate summary
  const summary: FinancialSummary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 pb-12">
      {/* Navbar */}
      <nav className="bg-dark-800 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Wallet className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Finanzas AI Pro
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                title="Exportar a Excel"
              >
                <FileSpreadsheet size={16} />
                <span className="hidden sm:inline">Exportar Excel</span>
              </button>

              <button 
                type="button"
                onClick={handleClearAll}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer border ${
                  isConfirmingDelete 
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                    : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20'
                }`}
                title="Borrar todo y poner saldos en cero"
              >
                {isConfirmingDelete ? (
                  <>
                    <AlertTriangle size={16} />
                    <span>¿Estás seguro?</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Borrar Historial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                <Wallet size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Balance Total</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  ${summary.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ingresos Totales</p>
                <p className="text-2xl font-bold text-emerald-400">
                  ${summary.totalIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-full text-rose-400">
                <TrendingDown size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Gastos Totales</p>
                <p className="text-2xl font-bold text-rose-400">
                  ${summary.totalExpense.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Analysis & AI Advisor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 h-auto lg:h-[420px]">
          <div className="lg:col-span-2 h-[400px] lg:h-full">
            <FinancialCharts summary={summary} />
          </div>
          <div className="lg:col-span-1 h-[400px] lg:h-full">
            <AiAdvisor key={advisorKey} summary={summary} transactions={transactions} />
          </div>
        </div>

        {/* Row 2: Transactions Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-full">
             <TransactionForm onAddTransaction={handleAddTransaction} />
          </div>
          <div className="lg:col-span-2 h-full min-h-[400px]">
             <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;