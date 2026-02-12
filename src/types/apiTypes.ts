/**
 * @file src/types/apiTypes.ts
 * @description Types for API responses
 */

/**
 * Represents a generic API response with a data payload.
 * @template T The type of the data payload.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Represents an error object returned by the API.
 */
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

/**
 * Represents a user object.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a post object.
 */
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a comment object.
 */
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents pagination metadata.
 */
export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Represents a paginated response.
 * @template T The type of the data items.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Type representing the possible sorting orders.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Type representing the possible filter operators.
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith';

/**
 * Represents a filter condition.
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Represents the possible status values for a task.
 */
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'blocked';

/**
 * Represents a task object.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents the possible roles for a user.
 */
export type UserRole = 'admin' | 'user' | 'guest';

/**
 * Represents a user object with roles.
 */
export interface UserWithRoles extends User {
  roles: UserRole[];
}

/**
 * Represents the possible permission types.
 */
export type PermissionType = 'read' | 'write' | 'delete' | 'update';

/**
 * Represents a permission object.
 */
export interface Permission {
  id: string;
  name: string;
  type: PermissionType;
  description: string;
}

/**
 * Represents a role object.
 */
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

/**
 * Represents a product object.
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a shopping cart item.
 */
export interface CartItem {
  productId: string;
  quantity: number;
}

/**
 * Represents a shopping cart.
 */
export interface ShoppingCart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents an order object.
 */
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

/**
 * Represents a review object.
 */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a notification object.
 */
export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  read: boolean;
}

/**
 * Represents a configuration setting.
 */
export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
}

/**
 * Represents a file upload response.
 */
export interface FileUploadResponse {
  filename: string;
  url: string;
}

/**
 * Represents a type for request options.
 */
export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
};