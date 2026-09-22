import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type ShoppingHeaderProps = {
  totalItems: number;
  completedItems: number;
};

export function ShoppingHeader({
  totalItems,
  completedItems,
}: ShoppingHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>LISTA DE COMPRAS</Text>
      <Text style={styles.title}>Mercado em ordem.</Text>
      <Text style={styles.subtitle}>
        Adicione o que precisa e acompanhe sua compra sem esquecer de nada.
      </Text>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>itens na lista</Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.summaryValue}>{completedItems}</Text>
          <Text style={styles.summaryLabel}>já comprados</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 330,
  },
  summary: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingVertical: 16,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  divider: {
    backgroundColor: colors.divider,
    height: 34,
    width: 1,
  },
});