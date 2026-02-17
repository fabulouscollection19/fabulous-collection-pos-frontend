import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Calendar, Search, Download, Filter, Receipt, User, ArrowRight } from 'lucide-react';
import { Button, Card, PageHeader, Input } from '../components/UIComponents';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState(null);

  const fetchTransactions = async (date = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/transactions${date ? `?date=${date}` : ''}`);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError("Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const parseItems = (items) => {
    try {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items;
      if (Array.isArray(parsed)) {
        return parsed.map(i => ({
          name: i.name || i.product_name || 'Item',
          qty: i.qty || i.quantity || 1
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="container-tablet">
      <PageHeader
        title="Transaction Records"
        subtitle="Historical sale manifest and revenue logs"
        icon={CreditCard}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchTransactions(e.target.value);
                }}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all shadow-sm"
              />
            </div>
            <Button variant="secondary" icon={Download} className="h-10">Export</Button>
          </div>
        }
      />

      <Card className="overflow-hidden border-slate-100 p-0 mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Ref</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchased Items</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Method</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Decrypting Logs...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Receipt className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No records matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.map((txn, idx) => {
                const items = parseItems(txn.items_purchased);
                return (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={txn.transaction_id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-base">#{txn.transaction_id.toString().padStart(6, '0')}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {formatDate(txn.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <p className="font-black text-slate-900 text-sm whitespace-nowrap">{txn.customer_name || 'Counter Customer'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {items.length > 0 ? items.map((item, i) => (
                          <span key={i} className="text-[10px] font-bold text-slate-600">
                            {item.name} <span className="text-slate-400">x{item.qty}</span>{i < items.length - 1 ? ',' : ''}
                          </span>
                        )) : <span className="text-[10px] text-slate-400 italic">N/A</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <span className="text-base font-black text-slate-900 tracking-tight">₹{txn.total_amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center align-top">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {txn.payment_mode || 'CASH'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center align-top">
                      <div className="inline-flex items-center gap-1.5 py-1 text-emerald-600">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TransactionsPage;
