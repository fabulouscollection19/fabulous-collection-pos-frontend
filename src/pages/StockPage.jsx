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
      { value: 'Silk', label: 'Silk' }, { value: 'Cotton', label: 'Cotton' }, { value: 'Georgette', label: 'Georgette' },
      { value: 'Chiffon', label: 'Chiffon' }, { value: 'Linen', label: 'Linen' }, { value: 'Velvet', label: 'Velvet' }
    ],
    color: [
      { value: 'Red', label: 'Red' }, { value: 'Blue', label: 'Blue' }, { value: 'Green', label: 'Green' },
      { value: 'Black', label: 'Black' }, { value: 'White', label: 'White' }, { value: 'Gold', label: 'Gold' }
    ],
    pattern: [
      { value: 'Solid', label: 'Solid' }, { value: 'Floral', label: 'Floral' }, { value: 'Striped', label: 'Striped' },
      { value: 'Embroidered', label: 'Embroidered' }, { value: 'Printed', label: 'Printed' }
    ],
    size: [
      { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' },
      { value: 'XL', label: 'XL' }, { value: 'Free Size', label: 'Free Size' }
    ]
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/stock`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      // Sort by stock_quantity descending and take top 10 as default
      const sortedData = [...data].sort((a, b) => b.stock_quantity - a.stock_quantity).slice(0, 10);
      setStockData(sortedData);
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
        const numericPart = parseInt(data.lastSku.replace(/\D/g, ''), 10);
        if (!isNaN(numericPart)) nextNumber = numericPart + 1;
      }
      return `${categoryPrefix}${nextNumber.toString().padStart(5, '0')}`;
    } catch (err) {
      return `${category.slice(0, 2).toUpperCase()}10001`;
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
    try {
      const endpoint = isEditMode ? `/api/stock/${editingSku}` : '/api/stock';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
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
            <Button variant="secondary" icon={Search} onClick={() => setShowLookup(!showLookup)}>
              {showLookup ? 'Hide Search' : 'Lookup SKU'}
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsOffcanvasOpen(true)}>
              Add Product
            </Button>
          </div>
        }
      />

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
