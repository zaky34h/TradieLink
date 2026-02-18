import { Image, Pressable, Text, TextInput, View } from 'react-native';
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
      <View style={styles.loginLogoWrap}>
        <Image
          source={require('../../../assets/tradielink-logo.png')}
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

      <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberRow}>
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
        <Text>Remember me</Text>
      </Pressable>

      <Pressable style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </Pressable>

      <Pressable onPress={() => setScreen('signup')} style={styles.signupFromLoginButton}>
        <Text style={styles.signupFromLoginText}>Create an account</Text>
      </Pressable>
    </View>
  );
}
