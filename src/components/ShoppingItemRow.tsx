import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { ShoppingItem } from '../types/shopping';

type ShoppingItemRowProps = {
  item: ShoppingItem;
  onRemove: (itemId: number) => void;
  onToggle: (itemId: number) => void;
};

export function ShoppingItemRow({
  item,
  onRemove,
  onToggle,
}: ShoppingItemRowProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={`${item.completed ? 'Desmarcar' : 'Marcar'} ${item.name}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
        onPress={() => onToggle(item.id)}
        style={[styles.checkButton, item.completed && styles.checkedButton]}
      >
        <Text style={styles.checkText}>{item.completed ? 'OK' : ''}</Text>
      </Pressable>

      <Text style={[styles.name, item.completed && styles.completedName]}>
        {item.name}
      </Text>

      <Pressable
        accessibilityLabel={`Remover ${item.name}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onRemove(item.id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeText}>Remover</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  checkButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    marginRight: 12,
    width: 26,
  },
  checkedButton: {
    backgroundColor: colors.primary,
  },
  checkText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  completedName: {
    color: colors.textDisabled,
    textDecorationLine: 'line-through',
  },
  removeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },
  removeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});