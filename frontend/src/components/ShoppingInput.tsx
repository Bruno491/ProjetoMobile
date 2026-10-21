import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

type ShoppingInputProps = {
  onAdd: (itemName: string) => void;
};

export function ShoppingInput({ onAdd }: ShoppingInputProps) {
  const [itemName, setItemName] = useState('');

  function handleAddItem() {
    const trimmedName = itemName.trim();

    if (!trimmedName) {
      return;
    }

    onAdd(trimmedName);
    setItemName('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>O que está faltando?</Text>
      <View style={styles.formRow}>
        <TextInput
          onChangeText={setItemName}
          onSubmitEditing={handleAddItem}
          placeholder="Ex.: Leite, arroz, frutas..."
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
          style={styles.input}
          value={itemName}
        />
        <Pressable
          accessibilityLabel="Adicionar item"
          accessibilityRole="button"
          onPress={handleAddItem}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>Adicionar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  formRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});