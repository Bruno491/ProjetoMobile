import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export default function IndexRoute() {
  const { isInitializing, user } = useAuth();
  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return <Redirect href={user ? '/home' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
