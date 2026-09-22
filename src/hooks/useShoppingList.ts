import { useState } from 'react';
import { initialShoppingItems } from '../data/initialShoppingItems';
import type { ShoppingItem } from '../types/shopping';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(initialShoppingItems);

  function addItem(name: string) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return;
    }

    setItems((currentItems) => {
      const nextId =
        currentItems.reduce(
          (largestId, item) => Math.max(largestId, item.id),
          0,
        ) + 1;

      return [
        ...currentItems,
        { id: nextId, name: normalizedName, completed: false },
      ];
    });
  }

  function toggleItem(itemId: number) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function removeItem(itemId: number) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  }

  const completedItems = items.filter((item) => item.completed).length;

  return {
    items,
    totalItems: items.length,
    completedItems,
    addItem,
    toggleItem,
    removeItem,
  };
}