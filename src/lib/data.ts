


export type Invoice = {
  id: string;
  customer: string;
  customerEmail: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid' | 'Cancelled';
  items: InvoiceItem[];
};

export type UserRole = {
    uid: string;
    role: 'admin' | 'salesperson';
    firstName: string;
    lastName: string;
}

export type Customer = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

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

export const customers: Customer[] = [
    { id: 'CUST-01', firstName: 'Stark', lastName: 'Industries', email: 'tony@stark.com' },
    { id: 'CUST-02', firstName: 'Wayne', lastName: 'Enterprises', email: 'bruce@wayne.com' },
    { id: 'CUST-03', firstName: 'Oscorp', lastName: '', email: 'norman@oscorp.com' },
];


export const invoices: Invoice[] = [
  { 
    id: 'INV-001', 
    customer: 'Stark Industries', 
    customerEmail: 'tony@stark.com', 
    date: '2023-10-01T10:00:00Z', 
    dueDate: '2023-10-31',
    totalAmount: 2500.00,
    paidAmount: 2500.00,
    dueAmount: 0,
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
    date: '2023-10-05T11:30:00Z', 
    dueDate: '2023-11-04',
    totalAmount: 1500.75, 
    paidAmount: 1500.75,
    dueAmount: 0,
    status: 'Paid',
    items: [
        { id: 'item-3', description: 'Eco-friendly Solvent', quantity: 50, unitPrice: 30.015, total: 1500.75 }
    ]
  },
  { 
    id: 'INV-003', 
    customer: 'Oscorp', 
    customerEmail: 'norman@oscorp.com', 
    date: '2023-11-15T14:00:00Z', 
    dueDate: '2023-12-15',
    totalAmount: 3200.00, 
    paidAmount: 0,
    dueAmount: 3200.00,
    status: 'Unpaid',
    items: [
        { id: 'item-4', description: 'Industrial Grade Coating', quantity: 40, unitPrice: 80.00, total: 3200.00 }
    ]
  },
  { 
    id: 'INV-004', 
    customer: 'Cyberdyne Systems', 
    customerEmail: 'miles@cyberdyne.com', 
    date: '2023-09-20T09:00:00Z', 
    dueDate: '2023-10-20',
    totalAmount: 5000.00, 
    paidAmount: 0,
    dueAmount: 5000.00,
    status: 'Overdue',
    items: [
        { id: 'item-5', description: 'Advanced Polymer Compound', quantity: 10, unitPrice: 500.00, total: 5000.00 }
    ]
  },
  {
    id: 'INV-005',
    customer: 'Queen Consolidated',
    customerEmail: 'oliver@queen.com',
    date: '2023-12-01T16:45:00Z',
    dueDate: '2023-12-31',
    totalAmount: 750.50,
    paidAmount: 0,
    dueAmount: 750.50,
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
    appliesTo: string[];
    type: 'Percentage' | 'Fixed';
    rate: number;
}

export type SalesCommission = {
    id: string;
    salespersonId: string;
    productId: string;
    distributionChannelId: string;
    commissionRate: number;
    saleDate: string;
    saleAmount: number;
    discountAmount: number;
    netSaleAmount: number;
    commissionAmount: number;
    invoiceId: string;
    ruleId: string;
    ruleName: string;
    commissionType: 'Percentage' | 'Fixed';
};


export const commissions: Commission[] = [
    { id: 'COM-01', ruleName: 'Standard Sales', appliesTo: ['All Products'], type: 'Percentage', rate: 5 },
    { id: 'COM-02', ruleName: 'Distributor Tier 1', appliesTo: ['Tier 1 Distributors'], type: 'Percentage', rate: 7.5 },
    { id: 'COM-03', ruleName: 'New Product Launch', appliesTo: ['New-Gen Paint'], type: 'Fixed', rate: 5000 },
    { id: 'COM-04', ruleName: 'Q4 Volume Bonus', appliesTo: ['Sales over 1,000,000'], type: 'Fixed', rate: 25000 },
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
    deliveryStatus: 'Pending' | 'Shipped' | 'Received' | 'Cancelled';
    paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
    items: PurchaseOrderItem[];
    discount: number;
    tax: number;
    paidAmount: number;
    dueAmount: number;
}


export const purchaseOrders: PurchaseOrder[] = [
    { id: 'PO-001', supplier: 'Chemical Supply Inc.', date: '2023-11-02', amount: 12000, deliveryStatus: 'Received', paymentStatus: 'Paid', items: [{ id: 'po-item-1', rawMaterialId: 'RM-001', quantity: 80, unitCost: 150}], discount: 0, tax: 0, paidAmount: 12000, dueAmount: 0 },
    { id: 'PO-002', supplier: 'Global Minerals Co.', date: '2023-11-10', amount: 25000, deliveryStatus: 'Received', paymentStatus: 'Paid', items: [{ id: 'po-item-2', rawMaterialId: 'RM-002', quantity: 100, unitCost: 250}], discount: 1000, tax: 500, paidAmount: 24500, dueAmount: 0 },
    { id: 'PO-003', supplier: 'Advanced Polymers', date: '2023-11-20', amount: 8000, deliveryStatus: 'Pending', paymentStatus: 'Unpaid', items: [{ id: 'po-item-3', rawMaterialId: 'RM-003', quantity: 1600, unitCost: 5}], discount: 0, tax: 0, paidAmount: 0, dueAmount: 8000 },
    { id: 'PO-004', supplier: 'Chemical Supply Inc.', date: '2023-12-01', amount: 18000, deliveryStatus: 'Pending', paymentStatus: 'Partially Paid', items: [{ id: 'po-item-4', rawMaterialId: 'RM-001', quantity: 120, unitCost: 150}], discount: 500, tax: 200, paidAmount: 10000, dueAmount: 7700 },
];

export type RawMaterial = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: 'kg' | 'litre' | 'pcs' | 'ml' | 'gm';
    unitCost: number;
    createdAt: any;
};

export const rawMaterials: RawMaterial[] = [
    { id: 'RM-001', name: 'Titanium Dioxide', category: 'Pigment', quantity: 500, unit: 'kg', unitCost: 150, createdAt: new Date() },
    { id: 'RM-002', name: 'Acrylic Polymer', category: 'Binder', quantity: 300, unit: 'litre', unitCost: 250, createdAt: new Date() },
    { id: 'RM-003', name: 'Water', category: 'Solvent', quantity: 1000, unit: 'litre', unitCost: 5, createdAt: new Date() },
    { id: 'RM-004', name: 'Calcium Carbonate', category: 'Filler', quantity: 800, unit: 'kg', unitCost: 50, createdAt: new Date() },
    { id: 'RM-005', name: 'Fungicide', category: 'Additive', quantity: 50, unit: 'kg', unitCost: 500, createdAt: new Date() },
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
  materialCost: number;
  labourCost: number;
  otherCosts: number;
  wastageValue: number;
  totalCost: number;
  unitCost: number;
  status: 'In Progress' | 'Completed' | 'Pending' | 'Cancelled';
  startDate: string;
  createdAt: any;
};

export const productionOrders: ProductionOrder[] = [
  { id: 'PROD-001', productName: 'Premium Wall Paint', quantity: 500, materialCost: 37750, labourCost: 5000, otherCosts: 2000, wastageValue: 500, totalCost: 45250, unitCost: 90.5, status: 'Completed', startDate: '2023-11-05', createdAt: new Date() },
  { id: 'PROD-002', productName: 'Weather-Proof Exterior', quantity: 300, materialCost: 28500, labourCost: 4000, otherCosts: 1500, wastageValue: 300, totalCost: 34300, unitCost: 114.33, status: 'In Progress', startDate: '2023-11-20', createdAt: new Date() },
];

export type Distributor = {
    id: string;
    name: string;
    location: string;
    tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    totalSales: number;
    outstandingDues: number;
    totalCommission: number;
    email?: string;
    phone?: string;
}

export const distributors: Distributor[] = [
    { id: 'DIST-01', name: 'Dhaka Paint Supplies', location: 'Dhaka, Bangladesh', tier: 'Tier 1', totalSales: 550000, outstandingDues: 50000, totalCommission: 27500, email: 'contact@dps.com', phone: '01700000001' },
    { id: 'DIST-02', name: 'Chittagong Coatings', location: 'Chittagong, Bangladesh', tier: 'Tier 2', totalSales: 320000, outstandingDues: 15000, totalCommission: 16000, email: 'sales@cc.com', phone: '01800000002' },
    { id: 'DIST-03', name: 'Sylhet Colors', location: 'Sylhet, Bangladesh', tier: 'Tier 3', totalSales: 150000, outstandingDues: 0, totalCommission: 7500, email: 'info@sylhetcolors.com', phone: '01900000003' },
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

// Getting current date and subtracting days to make datetimes dynamic
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(now.getDate() - 2);
const lastWeek = new Date(now);
lastWeek.setDate(now.getDate() - 7);

export type Notification = {
    id: string;
    title: string;
    description: string;
    datetime: Date;
    read: boolean;
};
export const notifications: Notification[] = [
    { 
        id: 'NOTIF-01',
        title: 'New PO #PO-004 Created',
        description: 'A new purchase order has been created for Chemical Supply Inc. for an amount of BDT 18,000.',
        datetime: now,
        read: false,
    },
    { 
        id: 'NOTIF-02',
        title: 'Invoice #INV-003 is due tomorrow!',
        description: 'The invoice for Oscorp (BDT 3,200.00) is due tomorrow. Consider sending a reminder.',
        datetime: yesterday,
        read: false,
    },
    { 
        id: 'NOTIF-03',
        title: 'Production Order #PROD-001 Completed',
        description: '500 units of "Premium Wall Paint" have been added to inventory.',
        datetime: twoDaysAgo,
        read: true,
    },
    { 
        id: 'NOTIF-04',
        title: 'Low Stock Warning: Water',
        description: 'Inventory for "Water" is running low. Current stock: 1000 litre.',
        datetime: lastWeek,
        read: true,
    },
];

export type SalaryPayment = {
    id: string;
    employeeName: string;
    position: string;
    paymentDate: string;
    amount: number;
};


export type SalesReturn = {
    id: string;
    invoiceId: string;
    returnDate: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
    }[];
    totalReturnValue: number;
    reason: string;
}

export type Expense = {
    id: string;
    category: string;
    description: string;
    date: string;
    amount: number;
}
