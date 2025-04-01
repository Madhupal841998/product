export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  isactive: boolean;
  createdat: Date;
  updatedat: Date;
}