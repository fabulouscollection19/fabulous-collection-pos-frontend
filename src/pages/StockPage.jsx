import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Search, Edit, Filter, Trash2, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Button, Card, Input, Select, PageHeader } from '../components/UIComponents';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const StockPage = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupSKU, setLookupSKU] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSku, setEditingSku] = useState(null);

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
    category: '',
    brand: '',
    fabric_type: '',
    color: '',
    pattern: '',
    size: '',
    supplier_name: '',
    stock_quantity: '',
    purchase_price: '',
    selling_price: '',
    sales_quantity: 0,
    date_added: new Date().toISOString().split('T')[0]
  });

  const dropdownOptions = {
    category: [
      { value: 'Saree', label: 'Saree' }, { value: 'Dress', label: 'Dress' }, { value: 'Kurti', label: 'Kurti' },
      { value: 'Lehenga', label: 'Lehenga' }, { value: 'Blouse', label: 'Blouse' }, { value: 'Gown', label: 'Gown' },
      { value: 'Salwar Suit', label: 'Salwar Suit' }, { value: 'Palazzo', label: 'Palazzo' },
      { value: 'Top', label: 'Top' }, { value: 'Skirt', label: 'Skirt' }
    ],
    fabric_type: [
      { value: 'N/A', label: 'N/A' },
      { value: 'Silk', label: 'Silk' }, { value: 'Cotton', label: 'Cotton' }, { value: 'Georgette', label: 'Georgette' },
      { value: 'Chiffon', label: 'Chiffon' }, { value: 'Linen', label: 'Linen' }, { value: 'Velvet', label: 'Velvet' }
    ],
    color: [
      { value: 'N/A', label: 'N/A' },
      { value: 'Red', label: 'Red' }, { value: 'Blue', label: 'Blue' }, { value: 'Green', label: 'Green' },
      { value: 'Black', label: 'Black' }, { value: 'White', label: 'White' }, { value: 'Gold', label: 'Gold' }
    ],
    pattern: [
      { value: 'N/A', label: 'N/A' },
      { value: 'Solid', label: 'Solid' }, { value: 'Floral', label: 'Floral' }, { value: 'Striped', label: 'Striped' },
      { value: 'Embroidered', label: 'Embroidered' }, { value: 'Printed', label: 'Printed' }
    ],
    size: [
      { value: 'N/A', label: 'N/A' },
      { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' },
      { value: 'XL', label: 'XL' }, { value: 'Free Size', label: 'Free Size' }
    ]
  };

  useEffect(() => {
    fetchStockData(currentPage, selectedDate);
  }, [currentPage, selectedDate]);

  const fetchStockData = async (page = 1, date = '') => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/api/stock`);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', 10);
      if (date) url.searchParams.append('date', date);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();

      setStockData(data.products || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = async (category) => {
    if (!category) return '';
    try {
      const res = await fetch(`${API_BASE}/api/last-sku`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      const categoryPrefix = category.slice(0, 2).toUpperCase();

      let nextNumber = 10001;
      if (data.lastSku) {
        // More robust numeric extraction in case of mixed formats
        const match = data.lastSku.match(/\d+$/);
        const numericPart = match ? parseInt(match[0], 10) : 0;

        // Ensure we don't look before 10009 as per user request (logic: next is max(current+1, 10010))
        nextNumber = Math.max(numericPart + 1, 10010);
      }
      return `${categoryPrefix}${nextNumber.toString().padStart(5, '0')}`;
    } catch (err) {
      return `${category.slice(0, 2).toUpperCase()}10010`;
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      const newSku = await generateSKU(value);
      setFormData(prev => ({ ...prev, [name]: value, sku: newSku }));
    } else if (['stock_quantity', 'purchase_price', 'selling_price', 'sales_quantity'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = {
      category: 'Category',
      stock_quantity: 'Stock Qty',
      purchase_price: 'Purchase Price',
      selling_price: 'Selling Price'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = formData[field];
      if (value === '' || value === null || value === undefined) {
        alert(`❌ ${label} is required!`);
        return;
      }
    }

    try {
      // Prepare data with proper numeric conversions
      const dataToSubmit = {
        ...formData,
        stock_quantity: Number(formData.stock_quantity) || 0,
        purchase_price: Number(formData.purchase_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        sales_quantity: Number(formData.sales_quantity) || 0
      };

      const endpoint = isEditMode ? `/api/stock/${editingSku}` : '/api/stock';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || `HTTP error! Status: ${res.status}`);
      }
      const savedStock = await res.json();
      if (isEditMode) {
        setStockData(prev => prev.map(item => item.sku === editingSku ? savedStock : item));
      } else {
        setStockData(prev => [...prev, savedStock]);
      }
      handleCancelEdit();
    } catch (err) {
      alert("Error saving stock: " + err.message);
    }
  };

  const handleEditSKU = (item) => {
    setIsEditMode(true);
    setEditingSku(item.sku);
    setFormData({ ...item });
    setIsOffcanvasOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingSku(null);
    setIsOffcanvasOpen(false);
    setFormData({
      sku: '', product_name: '', category: '', brand: '', fabric_type: '',
      color: '', pattern: '', size: '', supplier_name: '',
      stock_quantity: '', purchase_price: '', selling_price: '',
      sales_quantity: 0, date_added: new Date().toISOString().split('T')[0]
    });
  };

  const handleLookup = async () => {
    const sku = lookupSKU.trim().toUpperCase();
    if (!sku) return;
    try {
      const res = await fetch(`${API_BASE}/api/product/${sku}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResult([data]);
        setLookupError(null);
      } else {
        setLookupResult([]);
        setLookupError(`No product found for SKU: ${sku}`);
      }
    } catch {
      setLookupError("Error fetching product data");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-slate-500 font-medium">Loading inventory...</p>
    </div>
  );

  const tableData = lookupResult || stockData;

  return (
    <div className="container-tablet">
      <PageHeader
        title="Inventory Hub"
        subtitle="Manage product stock, pricing, and specifications"
        icon={Package}
        actions={
          <div className="flex gap-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                  setLookupResult(null);
                }}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all shadow-sm h-10"
              />
            </div>
            {selectedDate && (
              <Button variant="secondary" onClick={() => setSelectedDate('')} className="h-10">Clear Date</Button>
            )}
            <Button variant="secondary" icon={Search} onClick={() => setShowLookup(!showLookup)} className="h-10">
              {showLookup ? 'Hide Search' : 'Lookup SKU'}
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsOffcanvasOpen(true)} className="h-10">
              Add Product
            </Button>
          </div>
        }
      />

      {selectedDate && (
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Date:</span>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      )}

      <AnimatePresence>
        {showLookup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card className="bg-slate-50 border-slate-200">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter SKU Code (e.g. SA10023)"
                    value={lookupSKU}
                    onChange={(e) => setLookupSKU(e.target.value.toUpperCase())}
                    className="bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLookup} className="md:w-32">Search</Button>
                  <Button variant="secondary" onClick={() => { setShowLookup(false); setLookupResult(null); }}>
                    Reset
                  </Button>
                </div>
              </div>
              {lookupError && <p className="text-rose-600 text-xs mt-2 font-bold px-1">{lookupError}</p>}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden border-slate-100 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabric</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Color</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pattern</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Size</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Selling Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Date Added</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 block leading-none">{item.sku}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] text-slate-600 font-bold truncate max-w-[150px]">{item.product_name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{item.category || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-medium text-slate-600">{item.fabric_type || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] font-medium text-slate-600">{item.color || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] font-medium text-slate-600">{item.pattern || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] font-bold text-slate-700">{item.size || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px] block">{item.supplier_name || 'Generic'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-black text-slate-700">
                      {item.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-black text-slate-900 leading-tight">₹{item.selling_price.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">MRP ₹{item.purchase_price.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[11px] font-black text-slate-600 whitespace-nowrap">{formatDate(item.date_added)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEditSKU(item)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination Controls */}
        {!lookupResult && totalPages > 1 && (
          <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9 px-4 text-xs font-bold"
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === page
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9 px-4 text-xs font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modern Side Panel */}
      <AnimatePresence>
        {isOffcanvasOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelEdit}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {isEditMode ? 'Modify Product' : 'New Product'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Inventory Management</p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="SKU Code" value={formData.sku} readOnly disabled className="bg-slate-50 font-bold" />
                  <Select
                    label="Category *"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={dropdownOptions.category}
                  />
                </div>

                <Input
                  label="Product Name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="e.g. Designer Silk Saree with Zari"
                />

                <Input
                  label="Brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Premium Collection"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Fabric" name="fabric_type" value={formData.fabric_type} onChange={handleChange} options={dropdownOptions.fabric_type} />
                  <Select label="Color" name="color" value={formData.color} onChange={handleChange} options={dropdownOptions.color} />
                  <Select label="Pattern" name="pattern" value={formData.pattern} onChange={handleChange} options={dropdownOptions.pattern} />
                  <Select label="Size" name="size" value={formData.size} onChange={handleChange} options={dropdownOptions.size} />
                </div>

                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <Input label="Stock Qty" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} />
                  <Input label="Supplier" name="supplier_name" value={formData.supplier_name} onChange={handleChange} />
                  <Input label="Purchase Price" type="number" name="purchase_price" value={formData.purchase_price} onChange={handleChange} />
                  <Input label="Selling Price" type="number" name="selling_price" value={formData.selling_price} onChange={handleChange} />
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                <Button onClick={handleSubmit} className="flex-1 py-4 text-base shadow-xl shadow-indigo-600/10">
                  {isEditMode ? 'Update Inventory' : 'Confirm & Save'}
                </Button>
                <Button variant="secondary" onClick={handleCancelEdit} className="py-4">Cancel</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockPage;
