import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

type FormMode = 'login' | 'family' | 'join';

export default function LoginScreen() {
  const { isInitializing, joinFamily, login, registerFamily, user } = useAuth();
  const [mode, setMode] = useState<FormMode>('login');
  const [familyName, setFamilyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (user) {
    return <Redirect href="/home" />;
  }

  async function submit() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else if (mode === 'family') {
        await registerFamily({
          family_name: familyName.trim(),
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await joinFamily({
          name: name.trim(),
          email: email.trim(),
          password,
          invite_code: inviteCode.trim(),
        });
      }
      router.replace('/home');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível concluir o acesso.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    mode === 'login'
      ? 'Que bom ter você de volta'
      : mode === 'family'
        ? 'Crie a conta da família'
        : 'Entre para sua família';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>LISTA DE COMPRAS</Text>
          <Text style={styles.title}>Mercado em ordem.</Text>
          <Text style={styles.subtitle}>{title}</Text>

          <View style={styles.modeRow}>
            {([
              ['login', 'Entrar'],
              ['family', 'Criar família'],
              ['join', 'Tenho convite'],
            ] as const).map(([key, label]) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: mode === key }}
                key={key}
                onPress={() => {
                  setMode(key);
                  setError(null);
                }}
                style={[styles.modeButton, mode === key && styles.modeSelected]}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === key && styles.modeTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'family' ? (
            <FormField
              autoCapitalize="words"
              label="Nome da família"
              onChangeText={setFamilyName}
              placeholder="Ex.: Família Silva"
              value={familyName}
            />
          ) : null}
          {mode !== 'login' ? (
            <FormField
              autoCapitalize="words"
              label="Seu nome"
              onChangeText={setName}
              placeholder="Como podemos chamar você?"
              value={name}
            />
          ) : null}
          <FormField
            autoCapitalize="none"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
            value={email}
          />
          <FormField
            label="Senha"
            onChangeText={setPassword}
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
            value={password}
          />
          {mode === 'join' ? (
            <FormField
              autoCapitalize="characters"
              label="Código de convite"
              onChangeText={setInviteCode}
              placeholder="Peça o código ao responsável"
              value={inviteCode}
            />
          ) : null}

          {mode === 'family' || mode === 'join' ? (
            <Text style={styles.hint}>
              {mode === 'family'
                ? 'Você será o responsável e poderá convidar familiares.'
                : 'O código é de uso único e válido por 24 horas.'}
            </Text>
          ) : null}

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && !isSubmitting && styles.pressed,
              isSubmitting && styles.disabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'login'
                  ? 'Entrar'
                  : mode === 'family'
                    ? 'Criar minha família'
                    : 'Entrar na família'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  secureTextEntry = false,
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 10 },
  subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 6 },
  modeRow: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 22,
    marginTop: 28,
    padding: 4,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  modeSelected: { backgroundColor: colors.surface },
  modeText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  modeTextSelected: { color: colors.text },
  field: { marginBottom: 14 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 52,
  },
  submitText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.65 },
});
