import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar } from 'lucide-react';

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
        return parsed.map(i => `${i.name || i.product_name || 'Item'} (x${i.qty || i.quantity || 1})`).join(', ');
      }
      return JSON.stringify(parsed);
    } catch {
      return '—';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <p className="text-gray-600">Daily and historical sales records</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg p-2"
          />
          <button
            onClick={() => fetchTransactions(selectedDate)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>By Date</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-x-auto"
      >
        {loading ? (
          <p>Loading transactions...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-600 text-center py-10">No transactions found</p>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">TRANSACTION ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">ITEMS PURCHASED</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">TOTAL AMOUNT</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">CUSTOMER NAME</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">PAYMENT MODE</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.transaction_id} className="hover:bg-gray-50 transition duration-200">
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{txn.transaction_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{parseItems(txn.items_purchased)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">₹{txn.total_amount}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{txn.customer_name || 'N/A'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{txn.payment_mode || 'N/A'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {new Date(txn.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
};

export default TransactionsPage;