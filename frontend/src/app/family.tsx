import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import {
  createFamilyInvitation,
  fetchFamilyMembers,
  type FamilyMember,
} from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export default function FamilyScreen() {
  const { isInitializing, logout, user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetchFamilyMembers()
      .then((loadedMembers) => {
        if (active) {
          setMembers(loadedMembers);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar os membros.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  async function generateInvite() {
    setError(null);
    setIsCreatingInvite(true);
    try {
      setInviteCode(await createFamilyInvitation());
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Não foi possível criar o convite.',
      );
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function signOut() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      setError('Não foi possível encerrar a sessão neste dispositivo.');
      setIsLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/home')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹  Voltar à lista</Text>
        </Pressable>
        <Text style={styles.eyebrow}>SUA FAMÍLIA</Text>
        <Text style={styles.title}>{user.family_name}</Text>
        <Text style={styles.subtitle}>
          Conta conectada como {user.name}
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Membros</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.name}
                    {member.id === user.id ? ' (você)' : ''}
                  </Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <Text style={styles.role}>
                  {member.role === 'owner' ? 'Responsável' : 'Membro'}
                </Text>
              </View>
            ))
          )}
        </View>

        {user.role === 'owner' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Adicionar familiar</Text>
            <Text style={styles.description}>
              Crie um convite e compartilhe o código pessoalmente. Cada convite
              vale por 24 horas e só pode ser usado uma vez.
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isCreatingInvite}
              onPress={() => void generateInvite()}
              style={[styles.primaryButton, isCreatingInvite && styles.disabled]}
            >
              {isCreatingInvite ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>Gerar convite</Text>
              )}
            </Pressable>
            {inviteCode ? (
              <View style={styles.inviteBox}>
                <Text style={styles.inviteLabel}>CÓDIGO DO CONVITE</Text>
                <Text selectable style={styles.inviteCode}>
                  {inviteCode}
                </Text>
                <Text style={styles.inviteHint}>
                  Toque e segure o código para copiá-lo.
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.description}>
              Você acompanha a lista da família. Somente o responsável pode
              convidar membros e editar produtos.
            </Text>
          </View>
        )}

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isLoggingOut}
          onPress={() => void signOut()}
          style={styles.logoutButton}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={styles.logoutText}>Sair da conta</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  content: { padding: 24, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', marginBottom: 24, paddingVertical: 8 },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 22,
    padding: 18,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 14 },
  memberRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 10 },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  memberInitial: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  memberEmail: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  role: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginLeft: 6 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 13,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
  },
  primaryButtonText: { color: colors.surface, fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.65 },
  inviteBox: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    marginTop: 16,
    padding: 16,
  },
  inviteLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  inviteCode: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  inviteHint: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, marginTop: 16 },
  logoutButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 48,
  },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
});
