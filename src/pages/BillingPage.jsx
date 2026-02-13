import { useState, useEffect } from 'react';
import { Download, FileText, Search, UserPlus, Send, Ruler, Edit, Plus, Trash } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const BillingPage = () => {
  // Invoice state
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    customer_number: '',
    customer_name: '',
    payment_mode: 'N/A',
    discount: 0,
    discount_type: 'amount',
    items: [{ name: '', sku: '', quantity: 1, price: 0 }]
  });

  // Customer state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_number: '',
    customer_name: '',
    whatsapp: 'No',
    email_id: '',
    address: ''
  });

  // Stitching state
  const [latestMeasurement, setLatestMeasurement] = useState(null);
  const [stitchingMeasurements, setStitchingMeasurements] = useState({
    C: '',
    W: '',
    S: '',
    H: '',
    SH: '',
    notes: ''
  });
  const [showStitchingForm, setShowStitchingForm] = useState(false);
  const [stitchingMode, setStitchingMode] = useState('add'); // 'add' or 'edit'
  const [editingMeasurementId, setEditingMeasurementId] = useState(null);
  const [stitchingMessage, setStitchingMessage] = useState({ type: '', text: '' });

  // Other state
  const [phoneError, setPhoneError] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Show message temporarily
  const showMessage = (type, text) => {
    setStitchingMessage({ type, text });
    setTimeout(() => setStitchingMessage({ type: '', text: '' }), 3000);
  };

  // Load LATEST measurements only after explicit customer lookup
  // DO NOT auto-load on every change - this causes recurring API calls
  // Measurements are loaded only in lookupCustomer() function after successful lookup

  const loadLatestMeasurements = async () => {
    try {
      const customerResponse = await fetch(`${API_BASE}/api/customer/${invoiceData.customer_number}`);
      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        const measurementsResponse = await fetch(`${API_BASE}/api/stitching/${customer.customer_id}`);
        if (measurementsResponse.ok) {
          const measurements = await measurementsResponse.json();
          if (measurements.length > 0) {
            setLatestMeasurement(measurements[0]);
          } else {
            setLatestMeasurement(null);
          }
        }
      }
    } catch (err) {
      console.error("Error loading measurements:", err);
    }
  };

  // Start adding NEW measurements
  const startAddMeasurement = () => {
    setStitchingMode('add');
    setEditingMeasurementId(null);

    if (latestMeasurement) {
      // Pre-populate with latest measurements
      setStitchingMeasurements({
        C: latestMeasurement.measurements.C || '',
        W: latestMeasurement.measurements.W || '',
        S: latestMeasurement.measurements.S || '',
        H: latestMeasurement.measurements.H || '',
        SH: latestMeasurement.measurements.SH || '',
        notes: ''
      });
    } else {
      setStitchingMeasurements({ C: '', W: '', S: '', H: '', SH: '', notes: '' });
    }
    setShowStitchingForm(true);
  };

  // Start EDITING existing latest measurement
  const startEditMeasurement = () => {
    if (!latestMeasurement) return;

    setStitchingMode('edit');
    setEditingMeasurementId(latestMeasurement.id);
    setStitchingMeasurements({
      C: latestMeasurement.measurements.C || '',
      W: latestMeasurement.measurements.W || '',
      S: latestMeasurement.measurements.S || '',
      H: latestMeasurement.measurements.H || '',
      SH: latestMeasurement.measurements.SH || '',
      notes: latestMeasurement.measurements.notes || ''
    });
    setShowStitchingForm(true);
  };

  // Save stitching measurements (Add or Edit)
  const saveStitchingMeasurements = async () => {
    try {
      const customerResponse = await fetch(`${API_BASE}/api/customer/${invoiceData.customer_number}`);
      if (!customerResponse.ok) {
        throw new Error("Customer not found");
      }

      const customer = await customerResponse.json();

      const measurementData = {
        C: stitchingMeasurements.C,
        W: stitchingMeasurements.W,
        S: stitchingMeasurements.S,
        H: stitchingMeasurements.H,
        SH: stitchingMeasurements.SH,
        notes: stitchingMeasurements.notes,
        date: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      };

      let response;

      if (stitchingMode === 'edit' && editingMeasurementId) {
        // UPDATE existing measurement
        response = await fetch(`${API_BASE}/api/stitching/${editingMeasurementId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            measurements: measurementData
          })
        });
      } else {
        // ADD new measurement
        response = await fetch(`${API_BASE}/api/stitching`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customer.customer_id,
            customer_name: invoiceData.customer_name,
            customer_number: invoiceData.customer_number,
            measurements: measurementData
          })
        });
      }

      if (response.ok) {
        showMessage('success', `Stitching measurements ${stitchingMode === 'edit' ? 'updated' : 'saved'} successfully!`);
        setShowStitchingForm(false);
        setStitchingMeasurements({ C: '', W: '', S: '', H: '', SH: '', notes: '' });
        setEditingMeasurementId(null);
        // RELOAD to show updated data
        await loadLatestMeasurements();
      } else {
        throw new Error(`Failed to ${stitchingMode === 'edit' ? 'update' : 'save'} measurements`);
      }
    } catch (err) {
      console.error("Error saving stitching measurements:", err);
      showMessage('error', `Error ${stitchingMode === 'edit' ? 'updating' : 'saving'} measurements: ${err.message}`);
    }
  };

  // Delete latest measurement
  const deleteLatestMeasurement = async () => {
    if (!latestMeasurement) return;

    if (!confirm('Are you sure you want to delete this measurement set?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/stitching/${latestMeasurement.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        showMessage('success', 'Measurement set deleted successfully!');
        setLatestMeasurement(null);
        // RELOAD to check if there are older measurements
        await loadLatestMeasurements();
      } else {
        throw new Error('Failed to delete measurements');
      }
    } catch (err) {
      console.error("Error deleting stitching measurements:", err);
      showMessage('error', `Error deleting measurements: ${err.message}`);
    }
  };

  // Cancel stitching form
  const cancelStitchingForm = () => {
    setShowStitchingForm(false);
    setStitchingMeasurements({ C: '', W: '', S: '', H: '', SH: '', notes: '' });
    setEditingMeasurementId(null);
    setStitchingMode('add');
  };

  // Load last invoice number on component mount
  useEffect(() => {
    const loadLastInvoice = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/last-invoice`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setInvoiceData(prev => ({ ...prev, invoice_number: 'Auto-generated' }));
      } catch (err) {
        console.error("Error loading last invoice:", err);
        // Set invoice number to auto-generated as fallback
        setInvoiceData(prev => ({ ...prev, invoice_number: 'Auto-generated' }));
      }
    };
    loadLastInvoice();
  }, []);

  // Validate phone number
  const validatePhoneNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length > 0 && cleanNumber.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
      return false;
    } else {
      setPhoneError('');
      return true;
    }
  };

  // Handle customer number change
  const handleCustomerNumberChange = (e) => {
    const value = e.target.value;
    setInvoiceData(prev => ({
      ...prev,
      customer_number: value,
      customer_name: '' // Clear customer name when number changes
    }));
    setShowCustomerForm(false); // Hide form when typing
    validatePhoneNumber(value);
  };

  // Lookup product by SKU
  const lookupProduct = async (sku, index) => {
    if (!sku) return;

    try {
      const response = await fetch(`${API_BASE}/api/product/${sku}`);
      if (response.ok) {
        const product = await response.json();
        const newItems = [...invoiceData.items];
        newItems[index].name = product.product_name;
        newItems[index].price = Number(product.selling_price) || 0;
        setInvoiceData(prev => ({ ...prev, items: newItems }));
      }
    } catch (err) {
      console.error("Product lookup error:", err);
    }
  };

  // Lookup customer by number - FIXED VERSION
  const lookupCustomer = async () => {
    if (!invoiceData.customer_number) return;

    if (!validatePhoneNumber(invoiceData.customer_number)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/customer/${invoiceData.customer_number}`);

      if (response.ok) {
        // Customer found
        const customer = await response.json();
        setInvoiceData(prev => ({
          ...prev,
          customer_name: customer.customer_name
        }));
        setShowCustomerForm(false);
        // Load measurements only after successful customer lookup
        await loadLatestMeasurements();
      } else if (response.status === 404) {
        // Customer not found - show registration form
        setNewCustomer(prev => ({
          ...prev,
          customer_number: invoiceData.customer_number,
          customer_name: '',
          whatsapp: 'No',
          email_id: '',
          address: ''
        }));
        setInvoiceData(prev => ({
          ...prev,
          customer_name: ''
        }));
        setLatestMeasurement(null); // Clear measurements when customer not found
        setShowCustomerForm(true); // THIS SHOWS THE FORM
      } else {
        // Other server errors
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error("Customer lookup error:", err);
      alert("Error looking up customer. Please try again.");
    }
  };

  // Create new customer
  const createCustomer = async () => {
    // Validate required fields
    if (!newCustomer.customer_number || !newCustomer.customer_name) {
      alert("Customer number and name are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        const customer = await response.json();
        setInvoiceData(prev => ({
          ...prev,
          customer_name: customer.customer_name,
          customer_number: customer.customer_number
        }));
        setShowCustomerForm(false);
        setNewCustomer({
          customer_number: '',
          customer_name: '',
          whatsapp: 'No',
          email_id: '',
          address: ''
        });
        alert("Customer created successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create customer");
      }
    } catch (err) {
      console.error("Customer creation error:", err);
      alert("Error creating customer: " + err.message);
    }
  };

  // Generate PDF and return blob
  const generatePDFBlob = async () => {
    try {
      const pdfData = {
        customer_number: invoiceData.customer_number,
        customer_name: invoiceData.customer_name,
        items: invoiceData.items.map(item => ({
          name: item.name,
          sku: item.sku,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0
        })),
        payment_mode: invoiceData.payment_mode,
        discount: Number(invoiceData.discount) || 0,
        discount_type: invoiceData.discount_type
      };

      const response = await fetch(`${API_BASE}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate PDF: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (err) {
      console.error("Error generating PDF:", err);
      throw err;
    }
  };

  // Send WhatsApp message
  const sendWhatsAppInvoice = async () => {
    if (!invoiceData.customer_number) {
      alert("Customer number is required to send WhatsApp message");
      return;
    }

    setSendingInvoice(true);
    try {
      // First generate the PDF (which will update stock)
      const pdfBlob = await generatePDFBlob();

      const base64PDF = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(pdfBlob);
      });

      const response = await fetch(`${API_BASE}/send-whatsapp-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_number: invoiceData.customer_number,
          customer_name: invoiceData.customer_name,
          pdf_base64: base64PDF,
          invoice_data: {
            items: invoiceData.items,
            subtotal: subtotal,
            discount: discountAmount,
            grandTotal: grandTotal
          }
        }),
      });

        if (response.ok) {
        const result = await response.json();
        alert("Invoice sent via WhatsApp successfully! Stock quantities have been updated.");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to send WhatsApp message");
      }
    } catch (err) {
      console.error("Error sending WhatsApp invoice:", err);
      alert("Error sending WhatsApp invoice: " + err.message);
    } finally {
      setSendingInvoice(false);
    }
  };

  const generatePDF = async () => {

    try {
      const pdfData = {
        customer_number: invoiceData.customer_number,
        customer_name: invoiceData.customer_name,
        items: invoiceData.items.map(item => ({
          name: item.name,
          sku: item.sku,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0
        })),
        payment_mode: invoiceData.payment_mode,
        discount: Number(invoiceData.discount) || 0,
        discount_type: invoiceData.discount_type
      };

      

      const response = await fetch(`${API_BASE}/generate-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfData),
      });

      

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Failed to generate PDF: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Received empty PDF blob");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      

      // Show success message
      alert("Invoice generated successfully! Stock quantities have been updated.");

    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', sku: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (invoiceData.items.length > 1) {
      const newItems = invoiceData.items.filter((_, i) => i !== index);
      setInvoiceData(prev => ({ ...prev, items: newItems }));
    }
  };

  const paymentModes = [
    { value: 'N/A', label: 'Select Payment Mode' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' }
  ];

  // Calculate totals
  const subtotal = invoiceData.items.reduce((total, item) => total + (item.quantity * item.price), 0);
  const discountAmount = invoiceData.discount_type === 'percentage'
    ? (subtotal * invoiceData.discount) / 100
    : invoiceData.discount;
  const grandTotal = subtotal - discountAmount;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Bill Generator</h2>
      </div>

      {/* Stitching Message Display */}
      {stitchingMessage.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          stitchingMessage.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {stitchingMessage.text}
        </div>
      )}

      <div className="space-y-4 bg-white p-6 rounded-lg shadow">
        {/* Invoice Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Number</label>
            <input
              type="text"
              value="Auto-generated"
              readOnly
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer Number *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={invoiceData.customer_number}
                onChange={handleCustomerNumberChange}
                className={`flex-1 border rounded-lg p-2 ${phoneError ? 'border-red-500' : ''}`}
                placeholder="Enter customer number"
              />
              <button
                onClick={lookupCustomer}
                className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Mode</label>
            <select
              value={invoiceData.payment_mode}
              onChange={(e) => setInvoiceData(prev => ({...prev, payment_mode: e.target.value}))}
              className="w-full border rounded-lg p-2"
            >
              {paymentModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Name Display - Only show when customer is found */}
        {invoiceData.customer_name && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">Customer: </span>
                {invoiceData.customer_name}
              </div>
              <button
                onClick={startAddMeasurement}
                className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{latestMeasurement ? 'New Stitching Entry' : 'Add Stitching'}</span>
              </button>
            </div>

            {/* Latest Measurement Display */}
            {latestMeasurement && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm text-blue-800">Latest Stitching Measurements:</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={startEditMeasurement}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={deleteLatestMeasurement}
                      className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                    >
                      <Trash className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex space-x-4">
                    <span><strong>Chest:</strong> {latestMeasurement.measurements.C} cm</span>
                    <span><strong>Waist:</strong> {latestMeasurement.measurements.W} cm</span>
                    <span><strong>Shoulder:</strong> {latestMeasurement.measurements.S} cm</span>
                  </div>
                  {latestMeasurement.measurements.H && (
                    <div><strong>Hip:</strong> {latestMeasurement.measurements.H} cm</div>
                  )}
                  {latestMeasurement.measurements.SH && (
                    <div><strong>Shirt Length:</strong> {latestMeasurement.measurements.SH} cm</div>
                  )}
                  {latestMeasurement.measurements.notes && (
                    <div className="text-gray-700 bg-yellow-50 p-2 rounded mt-2">
                      <strong>Notes:</strong> {latestMeasurement.measurements.notes}
                    </div>
                  )}
                  <div className="text-gray-500 text-xs mt-2">
                    Recorded: {latestMeasurement.measurements.date}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CUSTOMER REGISTRATION FORM - MOVED OUTSIDE THE CUSTOMER NAME CONDITION */}
        {showCustomerForm && (
          <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">New Customer Registration</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">Customer Number *</label>
                <input
                  type="text"
                  value={newCustomer.customer_number}
                  readOnly
                  className="w-full border rounded-lg p-2 text-sm bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newCustomer.customer_name}
                  onChange={(e) => setNewCustomer(prev => ({...prev, customer_name: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">WhatsApp Available?</label>
                <select
                  value={newCustomer.whatsapp}
                  onChange={(e) => setNewCustomer(prev => ({...prev, whatsapp: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Email ID</label>
                <input
                  type="email"
                  value={newCustomer.email_id}
                  onChange={(e) => setNewCustomer(prev => ({...prev, email_id: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="customer@example.com"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({...prev, address: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  rows="2"
                  placeholder="Customer address"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={createCustomer}
                disabled={!newCustomer.customer_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                Create Customer
              </button>
              <button
                onClick={() => {
                  setShowCustomerForm(false);
                  setNewCustomer({
                    customer_number: '',
                    customer_name: '',
                    whatsapp: 'No',
                    email_id: '',
                    address: ''
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stitching Measurements Form */}
        {showStitchingForm && (
          <div className="border-2 border-purple-200 bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Ruler className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">
                {stitchingMode === 'edit'
                  ? 'Edit Latest Measurement'
                  : (latestMeasurement ? 'New Stitching Entry (Pre-filled)' : 'New Stitching Measurements')}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">Chest (C) cm *</label>
                <input
                  type="number"
                  value={stitchingMeasurements.C}
                  onChange={(e) => setStitchingMeasurements(prev => ({...prev, C: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Chest measurement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Waist (W) cm *</label>
                <input
                  type="number"
                  value={stitchingMeasurements.W}
                  onChange={(e) => setStitchingMeasurements(prev => ({...prev, W: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Waist measurement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Shoulder (S) cm</label>
                <input
                  type="number"
                  value={stitchingMeasurements.S}
                  onChange={(e) => setStitchingMeasurements(prev => ({...prev, S: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Shoulder measurement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hip (H) cm</label>
                <input
                  type="number"
                  value={stitchingMeasurements.H}
                  onChange={(e) => setStitchingMeasurements(prev => ({...prev, H: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Hip measurement"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Shirt Length (SH) cm</label>
                <input
                  type="number"
                  value={stitchingMeasurements.SH}
                  onChange={(e) => setStitchingMeasurements(prev => ({...prev, SH: e.target.value}))}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Shirt length"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Special Instructions / Notes</label>
              <textarea
                value={stitchingMeasurements.notes}
                onChange={(e) => setStitchingMeasurements(prev => ({...prev, notes: e.target.value}))}
                className="w-full border rounded-lg p-2 text-sm"
                rows="3"
                placeholder="Pattern preferences, loose/tight areas, special requirements, fabric type, etc..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={saveStitchingMeasurements}
                disabled={!stitchingMeasurements.C || !stitchingMeasurements.W}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
              >
                {stitchingMode === 'edit' ? 'Update Measurement' : 'Save New Entry'}
              </button>
              <button
                onClick={cancelStitchingForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items Section */}
        <div>
          <label className="block text-sm font-medium mb-2">Items</label>
          <div className="space-y-3">
            {invoiceData.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">SKU</label>
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      placeholder="SKU"
                      value={item.sku}
                      onChange={(e) => {
                        const newItems = [...invoiceData.items];
                        newItems[index].sku = e.target.value;
                        setInvoiceData(prev => ({...prev, items: newItems}));
                      }}
                      onBlur={() => lookupProduct(item.sku, index)}
                      className="flex-1 border rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...invoiceData.items];
                      newItems[index].name = e.target.value;
                      setInvoiceData(prev => ({...prev, items: newItems}));
                    }}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...invoiceData.items];
                      newItems[index].quantity = Number(e.target.value) || 0;
                      setInvoiceData(prev => ({...prev, items: newItems}));
                    }}
                    className="w-full border rounded-lg p-2 text-sm"
                    min="1"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...invoiceData.items];
                      newItems[index].price = Number(e.target.value) || 0;
                      setInvoiceData(prev => ({...prev, items: newItems}));
                    }}
                    className="w-full border rounded-lg p-2 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Total</label>
                  <div className="w-full border rounded-lg p-2 text-sm bg-gray-100 text-center">
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </div>
                </div>
                {invoiceData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-3">
            <button
              onClick={addItem}
              className="text-blue-600 text-sm hover:text-blue-700 font-medium"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Discount Section */}
        <div className="border-t pt-4">
          <div className="flex items-center space-x-4">
            <label className="block text-sm font-medium">Discount:</label>
            <select
              value={invoiceData.discount_type}
              onChange={(e) => setInvoiceData(prev => ({...prev, discount_type: e.target.value, discount: 0}))}
              className="border rounded-lg p-2 text-sm"
            >
              <option value="amount">Amount (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
            <input
              type="number"
              value={invoiceData.discount}
              onChange={(e) => setInvoiceData(prev => ({...prev, discount: Number(e.target.value) || 0}))}
              className="w-32 border rounded-lg p-2 text-sm"
              min="0"
              step={invoiceData.discount_type === 'percentage' ? '1' : '0.01'}
              placeholder={invoiceData.discount_type === 'percentage' ? 'Percentage' : 'Amount'}
            />
          </div>
        </div>

        {/* Totals Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold">
              Subtotal: ₹{subtotal.toFixed(2)}
            </div>
            {discountAmount > 0 && (
              <div className="text-lg font-bold text-red-600">
                Discount: -₹{discountAmount.toFixed(2)}
              </div>
            )}
            <div className="text-xl font-bold text-green-600">
              Grand Total: ₹{grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={generatePDF}
            disabled={!invoiceData.customer_number || !invoiceData.customer_name || invoiceData.items.some(item => !item.name || item.quantity <= 0) || phoneError}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex-1 justify-center"
          >
            <Download className="w-5 h-5" />
            <span>Generate PDF Bill</span>
          </button>
          <button
            onClick={sendWhatsAppInvoice}
            disabled={!invoiceData.customer_number || !invoiceData.customer_name || invoiceData.items.some(item => !item.name || item.quantity <= 0) || phoneError || sendingInvoice}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex-1 justify-center"
          >
            <Send className="w-5 h-5" />
            <span>{sendingInvoice ? 'Sending...' : 'Send Invoice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;