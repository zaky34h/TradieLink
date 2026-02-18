import { ScrollView } from 'react-native';
import { TradieBottomTabs } from '../../components/TradieBottomTabs';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';
import { TradieHomeScreen } from './HomeScreen';
import { TradieJobsScreen } from './JobsScreen';
import { TradieMessagesScreen } from './TradieMessagesScreen';
import { TradieQuotesScreen } from './QuotesScreen';
import { TradiePayScreen } from './PayScreen';
import { TradieProfileScreen } from './ProfileScreen';

export function TradieShellScreen() {
  const { tradieTab, setTradieTab } = useApp();

  return (
    <>
      <ScrollView style={styles.builderScroll} contentContainerStyle={styles.builderContent} showsVerticalScrollIndicator={false}>
        {tradieTab === 'home' && <TradieHomeScreen />}
        {tradieTab === 'jobs' && <TradieJobsScreen />}
        {tradieTab === 'messages' && <TradieMessagesScreen />}
        {tradieTab === 'quotes' && <TradieQuotesScreen />}
        {tradieTab === 'pay' && <TradiePayScreen />}
        {tradieTab === 'profile' && <TradieProfileScreen />}
      </ScrollView>
      <TradieBottomTabs activeTab={tradieTab} onChange={setTradieTab} />
    </>
  );
}
