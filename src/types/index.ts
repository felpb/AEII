export type UserRole = 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  items: PurchaseItem[];
  total: number;
  supplier: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  estimatedProfit: number;
  totalSales: number;
  lowStockCount: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}
