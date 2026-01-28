/**
 * @jest-environment jsdom
 */

import {
  ApiResponse,
  ApiError,
  User,
  Post,
  Comment,
  Pagination,
  PaginatedResponse,
  SortOrder,
  FilterOperator,
  FilterCondition,
  TaskStatus,
  Task,
  UserRole,
  UserWithRoles,
  PermissionType,
  Permission,
  Role,
  Product,
  CartItem,
  ShoppingCart,
  Order,
  Review,
  Notification,
  Setting,
  FileUploadResponse,
  RequestOptions,
} from '../src/types/apiTypes';

describe('apiTypes', () => {
  it('should define ApiResponse interface', () => {
    const apiResponse: ApiResponse<string> = {
      success: true,
      data: 'test data',
    };
    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data).toBe('test data');
  });

  it('should define ApiResponse interface with error', () => {
    const apiResponse: ApiResponse<string> = {
      success: false,
      error: { code: 500, message: 'Internal Server Error' },
    };
    expect(apiResponse.success).toBe(false);
    expect(apiResponse.error).toEqual({ code: 500, message: 'Internal Server Error' });
  });

  it('should define ApiError interface', () => {
    const apiError: ApiError = {
      code: 400,
      message: 'Bad Request',
      details: { reason: 'Invalid input' },
    };
    expect(apiError.code).toBe(400);
    expect(apiError.message).toBe('Bad Request');
    expect(apiError.details).toEqual({ reason: 'Invalid input' });
  });

  it('should define User interface', () => {
    const user: User = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(user.id).toBe('123');
    expect(user.username).toBe('testuser');
  });

  it('should define Post interface', () => {
    const post: Post = {
      id: '456',
      title: 'Test Post',
      content: 'This is a test post.',
      authorId: '123',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(post.id).toBe('456');
    expect(post.title).toBe('Test Post');
  });

  it('should define Comment interface', () => {
    const comment: Comment = {
      id: '789',
      postId: '456',
      authorId: '123',
      content: 'Test comment',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(comment.id).toBe('789');
    expect(comment.content).toBe('Test comment');
  });

  it('should define Pagination interface', () => {
    const pagination: Pagination = {
      totalItems: 100,
      totalPages: 10,
      currentPage: 1,
      pageSize: 10,
    };
    expect(pagination.totalItems).toBe(100);
    expect(pagination.totalPages).toBe(10);
  });

  it('should define PaginatedResponse interface', () => {
    const paginatedResponse: PaginatedResponse<User> = {
      data: [
        {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          createdAt: '2023-10-26T00:00:00.000Z',
          updatedAt: '2023-10-26T00:00:00.000Z',
        },
      ],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
      },
    };
    expect(paginatedResponse.data.length).toBe(1);
    expect(paginatedResponse.pagination.totalItems).toBe(1);
  });

  it('should define SortOrder type', () => {
    const sortOrderAsc: SortOrder = 'asc';
    const sortOrderDesc: SortOrder = 'desc';
    expect(sortOrderAsc).toBe('asc');
    expect(sortOrderDesc).toBe('desc');
  });

  it('should define FilterOperator type', () => {
    const filterOperatorEq: FilterOperator = 'eq';
    const filterOperatorNe: FilterOperator = 'ne';
    expect(filterOperatorEq).toBe('eq');
    expect(filterOperatorNe).toBe('ne');
  });

  it('should define FilterCondition interface', () => {
    const filterCondition: FilterCondition = {
      field: 'username',
      operator: 'eq',
      value: 'testuser',
    };
    expect(filterCondition.field).toBe('username');
    expect(filterCondition.operator).toBe('eq');
    expect(filterCondition.value).toBe('testuser');
  });

  it('should define TaskStatus type', () => {
    const taskStatusOpen: TaskStatus = 'open';
    const taskStatusInProgress: TaskStatus = 'in_progress';
    expect(taskStatusOpen).toBe('open');
    expect(taskStatusInProgress).toBe('in_progress');
  });

  it('should define Task interface', () => {
    const task: Task = {
      id: '1',
      title: 'Test Task',
      description: 'This is a test task',
      status: 'open',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(task.id).toBe('1');
    expect(task.status).toBe('open');
  });

  it('should define UserRole type', () => {
    const userRoleAdmin: UserRole = 'admin';
    const userRoleUser: UserRole = 'user';
    expect(userRoleAdmin).toBe('admin');
    expect(userRoleUser).toBe('user');
  });

  it('should define UserWithRoles interface', () => {
    const userWithRoles: UserWithRoles = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
      roles: ['admin'],
    };
    expect(userWithRoles.id).toBe('123');
    expect(userWithRoles.roles).toEqual(['admin']);
  });

  it('should define PermissionType type', () => {
    const permissionTypeRead: PermissionType = 'read';
    const permissionTypeWrite: PermissionType = 'write';
    expect(permissionTypeRead).toBe('read');
    expect(permissionTypeWrite).toBe('write');
  });

  it('should define Permission interface', () => {
    const permission: Permission = {
      id: '1',
      name: 'Read Users',
      type: 'read',
      description: 'Allows reading user data',
    };
    expect(permission.id).toBe('1');
    expect(permission.type).toBe('read');
  });

  it('should define Role interface', () => {
    const role: Role = {
      id: '1',
      name: 'Administrator',
      permissions: [
        {
          id: '1',
          name: 'Read Users',
          type: 'read',
          description: 'Allows reading user data',
        },
      ],
    };
    expect(role.id).toBe('1');
    expect(role.permissions.length).toBe(1);
  });

  it('should define Product interface', () => {
    const product: Product = {
      id: '1',
      name: 'Test Product',
      description: 'This is a test product',
      price: 99.99,
      imageUrl: 'http://example.com/image.jpg',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(product.id).toBe('1');
    expect(product.price).toBe(99.99);
  });

  it('should define CartItem interface', () => {
    const cartItem: CartItem = {
      productId: '1',
      quantity: 2,
    };
    expect(cartItem.productId).toBe('1');
    expect(cartItem.quantity).toBe(2);
  });

  it('should define ShoppingCart interface', () => {
    const shoppingCart: ShoppingCart = {
      id: '1',
      userId: '123',
      items: [
        {
          productId: '1',
          quantity: 2,
        },
      ],
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(shoppingCart.id).toBe('1');
    expect(shoppingCart.items.length).toBe(1);
  });

  it('should define Order interface', () => {
    const order: Order = {
      id: '1',
      userId: '123',
      items: [
        {
          productId: '1',
          quantity: 2,
        },
      ],
      totalAmount: 199.98,
      orderDate: '2023-10-26T00:00:00.000Z',
      status: 'pending',
    };
    expect(order.id).toBe('1');
    expect(order.totalAmount).toBe(199.98);
    expect(order.status).toBe('pending');
  });

  it('should define Review interface', () => {
    const review: Review = {
      id: '1',
      productId: '1',
      userId: '123',
      rating: 5,
      comment: 'Great product!',
      createdAt: '2023-10-26T00:00:00.000Z',
      updatedAt: '2023-10-26T00:00:00.000Z',
    };
    expect(review.id).toBe('1');
    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Great product!');
  });

  it('should define Notification interface', () => {
    const notification: Notification = {
      id: '1',
      userId: '123',
      message: 'You have a new message',
      type: 'info',
      createdAt: '2023-10-26T00:00:00.000Z',
      read: false,
    };
    expect(notification.id).toBe('1');
    expect(notification.message).toBe('You have a new message');
    expect(notification.read).toBe(false);
  });

  it('should define Setting interface', () => {
    const setting: Setting = {
      id: '1',
      key: 'theme',
      value: 'dark',
      description: 'Application theme',
    };
    expect(setting.id).toBe('1');
    expect(setting.key).toBe('theme');
    expect(setting.value).toBe('dark');
  });

  it('should define FileUploadResponse interface', () => {
    const fileUploadResponse: FileUploadResponse = {
      filename: 'test.jpg',
      url: 'http://example.com/test.jpg',
    };
    expect(fileUploadResponse.filename).toBe('test.jpg');
    expect(fileUploadResponse.url).toBe('http://example.com/test.jpg');
  });

  it('should define RequestOptions type', () => {
    const requestOptions: RequestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { data: 'test' },
    };
    expect(requestOptions.method).toBe('POST');
    expect(requestOptions.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(requestOptions.body).toEqual({ data: 'test' });
  });
});