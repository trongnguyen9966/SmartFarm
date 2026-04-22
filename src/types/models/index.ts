/**
 * DocType Models
 * TypeScript interfaces for Frappe DocTypes
 */

// Base fields present in all DocTypes
export interface BaseDocType {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: 0 | 1 | 2; // 0=Draft, 1=Submitted, 2=Cancelled
}

// ============================================
// Distribution Store
// ============================================
export interface DistributionStore extends BaseDocType {
  store_name: string;
  warehouse: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  status: 'Active' | 'Inactive';
}

// ============================================
// Farm Owner
// ============================================
export interface FarmOwner extends BaseDocType {
  owner_name: string;
  phone?: string;
  email?: string;
  address?: string;
  linked_user?: string;
  distribution_store?: string;
}

// ============================================
// Farm
// ============================================
export interface Farm extends BaseDocType {
  farm_name: string;
  farm_owner: string;
  distribution_store: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  area_uom?: string;
  status: 'Active' | 'Inactive';
  // Computed fields (from API aggregation)
  garden_count?: number;
  total_area?: number;
}

// ============================================
// Garden
// ============================================
export interface Garden extends BaseDocType {
  garden_name: string;
  farm: string;
  farm_owner: string;
  area?: number;
  area_uom?: string;
  latitude?: number;
  longitude?: number;
  soil_type?: string;
  status: 'Active' | 'Inactive';
}

// ============================================
// Cultivation Master
// ============================================
export interface CultivationMaster extends BaseDocType {
  cultivation_name: string;
  cultivation_type: string;
  description?: string;
  image?: string;
  expected_duration_days?: number;
  status: 'Active' | 'Inactive';
}

// ============================================
// Cultivation Log
// ============================================
export interface CultivationLog extends BaseDocType {
  garden: string;
  garden_name?: string;
  farm: string;
  farm_owner: string;
  cultivation_master: string;
  cultivation_type: string;
  from_date: string;
  to_date?: string;
  expected_harvest_date?: string;
  status: 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
}

// ============================================
// Care Log
// ============================================
export interface CareLogItem {
  item: string;
  item_name?: string;
  quantity: number;
  uom: string;
  notes?: string;
}

export interface CareLog extends BaseDocType {
  cultivation_log: string;
  garden: string;
  garden_name?: string;
  care_date: string;
  content?: string;
  efficiency_percent?: number;
  items: CareLogItem[];
  attachments?: string[];
}

// ============================================
// Sales Order (ERPNext standard)
// ============================================
export interface SalesOrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
}

export interface SalesOrder extends BaseDocType {
  customer: string;
  customer_name: string;
  transaction_date: string;
  delivery_date?: string;
  custom_distribution_store?: string;
  items: SalesOrderItem[];
  total: number;
  grand_total: number;
  status: 'Draft' | 'To Deliver and Bill' | 'To Bill' | 'To Deliver' | 'Completed' | 'Cancelled';
}

// ============================================
// Delivery Note (ERPNext standard)
// ============================================
export interface DeliveryNoteItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
}

export interface DeliveryNote extends BaseDocType {
  customer: string;
  customer_name: string;
  posting_date: string;
  custom_distribution_store?: string;
  items: DeliveryNoteItem[];
  total: number;
  grand_total: number;
  status: 'Draft' | 'To Bill' | 'Completed' | 'Cancelled';
}

// ============================================
// Item (ERPNext standard)
// ============================================
export interface Item extends BaseDocType {
  item_code: string;
  item_name: string;
  item_group: string;
  custom_usage_type?: 'Farm Care' | 'Sales' | 'Both';
  stock_uom: string;
  image?: string;
  description?: string;
}

// ============================================
// Customer (ERPNext standard)
// ============================================
export interface Customer extends BaseDocType {
  customer_name: string;
  customer_type: 'Company' | 'Individual';
  customer_group?: string;
  territory?: string;
}
