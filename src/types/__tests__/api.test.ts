/**
 * @file src/types/api.test.ts
 * @description Jest tests for the API type definitions.
 *
 * These tests don't validate runtime logic, as the source file only contains
 * TypeScript interfaces and types. Instead, they serve three main purposes:
 * 1.  **Compile-Time Verification**: By creating mock objects that conform to the
 *     interfaces, we leverage the TypeScript compiler to ensure the types are
 *     consistent and usable. If a type changes in a breaking way, these tests
 *     will fail to compile.
 * 2.  **Living Documentation**: These tests provide clear, concrete examples of what
 *     the data structure for each API type looks like.
 * 3.  **Coverage**: Fulfills test coverage requirements for projects that mandate
 *     a test file for every source file.
 */

import type {
  Address,
  ApiErrorResponse,
  ApiResponse,
  AuthToken,
  Category,
  CreateOrderResponse,
  CreateUserResponse,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetOrderResponse,
  GetOrdersResponse,
  GetProductResponse,
  GetProductsResponse,
  GetProfileResponse,
  GetUserResponse,
  GetUsersResponse,
  LoginResponse,
  Order,
  OrderItem,
  OrderStatus,
  PaginatedApiResponse,
  PaginationMeta,
  Product,
  RefreshTokenResponse,
  UpdateUserResponse,
  User,
} from './api';

// =================================================================
// Mocks for Reusability
// =================================================================

const mockIsoDate = '2023-10-27T10:00:00.000Z';

const mockUser: User = {
  id: 'user-123',
  username: 'john.doe',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatarUrl: 'https://example.com/avatar.png',
  createdAt: mockIsoDate,
  updatedAt: mockIsoDate,
};

const mockProduct: Product = {
  id: 'prod-456',
  name: 'Wireless Mouse',
  description: 'An ergonomic wireless mouse.',
  price: 2500, // in cents
  sku: 'WM-001',
  stockQuantity: 150,
  imageUrl: 'https://example.com/mouse.png',
  categoryId: 'cat-789',
  tags: ['electronics', 'computer', 'accessory'],
  createdAt: mockIsoDate,
  updatedAt: mockIsoDate,
};

const mockCategory: Category = {
  id: 'cat-789',
  name: 'Electronics',
  slug: 'electronics',
  description: 'All kinds of electronic gadgets.',
  parentCategoryId: null,
};

const mockAddress: Address = {
  street: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  postalCode: '12345',
  country: 'USA',
};

const mockOrderItem: OrderItem = {
  productId: 'prod-456',
  quantity: 2,
  price: 2500,
  productSnapshot: {
    name: 'Wireless Mouse',
    sku: 'WM-001',
    imageUrl: 'https://example.com/mouse.png',
  },
};

const mockOrder: Order = {
  id: 'order-abc',
  userId: 'user-123',
  status: 'processing',
  totalAmount: 5500, // 2 * 2500 + 500 shipping
  items: [mockOrderItem],
  shippingAddress: mockAddress,
  billingAddress: mockAddress,
  createdAt: mockIsoDate,
  updatedAt: mockIsoDate,
};

const mockPaginationMeta: PaginationMeta = {
  currentPage: 1,
  totalPages: 10,
  pageSize: 20,
  totalCount: 200,
};

const mockAuthToken: AuthToken = {
  accessToken: 'mock-access-token-string',
  refreshToken: 'mock-refresh-token-string',
  expiresIn: 3600,
  tokenType: 'Bearer',
};

// =================================================================
// Tests
// =================================================================

describe('API Type Definitions', () => {
  describe('Base API Types', () => {
    it('should correctly type PaginationMeta', () => {
      const meta: PaginationMeta = mockPaginationMeta;
      expect(meta.currentPage).toBe(1);
      expect(meta.totalCount).toBe(200);
    });

    it('should correctly type a generic ApiResponse', () => {
      const response: ApiResponse<{ status: string }> = {
        data: { status: 'ok' },
        meta: { timestamp: mockIsoDate },
      };
      expect(response.data.status).toBe('ok');
      expect(response.meta).toBeDefined();
    });

    it('should correctly type a generic PaginatedApiResponse', () => {
      const response: PaginatedApiResponse<{ id: number }> = {
        data: [{ id: 1 }, { id: 2 }],
        meta: mockPaginationMeta,
      };
      expect(response.data).toHaveLength(2);
      expect(response.meta.totalPages).toBe(10);
    });

    it('should correctly type ApiErrorResponse', () => {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'not_found',
          message: 'The requested resource was not found.',
          details: { resource: 'user', id: 'user-999' },
        },
        statusCode: 404,
      };
      expect(errorResponse.statusCode).toBe(404);
      expect(errorResponse.error.code).toBe('not_found');
    });
  });

  describe('Entity Types', () => {
    it('should correctly type User', () => {
      const user: User = mockUser;
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('john.doe@example.com');
    });

    it('should correctly type Product', () => {
      const product: Product = mockProduct;
      expect(product.id).toBe('prod-456');
      expect(product.price).toBe(2500);
    });

    it('should correctly type Category', () => {
      const category: Category = mockCategory;
      expect(category.id).toBe('cat-789');
      expect(category.slug).toBe('electronics');
    });

    it('should correctly type OrderStatus', () => {
      const statuses: OrderStatus[] = [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ];
      const status: OrderStatus = 'shipped';
      expect(statuses).toContain(status);
    });

    it('should correctly type Address', () => {
      const address: Address = mockAddress;
      expect(address.street).toBe('123 Main St');
      expect(address.country).toBe('USA');
    });

    it('should correctly type OrderItem', () => {
      const item: OrderItem = mockOrderItem;
      expect(item.productId).toBe('prod-456');
      expect(item.productSnapshot.name).toBe('Wireless Mouse');
    });

    it('should correctly type Order', () => {
      const order: Order = mockOrder;
      expect(order.id).toBe('order-abc');
      expect(order.items).toHaveLength(1);
      expect(order.status).toBe('processing');
    });

    it('should correctly type AuthToken', () => {
      const token: AuthToken = mockAuthToken;
      expect(token.tokenType).toBe('Bearer');
      expect(token.expiresIn).toBe(3600);
    });
  });

  describe('Specific API Endpoint Response Types', () => {
    // --- User Endpoints ---
    it('should correctly type GetUserResponse', () => {
      const response: GetUserResponse = { data: mockUser };
      expect(response.data.id).toBe(mockUser.id);
    });

    it('should correctly type GetUsersResponse', () => {
      const response: GetUsersResponse = {
        data: [mockUser],
        meta: mockPaginationMeta,
      };
      expect(response.data[0].id).toBe(mockUser.id);
      expect(response.meta.totalCount).toBe(200);
    });

    it('should correctly type UpdateUserResponse', () => {
      const response: UpdateUserResponse = { data: mockUser };
      expect(response.data.username).toBe(mockUser.username);
    });

    it('should correctly type CreateUserResponse', () => {
      const response: CreateUserResponse = { data: mockUser };
      expect(response.data.email).toBe(mockUser.email);
    });

    // --- Product Endpoints ---
    it('should correctly type GetProductResponse', () => {
      const response: GetProductResponse = { data: mockProduct };
      expect(response.data.id).toBe(mockProduct.id);
    });

    it('should correctly type GetProductsResponse', () => {
      const response: GetProductsResponse = {
        data: [mockProduct],
        meta: mockPaginationMeta,
      };
      expect(response.data[0].sku).toBe(mockProduct.sku);
      expect(response.meta.currentPage).toBe(1);
    });

    // --- Category Endpoints ---
    it('should correctly type GetCategoryResponse', () => {
      const response: GetCategoryResponse = { data: mockCategory };
      expect(response.data.slug).toBe(mockCategory.slug);
    });

    it('should correctly type GetCategoriesResponse', () => {
      const response: GetCategoriesResponse = { data: [mockCategory] };
      expect(response.data[0].name).toBe(mockCategory.name);
    });

    // --- Order Endpoints ---
    it('should correctly type GetOrderResponse', () => {
      const response: GetOrderResponse = { data: mockOrder };
      expect(response.data.id).toBe(mockOrder.id);
    });

    it('should correctly type GetOrdersResponse', () => {
      const response: GetOrdersResponse = {
        data: [mockOrder],
        meta: mockPaginationMeta,
      };
      expect(response.data[0].status).toBe(mockOrder.status);
      expect(response.meta.pageSize).toBe(20);
    });

    it('should correctly type CreateOrderResponse', () => {
      const response: CreateOrderResponse = { data: mockOrder };
      expect(response.data.totalAmount).toBe(mockOrder.totalAmount);
    });

    // --- Auth Endpoints ---
    it('should correctly type LoginResponse', () => {
      const response: LoginResponse = {
        data: {
          ...mockAuthToken,
          user: {
            id: mockUser.id,
            username: mockUser.username,
            email: mockUser.email,
            avatarUrl: mockUser.avatarUrl,
          },
        },
      };
      expect(response.data.accessToken).toBe(mockAuthToken.accessToken);
      expect(response.data.user.id).toBe(mockUser.id);
    });

    it('should correctly type RefreshTokenResponse', () => {
      const response: RefreshTokenResponse = {
        data: {
          accessToken: 'new-mock-access-token',
          expiresIn: 3600,
        },
      };
      expect(response.data.accessToken).toBe('new-mock-access-token');
      expect(response.data.expiresIn).toBe(3600);
    });

    it('should correctly type GetProfileResponse', () => {
      const response: GetProfileResponse = { data: mockUser };
      expect(response.data.id).toBe(mockUser.id);
      expect(response.data.createdAt).toBe(mockUser.createdAt);
    });
  });
});