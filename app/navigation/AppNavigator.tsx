import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { styles } from '../styles';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { BuilderShellScreen } from '../screens/builder/BuilderShellScreen';
import { TradieShellScreen } from '../screens/tradie/ShellScreen';

export function AppNavigator() {
  const { screen, isLogin, isSignup, pageTitle } = useApp();
  const isPortalScreen = screen === 'builderHome' || screen === 'tradieHome';

  return (
    <View
      style={[
        styles.container,
        isLogin && styles.containerLogin,
        isSignup && styles.containerSignup,
        isPortalScreen && styles.containerBuilder,
      ]}
    >
      {!isLogin && !isSignup && !isPortalScreen && (
        <>
          <Text style={styles.brand}>TradieLink</Text>
          <Text style={styles.title}>{pageTitle}</Text>
        </>
      )}

      {screen === 'login' && <LoginScreen />}
      {screen === 'signup' && <SignupScreen />}
      {screen === 'builderHome' && <BuilderShellScreen />}
      {screen === 'tradieHome' && <TradieShellScreen />}
    </View>
  );
}
