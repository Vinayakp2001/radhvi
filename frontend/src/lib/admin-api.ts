// Admin API client — all calls require a staff token
import api from './api';

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  pending_orders: number;
  pending_returns: number;
  pending_inquiries: number;
  recent_orders: AdminOrder[];
  low_stock_products: { id: number; name: string; sku: string; stock: number }[];
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  price: string;
  discounted_price: string | null;
  discount_percentage: number;
  category: number;
  category_name: string;
  stock: number;
  weight: string | null;
  dimensions: string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_deal_of_day: boolean;
  rating: number;
  review_count: number;
  sold_count: number;
  meta_title: string;
  meta_description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOrder {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: string;
  items_count: number;
  shiprocket_synced: boolean;
  created_at: string;
}

export interface AdminOrderDetail extends AdminOrder {
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  subtotal: string;
  shipping_charge: string;
  tax_amount: string;
  discount_amount: string;
  shiprocket_sync_error: string;
  courier_id: number | null;
  updated_at: string;
  items: { id: number; product: number; product_name: string; product_price: string; quantity: number; total_price: string }[];
  shipment: { awb_code: string; courier_name: string; status: string; tracking_url: string | null; estimated_delivery_date: string | null } | null;
  payment_details: Record<string, unknown>;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  is_active: boolean;
  product_count: number;
}

export interface AdminCoupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  usage_limit: number;
  used_count: number;
}

export interface AdminReturn {
  id: number;
  request_id: string;
  order_id: string;
  username: string;
  return_type: string;
  reason: string;
  description: string;
  status: string;
  refund_amount: string | null;
  pickup_date: string | null;
  tracking_number: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  order_count: number;
}

export interface AdminUserDetail extends AdminUser {
  orders: AdminOrder[];
}

export interface AdminBulkInquiry {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  inquiry_type: string;
  quantity: number;
  product_interest: string;
  budget_range: string;
  delivery_timeline: string;
  message: string;
  gst_number: string;
  status: string;
  admin_notes: string;
  quoted_amount: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductImage {
  id: number;
  url: string | null;
  is_primary: boolean;
  alt_text: string;
}

export interface ProductSpec {
  id?: number;
  name: string;
  value: string;
}

export interface OccasionLink {
  id: number;
  name: string;
  slug: string;
  linked: boolean;
}

export interface AdminOccasion {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  is_active: boolean;
  order: number;
  image_url: string | null;
}

export const adminApi = {
  getDashboard: () =>
    api.get<DashboardStats>('/admin/dashboard/').then(r => r.data),

  getProducts: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminProduct>>('/admin/products/', { params }).then(r => r.data),
  getProduct: (id: number) =>
    api.get<AdminProduct>(`/admin/products/${id}/`).then(r => r.data),
  createProduct: (data: Partial<AdminProduct>) =>
    api.post<AdminProduct>('/admin/products/', data).then(r => r.data),
  updateProduct: (id: number, data: Partial<AdminProduct>) =>
    api.patch<AdminProduct>(`/admin/products/${id}/`, data).then(r => r.data),
  deleteProduct: (id: number) =>
    api.delete(`/admin/products/${id}/`),

  getOrders: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminOrder>>('/admin/orders/', { params }).then(r => r.data),
  getOrder: (orderId: string) =>
    api.get<AdminOrderDetail>(`/admin/orders/${orderId}/`).then(r => r.data),
  updateOrderStatus: (orderId: string, data: { status?: string; payment_status?: string }) =>
    api.patch<AdminOrder>(`/admin/orders/${orderId}/`, data).then(r => r.data),

  getCategories: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminCategory>>('/admin/categories/', { params }).then(r => r.data),
  createCategory: (data: Partial<AdminCategory>) =>
    api.post<AdminCategory>('/admin/categories/', data).then(r => r.data),
  updateCategory: (id: number, data: Partial<AdminCategory>) =>
    api.patch<AdminCategory>(`/admin/categories/${id}/`, data).then(r => r.data),
  deleteCategory: (id: number) =>
    api.delete(`/admin/categories/${id}/`),

  getCoupons: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminCoupon>>('/admin/coupons/', { params }).then(r => r.data),
  createCoupon: (data: Partial<AdminCoupon>) =>
    api.post<AdminCoupon>('/admin/coupons/', data).then(r => r.data),
  updateCoupon: (id: number, data: Partial<AdminCoupon>) =>
    api.patch<AdminCoupon>(`/admin/coupons/${id}/`, data).then(r => r.data),
  deleteCoupon: (id: number) =>
    api.delete(`/admin/coupons/${id}/`),

  getReturns: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminReturn>>('/admin/returns/', { params }).then(r => r.data),
  getReturn: (id: number) =>
    api.get<AdminReturn>(`/admin/returns/${id}/`).then(r => r.data),
  updateReturnStatus: (id: number, status: string) =>
    api.patch<AdminReturn>(`/admin/returns/${id}/`, { status }).then(r => r.data),

  getUsers: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminUser>>('/admin/users/', { params }).then(r => r.data),
  getUserDetail: (id: number) =>
    api.get<AdminUserDetail>(`/admin/users/${id}/`).then(r => r.data),

  getBulkInquiries: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AdminBulkInquiry>>('/admin/bulk-inquiries/', { params }).then(r => r.data),
  getBulkInquiry: (id: number) =>
    api.get<AdminBulkInquiry>(`/admin/bulk-inquiries/${id}/`).then(r => r.data),
  updateInquiryStatus: (id: number, data: { status?: string; admin_notes?: string; quoted_amount?: string }) =>
    api.patch<AdminBulkInquiry>(`/admin/bulk-inquiries/${id}/`, data).then(r => r.data),
};

export const productImageApi = {
  getImages: (productId: number) =>
    api.get<ProductImage[]>(`/admin/products/${productId}/images/`).then(r => r.data),
  upload: (productId: number, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    return api.post<ProductImage[]>(`/admin/products/${productId}/images/upload/`, fd).then(r => r.data);
  },
  remove: (productId: number, imageId: number) =>
    api.delete(`/admin/products/${productId}/images/${imageId}/delete/`),
  setPrimary: (productId: number, imageId: number) =>
    api.patch(`/admin/products/${productId}/images/${imageId}/set-primary/`).then(r => r.data),
};

export const productSpecApi = {
  get: (productId: number) =>
    api.get<ProductSpec[]>(`/admin/products/${productId}/specs/`).then(r => r.data),
  save: (productId: number, specs: ProductSpec[]) =>
    api.post<ProductSpec[]>(`/admin/products/${productId}/specs/save/`, { specs }).then(r => r.data),
};

export const productOccasionApi = {
  get: (productId: number) =>
    api.get<OccasionLink[]>(`/admin/products/${productId}/occasions/`).then(r => r.data),
  set: (productId: number, occasionIds: number[]) =>
    api.post(`/admin/products/${productId}/occasions/set/`, { occasion_ids: occasionIds }).then(r => r.data),
};

export const occasionAdminApi = {
  list: () =>
    api.get<AdminOccasion[]>('/admin/occasions/').then(r => r.data),
  update: (id: number, data: FormData) =>
    api.patch<AdminOccasion>(`/admin/occasions/${id}/`, data).then(r => r.data),
};
