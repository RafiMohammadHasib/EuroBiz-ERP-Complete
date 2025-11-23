

export type Invoice = {
  id: string;
  customer: string;
  customerEmail: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  items: InvoiceItem[];
};

export type InvoiceItem = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export const companyDetails = {
    name: 'BizFin Inc.',
    address: '123 Innovation Drive, Tech City, 12345',
    email: 'accounts@bizfin.com',
    phone: '+1 (555) 123-4567',
    logoUrl: '/logo.png' // You can add a logo here
}

export const invoices: Invoice[] = [
  { 
    id: 'INV-001', 
    customer: 'Stark Industries', 
    customerEmail: 'tony@stark.com', 
    date: '2023-10-01', 
    dueDate: '2023-10-31',
    amount: 2500.00, 
    status: 'Paid',
    items: [
        { id: 'item-1', description: 'Premium Wall Paint (1L)', quantity: 100, unitPrice: 20.00, total: 2000.00 },
        { id: 'item-2', description: 'Painting Supplies Kit', quantity: 20, unitPrice: 25.00, total: 500.00 },
    ]
  },
  { 
    id: 'INV-002', 
    customer: 'Wayne Enterprises', 
    customerEmail: 'bruce@wayne.com', 
    date: '2023-10-05', 
    dueDate: '2023-11-04',
    amount: 1500.75, 
    status: 'Paid',
    items: [
        { id: 'item-3', description: 'Weather-Proof Exterior (5L)', quantity: 15, unitPrice: 75.50, total: 1132.50 },
        { id: 'item-4', description: 'Primer (1L)', quantity: 50, unitPrice: 7.365, total: 368.25 },
    ]
  },
  { 
    id: 'INV-003', 
    customer: 'Oscorp', 
    customerEmail: 'norman@oscorp.com', 
    date: '2023-10-12', 
    dueDate: '2023-11-11',
    amount: 3000.00, 
    status: 'Unpaid',
    items: [
        { id: 'item-5', description: 'Standard Emulsion (1L)', quantity: 300, unitPrice: 10.00, total: 3000.00 },
    ]
  },
  { 
    id: 'INV-004', 
    customer: 'Queen Consolidated', 
    customerEmail: 'oliver@queen.com', 
    date: '2023-09-15', 
    dueDate: '2023-10-15',
    amount: 750.00, 
    status: 'Overdue',
    items: [
        { id: 'item-6', description: 'Wood Varnish (0.5L)', quantity: 50, unitPrice: 15.00, total: 750.00 },
    ]
  },
  { 
    id: 'INV-005', 
    customer: 'Stark Industries', 
    customerEmail: 'tony@stark.com', 
    date: '2023-10-20', 
    dueDate: '2023-11-19',
    amount: 5500.50, 
    status: 'Unpaid',
    items: [
        { id: 'item-1', description: 'Premium Wall Paint (1L)', quantity: 200, unitPrice: 20.00, total: 4000.00 },
        { id: 'item-7', description: 'Luxury Finish Additive', quantity: 50, unitPrice: 30.01, total: 1500.50 },
    ]
  },
  { 
    id: 'INV-006', 
    customer: 'Daily Planet', 
    customerEmail: 'clark@dailyplanet.com', 
    date: '2023-10-22', 
    dueDate: '2023-11-21',
    amount: 850.00, 
    status: 'Paid',
    items: [
        { id: 'item-3', description: 'Standard Emulsion (1L)', quantity: 85, unitPrice: 10.00, total: 850.00 },
    ]
  },
  { 
    id: 'INV-007', 
    customer: 'Kord Industries', 
    customerEmail: 'ted@kord.com', 
    date: '2023-08-30', 
    dueDate: '2023-09-29',
    amount: 1250.25, 
    status: 'Overdue',
    items: [
        { id: 'item-8', description: 'Industrial Degreaser (10L)', quantity: 25, unitPrice: 50.01, total: 1250.25 },
    ]
  },
];

export const salesData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 18000 },
    { month: 'Mar', revenue: 15000 },
    { month: 'Apr', revenue: 22000 },
    { month: 'May', revenue: 25000 },
    { month: 'Jun', revenue: 23000 },
    { month: 'Jul', revenue: 28000 },
    { month: 'Aug', revenue: 32000 },
    { month: 'Sep', revenue: 30000 },
    { month: 'Oct', revenue: 35000 },
    { month: 'Nov', revenue: 40000 },
    { month: 'Dec', revenue: 45000 },
];

export type Commission = {
  id: string;
  ruleName: string;
  appliesTo: string;
  type: 'Percentage' | 'Fixed';
  rate: number;
};

export const commissions: Commission[] = [
  { id: 'COM-01', ruleName: 'Standard Product', appliesTo: 'All Products', type: 'Percentage', rate: 5 },
  { id: 'COM-02', ruleName: 'Distributor Tier 1', appliesTo: 'Distributor Group A', type: 'Percentage', rate: 7.5 },
  { id: 'COM-03', ruleName: 'Special Promotion', appliesTo: 'Product X123', type: 'Fixed', rate: 50 },
  { id: 'COM-04', ruleName: 'Distributor Tier 2', appliesTo: 'Distributor Group B', type: 'Percentage', rate: 6 },
];

export type PurchaseOrder = {
    id: string;
    supplier: string;
    date: string;
    amount: number;
    status: 'Pending' | 'Completed' | 'Cancelled';
};

export const purchaseOrders: PurchaseOrder[] = [
    { id: 'PO-001', supplier: 'Acme Corp', date: '2023-10-05', amount: 1200.00, status: 'Completed' },
    { id: 'PO-002', supplier: 'Globex Corporation', date: '2023-10-10', amount: 350.50, status: 'Completed' },
    { id: 'PO-003', supplier: 'Soylent Corp', date: '2023-10-15', amount: 2000.00, status: 'Pending' },
    { id: 'PO-004', supplier: 'InGen', date: '2023-10-20', amount: 500.00, status: 'Cancelled' },
];

export type Salary = {
    id: string;
    name: string;
    position: string;
    amount: number;
    status: 'Active' | 'Inactive';
    paymentDate: string;
};

export const salaries: Salary[] = [
    { id: 'SAL-001', name: 'John Doe', position: 'Factory Manager', amount: 5000, status: 'Active', paymentDate: '2023-10-31' },
    { id: 'SAL-002', name: 'Jane Smith', position: 'Sales Lead', amount: 4500, status: 'Active', paymentDate: '2023-10-31' },
    { id: 'SAL-003', name: 'Peter Jones', position: 'Accountant', amount: 4000, status: 'Active', paymentDate: '2023-10-31' },
    { id: 'SAL-004', name: 'Susan Williams', position: 'Lead Developer', amount: 6000, status: 'Inactive', paymentDate: '2023-09-30' },
];

export type Distributor = {
    id: string;
    name: string;
    location: string;
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    totalSales: number;
};

export const distributors: Distributor[] = [
    { id: 'DIST-01', name: 'Global Distributors Inc.', location: 'New York, USA', tier: 'Tier 1', totalSales: 150000 },
    { id: 'DIST-02', name: 'Euro Sales Partners', location: 'Berlin, Germany', tier: 'Tier 2', totalSales: 95000 },
    { id: 'DIST-03', name: 'Asia Pacific Traders', location: 'Singapore', tier: 'Tier 1', totalSales: 250000 },
];

export type Supplier = {
    id: string;
    name: string;
    category: string;
    status: 'Active' | 'Inactive';
    totalPOValue: number;
};

export const suppliers: Supplier[] = [
    { id: 'SUP-01', name: 'Raw Materials Co.', category: 'Chemicals', status: 'Active', totalPOValue: 75000 },
    { id: 'SUP-02', name: 'Packaging Pros', category: 'Containers', status: 'Active', totalPOValue: 32000 },
    { id: 'SUP-03', name: 'Industrial Components', category: 'Parts', status: 'Inactive', totalPOValue: 15000 },
];


export type ProductionOrder = {
    id: string;
    productName: string;
    quantity: number;
    status: 'In Progress' | 'Completed' | 'Pending';
    startDate: string;
    totalCost: number;
}

export const productionOrders: ProductionOrder[] = [
    { id: 'PROD-001', productName: 'Premium Wall Paint (1L)', quantity: 500, status: 'Completed', startDate: '2023-10-01', totalCost: 6250 },
    { id: 'PROD-002', productName: 'Weather-Proof Exterior (5L)', quantity: 250, status: 'In Progress', startDate: '2023-10-15', totalCost: 11250 },
    { id: 'PROD-003', productName: 'Standard Emulsion (1L)', quantity: 1000, status: 'Pending', startDate: '2023-10-25', totalCost: 8000 },
];

export type RawMaterial = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: 'kg' | 'litre' | 'pcs';
    unitCost: number;
}

export const rawMaterials: RawMaterial[] = [
    { id: 'RM-001', name: 'Titanium Dioxide', category: 'Pigment', quantity: 500, unit: 'kg', unitCost: 5.50 },
    { id: 'RM-002', name: 'Binder Resin', category: 'Binder', quantity: 1000, unit: 'litre', unitCost: 2.20 },
    { id: 'RM-003', name: 'Water', category: 'Solvent', quantity: 5000, unit: 'litre', unitCost: 0.01 },
    { id: 'RM-004', name: 'Preservative', category: 'Additive', quantity: 100, unit: 'kg', unitCost: 10.00 },
    { id: 'RM-005', name: 'Thickener', category: 'Additive', quantity: 150, unit: 'kg', unitCost: 7.80 },
    { id: 'RM-006', name: 'Anti-Foam Agent', category: 'Additive', quantity: 50, unit: 'kg', unitCost: 12.00 },
];

export type RawMaterialComponent = {
    materialId: string;
    quantity: number;
}

export type FinishedGood = {
    id: string;
    productName: string;
    quantity: number;
    unitCost: number;
    sellingPrice: number | null;
    components: RawMaterialComponent[];
}

export const finishedGoods: FinishedGood[] = [
    { 
        id: 'FG-001', 
        productName: 'Premium Wall Paint (1L)', 
        quantity: 500, 
        unitCost: 12.50, 
        sellingPrice: 22.99,
        components: [
            { materialId: 'RM-001', quantity: 0.2 }, // 0.2 kg Titanium
            { materialId: 'RM-002', quantity: 0.4 }, // 0.4 litre Binder
            { materialId: 'RM-003', quantity: 0.35 }, // 0.35 litre Water
            { materialId: 'RM-005', quantity: 0.05 }, // 0.05 kg Thickener
        ]
    },
    { 
        id: 'FG-002', 
        productName: 'Weather-Proof Exterior (5L)', 
        quantity: 150, 
        unitCost: 45.00, 
        sellingPrice: 79.99,
        components: [
            { materialId: 'RM-001', quantity: 1.5 },
            { materialId: 'RM-002', quantity: 2.5 },
            { materialId: 'RM-003', quantity: 1.0 },
            { materialId: 'RM-004', quantity: 0.1 },
            { materialId: 'RM-006', quantity: 0.05 },
        ]
    },
    { 
        id: 'FG-003', 
        productName: 'Standard Emulsion (1L)', 
        quantity: 800, 
        unitCost: 8.00, 
        sellingPrice: null,
        components: [
             { materialId: 'RM-001', quantity: 0.1 },
             { materialId: 'RM-002', quantity: 0.3 },
             { materialId: 'RM-003', quantity: 0.55 },
             { materialId: 'RM-005', quantity: 0.05 },
        ]
    },
];
