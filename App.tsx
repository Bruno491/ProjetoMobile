import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ShoppingHeader } from './src/components/ShoppingHeader';
import { ShoppingInput } from './src/components/ShoppingInput';
import { ShoppingItemRow } from './src/components/ShoppingItemRow';
import { useShoppingList } from './src/hooks/useShoppingList';
import { colors } from './src/theme/colors';

export default function App() {
  const {
    addItem,
    completedItems,
    items,
    removeItem,
    toggleItem,
    totalItems,
  } = useShoppingList();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
            <Text style={styles.emptyText}>
              Adicione o primeiro produto para começar.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <>
            <ShoppingHeader
              completedItems={completedItems}
              totalItems={totalItems}
            />
            <ShoppingInput onAdd={addItem} />
            <Text style={styles.listTitle}>Produtos</Text>
          </>
        }
        renderItem={({ item }) => (
          <ShoppingItemRow
            item={item}
            onRemove={removeItem}
            onToggle={toggleItem}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 24,
    marginTop: 28,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 38,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
});
