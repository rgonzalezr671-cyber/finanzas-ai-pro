import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, FinancialSummary } from './types';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import FinancialCharts from './FinancialCharts';
import AiAdvisor from './AiAdvisor';
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
              {/* Botón de Exportar Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                title="Exportar a Excel"
              >
                <FileSpreadsheet size={16} />
                <span className="hidden sm:inline">Exportar Excel</span>
              </button>

              {/* Menú de Donaciones */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20">
                  <span>💛 Apoyar el Proyecto</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Menú Desplegable */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-dark-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 space-y-3">
                    {/* PayPal */}
                    <button
                      onClick={() => window.open('https://paypal.me/raul2510', '_blank')}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">PayPal</div>
                        <div className="text-xs text-gray-400">Tarjeta o transferencia</div>
                      </div>
                    </button>

                    {/* USDT TRC20 */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('THGK5x68gGqL6rZ6Gfyg8zF2vXy9kJivw9');
                        alert('Dirección USDT (TRC20) copiada al portapapeles');
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 transition-all"
                    >
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">T</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">USDT (TRC20)</div>
                        <div className="text-xs text-gray-400">Comisiones bajas</div>
                      </div>
                    </button>

                    {/* USDC ERC20 */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('0xee6d3cb8EB21372d1263C0623e9d6691A6362d47');
                        alert('Dirección USDC (ERC20) copiada al portapapeles');
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 transition-all"
                    >
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">U</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">USDC (ERC20)</div>
                        <div className="text-xs text-gray-400">Red Ethereum</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón de Borrar Historial */}
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
