import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Clock } from 'lucide-react';
import { FinancialSummary, Transaction } from '../types';
import ReactMarkdown from 'react-markdown';

interface AiAdvisorProps {
  summary: FinancialSummary;
  transactions: Transaction[];
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ summary, transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Effect to handle the 120-second timer when advice is set
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    if (advice) {
      setTimeLeft(120); // 2 minutes
      
      // Timer to clear the advice after 120 seconds
      timer = setTimeout(() => {
        setAdvice(null);
        setTimeLeft(0);
      }, 120000);

      // Interval to update the countdown visual (optional but helpful for UX)
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    // Cleanup function to clear timers if component unmounts or advice changes
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [advice]);

  const handleGetAdvice = async () => {
    if (transactions.length === 0) {
      setAdvice("💡 **Por favor agrega algunas transacciones primero** para que pueda analizar tus finanzas y darte consejos personalizados.");
      return;
    }

    setLoading(true);
    
    // Simular un pequeño delay para que parezca que está "pensando"
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const { totalIncome, totalExpense, balance } = summary;
      const recentTransactions = transactions.slice(-10); // Últimas 10 transacciones
      
      // ANÁLISIS INTELIGENTE BASADO EN LOS DATOS REALES
      let adviceMessage = "";
      
      // Análisis de Balance
      if (balance < 0) {
        adviceMessage += "⚠️ **Alerta**: Tu balance es negativo. Esto indica que estás gastando más de lo que ganas. ";
      } else if (balance > totalIncome * 0.3) {
        adviceMessage += "✅ **Excelente**: Tienes un buen colchón de ahorros. ";
      } else if (balance > 0) {
        adviceMessage += "👍 **Bien**: Tu balance es positivo, pero podrías ahorrar más. ";
      }
      
      // Análisis de Gastos vs Ingresos
      const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
      
      if (expenseRatio > 90) {
        adviceMessage += `📊 **Estás usando el ${expenseRatio.toFixed(0)}% de tus ingresos en gastos**. Esto es muy alto. `;
      } else if (expenseRatio > 70) {
        adviceMessage += `📊 **Estás usando el ${expenseRatio.toFixed(0)}% de tus ingresos**. Considera reducir algunos gastos. `;
      } else if (expenseRatio > 0) {
        adviceMessage += `📊 **Buen control**: Solo usas el ${expenseRatio.toFixed(0)}% de tus ingresos. `;
      }
      
      // Consejos específicos basados en patrones
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      const incomeTransactions = transactions.filter(t => t.type === 'income');
      
      if (expenseTransactions.length > incomeTransactions.length * 2) {
        adviceMessage += "💸 **Tienes muchos gastos registrados**. Revisa cuáles son esenciales. ";
      }
      
      if (totalIncome === 0) {
        adviceMessage += "🎯 **Prioridad**: Enfócate en generar ingresos. ";
      }
      
      // Consejos de ahorro
      if (balance > 500) {
        adviceMessage += "💰 **Sugerencia**: Considera invertir parte de tus ahorros. ";
      } else if (balance < 100) {
        adviceMessage += "🔔 **Recomendación**: Construye un fondo de emergencia. ";
      }
      
      // Análisis de frecuencia
      if (recentTransactions.length >= 5) {
        const lastTransaction = recentTransactions[recentTransactions.length - 1];
        const daysAgo = Math.floor((new Date().getTime() - new Date(lastTransaction.date).getTime()) / (1000 * 3600 * 24));
        
        if (daysAgo <= 1) {
          adviceMessage += "⚡ **Actividad reciente**: Mantén este seguimiento constante. ";
        }
      }
      
      // Mensaje final motivacional
      adviceMessage += `\n\n✨ **Resumen**: Balance: $${balance} | Ingresos: $${totalIncome} | Gastos: $${totalExpense}`;
      adviceMessage += `\n\n💡 **Siguiente paso**: ${balance < 0 ? "Enfócate en reducir gastos no esenciales." : "Mantén tu buen trabajo y establece metas de ahorro."}`;
      
      setAdvice(adviceMessage);
      
    } catch (err) {
      setAdvice("❌ Ocurrió un error al analizar tus finanzas. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border border-indigo-500/30 p-6 rounded-xl shadow-lg backdrop-blur-sm relative overflow-hidden h-full flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Sparkles className="text-indigo-300" size={24} />
            </div>
            <h2 className="text-xl font-bold text-indigo-100">Consejero IA</h2>
          </div>
          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-indigo-500/25"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {loading ? 'Analizando...' : 'Obtener Consejo'}
          </button>
        </div>

        <div className="bg-dark-900/60 rounded-lg p-4 border border-indigo-500/10 flex-1 overflow-y-auto min-h-0 custom-scrollbar relative">
          {advice ? (
            <>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 pb-6">
                <ReactMarkdown>{advice}</ReactMarkdown>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-500 bg-dark-900/80 px-2 py-1 rounded-full border border-gray-700/50">
                <Clock size={12} />
                <span>Desaparece en {timeLeft}s</span>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-2">
              <p className="text-sm">
                Tu asesor personal está listo.
              </p>
              <p className="text-xs opacity-70">
                Haz clic en "Obtener Consejo" para recibir un análisis basado en tus movimientos recientes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAdvisor;
