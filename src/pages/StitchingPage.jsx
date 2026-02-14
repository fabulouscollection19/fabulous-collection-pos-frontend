// StitchingPage.jsx - Updated with search functionality
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ruler, Calendar, User, Phone, CheckCircle, XCircle, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const StitchingPage = () => {
  const [stitchingData, setStitchingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState('today'); // 'today' or 'search'
  const [customerNumber, setCustomerNumber] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadTodayStitching();
  }, []);

  const loadTodayStitching = async () => {
    try {
      setError('');
      setSearchMode('today');
      const response = await fetch(`${API_BASE}/api/today-stitching`);
      if (response.ok) {
        const data = await response.json();
        setStitchingData(data);
        setFilteredData(data);
      } else {
        throw new Error('Failed to load stitching data');
      }
    } catch (err) {
      console.error("Error loading today's stitching:", err);
      setError('Failed to load stitching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchByCustomerNumber = async () => {
    if (!customerNumber.trim()) {
      setError('Please enter a customer number');
      return;
    }

    try {
      setSearching(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/stitching-history/phone/${customerNumber}`);
      if (response.ok) {
        const data = await response.json();
        setStitchingData(data);
        setFilteredData(data);
        setSearchMode('search');
      } else {
        throw new Error('Customer not found or no stitching history');
      }
    } catch (err) {
      console.error("Error searching customer:", err);
      setError('Error searching customer: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const assignWork = async (stitchingId) => {

    if (!stitchingId) {
      setError('Invalid stitching data: missing stitching ID');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date');
      return;
    }

    try {
      setError('');
      const url = `${API_BASE}/api/assign-stitching/${stitchingId}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          due_date: dueDate
        })
      });

      

      if (response.ok) {
        const result = await response.json();
        // Reload data based on current mode
        if (searchMode === 'today') {
          await loadTodayStitching();
        } else {
          await searchByCustomerNumber();
        }
        setAssigningId(null);
        setDueDate('');
        alert('Work assigned successfully!');
      } else {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(errorText || 'Failed to assign work');
      }
    } catch (err) {
      console.error("Error assigning work:", err);
      setError('Error assigning work: ' + err.message);
    }
  };

  const unassignWork = async (stitchingId) => {
    if (!stitchingId) {
      setError('Invalid stitching ID');
      return;
    }

    if (!confirm('Are you sure you want to unassign this work?')) return;

    try {
      setError('');
      const response = await fetch(`${API_BASE}/api/unassign-stitching/${stitchingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.ok) {
        // Reload data based on current mode
        if (searchMode === 'today') {
          await loadTodayStitching();
        } else {
          await searchByCustomerNumber();
        }
        alert('Work unassigned successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign work');
      }
    } catch (err) {
      console.error("Error unassigning work:", err);
      setError('Error unassigning work: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Not Assigned': { color: 'bg-gray-100 text-gray-800', label: 'Not Assigned' },
      'Assigned': { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      'Completed': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig['Not Assigned'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Ruler className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stitching Management</h2>
            <p className="text-gray-600">
              {searchMode === 'today' ? "Today's stitching entries" : "Customer stitching history"}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={loadTodayStitching}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            searchMode === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Today's Stitching
        </button>

        <div className="flex-1 flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter customer number to search..."
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchByCustomerNumber()}
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={searchByCustomerNumber}
            disabled={searching}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stitching Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {searchMode === 'today' ? "Today's Stitching Measurements" : "Customer Stitching History"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredData.length} entries found
            {searchMode === 'search' && ` for customer: ${customerNumber}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Measurements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((stitching) => (
                <tr key={stitching.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {stitching.customer_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {stitching.customer_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {stitching.measurements?.C && <div>C: {stitching.measurements.C} cm</div>}
                      {stitching.measurements?.W && <div>W: {stitching.measurements.W} cm</div>}
                      {stitching.measurements?.S && <div>S: {stitching.measurements.S} cm</div>}
                      {stitching.measurements?.H && <div>H: {stitching.measurements.H} cm</div>}
                      {stitching.measurements?.SH && <div>SH: {stitching.measurements.SH} cm</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {stitching.measurements?.notes || 'No special instructions'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(stitching.assigned_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stitching.due_date ? formatDate(stitching.due_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(stitching.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {assigningId === stitching.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="border rounded-lg px-2 py-1 text-sm"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <button
                          onClick={() => assignWork(stitching.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setAssigningId(null);
                            setDueDate('');
                            setError('');
                          }}
                          className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : stitching.assigned_status === 'Assigned' ? (
                      <button
                        onClick={() => unassignWork(stitching.id)}
                        className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Unassign</span>
                      </button>
                    ) : stitching.assigned_status === 'Not Assigned' ? (
                      <button
                        onClick={() => {
                          setAssigningId(stitching.id);
                          setError('');
                        }}
                        className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Assign Work</span>
                      </button>
                    ) : (
                      <span className="text-gray-500">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Ruler className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchMode === 'today' ? 'No stitching entries today' : 'No stitching history found'}
              </h3>
              <p className="text-gray-600">
                {searchMode === 'today'
                  ? 'Stitching measurements added today will appear here.'
                  : 'No stitching measurements found for this customer number.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StitchingPage;