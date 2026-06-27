import { CategoryRef } from './category.model';

export interface Product {
  id: number;
  uniqueId: string;
  name: string;
  image: string | null;
  price: number;
  category: CategoryRef;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  categoryId?: number;
}
