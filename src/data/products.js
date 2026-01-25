export const products = [
  { id: 1, name: "Premium Rice 5kg", sku: "GR-1001", unit: "bag", stock: 18, price: 1250, originalPrice: 1450, category: "grocery", brand: "Golden Fields", hasBarcode: true, isOnSale: true, popularity: 95, createdAt: new Date('2025-12-01'), description: "High-quality premium rice sourced from local farmers. Perfect for everyday meals.", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop" },
  { id: 2, name: "Cooking Oil 1L", sku: "GR-1020", unit: "bottle", stock: 40, price: 160, originalPrice: null, category: "grocery", brand: "SunHarvest", hasBarcode: true, isOnSale: false, popularity: 88, createdAt: new Date('2025-11-15'), description: "Pure vegetable cooking oil. Ideal for frying and sauteing.", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
  { id: 3, name: "Laundry Detergent 1kg", sku: "GR-1201", unit: "pack", stock: 25, price: 150, originalPrice: 180, category: "grocery", brand: "CleanWave", hasBarcode: true, isOnSale: true, popularity: 72, createdAt: new Date('2025-12-10'), description: "Powerful cleaning formula that removes tough stains while being gentle on fabrics.", image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop" },
  { id: 4, name: "Cement 40kg", sku: "HW-2001", unit: "bag", stock: 70, price: 360, originalPrice: null, category: "hardware", brand: "BuildPro", hasBarcode: false, isOnSale: false, popularity: 65, createdAt: new Date('2025-10-20'), description: "Portland cement for construction and repair work. High strength formula.", image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=400&h=400&fit=crop" },
  { id: 5, name: "PVC Pipe 1 inch", sku: "HW-1023", unit: "pc", stock: 6, price: 95, originalPrice: 120, category: "hardware", brand: "PipeMaster", hasBarcode: false, isOnSale: true, isFlashSale: true, flashSaleEnds: new Date(Date.now() + 4 * 60 * 60 * 1000), popularity: 45, createdAt: new Date('2025-12-05'), description: "Durable PVC pipe for plumbing applications. UV resistant.", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=400&fit=crop" },
  { id: 6, name: "Nails Assorted", sku: "HW-3102", unit: "pack", stock: 120, price: 55, originalPrice: null, category: "hardware", brand: "IronForge", hasBarcode: true, isOnSale: false, popularity: 80, createdAt: new Date('2025-09-01'), description: "Assorted nails pack with various sizes for different applications.", image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop" },
  { id: 7, name: "Screwdriver Set", sku: "HW-0902", unit: "set", stock: 4, price: 260, originalPrice: 320, category: "hardware", brand: "ToolCraft", hasBarcode: true, isOnSale: true, popularity: 55, createdAt: new Date('2025-11-28'), description: "Complete 6-piece screwdriver set with ergonomic handles.", image: "https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=400&h=400&fit=crop" },
  { id: 8, name: "General Item", sku: "GN-0001", unit: "pc", stock: 999, price: 99, originalPrice: null, category: "general", brand: "Everyday", hasBarcode: false, isOnSale: false, popularity: 30, createdAt: new Date('2025-08-15'), description: "Versatile general purpose item for various uses.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop" },
  { id: 9, name: "Instant Noodles Pack", sku: "GR-1301", unit: "pack", stock: 200, price: 85, originalPrice: 100, category: "grocery", brand: "QuickBite", hasBarcode: true, isOnSale: true, isFlashSale: true, flashSaleEnds: new Date(Date.now() + 2 * 60 * 60 * 1000), popularity: 92, createdAt: new Date('2026-01-10'), description: "Delicious instant noodles with savory seasoning. Quick and easy meal.", image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop" },
  { id: 10, name: "LED Light Bulb", sku: "HW-4001", unit: "pc", stock: 50, price: 120, originalPrice: null, category: "hardware", brand: "BrightLite", hasBarcode: true, isOnSale: false, popularity: 70, createdAt: new Date('2026-01-05'), description: "Energy-efficient LED bulb. 10W equivalent to 60W incandescent.", image: "https://images.unsplash.com/photo-1532007442975-6095c9c1db01?w=400&h=400&fit=crop" },
  { id: 11, name: "Dishwashing Liquid 500ml", sku: "GR-1401", unit: "bottle", stock: 35, price: 75, originalPrice: null, category: "grocery", brand: "FreshClean", hasBarcode: true, isOnSale: false, popularity: 68, createdAt: new Date('2025-12-20'), description: "Gentle yet effective dishwashing liquid with fresh lemon scent.", image: "https://images.unsplash.com/photo-1622560481156-34aa8de8d519?w=400&h=400&fit=crop" },
  { id: 12, name: "Paint Brush Set", sku: "HW-5001", unit: "set", stock: 15, price: 180, originalPrice: 220, category: "hardware", brand: "ColorEdge", hasBarcode: false, isOnSale: true, popularity: 42, createdAt: new Date('2026-01-12'), description: "Professional paint brush set with 3 different sizes.", image: "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&h=400&fit=crop" },
];

export const categories = [
  { value: 'all', label: 'All Categories', icon: 'grid-outline' },
  { value: 'grocery', label: 'Grocery', icon: 'basket-outline' },
  { value: 'hardware', label: 'Hardware', icon: 'hammer-outline' },
  { value: 'general', label: 'General', icon: 'cube-outline' },
];

// Promotional banners
export const banners = [
  {
    id: 1,
    title: 'Flash Sale!',
    subtitle: 'Up to 25% off on selected items',
    backgroundColor: '#7c3aed',
    icon: 'flash',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Check out our latest products',
    backgroundColor: '#2563eb',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'Free Delivery',
    subtitle: 'On orders above ₱1,000',
    backgroundColor: '#059669',
    icon: 'car',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
  },
];

// Sort options
export const sortOptions = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];
