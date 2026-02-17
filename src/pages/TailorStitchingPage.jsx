import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User, Calendar, CheckCircle, Clock, X, Eye, Package, AlertCircle } from 'lucide-react';
import { Button, Card, PageHeader } from '../components/UIComponents';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const TailorStitchingPage = () => {
  const [assignedWork, setAssignedWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);

  useEffect(() => {
    loadAssignedWork();
  }, []);

  const loadAssignedWork = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/assigned-work`);
      if (response.ok) {
        const data = await response.json();
        setAssignedWork(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (assignmentId) => {
    if (!confirm('Mark this assignment as completed?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        await loadAssignedWork();
        setSelectedWork(null);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatDate = (date) => !date ? '-' : new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'neutral';
    const diffDays = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'danger';
    if (diffDays === 0) return 'warning';
    if (diffDays <= 2) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Syncing assigned work...</p>
      </div>
    );
  }

  return (
    <div className="container-tablet">
      <PageHeader
        title="Production Queue"
        subtitle="Manage your assigned stitching and tailoring tasks"
        icon={Briefcase}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedWork.map((assignment) => {
          const status = getDueDateStatus(assignment.due_date);
          const statusColors = {
            danger: 'bg-rose-50 text-rose-600 border-rose-100',
            warning: 'bg-amber-50 text-amber-600 border-amber-100',
            success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            neutral: 'bg-slate-50 text-slate-600 border-slate-100'
          };

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={assignment.assignment_id}
            >
              <Card className="hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                      {assignment.customer_name?.[0] || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">
                        {assignment.customer_name?.trim()}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                        Order #{assignment.order_id}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[status]}`}>
                    {status === 'danger' ? 'OVERDUE' : status === 'warning' ? 'DUE SOON' : 'ON TRACK'}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6 p-2 bg-slate-50 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">
                    Deadline: {formatDate(assignment.due_date)}
                  </span>
                </div>

                <Button
                  className="w-full h-10"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => setSelectedWork(assignment)}
                >
                  Inspect Order
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {assignedWork.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Queue is Empty</h3>
          <p className="text-slate-500 max-w-sm">
            All caught up! New assignments will appear here as they are created in the terminal.
          </p>
        </div>
      )}

      {/* DETAILED ORDER MODAL */}
      <AnimatePresence>
        {selectedWork && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWork(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {selectedWork.customer_name?.trim()}
                    </h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      Manifest #{selectedWork.order_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {selectedWork.notes && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tailoring Directives</h4>
                    </div>
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-[24px]">
                      <p className="text-slate-700 font-medium leading-relaxed italic">"{selectedWork.notes}"</p>
                    </div>
                  </div>
                )}

                {selectedWork.measurements && Object.keys(selectedWork.measurements).length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Precision Measurements</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(selectedWork.measurements).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl group hover:bg-white hover:border-indigo-200 transition-colors">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xl font-bold text-slate-900">{value || 'N/A'}<span className="text-xs ml-1 text-slate-400">in</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 rounded-[28px] p-6 text-white flex flex-wrap gap-x-12 gap-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                    <p className="font-bold">{formatDate(selectedWork.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="font-bold text-emerald-400 capitalize">{selectedWork.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button
                  className="w-full py-4 text-lg shadow-xl shadow-emerald-500/20"
                  variant="success"
                  icon={CheckCircle}
                  onClick={() => markAsCompleted(selectedWork.assignment_id)}
                >
                  Finalize Completion
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TailorStitchingPage;