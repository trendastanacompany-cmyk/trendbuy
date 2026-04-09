export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  image: string;
  sortOrder: number;
  description: string;
  price: number;
  oldPrice: number | null;
  createdAt: string;
  updatedAt: string;
};
