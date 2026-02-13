import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, X, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

const StockPage = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupSKU, setLookupSKU] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
    category: '',
    subcategory: '',
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

  // Dropdown options
  const dropdownOptions = {
    category: [
      'Saree', 'Dress', 'Kurti', 'Lehenga', 'Blouse', 'Gown',
      'Salwar Suit', 'Palazzo', 'Top', 'Skirt'
    ],
    subcategory: {
      'Saree': ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Net', 'Banarasi'],
      'Dress': ['Casual', 'Formal', 'Party', 'Summer', 'Winter'],
      'Kurti': ['Anarkali', 'Straight', 'A-line', 'Angrakha'],
      'Lehenga': ['Bridal', 'Party', 'Traditional'],
      'Blouse': ['Designer', 'Simple', 'Backless'],
      'Gown': ['Evening', 'Cocktail', 'Bridal'],
      'Salwar Suit': ['Patiala', 'Churidar', 'Patiala Suit'],
      'Palazzo': ['Printed', 'Solid', 'Embroidered'],
      'Top': ['Crop', 'Off-shoulder', 'High-neck'],
      'Skirt': ['A-line', 'Pencil', 'Wrap']
    },
    fabric_type: [
      'Silk', 'Cotton', 'Georgette', 'Chiffon', 'Linen', 'Velvet',
      'Satin', 'Crepe', 'Net', 'Jacquard', 'Organza', 'Polyester'
    ],
    color: [
      'Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Yellow',
      'Purple', 'Orange', 'Brown', 'Grey', 'Maroon', 'Navy Blue',
      'Peach', 'Lavender', 'Teal', 'Magenta', 'Cream', 'Gold', 'Silver'
    ],
    pattern: [
      'Solid', 'Floral', 'Striped', 'Polka Dot', 'Geometric', 'Abstract',
      'Paisley', 'Animal Print', 'Chevron', 'Plaid', 'Embroidered',
      'Printed', 'Sequined', 'Zari Work', 'Mirror Work'
    ],
    size: [
      'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
      'Free Size', '28', '30', '32', '34', '36', '38', '40'
    ]
  };

  // Fetch stock data
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stock`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setStockData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStockData();
  }, []);

  // Generate SKU
// Generate SKU
    const generateSKU = async (category) => {
      if (!category) return '';

      try {
        const res = await fetch(`${API_BASE}/api/last-sku`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();

        const categoryPrefix = category.slice(0, 2).toUpperCase();
        let nextNumber = 10001;

        if (data.lastSku) {
          // Extract only the numeric part from the last SKU (remove any letters)
          const numericPart = parseInt(data.lastSku.replace(/\D/g, ''), 10);
          if (!isNaN(numericPart)) {
            nextNumber = numericPart + 1;
          }
        }

        // Always pad to 5 digits for consistency
        const paddedNumber = nextNumber.toString().padStart(5, '0');
        return `${categoryPrefix}${paddedNumber}`;
      } catch (err) {
        console.error("Error generating SKU:", err);
        // Fallback: category prefix + 10001
        return `${category.slice(0, 2).toUpperCase()}10001`;
      }
    };



  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      const newSku = await generateSKU(value);
      setFormData(prev => ({
        ...prev,
        [name]: value.charAt(0).toUpperCase() + value.slice(1),
        sku: newSku,
        subcategory: ''
      }));
    } else if (['stock_quantity', 'purchase_price', 'selling_price', 'sales_quantity'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value.charAt(0).toUpperCase() + value.slice(1) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const newStock = await res.json();
      setStockData(prev => [...prev, newStock]);
      setIsOffcanvasOpen(false);
      setFormData({
        sku: '',
        product_name: '',
        category: '',
        subcategory: '',
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
    } catch (err) {
      console.error("Error saving stock:", err);
      alert("Error saving stock: " + err.message);
    }
  };

  // Lookup SKU
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

  if (loading) return <p>Loading stock data...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  const tableData = lookupResult || stockData;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
            <p className="text-gray-600">View, lookup, and manage inventory</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLookup(!showLookup)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Search className="w-4 h-4" />
            <span>Lookup Stock</span>
          </button>

          <button
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={() => setIsOffcanvasOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Stock</span>
          </button>
        </div>
      </div>

      {/* Lookup Section */}
      {showLookup && (
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="text"
            value={lookupSKU}
            onChange={(e) => setLookupSKU(e.target.value.toUpperCase())}
            placeholder="Enter SKU (e.g., SR10001)"
            className="border rounded-lg p-2 w-64"
          />
          <button
            onClick={handleLookup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
          <button
            onClick={() => { setShowLookup(false); setLookupResult(null); }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      )}

      {/* Stock Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-x-auto"
      >
        {lookupError && <p className="text-red-600 mb-2">{lookupError}</p>}
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(tableData[0] || {}).map(key => (
                <th key={key} className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                  {key.replace(/_/g,' ').toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row,index)=>(
              <tr key={index} className="hover:bg-gray-50 transition duration-200">
                {Object.values(row).map((value,idx)=>(
                  <td key={idx} className="px-4 py-2 text-sm text-gray-600 border-b">{value?.toString() || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Offcanvas Panel (unchanged from your version) */}
      <motion.div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50`}
        initial={{ x: '100%' }}
        animate={{ x: isOffcanvasOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Add New Stock</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => setIsOffcanvasOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input name="sku" value={formData.sku} readOnly className="mt-1 w-full border rounded-lg p-2 bg-gray-100" />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">CATEGORY *</label>
                <select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full border rounded-lg p-2" required>
                  <option value="">Select Category</option>
                  {dropdownOptions.category.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-medium text-gray-700">SUBCATEGORY</label>
                <select name="subcategory" value={formData.subcategory} onChange={handleChange} className="mt-1 w-full border rounded-lg p-2">
                  <option value="">Select Subcategory</option>
                  {formData.category && dropdownOptions.subcategory[formData.category]?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Other fields */}
              {['product_name','brand','supplier_name'].map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700">{f.replace(/_/g,' ').toUpperCase()}</label>
                  <input name={f} value={formData[f]} onChange={handleChange} className="mt-1 w-full border rounded-lg p-2" />
                </div>
              ))}

              {/* Dropdown fields */}
              {['fabric_type','color','pattern','size'].map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700">{f.replace(/_/g,' ').toUpperCase()}</label>
                  <select name={f} value={formData[f]} onChange={handleChange} className="mt-1 w-full border rounded-lg p-2">
                    <option value="">Select {f}</option>
                    {dropdownOptions[f].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}

              {['stock_quantity','purchase_price','selling_price','sales_quantity'].map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700">{f.replace(/_/g,' ').toUpperCase()}</label>
                  <input type="number" name={f} value={formData[f]} onChange={handleChange} className="mt-1 w-full border rounded-lg p-2" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700">DATE ADDED</label>
                <input name="date_added" value={formData.date_added} readOnly className="mt-1 w-full border rounded-lg p-2 bg-gray-100" />
              </div>

              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Save</button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StockPage;
