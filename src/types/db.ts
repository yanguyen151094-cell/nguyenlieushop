export type Role = 'user' | 'vendor' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  balance: number;
  pending_balance: number;
  store_code: string | null;
  store_name: string | null;
  bank_name: string | null;
  bank_number: string | null;
  bank_holder: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  shop_description: string | null;
  store_warranty_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarrantyOption {
  label: string;
  days: number;
  extra_price: number;
}

export interface Product {
  id: string;
  vendor_id: string | null;
  vendor_code: string;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  images: string[] | null;
  base_price: number;
  warranty_options: WarrantyOption[];
  delivery_format: string | null;
  delivery_time: string | null;
  stock_count: number;
  sold_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  vendor_id: string | null;
  product_id: string | null;
  product_name: string;
  vendor_code: string;
  warranty_label: string;
  warranty_days: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  account_data: string;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  transfer_code: string;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Withdrawal {
  id: string;
  vendor_id: string;
  amount: number;
  bank_name: string;
  bank_number: string;
  bank_holder: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export type TransactionType = 'purchase' | 'deposit' | 'withdraw' | 'sale';

export interface TransactionRow {
  id: string;
  type: TransactionType;
  user_id: string | null;
  amount: number;
  display_name: string;
  description: string;
  product_name: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  audience: 'customer' | 'vendor';
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  user_id: string;
  sender_role: 'user' | 'admin' | 'vendor';
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  user_id: string;
  vendor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorBankCard {
  id: string;
  vendor_id: string;
  bank_name: string;
  bank_number: string;
  bank_holder: string;
  is_default: boolean;
  created_at: string;
}

export interface ShopMedia {
  id: string;
  vendor_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface VendorNotification {
  id: string;
  vendor_id: string;
  type: 'fee' | 'system' | 'notice';
  title: string;
  content: string;
  amount: number;
  period: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SiteSettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}