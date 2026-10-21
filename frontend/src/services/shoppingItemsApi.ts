import { apiRequest } from './apiClient';
import type { ShoppingItem } from '../types/shopping';

function isShoppingItem(value: unknown): value is ShoppingItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'number' &&
    typeof item.name === 'string' &&
    typeof item.completed === 'boolean'
  );
}

export async function fetchShoppingItems(): Promise<ShoppingItem[]> {
  const items: unknown = await apiRequest('/api/items');
  if (!Array.isArray(items) || !items.every(isShoppingItem)) {
    throw new Error('O serviço retornou uma lista de produtos inválida.');
  }
  return items;
}

export async function createShoppingItem(
  name: string,
): Promise<ShoppingItem> {
  const item: unknown = await apiRequest('/api/items', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!isShoppingItem(item)) {
    throw new Error('O serviço retornou um produto inválido.');
  }
  return item;
}

export async function updateShoppingItem(
  itemId: number,
  completed: boolean,
): Promise<ShoppingItem> {
  const item: unknown = await apiRequest(`/api/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
  if (!isShoppingItem(item)) {
    throw new Error('O serviço retornou um produto inválido.');
  }
  return item;
}

export async function deleteShoppingItem(itemId: number): Promise<void> {
  await apiRequest(`/api/items/${itemId}`, { method: 'DELETE' });
}
