import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { AppProvider, useApp } from './context/AppContext';
import { AppNavigator } from './navigation/AppNavigator';
import { ErrorBoundary } from './components/core/ErrorBoundary';
import { styles } from './styles';

function AppShell() {
  const { useLightTheme, isLogin } = useApp();

  return (
    <SafeAreaView style={[styles.safe, useLightTheme && styles.safeLight, isLogin && styles.safeLogin]}>
      <StatusBar style={useLightTheme ? 'dark' : 'light'} />
      <AppNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
