export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  createdAt: Date;
}

export interface Variation {
  id: string;
  productId: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  costEncrypted: string;
  iv: string;
  authTag: string;
}

export interface MatrixPayload {
  name: string;
  description: string;
  basePrice: number;
  sizes: string[];
  colors: string[];
  cost: number;
}
