

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
        { id: 'item-3', description: 'Eco-friendly Solvent', quantity: 50, unitPrice: 30.015, total: 1500.75 }
    ]
  },
  { 
    id: 'INV-003', 
    customer: 'Oscorp', 
    customerEmail: 'norman@oscorp.com', 
    date: '2023-11-15', 
    dueDate: '2023-12-15',
    amount: 3200.00, 
    status: 'Unpaid',
    items: [
        { id: 'item-4', description: 'Industrial Grade Coating', quantity: 40, unitPrice: 80.00, total: 3200.00 }
    ]
  },
  { 
    id: 'INV-004', 
    customer: 'Cyberdyne Systems', 
    customerEmail: 'miles@cyberdyne.com', 
    date: '2023-09-20', 
    dueDate: '2023-10-20',
    amount: 5000.00, 
    status: 'Overdue',
    items: [
        { id: 'item-5', description: 'Advanced Polymer Compound', quantity: 10, unitPrice: 500.00, total: 5000.00 }
    ]
  },
  {
    id: 'INV-005',
    customer: 'Queen Consolidated',
    customerEmail: 'oliver@queen.com',
    date: '2023-12-01',
    dueDate: '2023-12-31',
    amount: 750.50,
    status: 'Unpaid',
    items: [
        { id: 'item-6', description: 'Specialty Arrowhead Paint', quantity: 15, unitPrice: 50.033, total: 750.50 }
    ]
  },
];

export const salesData = [
    { month: "Jan", revenue: 400000 },
    { month: "Feb", revenue: 300000 },
    { month: "Mar", revenue: 500000 },
    { month: "Apr", revenue: 450000 },
    { month: "May", revenue: 700000 },
    { month: "Jun", revenue: 600000 },
    { month: "Jul", revenue: 800000 },
    { month: "Aug", revenue: 750000 },
    { month: "Sep", revenue: 900000 },
    { month: "Oct", revenue: 850000 },
    { month: "Nov", revenue: 1100000 },
    { month: "Dec", revenue: 1200000 },
];

export type Commission = {
    id: string;
    ruleName: string;
    appliesTo: string;
    type: 'Percentage' | 'Fixed';
    rate: number;
}

export const commissions: Commission[] = [
    { id: 'COM-01', ruleName: 'Standard Sales', appliesTo: 'All Products', type: 'Percentage', rate: 5 },
    { id: 'COM-02', ruleName: 'Distributor Tier 1', appliesTo: 'Tier 1 Distributors', type: 'Percentage', rate: 7.5 },
    { id: 'COM-03', ruleName: 'New Product Launch', appliesTo: 'New-Gen Paint', type: 'Fixed', rate: 5000 },
    { id: 'COM-04', ruleName: 'Q4 Volume Bonus', appliesTo: 'Sales over 1,000,000', type: 'Fixed', rate: 25000 },
];

export type PurchaseOrderItem = {
    id: string;
    rawMaterialId: string;
    quantity: number;
    unitCost: number;
}

export type PurchaseOrder = {
    id: string;
    supplier: string;
    date: string;
    amount: number;
    status: 'Pending' | 'Completed' | 'Cancelled';
    items: PurchaseOrderItem[];
}

export const purchaseOrders: PurchaseOrder[] = [
    { id: 'PO-001', supplier: 'Chemical Supply Inc.', date: '2023-11-02', amount: 12000, status: 'Completed', items: [{ id: 'po-item-1', rawMaterialId: 'RM-001', quantity: 200, unitCost: 60}] },
    { id: 'PO-002', supplier: 'Global Minerals Co.', date: '2023-11-10', amount: 25000, status: 'Completed', items: [{ id: 'po-item-2', rawMaterialId: 'RM-002', quantity: 100, unitCost: 250}] },
    { id: 'PO-003', supplier: 'Advanced Polymers', date: '2023-11-20', amount: 8000, status: 'Pending', items: [{ id: 'po-item-3', rawMaterialId: 'RM-003', quantity: 50, unitCost: 160}] },
    { id: 'PO-004', supplier: 'Chemical Supply Inc.', date: '2023-12-01', amount: 18000, status: 'Pending', items: [{ id: 'po-item-4', rawMaterialId: 'RM-001', quantity: 300, unitCost: 60}] },
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
    { id: 'SAL-001', name: 'Alice Johnson', position: 'CEO', amount: 150000, status: 'Active', paymentDate: '2023-11-30' },
    { id: 'SAL-002', name: 'Bob Williams', position: 'Sales Director', amount: 90000, status: 'Active', paymentDate: '2023-11-30' },
    { id: 'SAL-003', name: 'Charlie Brown', position: 'Production Manager', amount: 75000, status: 'Active', paymentDate: '2023-11-30' },
    { id: 'SAL-004', name: 'Diana Prince', position: 'Accountant', amount: 60000, status: 'Inactive', paymentDate: '2023-10-30' },
];

export type SalesReturn = {
    id: string;
    invoiceId: string;
    customer: string;
    date: string;
    amount: number;
    returnedUnits: number;
}

export const salesReturns: SalesReturn[] = [
    { id: 'RET-001', invoiceId: 'INV-004', customer: 'Cyberdyne Systems', date: '2023-10-25', amount: 1000, returnedUnits: 2 },
    { id: 'RET-002', invoiceId: 'INV-001', customer: 'Stark Industries', date: '2023-11-05', amount: 250, returnedUnits: 10 },
];

export type RawMaterial = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: 'kg' | 'litre' | 'pcs';
    unitCost: number;
};

export const rawMaterials: RawMaterial[] = [
    { id: 'RM-001', name: 'Titanium Dioxide', category: 'Pigment', quantity: 500, unit: 'kg', unitCost: 150 },
    { id: 'RM-002', name: 'Acrylic Polymer', category: 'Binder', quantity: 300, unit: 'litre', unitCost: 250 },
    { id: 'RM-003', name: 'Water', category: 'Solvent', quantity: 1000, unit: 'litre', unitCost: 5 },
    { id: 'RM-004', name: 'Calcium Carbonate', category: 'Filler', quantity: 800, unit: 'kg', unitCost: 50 },
    { id: 'RM-005', name: 'Fungicide', category: 'Additive', quantity: 50, unit: 'kg', unitCost: 500 },
];

export type FinishedGood = {
    id: string;
    productName: string;
    quantity: number;
    unitCost: number;
    sellingPrice?: number;
    components: { materialId: string, quantity: number }[];
};

export const finishedGoods: FinishedGood[] = [
    { 
        id: 'FG-001', 
        productName: 'Premium Wall Paint', 
        quantity: 150, 
        unitCost: 75.5, 
        sellingPrice: 110,
        components: [
            { materialId: 'RM-001', quantity: 0.1 }, // 0.1 kg Titanium Dioxide
            { materialId: 'RM-002', quantity: 0.3 }, // 0.3 litre Acrylic Polymer
            { materialId: 'RM-003', quantity: 0.5 }, // 0.5 litre Water
            { materialId: 'RM-004', quantity: 0.2 }, // 0.2 kg Calcium Carbonate
            { materialId: 'RM-005', quantity: 0.01 },// 0.01 kg Fungicide
        ]
    },
    { 
        id: 'FG-002', 
        productName: 'Weather-Proof Exterior', 
        quantity: 200, 
        unitCost: 95.0, 
        sellingPrice: 140,
        components: [
            { materialId: 'RM-001', quantity: 0.15 },
            { materialId: 'RM-002', quantity: 0.4 },
            { materialId: 'RM-003', quantity: 0.4 },
            { materialId: 'RM-005', quantity: 0.02 },
        ]
    },
];

export type ProductionOrder = {
  id: string;
  productName: string;
  quantity: number;
  totalCost: number;
  status: 'In Progress' | 'Completed' | 'Pending';
  startDate: string;
};

export const productionOrders: ProductionOrder[] = [
  { id: 'PROD-001', productName: 'Premium Wall Paint', quantity: 500, totalCost: 37750, status: 'Completed', startDate: '2023-11-05' },
  { id: 'PROD-002', productName: 'Weather-Proof Exterior', quantity: 300, totalCost: 28500, status: 'In Progress', startDate: '2023-11-20' },
];

export type Distributor = {
    id: string;
    name: string;
    location: string;
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    totalSales: number;
}

export const distributors: Distributor[] = [
    { id: 'DIST-01', name: 'Dhaka Paint Supplies', location: 'Dhaka, Bangladesh', tier: 'Tier 1', totalSales: 550000 },
    { id: 'DIST-02', name: 'Chittagong Coatings', location: 'Chittagong, Bangladesh', tier: 'Tier 2', totalSales: 320000 },
    { id: 'DIST-03', name: 'Sylhet Colors', location: 'Sylhet, Bangladesh', tier: 'Tier 3', totalSales: 150000 },
];

export type Supplier = {
    id: string;
    name: string;
    category: string;
    status: 'Active' | 'Inactive';
}

export const suppliers: Supplier[] = [
    { id: 'SUP-01', name: 'Chemical Supply Inc.', category: 'Chemicals', status: 'Active' },
    { id: 'SUP-02', name: 'Global Minerals Co.', category: 'Minerals', status: 'Active' },
    { id: 'SUP-03', name: 'Advanced Polymers', category: 'Polymers', status: 'Inactive' },
]


