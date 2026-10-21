import { useCallback, useEffect, useState } from 'react';
import {
  createShoppingItem,
  deleteShoppingItem,
  fetchShoppingItems,
  updateShoppingItem,
} from '../services/shoppingItemsApi';
import type { ShoppingItem } from '../types/shopping';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const loadedItems = await fetchShoppingItems();
      setItems(loadedItems);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Não foi possível carregar os produtos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    fetchShoppingItems()
      .then((loadedItems) => {
        if (isActive) {
          setItems(loadedItems);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os produtos.',
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function reloadItems() {
    setIsLoading(true);
    setLoadError(null);
    await loadItems();
  }

  async function addItem(name: string): Promise<boolean> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return false;
    }

    try {
      const item = await createShoppingItem(normalizedName);
      setItems((currentItems) => [...currentItems, item]);
      setActionError(null);
      setLoadError(null);
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível adicionar o produto.',
      );
      return false;
    }
  }

  async function toggleItem(itemId: number) {
    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }

    try {
      const updatedItem = await updateShoppingItem(
        itemId,
        !currentItem.completed,
      );
      setItems((currentItems) =>
        currentItems.map((item) => (item.id === itemId ? updatedItem : item)),
      );
      setActionError(null);
      setLoadError(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível atualizar o produto.',
      );
    }
  }

  async function removeItem(itemId: number) {
    try {
      await deleteShoppingItem(itemId);
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemId),
      );
      setActionError(null);
      setLoadError(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível remover o produto.',
      );
    }
  }

  const completedItems = items.filter((item) => item.completed).length;

  return {
    items,
    isLoading,
    loadError,
    actionError,
    reloadItems,
    totalItems: items.length,
    completedItems,
    addItem,
    toggleItem,
    removeItem,
  };
}