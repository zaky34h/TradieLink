import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshCurrentTab = useCallback(() => {
    setRefreshing(true);
    setRefreshTick((tick) => tick + 1);
    setTimeout(() => setRefreshing(false), 350);
  }, []);

  const handleTabChange = useCallback(
    (tab: typeof tradieTab) => {
      if (tab === tradieTab) {
        refreshCurrentTab();
        return;
      }
      setTradieTab(tab);
    },
    [refreshCurrentTab, setTradieTab, tradieTab]
  );

  return (
    <>
      <ScrollView
        style={styles.builderScroll}
        contentContainerStyle={styles.builderContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCurrentTab} />}
      >
        {tradieTab === 'home' && <TradieHomeScreen key={`home-${refreshTick}`} />}
        {tradieTab === 'jobs' && <TradieJobsScreen key={`jobs-${refreshTick}`} />}
        {tradieTab === 'messages' && <TradieMessagesScreen key={`messages-${refreshTick}`} />}
        {tradieTab === 'quotes' && <TradieQuotesScreen key={`quotes-${refreshTick}`} />}
        {tradieTab === 'pay' && <TradiePayScreen key={`pay-${refreshTick}`} />}
        {tradieTab === 'profile' && <TradieProfileScreen key={`profile-${refreshTick}`} />}
      </ScrollView>
      <TradieBottomTabs activeTab={tradieTab} onChange={handleTabChange} />
    </>
  );
}
