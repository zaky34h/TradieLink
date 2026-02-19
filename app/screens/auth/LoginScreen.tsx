import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';

export function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    handleLogin,
    setScreen,
  } = useApp();

  return (
    <View style={styles.loginShell}>
      <View pointerEvents="none" style={styles.loginBackgroundDecor}>
        <View style={[styles.loginCircle, styles.loginCircleTop]} />
        <View style={[styles.loginCircle, styles.loginCircleMid]} />
        <View style={[styles.loginCircle, styles.loginCircleBottom]} />
      </View>

      <View style={styles.loginContent}>
        <View style={styles.loginLogoWrap}>
          <Image
            source={require('../../../assets/tradielink-logo.png')}
            style={styles.loginLogo}
            resizeMode="contain"
          />
          <Text style={styles.loginSubtitle}>Builders and Tradies connected fast</Text>
        </View>

        <View style={styles.loginCard}>
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

          <View style={styles.rememberWrap}>
            <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberRow}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
              <Text style={styles.rememberText}>Remember me</Text>
            </Pressable>

            <Pressable onPress={() => Alert.alert('Forgot password', 'Password reset is coming soon.')}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>

          <Pressable onPress={() => setScreen('signup')} style={styles.signupFromLoginButton}>
            <Text style={styles.signupFromLoginText}>Create an account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
