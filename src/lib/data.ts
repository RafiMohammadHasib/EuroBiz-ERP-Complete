
export type Invoice = {
  id: string;
  customer: string;
  customerEmail: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
};

export const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Stark Industries', customerEmail: 'tony@stark.com', date: '2023-10-01', amount: 2500.00, status: 'Paid' },
  { id: 'INV-002', customer: 'Wayne Enterprises', customerEmail: 'bruce@wayne.com', date: '2023-10-05', amount: 1500.75, status: 'Paid' },
  { id: 'INV-003', customer: 'Oscorp', customerEmail: 'norman@oscorp.com', date: '2023-10-12', amount: 3000.00, status: 'Unpaid' },
  { id: 'INV-004', customer: 'Queen Consolidated', customerEmail: 'oliver@queen.com', date: '2023-09-15', amount: 750.00, status: 'Overdue' },
  { id: 'INV-005', customer: 'Stark Industries', customerEmail: 'tony@stark.com', date: '2023-10-20', amount: 5500.50, status: 'Unpaid' },
  { id: 'INV-006', customer: 'Daily Planet', customerEmail: 'clark@dailyplanet.com', date: '2023-10-22', amount: 850.00, status: 'Paid' },
  { id: 'INV-007', customer: 'Kord Industries', customerEmail: 'ted@kord.com', date: '2023-08-30', amount: 1250.25, status: 'Overdue' },
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
