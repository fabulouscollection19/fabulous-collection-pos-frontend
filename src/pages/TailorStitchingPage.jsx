import { useState, useEffect } from 'react';
import { Ruler, User, Calendar, CheckCircle, Clock, X, Eye } from 'lucide-react';

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

  const markAsCompleted = async (id) => {
    if (!confirm('Mark this work as completed?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/complete-work/${id}`, { method: "PUT" });
      if (response.ok) {
        await loadAssignedWork();
        setSelectedWork(null);
        alert('Completed!');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const formatDate = (date) => !date ? '-' : new Date(date).toLocaleDateString('en-GB');

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'no-due-date';
    const diffDays = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'due-today';
    if (diffDays <= 2) return 'due-soon';
    return 'on-track';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Ruler className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Assigned Work</h2>
          <p className="text-gray-600">Stitching assignments to complete</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedWork.map((work) => {
          const dueStatus = getDueDateStatus(work.due_date);

          return (
            <div
              key={work.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{work.customer_name?.trim()}</h3>
                    <p className="text-xs text-gray-500">Order #{work.id}</p>
                  </div>
                </div>

                {work.due_date && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Due:</span>
                      <span className={`text-sm font-medium ${
                        dueStatus === 'overdue' ? 'text-red-600' :
                        dueStatus === 'due-today' ? 'text-orange-600' :
                        dueStatus === 'due-soon' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {formatDate(work.due_date)}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      dueStatus === 'overdue' ? 'bg-red-500' :
                      dueStatus === 'due-today' ? 'bg-orange-500' :
                      dueStatus === 'due-soon' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                )}

                <button
                  onClick={() => setSelectedWork(work)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {assignedWork.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
          <Ruler className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No assigned work</h3>
          <p className="text-gray-600 mb-6">You don't have any stitching assignments at the moment.</p>
          <Clock className="w-8 h-8 text-gray-300 mx-auto" />
        </div>
      )}

      {/* MODAL FOR DETAILS */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedWork(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{selectedWork.customer_name?.trim()}</h3>
                  <p className="text-sm text-gray-500">Order #{selectedWork.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWork(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {selectedWork.due_date && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Due Date:</span>
                      <span className={`text-sm font-semibold ${
                        getDueDateStatus(selectedWork.due_date) === 'overdue' ? 'text-red-600' :
                        getDueDateStatus(selectedWork.due_date) === 'due-today' ? 'text-orange-600' :
                        getDueDateStatus(selectedWork.due_date) === 'due-soon' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {formatDate(selectedWork.due_date)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Measurements</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedWork.measurements?.C && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <span className="text-xs text-blue-600 font-medium">Chest</span>
                      <p className="text-2xl font-bold text-blue-900">{selectedWork.measurements.C} cm</p>
                    </div>
                  )}
                  {selectedWork.measurements?.W && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <span className="text-xs text-purple-600 font-medium">Waist</span>
                      <p className="text-2xl font-bold text-purple-900">{selectedWork.measurements.W} cm</p>
                    </div>
                  )}
                  {selectedWork.measurements?.S && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <span className="text-xs text-green-600 font-medium">Shoulder</span>
                      <p className="text-2xl font-bold text-green-900">{selectedWork.measurements.S} cm</p>
                    </div>
                  )}
                  {selectedWork.measurements?.H && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                      <span className="text-xs text-orange-600 font-medium">Hip</span>
                      <p className="text-2xl font-bold text-orange-900">{selectedWork.measurements.H} cm</p>
                    </div>
                  )}
                  {selectedWork.measurements?.SH && (
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200 col-span-2">
                      <span className="text-xs text-pink-600 font-medium">Shirt Length</span>
                      <p className="text-2xl font-bold text-pink-900">{selectedWork.measurements.SH} cm</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedWork.measurements?.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">Special Instructions</h4>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <p className="text-gray-800">{selectedWork.measurements.notes}</p>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Assigned on:</span> {formatDate(selectedWork.assigned_date)}
              </div>

              <button
                onClick={() => markAsCompleted(selectedWork.id)}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Mark as Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailorStitchingPage;