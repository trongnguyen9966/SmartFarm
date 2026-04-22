/**
 * Mock Data for Store Employee Module
 * Used in development mode when backend is not available
 */

import type {
  StoreDashboardResponse,
  StockLevelsResponse,
  RecentCareLog,
} from '@/types/api';
import type {
  DistributionStore,
  FarmOwner,
  Farm,
  Garden,
  CultivationLog,
  CareLog,
  SalesOrder,
  DeliveryNote,
} from '@/types/models';

// ============================================
// Dashboard Data
// ============================================

export const mockDashboard: StoreDashboardResponse = {
  stores: [
    {
      name: 'DS-00001',
      store_name: 'Cửa Hàng Quận 1',
      warehouse: 'WH-00001',
      farm_count: 5,
      garden_count: 12,
      active_cultivation_count: 8,
      farm_owner_count: 3,
    },
    {
      name: 'DS-00002',
      store_name: 'Cửa Hàng Quận 7',
      warehouse: 'WH-00002',
      farm_count: 3,
      garden_count: 7,
      active_cultivation_count: 5,
      farm_owner_count: 2,
    },
  ],
  recent_care_logs: [
    {
      name: 'CARE-00001',
      care_date: '2026-04-20',
      garden: 'GRD-00001',
      garden_name: 'Vườn Rau Sạch A',
      cultivation_log: 'CLOG-00001',
    },
    {
      name: 'CARE-00002',
      care_date: '2026-04-19',
      garden: 'GRD-00002',
      garden_name: 'Vườn Cà Chua',
      cultivation_log: 'CLOG-00002',
    },
    {
      name: 'CARE-00003',
      care_date: '2026-04-18',
      garden: 'GRD-00003',
      garden_name: 'Vườn Dưa Leo',
      cultivation_log: 'CLOG-00003',
    },
  ],
};

// ============================================
// Stock Levels Data
// ============================================

export const mockStockLevels: StockLevelsResponse = {
  warehouse: 'WH-00001',
  items: [
    {
      item_code: 'FERT-001',
      item_name: 'Phân bón NPK 20-20-15',
      item_group: 'Phân bón',
      custom_usage_type: 'Farm Care',
      actual_qty: 150,
      uom: 'Kg',
    },
    {
      item_code: 'FERT-002',
      item_name: 'Phân hữu cơ vi sinh',
      item_group: 'Phân bón',
      custom_usage_type: 'Farm Care',
      actual_qty: 200,
      uom: 'Kg',
    },
    {
      item_code: 'PEST-001',
      item_name: 'Thuốc trừ sâu sinh học',
      item_group: 'Thuốc BVTV',
      custom_usage_type: 'Farm Care',
      actual_qty: 50,
      uom: 'Lít',
    },
    {
      item_code: 'SEED-001',
      item_name: 'Hạt giống cà chua',
      item_group: 'Hạt giống',
      custom_usage_type: 'Both',
      actual_qty: 100,
      uom: 'Gói',
    },
    {
      item_code: 'TOOL-001',
      item_name: 'Cuốc làm vườn',
      item_group: 'Dụng cụ',
      custom_usage_type: 'Both',
      actual_qty: 25,
      uom: 'Cái',
    },
  ],
  total_count: 5,
};

// ============================================
// Distribution Stores
// ============================================

export const mockStores: DistributionStore[] = [
  {
    name: 'DS-00001',
    store_name: 'Cửa Hàng Quận 1',
    warehouse: 'WH-00001',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    phone: '028-1234-5678',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-01-01',
    modified: '2026-04-20',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'DS-00002',
    store_name: 'Cửa Hàng Quận 7',
    warehouse: 'WH-00002',
    address: '456 Nguyễn Văn Linh, Quận 7, TP.HCM',
    phone: '028-8765-4321',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-01-15',
    modified: '2026-04-18',
    modified_by: 'Administrator',
    docstatus: 0,
  },
];

// ============================================
// Farm Owners
// ============================================

export const mockFarmOwners: FarmOwner[] = [
  {
    name: 'FO-00001',
    owner_name: 'Nguyễn Văn An',
    phone: '0901234567',
    email: 'an.nguyen@email.com',
    address: 'Xã Tân Phú, Huyện Củ Chi, TP.HCM',
    owner: 'Administrator',
    creation: '2026-01-10',
    modified: '2026-04-15',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'FO-00002',
    owner_name: 'Trần Thị Bình',
    phone: '0912345678',
    email: 'binh.tran@email.com',
    address: 'Xã Phước Hiệp, Huyện Củ Chi, TP.HCM',
    owner: 'Administrator',
    creation: '2026-02-01',
    modified: '2026-04-10',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'FO-00003',
    owner_name: 'Lê Văn Cường',
    phone: '0923456789',
    email: 'cuong.le@email.com',
    address: 'Xã An Nhơn Tây, Huyện Củ Chi, TP.HCM',
    owner: 'Administrator',
    creation: '2026-02-15',
    modified: '2026-04-05',
    modified_by: 'Administrator',
    docstatus: 0,
  },
];

// ============================================
// Farms
// ============================================

export const mockFarms: Farm[] = [
  {
    name: 'FRM-00001',
    farm_name: 'Trang Trại Rau Sạch An',
    farm_owner: 'FO-00001',
    distribution_store: 'DS-00001',
    address: 'Ấp 1, Xã Tân Phú, Huyện Củ Chi',
    area: 5000,
    area_uom: 'm2',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-01-15',
    modified: '2026-04-15',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'FRM-00002',
    farm_name: 'Nông Trại Hữu Cơ Bình',
    farm_owner: 'FO-00002',
    distribution_store: 'DS-00001',
    address: 'Ấp 2, Xã Phước Hiệp, Huyện Củ Chi',
    area: 3000,
    area_uom: 'm2',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-02-05',
    modified: '2026-04-10',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'FRM-00003',
    farm_name: 'Vườn Cây Ăn Trái Cường',
    farm_owner: 'FO-00003',
    distribution_store: 'DS-00002',
    address: 'Ấp 3, Xã An Nhơn Tây, Huyện Củ Chi',
    area: 8000,
    area_uom: 'm2',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-02-20',
    modified: '2026-04-05',
    modified_by: 'Administrator',
    docstatus: 0,
  },
];

// ============================================
// Gardens
// ============================================

export const mockGardens: Garden[] = [
  {
    name: 'GRD-00001',
    garden_name: 'Vườn Rau Sạch A',
    farm: 'FRM-00001',
    farm_owner: 'FO-00001',
    area: 1000,
    area_uom: 'm2',
    soil_type: 'Đất phù sa',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-01-20',
    modified: '2026-04-15',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'GRD-00002',
    garden_name: 'Vườn Cà Chua',
    farm: 'FRM-00001',
    farm_owner: 'FO-00001',
    area: 800,
    area_uom: 'm2',
    soil_type: 'Đất thịt',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-01-25',
    modified: '2026-04-12',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'GRD-00003',
    garden_name: 'Vườn Dưa Leo',
    farm: 'FRM-00002',
    farm_owner: 'FO-00002',
    area: 600,
    area_uom: 'm2',
    soil_type: 'Đất cát pha',
    status: 'Active',
    owner: 'Administrator',
    creation: '2026-02-10',
    modified: '2026-04-08',
    modified_by: 'Administrator',
    docstatus: 0,
  },
];

// ============================================
// Cultivation Logs
// ============================================

export const mockCultivationLogs: CultivationLog[] = [
  {
    name: 'CLOG-00001',
    garden: 'GRD-00001',
    garden_name: 'Vườn Rau Sạch A',
    farm: 'FRM-00001',
    farm_owner: 'FO-00001',
    cultivation_master: 'CM-001',
    cultivation_type: 'Rau ăn lá',
    from_date: '2026-03-01',
    to_date: '2026-05-01',
    status: 'In Progress',
    owner: 'Administrator',
    creation: '2026-03-01',
    modified: '2026-04-20',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'CLOG-00002',
    garden: 'GRD-00002',
    garden_name: 'Vườn Cà Chua',
    farm: 'FRM-00001',
    farm_owner: 'FO-00001',
    cultivation_master: 'CM-002',
    cultivation_type: 'Rau ăn quả',
    from_date: '2026-02-15',
    to_date: '2026-06-15',
    status: 'In Progress',
    owner: 'Administrator',
    creation: '2026-02-15',
    modified: '2026-04-19',
    modified_by: 'Administrator',
    docstatus: 0,
  },
  {
    name: 'CLOG-00003',
    garden: 'GRD-00003',
    garden_name: 'Vườn Dưa Leo',
    farm: 'FRM-00002',
    farm_owner: 'FO-00002',
    cultivation_master: 'CM-003',
    cultivation_type: 'Rau ăn quả',
    from_date: '2026-03-10',
    to_date: '2026-05-10',
    status: 'In Progress',
    owner: 'Administrator',
    creation: '2026-03-10',
    modified: '2026-04-18',
    modified_by: 'Administrator',
    docstatus: 0,
  },
];

// ============================================
// Care Logs
// ============================================

export const mockCareLogs: CareLog[] = [
  {
    name: 'CARE-00001',
    cultivation_log: 'CLOG-00001',
    garden: 'GRD-00001',
    garden_name: 'Vườn Rau Sạch A',
    care_date: '2026-04-20',
    content: 'Bón phân NPK lần 2, tưới nước',
    efficiency_percent: 85,
    items: [
      { item: 'FERT-001', item_name: 'Phân bón NPK', quantity: 5, uom: 'Kg' },
    ],
    owner: 'store@test.com',
    creation: '2026-04-20',
    modified: '2026-04-20',
    modified_by: 'store@test.com',
    docstatus: 0,
  },
  {
    name: 'CARE-00002',
    cultivation_log: 'CLOG-00002',
    garden: 'GRD-00002',
    garden_name: 'Vườn Cà Chua',
    care_date: '2026-04-19',
    content: 'Phun thuốc trừ sâu sinh học',
    efficiency_percent: 90,
    items: [
      { item: 'PEST-001', item_name: 'Thuốc trừ sâu sinh học', quantity: 2, uom: 'Lít' },
    ],
    owner: 'store@test.com',
    creation: '2026-04-19',
    modified: '2026-04-19',
    modified_by: 'store@test.com',
    docstatus: 0,
  },
  {
    name: 'CARE-00003',
    cultivation_log: 'CLOG-00003',
    garden: 'GRD-00003',
    garden_name: 'Vườn Dưa Leo',
    care_date: '2026-04-18',
    content: 'Làm cỏ, bón phân hữu cơ',
    efficiency_percent: 80,
    items: [
      { item: 'FERT-002', item_name: 'Phân hữu cơ vi sinh', quantity: 10, uom: 'Kg' },
    ],
    owner: 'store@test.com',
    creation: '2026-04-18',
    modified: '2026-04-18',
    modified_by: 'store@test.com',
    docstatus: 0,
  },
];

// ============================================
// Sales Orders
// ============================================

export const mockSalesOrders: SalesOrder[] = [
  {
    name: 'SO-00001',
    customer: 'CUST-001',
    customer_name: 'Siêu thị CoopMart',
    transaction_date: '2026-04-20',
    custom_distribution_store: 'DS-00001',
    items: [
      { item_code: 'SEED-001', item_name: 'Hạt giống cà chua', qty: 50, rate: 15000, amount: 750000, uom: 'Gói' },
    ],
    total: 750000,
    grand_total: 750000,
    status: 'To Deliver and Bill',
    owner: 'Administrator',
    creation: '2026-04-20',
    modified: '2026-04-20',
    modified_by: 'Administrator',
    docstatus: 1,
  },
  {
    name: 'SO-00002',
    customer: 'CUST-002',
    customer_name: 'Chợ đầu mối Thủ Đức',
    transaction_date: '2026-04-18',
    custom_distribution_store: 'DS-00001',
    items: [
      { item_code: 'FERT-001', item_name: 'Phân bón NPK', qty: 100, rate: 25000, amount: 2500000, uom: 'Kg' },
      { item_code: 'FERT-002', item_name: 'Phân hữu cơ vi sinh', qty: 50, rate: 30000, amount: 1500000, uom: 'Kg' },
    ],
    total: 4000000,
    grand_total: 4000000,
    status: 'Completed',
    owner: 'Administrator',
    creation: '2026-04-18',
    modified: '2026-04-19',
    modified_by: 'Administrator',
    docstatus: 1,
  },
];

// ============================================
// Delivery Notes
// ============================================

export const mockDeliveryNotes: DeliveryNote[] = [
  {
    name: 'DN-00001',
    customer: 'CUST-002',
    customer_name: 'Chợ đầu mối Thủ Đức',
    posting_date: '2026-04-19',
    custom_distribution_store: 'DS-00001',
    items: [
      { item_code: 'FERT-001', item_name: 'Phân bón NPK', qty: 100, rate: 25000, amount: 2500000, uom: 'Kg' },
      { item_code: 'FERT-002', item_name: 'Phân hữu cơ vi sinh', qty: 50, rate: 30000, amount: 1500000, uom: 'Kg' },
    ],
    total: 4000000,
    grand_total: 4000000,
    status: 'Completed',
    owner: 'Administrator',
    creation: '2026-04-19',
    modified: '2026-04-19',
    modified_by: 'Administrator',
    docstatus: 1,
  },
];

// ============================================
// Helper Functions
// ============================================

export function getFarmOwnerById(id: string): FarmOwner | undefined {
  return mockFarmOwners.find((fo) => fo.name === id);
}

export function getFarmById(id: string): Farm | undefined {
  return mockFarms.find((f) => f.name === id);
}

export function getGardenById(id: string): Garden | undefined {
  return mockGardens.find((g) => g.name === id);
}

export function getFarmsByOwner(farmOwnerId: string): Farm[] {
  return mockFarms.filter((f) => f.farm_owner === farmOwnerId);
}

export function getGardensByFarm(farmId: string): Garden[] {
  return mockGardens.filter((g) => g.farm === farmId);
}

export function getCultivationLogsByGarden(gardenId: string): CultivationLog[] {
  return mockCultivationLogs.filter((cl) => cl.garden === gardenId);
}

export function getCareLogsByCultivation(cultivationLogId: string): CareLog[] {
  return mockCareLogs.filter((cl) => cl.cultivation_log === cultivationLogId);
}

export function getSalesOrdersByStore(storeId: string): SalesOrder[] {
  return mockSalesOrders.filter((so) => so.custom_distribution_store === storeId);
}

export function getDeliveryNotesByStore(storeId: string): DeliveryNote[] {
  return mockDeliveryNotes.filter((dn) => dn.custom_distribution_store === storeId);
}
