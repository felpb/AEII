import { User, Category, Product, Sale, Purchase } from '@/types';

const STORAGE_KEYS = {
  users: 'gestao_users',
  currentUser: 'gestao_current_user',
  categories: 'gestao_categories',
  products: 'gestao_products',
  sales: 'gestao_sales',
  purchases: 'gestao_purchases',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function initializeDefaultData(): void {
  if (!localStorage.getItem(STORAGE_KEYS.categories)) {
    const defaultCategories: Category[] = [
      { id: '1', name: 'Eletrônicos' },
      { id: '2', name: 'Roupas' },
      { id: '3', name: 'Alimentos' },
      { id: '4', name: 'Bebidas' },
      { id: '5', name: 'Outros' },
    ];
    setItem(STORAGE_KEYS.categories, defaultCategories);
  }

  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@sistema.com',
        name: 'Administrador',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ];
    setItem(STORAGE_KEYS.users, defaultUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    setItem(STORAGE_KEYS.products, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.sales)) {
    setItem(STORAGE_KEYS.sales, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.purchases)) {
    setItem(STORAGE_KEYS.purchases, []);
  }
}
export function getUsers(): User[] {
  initializeDefaultData();
  return getItem<User[]>(STORAGE_KEYS.users, []);
}

export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.currentUser, null);
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.currentUser, user);
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  setItem(STORAGE_KEYS.users, users);
  return newUser;
}

export function loginUser(email: string, password: string): User | null {
  initializeDefaultData();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function getCategories(): Category[] {
  initializeDefaultData();
  return getItem<Category[]>(STORAGE_KEYS.categories, []);
}

export function createCategory(name: string): Category {
  const categories = getCategories();
  const newCategory: Category = {
    id: crypto.randomUUID(),
    name,
  };
  categories.push(newCategory);
  setItem(STORAGE_KEYS.categories, categories);
  return newCategory;
}

export function getProducts(): Product[] {
  initializeDefaultData();
  return getItem<Product[]>(STORAGE_KEYS.products, []);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find(p => p.id === id);
}

export function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const products = getProducts();
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  products.push(newProduct);
  setItem(STORAGE_KEYS.products, products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.products, products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  setItem(STORAGE_KEYS.products, filtered);
  return true;
}

export function updateProductStock(id: string, quantityChange: number): Product | null {
  const product = getProductById(id);
  if (!product) return null;
  return updateProduct(id, { quantity: product.quantity + quantityChange });
}
export function getSales(): Sale[] {
  initializeDefaultData();
  return getItem<Sale[]>(STORAGE_KEYS.sales, []);
}

export function createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Sale {
  const sales = getSales();
  const newSale: Sale = {
    ...sale,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  sale.items.forEach(item => {
    updateProductStock(item.productId, -item.quantity);
  });

  sales.push(newSale);
  setItem(STORAGE_KEYS.sales, sales);
  return newSale;
}

export function getPurchases(): Purchase[] {
  initializeDefaultData();
  return getItem<Purchase[]>(STORAGE_KEYS.purchases, []);
}

export function createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Purchase {
  const purchases = getPurchases();
  const newPurchase: Purchase = {
    ...purchase,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  purchase.items.forEach(item => {
    updateProductStock(item.productId, item.quantity);
  });

  purchases.push(newPurchase);
  setItem(STORAGE_KEYS.purchases, purchases);
  return newPurchase;
}

export function getDashboardMetrics(): {
  totalRevenue: number;
  estimatedProfit: number;
  totalSales: number;
  lowStockCount: number;
} {
  const sales = getSales();
  const products = getProducts();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlySales = sales.filter(s => new Date(s.createdAt) >= startOfMonth);

  const totalRevenue = monthlySales.reduce((acc, s) => acc + s.total, 0);

  let totalCost = 0;
  monthlySales.forEach(sale => {
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        totalCost += product.costPrice * item.quantity;
      }
    });
  });

  const estimatedProfit = totalRevenue - totalCost;
  const totalSalesCount = monthlySales.length;
  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;

  return {
    totalRevenue,
    estimatedProfit,
    totalSales: totalSalesCount,
    lowStockCount,
  };
}

export function getRevenueData(days: number = 7): { date: string; revenue: number }[] {
  const sales = getSales();
  const result: { date: string; revenue: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayRevenue = sales
      .filter(s => s.createdAt.startsWith(dateStr))
      .reduce((acc, s) => acc + s.total, 0);

    result.push({
      date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      revenue: dayRevenue,
    });
  }

  return result;
}

export function getRecentTransactions(limit: number = 10): Array<{
  id: string;
  type: 'sale' | 'purchase';
  description: string;
  value: number;
  date: string;
}> {
  const sales = getSales().map(s => ({
    id: s.id,
    type: 'sale' as const,
    description: `Venda - ${s.items.length} item(s)`,
    value: s.total,
    date: s.createdAt,
  }));

  const purchases = getPurchases().map(p => ({
    id: p.id,
    type: 'purchase' as const,
    description: `Compra - ${p.supplier}`,
    value: -p.total,
    date: p.createdAt,
  }));

  return [...sales, ...purchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
