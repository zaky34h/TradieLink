import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Role = 'Builder' | 'Tradie';
type Screen = 'login' | 'signup' | 'builderHome' | 'tradieHome';
type BuilderTab = 'home' | 'jobs' | 'messages' | 'profile';
const BRAND_BLUE = '#1DB5AE';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed.');
  }
  return data as T;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [builderTab, setBuilderTab] = useState<BuilderTab>('home');
  const [selectedRole, setSelectedRole] = useState<Role>('Builder');
  const [builderCompanyName, setBuilderCompanyName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [about, setAbout] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [certifications, setCertifications] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [availableDates, setAvailableDates] = useState('');

  const pageTitle = useMemo(() => {
    if (screen === 'signup') return 'Create your TradieLink account';
    if (screen === 'builderHome') return 'Builder Home';
    if (screen === 'tradieHome') return 'Tradie Home';
    return 'Welcome back to TradieLink';
  }, [screen]);

  const openRoleHome = (role: Role) => {
    if (role === 'Builder') {
      setBuilderTab('home');
      setScreen('builderHome');
      return;
    }
    setScreen('tradieHome');
  };

  const handleLogin = async () => {
    try {
      const payload = await postJson<{
        ok: true;
        token: string;
        user: { role: 'builder' | 'tradie'; companyName?: string | null };
      }>('/auth/login', {
        email: email.trim(),
        password,
      });

      const role: Role = payload.user.role === 'builder' ? 'Builder' : 'Tradie';
      setSelectedRole(role);
      setBuilderCompanyName(role === 'Builder' ? payload.user.companyName || '' : '');
      openRoleHome(role);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to login.');
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Email and password are required.');
      return;
    }
    if (selectedRole === 'Builder' && !companyName.trim()) {
      Alert.alert('Missing info', 'Company name is required for builders.');
      return;
    }

    try {
      const payload = await postJson<{
        ok: true;
        token: string;
        user: { role: 'builder' | 'tradie'; companyName?: string | null };
      }>('/auth/register', {
        role: selectedRole.toLowerCase(),
        firstName,
        lastName,
        about,
        companyName,
        address,
        occupation,
        pricePerHour,
        experienceYears,
        certifications,
        photoUrl,
        email: email.trim(),
        password,
      });

      const role: Role = payload.user.role === 'builder' ? 'Builder' : 'Tradie';
      setSelectedRole(role);
      setBuilderCompanyName(role === 'Builder' ? payload.user.companyName || '' : '');
      openRoleHome(role);
    } catch (error) {
      Alert.alert(
        'Could not create account',
        error instanceof Error ? error.message : 'Unable to create account.',
      );
    }
  };

  const resetToLogin = () => {
    setScreen('login');
    setFirstName('');
    setLastName('');
    setAbout('');
    setCompanyName('');
    setAddress('');
    setOccupation('');
    setPricePerHour('');
    setExperienceYears('');
    setCertifications('');
    setPhotoUrl('');
    setAvailableDates('');
    setEmail('');
    setPassword('');
    setBuilderCompanyName('');
    setSelectedRole('Builder');
  };

  const isAuthScreen = screen === 'login' || screen === 'signup';
  const isSignup = screen === 'signup';
  const isBuilderHome = screen === 'builderHome';
  const isLogin = screen === 'login';
  const isTradie = selectedRole === 'Tradie';
  const isBuilderScreen = screen === 'builderHome';
  const useLightTheme = isLogin || isSignup || isBuilderScreen;
  const builderName = builderCompanyName || companyName.trim() || 'Company Name';

  return (
    <SafeAreaView style={[styles.safe, useLightTheme && styles.safeLight]}>
      <StatusBar style={useLightTheme ? 'dark' : 'light'} />
      <View
        style={[
          styles.container,
          isLogin && styles.containerLogin,
          isSignup && styles.containerSignup,
          isBuilderScreen && styles.containerBuilder,
        ]}
      >
        {!isLogin && !isSignup && !isBuilderScreen && (
          <>
            <Text style={styles.brand}>TradieLink</Text>
            <Text style={styles.title}>{pageTitle}</Text>
          </>
        )}

        {isLogin && (
          <View style={styles.loginShell}>
            <View style={styles.loginLogoWrap}>
              <Image
                source={require('./assets/tradielink-logo.png')}
                style={styles.loginLogo}
                resizeMode="contain"
              />
            </View>

            <View>
              <Text style={styles.loginLabel}>Email Address</Text>
              <TextInput
                placeholder="you@email.com"
                style={styles.loginInput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text style={styles.loginLabel}>Password</Text>
              <TextInput
                placeholder="••••••••"
                style={styles.loginInput}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              />
              <Text>Remember me</Text>
            </Pressable>

            <Pressable style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </Pressable>

            <Pressable
              onPress={() => setScreen('signup')}
              style={styles.signupFromLoginButton}
            >
              <Text style={styles.signupFromLoginText}>Create an account</Text>
            </Pressable>
          </View>
        )}

        {isSignup && (
          <ScrollView
            contentContainerStyle={styles.signupContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.signupTitle}>Create Account</Text>

            <View style={styles.roleRow}>
              <Pressable
                onPress={() => setSelectedRole('Builder')}
                style={[
                  styles.signupRoleButton,
                  !isTradie && styles.signupRoleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.signupRoleText,
                    !isTradie && styles.signupRoleTextActive,
                  ]}
                >
                  Builder
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedRole('Tradie')}
                style={[
                  styles.signupRoleButton,
                  isTradie && styles.signupRoleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.signupRoleText,
                    isTradie && styles.signupRoleTextActive,
                  ]}
                >
                  Tradie
                </Text>
              </Pressable>
            </View>

            <Field label="First Name" value={firstName} onChangeText={setFirstName} />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} />
            <Field label="About Yourself" value={about} onChangeText={setAbout} multiline />

            {!isTradie ? (
              <>
                <Field
                  label="Company Name"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
                <Field label="Address" value={address} onChangeText={setAddress} />
              </>
            ) : (
              <>
                <Field label="Occupation" value={occupation} onChangeText={setOccupation} />
                <Field
                  label="Price Per Hour"
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  keyboardType="numeric"
                />
                <Field
                  label="Experience (Years)"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="numeric"
                  placeholder="e.g. 3"
                />
                <Field
                  label="Certifications (comma separated)"
                  value={certifications}
                  onChangeText={setCertifications}
                  placeholder="White Card, Working at Heights, ..."
                />
                <Field
                  label="Photo URL (optional)"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  autoCapitalize="none"
                  placeholder="https://..."
                />
                <Field
                  label="Availability Dates"
                  value={availableDates}
                  onChangeText={setAvailableDates}
                  placeholder="2026-03-01, 2026-03-02"
                />
              </>
            )}

            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable onPress={handleSignup} style={styles.signupSubmitButton}>
              <Text style={styles.signupSubmitText}>Create Account</Text>
            </Pressable>

            <Pressable onPress={() => setScreen('login')}>
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </Pressable>
          </ScrollView>
        )}

        {isBuilderScreen && (
          <>
            <ScrollView
              style={styles.builderScroll}
              contentContainerStyle={styles.builderContent}
              showsVerticalScrollIndicator={false}
            >
              {builderTab === 'home' && (
                <>
                  <View style={styles.builderHeader}>
                    <Text style={styles.builderCompany}>{`Welcome, ${builderName}`}</Text>
                  </View>

                  <View style={styles.builderStatRow}>
                    <BuilderStatCard title="Active Chats" value="0" />
                    <BuilderStatCard title="Pending Offers" value="0" />
                  </View>
                  <View style={styles.builderStatRow}>
                    <BuilderStatCard title="Saved Tradies" value="0" />
                    <BuilderStatCard title="Pending Pay" value="0" />
                  </View>

                  <View style={styles.builderActionsWrap}>
                    <Text style={styles.builderActionsTitle}>Quick Actions</Text>
                    <BuilderActionButton
                      label="Browse Tradies"
                      subtitle="Find available workers by trade and date"
                      tone="brand"
                    />
                    <BuilderActionButton
                      label="Messages"
                      subtitle="View conversations with tradies"
                      onPress={() => setBuilderTab('messages')}
                    />
                    <BuilderActionButton
                      label="Generate Work Offer"
                      subtitle="Send formal offer details to a tradie"
                      tone="brand"
                    />
                  </View>
                </>
              )}

              {builderTab === 'jobs' && (
                <View style={styles.builderTabPane}>
                  <Text style={styles.builderPaneTitle}>Jobs</Text>
                  <Text style={styles.builderPaneBody}>
                    Your posted and active jobs will appear here.
                  </Text>
                </View>
              )}

              {builderTab === 'messages' && (
                <View style={styles.builderTabPane}>
                  <Text style={styles.builderPaneTitle}>Messages</Text>
                  <Text style={styles.builderPaneBody}>
                    Conversations with tradies will appear here.
                  </Text>
                </View>
              )}

              {builderTab === 'profile' && (
                <View style={styles.builderTabPane}>
                  <Text style={styles.builderPaneTitle}>Profile</Text>
                  <Text style={styles.builderPaneBody}>
                    Manage your builder profile details.
                  </Text>
                  <Pressable style={styles.builderLogoutBtn} onPress={resetToLogin}>
                    <Text style={styles.builderLogoutText}>Logout</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>

            <View style={styles.bottomTabs}>
              {(['home', 'jobs', 'messages', 'profile'] as BuilderTab[]).map((tab) => {
                const active = builderTab === tab;
                const color = active ? '#111111' : '#444444';
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setBuilderTab(tab)}
                    style={styles.bottomTabItem}
                  >
                    <Ionicons
                      name={
                        tab === 'home'
                          ? 'home'
                          : tab === 'jobs'
                            ? 'briefcase'
                            : tab === 'messages'
                              ? 'chatbubble'
                              : 'person'
                      }
                      size={20}
                      color={color}
                    />
                    <Text style={[styles.bottomTabText, { color }]}>
                      {tab === 'home'
                        ? 'Home'
                        : tab === 'jobs'
                          ? 'Jobs'
                          : tab === 'messages'
                            ? 'Messages'
                            : 'Profile'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {!isAuthScreen && !isBuilderScreen && (
          <View style={styles.card}>
            <Text style={styles.homeTitle}>
              {isBuilderHome ? 'Builder Dashboard' : 'Tradie Dashboard'}
            </Text>
            <Text style={styles.homeBody}>
              {isBuilderHome
                ? 'Post jobs, review quotes, and manage your projects from one place.'
                : 'Browse jobs, send quotes, and track your accepted work here.'}
            </Text>
            <Pressable style={styles.primaryButton} onPress={resetToLogin}>
              <Text style={styles.primaryText}>Logout</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeLight: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  containerLogin: {
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 18,
  },
  containerSignup: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  containerBuilder: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  loginShell: {
    flex: 1,
    gap: 18,
    backgroundColor: '#FFFFFF',
  },
  loginLogoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  loginLogo: {
    width: 300,
    height: 150,
  },
  loginLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    padding: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#111111',
  },
  loginButton: {
    padding: 16,
    backgroundColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: BRAND_BLUE,
    fontWeight: '800',
  },
  signupFromLoginButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: BRAND_BLUE,
  },
  signupFromLoginText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#111111',
  },
  brand: {
    color: '#FACC15',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  signupContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    gap: 14,
  },
  signupTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111111',
  },
  signupRoleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#111111',
  },
  signupRoleButtonActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  signupRoleText: {
    fontWeight: '800',
    color: '#111111',
  },
  signupRoleTextActive: {
    color: BRAND_BLUE,
  },
  signupSubmitButton: {
    padding: 16,
    backgroundColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signupSubmitText: {
    color: BRAND_BLUE,
    fontWeight: '800',
  },
  backToLoginText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#111111',
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#E5E7EB',
    marginBottom: 12,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '700',
    color: '#111111',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    padding: 14,
    color: '#111111',
  },
  fieldInputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  roleButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: BRAND_BLUE,
    borderColor: BRAND_BLUE,
  },
  roleText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#111827',
  },
  builderScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  builderContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 20,
  },
  builderHeader: {
    gap: 6,
  },
  builderWelcome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  builderCompany: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111111',
  },
  builderStatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  builderActionsWrap: {
    gap: 12,
  },
  builderActionsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  builderStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111111',
  },
  builderStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  builderStatTitle: {
    marginTop: 6,
    opacity: 0.7,
    fontWeight: '700',
    color: '#111111',
  },
  builderActionButton: {
    padding: 16,
    borderRadius: 16,
  },
  builderActionButtonDark: {
    backgroundColor: '#111111',
  },
  builderActionButtonBrand: {
    backgroundColor: BRAND_BLUE,
  },
  builderActionLabel: {
    fontWeight: '900',
    fontSize: 16,
  },
  builderActionLabelDark: {
    color: '#333333',
  },
  builderActionLabelBrand: {
    color: BRAND_BLUE,
  },
  builderActionSubtitle: {
    marginTop: 4,
    fontWeight: '600',
  },
  builderActionSubtitleDark: {
    color: '#444444',
  },
  builderActionSubtitleBrand: {
    color: BRAND_BLUE,
  },
  builderTabPane: {
    marginTop: 60,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  builderPaneTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  builderPaneBody: {
    marginTop: 8,
    color: '#333333',
    fontSize: 15,
  },
  builderLogoutBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  builderLogoutText: {
    color: BRAND_BLUE,
    fontWeight: '900',
  },
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#111111',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  bottomTabText: {
    fontWeight: '700',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryText: {
    color: '#052E16',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: BRAND_BLUE,
    fontSize: 14,
  },
  homeTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  homeBody: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
});

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address';
};

function Field({
  label,
  multiline,
  ...rest
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}

function BuilderStatCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.builderStatCard}>
      <Text style={styles.builderStatValue}>{value}</Text>
      <Text style={styles.builderStatTitle}>{title}</Text>
    </View>
  );
}

function BuilderActionButton({
  label,
  subtitle,
  onPress,
  tone,
}: {
  label: string;
  subtitle: string;
  onPress?: () => void;
  tone?: 'default' | 'brand';
}) {
  const isBrand = tone === 'brand';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.builderActionButton,
        isBrand ? styles.builderActionButtonBrand : styles.builderActionButtonDark,
      ]}
    >
      <Text
        style={[
          styles.builderActionLabel,
          isBrand ? styles.builderActionLabelDark : styles.builderActionLabelBrand,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.builderActionSubtitle,
          isBrand
            ? styles.builderActionSubtitleDark
            : styles.builderActionSubtitleBrand,
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}
