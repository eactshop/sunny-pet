export interface StoreProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  sellPrice: number;
  salePrice?: number;
  stock: number;
  image?: string;
  categoryId: string;
  categoryName: string;
  active: boolean;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface StoreCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface StoreOrder {
  id: string;
  code: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  note?: string;
  deliveryName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  paymentMethod: string;
  orderSource: string;
  createdAt: string;
  items: StoreOrderItem[];
}

export interface StoreOrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
  email?: string;
  paymentMethod: "COD" | "BANK_TRANSFER";
  note?: string;
  voucherCode?: string;
}

export interface Voucher {
  id: string;
  code: string;
  name: string;
  type: "PERCENT" | "FIXED" | "COMBO";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
}
