import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Search, UserPlus, Send, Ruler, Edit, Plus, Trash, RotateCcw } from 'lucide-react';
import { Button, Card, Input, Select, PageHeader } from '../components/UIComponents';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

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
    Length: '',
    Chest: '',
    'Neck depth': '',
    'Neck round': '',
    Shoulder: '',
    'Arm length': '',
    'Arm Round': '',
    'Arm Hole': '',
    Waist: '',
    Bottom: '',
    Hip: '',
    'Pant Round': '',
    'Pant Length': ''
  });
  const [showStitchingForm, setShowStitchingForm] = useState(false);
  const [stitchingMode, setStitchingMode] = useState('add'); // 'add' or 'edit'
  const [editingMeasurementId, setEditingMeasurementId] = useState(null);
  const [stitchingMessage, setStitchingMessage] = useState({ type: '', text: '' });

  // Order state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

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
      if (!customerResponse.ok) {
        console.error("Customer lookup failed:", customerResponse.status);
        return;
      }

      const customer = await customerResponse.json();
      if (!customer.customer_id) {
        console.error("Customer ID not found");
        return;
      }

      const measurementsResponse = await fetch(`${API_BASE}/api/stitching/${customer.customer_id}`);
      if (!measurementsResponse.ok) {
        console.error("Measurements fetch failed:", measurementsResponse.status);
        setLatestMeasurement(null);
        return;
      }

      const measurements = await measurementsResponse.json();
      if (Array.isArray(measurements) && measurements.length > 0) {
        console.log("Measurements found:", measurements[0]);
        setLatestMeasurement(measurements[0]);
      } else {
        console.log("No measurements found for customer");
        setLatestMeasurement(null);
      }
    } catch (err) {
      console.error("Error loading measurements:", err);
      setLatestMeasurement(null);
    }
  };

  // Start adding NEW measurements
  const startAddMeasurement = () => {
    setStitchingMode('add');
    setEditingMeasurementId(null);

    if (latestMeasurement) {
      // Pre-populate with latest measurements
      const meas = latestMeasurement.measurements || {};
      setStitchingMeasurements({
        Length: meas.Length || '',
        Chest: meas.Chest || '',
        'Neck depth': meas['Neck depth'] || '',
        'Neck round': meas['Neck round'] || '',
        Shoulder: meas.Shoulder || '',
        'Arm length': meas['Arm length'] || '',
        'Arm Round': meas['Arm Round'] || '',
        'Arm Hole': meas['Arm Hole'] || '',
        Waist: meas.Waist || '',
        Bottom: meas.Bottom || '',
        Hip: meas.Hip || '',
        'Pant Round': meas['Pant Round'] || '',
        'Pant Length': meas['Pant Length'] || ''
      });
    } else {
      setStitchingMeasurements({
        Length: '',
        Chest: '',
        'Neck depth': '',
        'Neck round': '',
        Shoulder: '',
        'Arm length': '',
        'Arm Round': '',
        'Arm Hole': '',
        Waist: '',
        Bottom: '',
        Hip: '',
        'Pant Round': '',
        'Pant Length': ''
      });
    }
    setShowStitchingForm(true);
  };

  // Start EDITING existing latest measurement
  const startEditMeasurement = () => {
    if (!latestMeasurement) return;

    setStitchingMode('edit');
    setEditingMeasurementId(latestMeasurement.customer_id || 'edit');
    const meas = latestMeasurement.measurements || {};
    setStitchingMeasurements({
      Length: meas.Length || '',
      Chest: meas.Chest || '',
      'Neck depth': meas['Neck depth'] || '',
      'Neck round': meas['Neck round'] || '',
      Shoulder: meas.Shoulder || '',
      'Arm length': meas['Arm length'] || '',
      'Arm Round': meas['Arm Round'] || '',
      'Arm Hole': meas['Arm Hole'] || '',
      Waist: meas.Waist || '',
      Bottom: meas.Bottom || '',
      Hip: meas.Hip || '',
      'Pant Round': meas['Pant Round'] || '',
      'Pant Length': meas['Pant Length'] || ''
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

      // Only include non-empty measurements
      const measurementData = {};
      Object.keys(stitchingMeasurements).forEach(key => {
        if (stitchingMeasurements[key]) {
          measurementData[key] = stitchingMeasurements[key];
        }
      });

      let response;

      if (stitchingMode === 'edit') {
        // UPDATE existing measurement using customer_id
        response = await fetch(`${API_BASE}/api/stitching/${customer.customer_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            measurements: measurementData
          })
        });
      } else {
        // ADD new measurement using UPSERT (customer_id as key)
        response = await fetch(`${API_BASE}/api/stitching`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customer.customer_id,
            measurements: measurementData
          })
        });
      }

      if (response.ok) {
        showMessage('success', `Stitching measurements ${stitchingMode === 'edit' ? 'updated' : 'saved'} successfully!`);
        setShowStitchingForm(false);
        setStitchingMeasurements({
          Length: '',
          Chest: '',
          'Neck depth': '',
          'Neck round': '',
          Shoulder: '',
          'Arm length': '',
          'Arm Round': '',
          'Arm Hole': '',
          Waist: '',
          Bottom: '',
          Hip: '',
          'Pant Round': '',
          'Pant Length': ''
        });
        setEditingMeasurementId(null);
        setStitchingMode('add');
        // RELOAD to show updated data
        await loadLatestMeasurements();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${stitchingMode === 'edit' ? 'update' : 'save'} measurements`);
      }
    } catch (err) {
      console.error("Error saving stitching measurements:", err);
      showMessage('error', `Error ${stitchingMode === 'edit' ? 'updating' : 'saving'} measurements: ${err.message}`);
    }
  };

  // Delete latest measurement
  // Delete latest measurement
  const deleteLatestMeasurement = async () => {
    if (!latestMeasurement) return;

    if (!confirm('Are you sure you want to delete this measurement set?')) {
      return;
    }

    try {
      // Get customer_id first
      const customerResponse = await fetch(`${API_BASE}/api/customer/${invoiceData.customer_number}`);
      if (!customerResponse.ok) {
        throw new Error("Could not find customer");
      }

      const customer = await customerResponse.json();
      const response = await fetch(`${API_BASE}/api/stitching/${customer.customer_id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        showMessage('success', 'Measurement set deleted successfully!');
        setLatestMeasurement(null);
        // RELOAD to check if there are any measurements
        await loadLatestMeasurements();
      } else {
        throw new Error('Failed to delete measurements');
      }
    } catch (err) {
      console.error("Error deleting stitching measurements:", err);
      showMessage('error', `Error deleting measurements: ${err.message}`);
    }
  };

  // Start creating a new stitching order
  const startNewStitchingOrder = () => {
    if (!latestMeasurement) {
      alert('Please add stitching measurements first');
      return;
    }

    // Add ST10001 sku at the first item slot
    const newItems = [...invoiceData.items];
    newItems[0] = { name: 'Stitching Order', sku: 'ST10001', quantity: 1, price: 0 };
    setInvoiceData(prev => ({ ...prev, items: newItems }));
    setOrderNotes('');
    setShowOrderForm(true);
  };

  // Cancel stitching form
  const cancelStitchingForm = () => {
    setShowStitchingForm(false);
    setStitchingMeasurements({
      Length: '',
      Chest: '',
      'Neck depth': '',
      'Neck round': '',
      Shoulder: '',
      'Arm length': '',
      'Arm Round': '',
      'Arm Hole': '',
      Waist: '',
      Bottom: '',
      Hip: '',
      'Pant Round': '',
      'Pant Length': ''
    });
    setEditingMeasurementId(null);
    setStitchingMode('add');
  };

  // Cancel order form
  const cancelOrderForm = () => {
    setShowOrderForm(false);
    setOrderNotes('');
  };

  // Save stitching order (without invoice)
  const saveOrder = async () => {
    if (!invoiceData.customer_name) {
      alert('Please select a customer first');
      return;
    }

    setSavingOrder(true);
    try {
      const customerResponse = await fetch(`${API_BASE}/api/customer/${invoiceData.customer_number}`);
      if (!customerResponse.ok) {
        throw new Error("Customer not found");
      }

      const customer = await customerResponse.json();

      const response = await fetch(`${API_BASE}/api/save-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          notes: orderNotes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save order');
      }

      const order = await response.json();
      alert(`Order #${order.order_id} saved successfully!`);

      // Clear the form only - do NOT clear bill items
      setShowOrderForm(false);
      setOrderNotes('');

    } catch (err) {
      console.error("Error saving order:", err);
      alert("Error saving order: " + err.message);
    } finally {
      setSavingOrder(false);
    }
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

      // Add notes if this invoice includes a stitching order
      const hasStitching = invoiceData.items.some(item => item.sku === 'ST10001');
      if (hasStitching && orderNotes) {
        pdfData.notes = orderNotes;
      }

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

  // ===== WHATSAPP SENDING - DISABLED =====
  // const sendWhatsAppInvoice = async () => {
  //   if (!invoiceData.customer_number) {
  //     alert("Customer number is required to send WhatsApp message");
  //     return;
  //   }

  //   setSendingInvoice(true);
  //   try {
  //     // First generate the PDF (which will update stock)
  //     const pdfBlob = await generatePDFBlob();

  //     const base64PDF = await new Promise((resolve) => {
  //       const reader = new FileReader();
  //       reader.onloadend = () => resolve(reader.result);
  //       reader.readAsDataURL(pdfBlob);
  //     });

  //     const response = await fetch(`${API_BASE}/send-whatsapp-invoice`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         customer_number: invoiceData.customer_number,
  //         customer_name: invoiceData.customer_name,
  //         pdf_base64: base64PDF,
  //         invoice_data: {
  //           items: invoiceData.items,
  //           subtotal: subtotal,
  //           discount: discountAmount,
  //           grandTotal: grandTotal
  //         }
  //       }),
  //     });

  //       if (response.ok) {
  //       const result = await response.json();
  //       alert("Invoice sent via WhatsApp successfully! Stock quantities have been updated.");
  //     } else {
  //       const error = await response.json();
  //       throw new Error(error.error || "Failed to send WhatsApp message");
  //     }
  //   } catch (err) {
  //     console.error("Error sending WhatsApp invoice:", err);
  //     alert("Error sending WhatsApp invoice: " + err.message);
  //   } finally {
  //     setSendingInvoice(false);
  //   }
  // };

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

      // Add notes if this invoice includes a stitching order
      const hasStitching = invoiceData.items.some(item => item.sku === 'ST10001');
      if (hasStitching && orderNotes) {
        pdfData.notes = orderNotes;
      }

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



      // Show success message and clear form
      alert("Invoice generated successfully! Stock quantities have been updated.");

      // Clear the stitching item and order notes after successful save
      if (invoiceData.items.some(item => item.sku === 'ST10001')) {
        const newItems = [...invoiceData.items];
        newItems[0] = { name: '', sku: '', quantity: 1, price: 0 };
        setInvoiceData(prev => ({ ...prev, items: newItems }));
        setShowOrderForm(false);
        setOrderNotes('');
      }

    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  // Save transaction without PDF
  const saveTransactionOnly = async () => {
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

      // Add notes if this transaction includes a stitching order
      const hasStitching = invoiceData.items.some(item => item.sku === 'ST10001');
      if (hasStitching && orderNotes) {
        pdfData.notes = orderNotes;
      }

      const response = await fetch(`${API_BASE}/api/save-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Failed to save transaction: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Show success message
      alert(`Transaction #${result.transaction_id} saved successfully! Stock quantities have been updated.`);

      // Clear the stitching item and order notes after successful save
      if (invoiceData.items.some(item => item.sku === 'ST10001')) {
        const newItems = [...invoiceData.items];
        newItems[0] = { name: '', sku: '', quantity: 1, price: 0 };
        setInvoiceData(prev => ({ ...prev, items: newItems }));
        setShowOrderForm(false);
        setOrderNotes('');
      }

    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Error saving transaction: " + err.message);
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
    <div className="container-tablet py-2">
      <PageHeader
        title="Bill Generator"
        subtitle="Process order and generate customer invoices"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={() => window.location.reload()}>
              Reset
            </Button>
          </div>
        }
      />

      {/* Message Display */}
      {stitchingMessage.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg border flex items-center gap-3 font-medium text-sm ${stitchingMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${stitchingMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
          {stitchingMessage.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer & Items */}
        <div className="lg:col-span-8 space-y-6">
          <Card title="Order Details" subtitle="Customer information and items list">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input
                label="Invoice Number"
                value="Auto-generated"
                readOnly
                disabled
              />
              <div className="md:col-span-2">
                <label>Customer Lookup *</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter mobile number"
                      value={invoiceData.customer_number}
                      onChange={handleCustomerNumberChange}
                      error={phoneError}
                    />
                  </div>
                  <Button onClick={lookupCustomer} icon={Search}>
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Customer Status Display */}
            <AnimatePresence>
              {invoiceData.customer_name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                      {invoiceData.customer_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{invoiceData.customer_name}</h4>
                      <p className="text-xs text-slate-500 font-medium tracking-wide">AUTHENTICATED CUSTOMER</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={startAddMeasurement}
                      icon={latestMeasurement ? Edit : Plus}
                      className="text-xs h-9"
                    >
                      {latestMeasurement ? 'Measurements' : 'Add Stats'}
                    </Button>
                    {latestMeasurement && (
                      <Button
                        variant="success"
                        onClick={startNewStitchingOrder}
                        icon={Plus}
                        className="text-xs h-9"
                      >
                        New Order
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items Table - Redesigned for absolute alignment using Grid */}
            <div className="mt-6">
              <div className="grid grid-cols-[100px_1fr_70px_110px_100px_40px] gap-3 px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div>SKU</div>
                <div>Description</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Price</div>
                <div className="text-right">Total</div>
                <div></div>
              </div>
              <div className="space-y-2">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[100px_1fr_70px_110px_100px_40px] gap-3 items-center p-2 bg-slate-50/50 border border-slate-100 rounded-xl group relative">
                    <div className="min-w-0">
                      <Input
                        placeholder="SKU"
                        value={item.sku}
                        onChange={(e) => {
                          const newItems = [...invoiceData.items];
                          newItems[index].sku = e.target.value;
                          setInvoiceData(prev => ({ ...prev, items: newItems }));
                        }}
                        onBlur={() => lookupProduct(item.sku, index)}
                        className="bg-white"
                      />
                    </div>
                    <div className="min-w-0">
                      <Input
                        placeholder="Item Description"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...invoiceData.items];
                          newItems[index].name = e.target.value;
                          setInvoiceData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="min-w-0">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...invoiceData.items];
                          newItems[index].quantity = Number(e.target.value) || 0;
                          setInvoiceData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="bg-white text-center px-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...invoiceData.items];
                          newItems[index].price = Number(e.target.value) || 0;
                          setInvoiceData(prev => ({ ...prev, items: newItems }));
                        }}
                        className="bg-white text-right"
                      />
                    </div>
                    <div className="text-right pr-1">
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                        ₹{(item.quantity * item.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      {invoiceData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Button variant="ghost" onClick={addItem} icon={Plus} className="text-indigo-600 text-xs py-1">
                  Add another item
                </Button>
              </div>
            </div>
          </Card>

          {/* New Customer / Measurements Forms */}
          <AnimatePresence>
            {showCustomerForm && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <Card title="Register New Customer" className="border-indigo-100 bg-indigo-50/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <Input label="Mobile Number" value={newCustomer.customer_number} readOnly disabled />
                    <Input
                      label="Customer Name *"
                      value={newCustomer.customer_name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, customer_name: e.target.value }))}
                    />
                    <Select
                      label="WhatsApp Notification"
                      value={newCustomer.whatsapp}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, whatsapp: e.target.value }))}
                      options={[{ value: 'Yes', label: 'Enabled' }, { value: 'No', label: 'Disabled' }]}
                    />
                    <Input
                      label="Email ID"
                      value={newCustomer.email_id}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email_id: e.target.value }))}
                    />
                    <div className="md:col-span-2">
                      <label>Residential Address</label>
                      <textarea
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                        rows="2"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createCustomer} disabled={!newCustomer.customer_name}>Register Now</Button>
                    <Button variant="secondary" onClick={() => setShowCustomerForm(false)}>Cancel</Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {showStitchingForm && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <Card title="Precision Measurements" className="border-purple-100 bg-purple-50/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 mb-6">
                    {Object.keys(stitchingMeasurements).map((fieldName) => (
                      <Input
                        key={fieldName}
                        label={`${fieldName} (in)`}
                        type="number"
                        step="0.5"
                        value={stitchingMeasurements[fieldName]}
                        onChange={(e) => setStitchingMeasurements(prev => ({ ...prev, [fieldName]: e.target.value }))}
                        className="h-9 py-1 px-2"
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={saveStitchingMeasurements}>
                      {stitchingMode === 'edit' ? 'Update Stats' : 'Save Stats'}
                    </Button>
                    <Button variant="secondary" onClick={cancelStitchingForm}>Discard</Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {showOrderForm && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <Card title="Order Specifications" className="border-emerald-100 bg-emerald-50/10">
                  <div className="mb-5">
                    <label>Design Instructions / Special Notes</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows="3"
                      placeholder="Enter fabric details, pattern requests, or delivery instructions..."
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" onClick={saveOrder} loading={savingOrder} icon={Send}>
                      Confirm Order
                    </Button>
                    <Button variant="secondary" onClick={cancelOrderForm}>Cancel</Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="lg:col-span-4 sticky top-6">
          <Card title="Summary" footer={
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={saveTransactionOnly}
                className="w-full py-4 text-base"
                disabled={!invoiceData.customer_name || invoiceData.items.some(item => !item.name)}
                icon={FileText}
              >
                Checkout Terminal
              </Button>
              <Button
                variant="success"
                onClick={generatePDF}
                className="w-full py-4 text-base"
                disabled={!invoiceData.customer_name || invoiceData.items.some(item => !item.name)}
                icon={Download}
              >
                Print Invoice
              </Button>
            </div>
          }>
            <div className="space-y-4 mb-6">
              <Select
                label="Payment Method"
                value={invoiceData.payment_mode}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, payment_mode: e.target.value }))}
                options={paymentModes}
              />

              <div className="pt-4 border-t border-slate-100 flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label="Discount Type"
                    value={invoiceData.discount_type}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_type: e.target.value, discount: 0 }))}
                    options={[{ value: 'amount', label: 'Fixed (₹)' }, { value: 'percentage', label: 'Percent (%)' }]}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={invoiceData.discount}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, discount: Number(e.target.value) || 0 }))}
                    placeholder="Value"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-900 text-white p-5 rounded-xl shadow-inner">
              <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-400 text-xs font-bold uppercase tracking-widest">
                  <span>Savings</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Grand Total</span>
                <span className="text-2xl font-black text-white">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Loyalty/Notes area */}
            <div className="mt-6 p-4 border border-dashed border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">POS Status</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-slate-600">Secure Environment Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
