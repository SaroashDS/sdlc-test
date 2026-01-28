/**
 * @file src/types/api.ts
 * @description TypeScript interfaces for all API payloads and responses.
 */

// ============================================================================
// GENERIC & COMMON TYPES
// ============================================================================

/**
 * Represents a standard API error response.
 */
export interface ApiError {
  /** The HTTP status code. */
  statusCode: number;
  /** A user-friendly error message. */
  message: string;
  /** Optional detailed validation errors. */
  errors?: Record<string, string[]>;
}

/**
 * A generic wrapper for paginated API responses.
 * @template T The type of the data items in the list.
 */
export interface PaginatedResponse<T> {
  /** The array of data items for the current page. */
  data: T[];
  /** The total number of items available across all pages. */
  total: number;
  /** The current page number. */
  page: number;
  /** The number of items per page. */
  limit: number;
  /** The total number of pages. */
  totalPages: number;
}

/**
 * Represents a generic successful response, often used for actions
 * like DELETE or other operations that don't return a specific entity.
 */
export interface SuccessResponse {
  success: true;
  message: string;
}

// ============================================================================
// ENUMS & DOMAIN-SPECIFIC LITERAL TYPES
// ============================================================================

/**
 * Defines the possible roles for a user.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/**
 * Defines the possible statuses for an order.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

/**
 * Represents a User entity in the system.
 */
export interface User {
  /** The unique identifier for the user (UUID). */
  id: string;
  /** The user's email address (must be unique). */
  email: string;
  /** The user's full name. */
  name: string;
  /** The role assigned to the user. */
  role: UserRole;
  /** The ISO 8601 timestamp when the user was created. */
  createdAt: string;
  /** The ISO 8601 timestamp when the user was last updated. */
  updatedAt: string;
}

/**
 * Represents a Product entity in the system.
 */
export interface Product {
  /** The unique identifier for the product (UUID). */
  id: string;
  /** The name of the product. */
  name: string;
  /** A detailed description of the product. */
  description: string;
  /** The price of the product in the smallest currency unit (e.g., cents). */
  price: number;
  /** The Stock Keeping Unit (SKU) for inventory management. */
  sku: string;
  /** The number of items currently in stock. */
  stock: number;
  /** An optional URL to the product's image. */
  imageUrl?: string;
  /** The ISO 8601 timestamp when the product was created. */
  createdAt: string;
  /** The ISO 8601 timestamp when the product was last updated. */
  updatedAt: string;
}

/**
 * Represents a single item within an order.
 */
export interface OrderItem {
  /** The ID of the product being ordered. */
  productId: string;
  /** The number of units of the product being ordered. */
  quantity: number;
  /** The price per unit at the time of purchase. */
  price: number;
}

/**
 * Represents an Order entity in the system.
 */
export interface Order {
  /** The unique identifier for the order (UUID). */
  id: string;
  /** The ID of the user who placed the order. */
  userId: string;
  /** An array of items included in the order. */
  items: OrderItem[];
  /** The total amount for the order in the smallest currency unit. */
  totalAmount: number;
  /** The current status of the order. */
  status: OrderStatus;
  /** The shipping address for the order. */
  shippingAddress: string;
  /** The ISO 8601 timestamp when the order was created. */
  createdAt: string;
  /** The ISO 8601 timestamp when the order was last updated. */
  updatedAt: string;
}

// ============================================================================
// API PAYLOADS (REQUEST BODIES)
// ============================================================================

/**
 * Payload for the user login endpoint.
 */
export type LoginPayload = Pick<User, 'email'> & { password: string };

/**
 * Payload for the user registration endpoint.
 */
export type RegisterPayload = Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

/**
 * Payload for creating a new product.
 */
export type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Payload for updating an existing product. All fields are optional.
 */
export type UpdateProductPayload = Partial<CreateProductPayload>;

/**
 * Represents a simplified item for the order creation payload.
 */
export type CreateOrderItem = Pick<OrderItem, 'productId' | 'quantity'>;

/**
 * Payload for creating a new order.
 */
export interface CreateOrderPayload {
  shippingAddress: string;
  items: CreateOrderItem[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * The user object returned by the API, with sensitive fields omitted.
 */
export type UserApiResponse = Omit<User, 'password'>;

/**
 * Response from a successful authentication (login/register) request.
 */
export interface AuthResponse {
  accessToken: string;
  user: UserApiResponse;
}

/**
 * Response for a request to fetch a single user.
 */
export type GetUserResponse = UserApiResponse;

/**
 * Response for a request to fetch a single product.
 */
export type GetProductResponse = Product;

/**
 * Response for a request to fetch a list of products.
 */
export type GetProductsResponse = PaginatedResponse<Product>;

/**
 * The Order object returned by the API, potentially with populated details.
 * For this example, we'll include the full product details in each order item.
 */
export interface OrderDetailsResponse extends Omit<Order, 'items'> {
  items: Array<Omit<OrderItem, 'productId'> & { product: Product }>;
  user: UserApiResponse;
}

/**
 * Response for a request to fetch a single order.
 */
export type GetOrderResponse = OrderDetailsResponse;

/**
 * Response for a request to fetch a list of orders.
 */
export type GetOrdersResponse = PaginatedResponse<Order>;