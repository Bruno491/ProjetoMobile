import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { ShoppingHeader } from '../components/ShoppingHeader';
import { ShoppingInput } from '../components/ShoppingInput';
import { ShoppingItemRow } from '../components/ShoppingItemRow';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingList } from '../hooks/useShoppingList';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const { isInitializing, user } = useAuth();
  if (isInitializing) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  return <ShoppingListScreen canEdit={user.role === 'owner'} familyName={user.family_name} />;
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

function ShoppingListScreen({
  canEdit,
  familyName,
}: {
  canEdit: boolean;
  familyName: string;
}) {
  const {
    addItem,
    actionError,
    completedItems,
    items,
    isLoading,
    loadError,
    reloadItems,
    removeItem,
    toggleItem,
    totalItems,
  } = useShoppingList();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>Carregando produtos...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
              <Text style={styles.emptyText}>{loadError}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void reloadItems()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
              <Text style={styles.emptyText}>
                {canEdit
                  ? 'Adicione o primeiro produto para começar.'
                  : 'O responsável ainda não adicionou produtos.'}
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <View style={styles.familyIdentity}>
                <Text style={styles.familyCaption}>LISTA DA FAMÍLIA</Text>
                <Text style={styles.familyName}>{familyName}</Text>
              </View>
              <Pressable
                accessibilityLabel="Abrir área da família"
                accessibilityRole="button"
                onPress={() => router.push('/family')}
                style={styles.familyButton}
              >
                <Text style={styles.familyButtonText}>Família</Text>
              </Pressable>
            </View>
            <ShoppingHeader
              completedItems={completedItems}
              totalItems={totalItems}
            />
            {canEdit ? <ShoppingInput onAdd={addItem} /> : (
              <Text style={styles.readOnlyNotice}>
                Você pode acompanhar a lista. Apenas o responsável pode alterá-la.
              </Text>
            )}
            {actionError ? (
              <Text accessibilityRole="alert" style={styles.actionError}>
                {actionError}
              </Text>
            ) : null}
            <Text style={styles.listTitle}>Produtos</Text>
          </>
        }
        renderItem={({ item }) => (
          <ShoppingItemRow
            canEdit={canEdit}
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
  container: { backgroundColor: colors.background, flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  listContent: { paddingBottom: 24 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  familyIdentity: { flex: 1 },
  familyCaption: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  familyName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  familyButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  familyButtonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  listTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 24,
    marginTop: 28,
  },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 38 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center' },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: colors.surface, fontWeight: '700' },
  actionError: { color: colors.danger, fontSize: 14, marginHorizontal: 24, marginTop: 12 },
  readOnlyNotice: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginHorizontal: 24,
    marginTop: 10,
  },
});
