import Dexie, { type Table } from "dexie";

// Define interfaces
export interface Product {
  id?: number;
  name: string;
  price: number;
  image: string | null;
  is_active: boolean;
}

export interface Sale {
  id?: number;
  total_amount: number;
  items_count: number;
  sale_date: string;
  customer_cash: number;
  change: number;
}

export interface SaleItem {
  id?: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Database class
export class PandesalDB extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  sale_items!: Table<SaleItem, number>;

  constructor() {
    super("PandesalPOS");

    this.version(1).stores({
      products: "++id, name, price, is_active",
      sales: "++id, sale_date, total_amount",
      sale_items: "++id, sale_id, product_id",
    });
  }
}

// Export database instance
export const db = new PandesalDB();

// Seed initial data
export async function seedDatabase() {
  const count = await db.products.count();

  if (count > 0) {
    console.log("Database already seeded");
    return;
  }

  const products: Product[] = [
    {
      name: "Regular Pandesal",
      price: 3.0,
      image: null,
      is_active: true,
    },
    {
      name: "Special Pandesal",
      price: 5.0,
      image: null,
      is_active: true,
    },
    {
      name: "Ube Pandesal",
      price: 6.0,
      image: null,
      is_active: true,
    },
    {
      name: "Cheese Pandesal",
      price: 7.0,
      image: null,
      is_active: true,
    },
    {
      name: "Chocolate Pandesal",
      price: 8.0,
      image: null,
      is_active: true,
    },
  ];

  await db.products.bulkAdd(products);
  console.log("✅ Database seeded with", products.length, "products");
}
