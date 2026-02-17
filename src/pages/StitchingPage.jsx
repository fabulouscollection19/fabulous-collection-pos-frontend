import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Calendar, User, Phone, Plus, Trash, Search, Edit, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, PageHeader, Input } from '../components/UIComponents';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const StitchingPage = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentUIState, setAssignmentUIState] = useState({});
  const [assigningTailorName, setAssigningTailorName] = useState('');
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState('today');
  const [customerNumber, setCustomerNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [orderAssignments, setOrderAssignments] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editableNotes, setEditableNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadTodayOrders();
  }, []);

  const loadTodayOrders = async () => {
    setLoading(true);
    try {
      setError('');
      setSearchMode('today');
      const response = await fetch(`${API_BASE}/api/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrdersData(data);
        setFilteredData(data);
        await loadAssignmentsForOrders(data);
      } else {
        throw new Error('Failed to load orders');
      }
    } catch (err) {
      setError('Failed to load orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentsForOrders = async (orders) => {
    const assignments = {};
    for (const order of orders) {
      try {
        const response = await fetch(`${API_BASE}/api/assignments/order/${order.order_id}`);
        if (response.ok) {
          const data = await response.json();
          assignments[order.order_id] = data;
        }
      } catch (err) {
        console.error(`Error loading assignments for order ${order.order_id}:`, err);
      }
    }
    setOrderAssignments(assignments);
  };

  const searchByCustomerNumber = async () => {
    if (!customerNumber.trim()) {
      setError('Please enter a customer number');
      return;
    }

    try {
      setSearching(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/orders?phone=${customerNumber}`);
      if (response.ok) {
        const data = await response.json();
        setOrdersData(data);
        setFilteredData(data);
        setSearchMode('search');
        await loadAssignmentsForOrders(data);
      } else {
        throw new Error('No orders found for this customer');
      }
    } catch (err) {
      setError('Error searching customer: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const assignWork = async (orderId) => {
    if (!assigningTailorName.trim()) {
      setError('Please enter tailor name');
      return;
    }

    try {
      setError('');
      const response = await fetch(`${API_BASE}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          tailor_name: assigningTailorName.trim()
        })
      });

      if (response.ok) {
        setAssignmentUIState({ ...assignmentUIState, [orderId]: false });
        setAssigningTailorName('');
        if (searchMode === 'today') await loadTodayOrders();
        else await searchByCustomerNumber();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to assign order');
      }
    } catch (err) {
      setError('Error assigning work: ' + err.message);
    }
  };

  const unassignWork = async (assignmentId) => {
    if (!confirm('Are you sure you want to unassign this tailor?')) return;

    try {
      setError('');
      const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        if (searchMode === 'today') await loadTodayOrders();
        else await searchByCustomerNumber();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign tailor');
      }
    } catch (err) {
      setError('Error unassigning work: ' + err.message);
    }
  };

  const startEditNotes = (order) => {
    setEditingOrder(order);
    setEditableNotes(order.notes || '');
  };

  const saveOrderNotes = async () => {
    if (!editingOrder) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${editingOrder.order_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editableNotes })
      });

      if (response.ok) {
        setFilteredData(filteredData.map(order =>
          order.order_id === editingOrder.order_id ? { ...order, notes: editableNotes } : order
        ));
        setEditingOrder(null);
        setEditableNotes('');
      } else {
        throw new Error('Failed to update notes');
      }
    } catch (err) {
      alert('Error updating notes: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'pending': { icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending' },
      'in-progress': { icon: Briefcase, className: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'Processing' },
      'completed': { icon: CheckCircle, className: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Ready' }
    }[status] || { icon: AlertCircle, className: 'bg-slate-50 text-slate-600 border-slate-100', label: status };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="container-tablet">
      <PageHeader
        title="Stitching Management"
        subtitle="Staff assignment and order tracking pipeline"
        icon={Briefcase}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant={searchMode === 'today' ? 'primary' : 'secondary'}
              onClick={loadTodayOrders}
              className="h-10 text-xs"
            >
              Today's Orders
            </Button>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search phone..."
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchByCustomerNumber()}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none w-48 focus:w-64 transition-all"
              />
            </div>
          </div>
        }
      />

      {error && (
        <Card className="border-rose-100 bg-rose-50 mb-6 p-4 border flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <p className="text-sm font-black text-rose-600 uppercase tracking-widest">{error}</p>
        </Card>
      )}

      <Card className="p-0 overflow-hidden border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer & Order</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Staff</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructions</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Timeline</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Deploying Pipeline...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">No active orders found.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.map((order, idx) => {
                const assignments = orderAssignments[order.order_id] || [];
                const activeAssignment = assignments.find(a => a.status === 'assigned' || a.status === 'in-progress');
                const isAssigning = assignmentUIState[order.order_id];

                return (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={order.order_id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                          {order.customer_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">#{order.order_id} {order.customer_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest">{order.customer_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      {activeAssignment ? (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                          <span className="font-black text-xs text-indigo-600 uppercase tracking-wide">{activeAssignment.tailor_name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-medium text-slate-500 max-w-[200px] line-clamp-2">{order.notes || 'No specific requests.'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="text-xs font-black text-slate-900 leading-none">{formatDate(order.created_at)}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Invoiced Date</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => startEditNotes(order)}
                          className="h-8 w-8 !p-0"
                          title="Edit Notes"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {isAssigning ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Name"
                              value={assigningTailorName}
                              onChange={(e) => setAssigningTailorName(e.target.value)}
                              className="w-24 h-8 text-[10px] font-bold uppercase"
                              onKeyPress={(e) => e.key === 'Enter' && assignWork(order.order_id)}
                            />
                            <Button variant="success" onClick={() => assignWork(order.order_id)} className="h-8 !px-2">OK</Button>
                            <Button variant="ghost" onClick={() => setAssignmentUIState({ ...assignmentUIState, [order.order_id]: false })} className="h-8 !px-2"><X className="w-3 h-3" /></Button>
                          </div>
                        ) : activeAssignment ? (
                          <Button
                            variant="danger"
                            onClick={() => unassignWork(activeAssignment.assignment_id)}
                            className="h-8 px-3 text-[10px]"
                          >
                            Unassign
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() => setAssignmentUIState({ ...assignmentUIState, [order.order_id]: true })}
                            className="h-8 px-3 text-[10px]"
                          >
                            Assign Staff
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg"
            >
              <Card
                title={`Refine Instructions - ID ${editingOrder.order_id}`}
                subtitle="Update patterns or sizing notes for this order"
              >
                <div className="space-y-4">
                  <textarea
                    value={editableNotes}
                    onChange={(e) => setEditableNotes(e.target.value)}
                    placeholder="Enter technical notes, pattern requests, or fabric details..."
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-sm font-medium min-h-[160px] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={saveOrderNotes}
                      loading={savingNotes}
                    >
                      Apply Changes
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingOrder(null)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StitchingPage;