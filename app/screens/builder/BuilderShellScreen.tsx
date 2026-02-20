import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BuilderBottomTabs } from '../../components/BuilderBottomTabs';
import { styles } from '../../styles';
import { BuilderHomeScreen } from './HomeScreen';
import { BuilderJobsScreen } from './JobsScreen';
import { BuilderMessagesScreen } from './MessagesScreen';
import { BuilderQuotesScreen } from './QuotesScreen';
import { BuilderPayScreen } from './PayScreen';
import { BuilderProfileScreen } from './ProfileScreen';

export function BuilderShellScreen() {
  const { builderTab, setBuilderTab } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshCurrentTab = useCallback(() => {
    setRefreshing(true);
    setRefreshTick((tick) => tick + 1);
    setTimeout(() => setRefreshing(false), 350);
  }, []);

  const handleTabChange = useCallback(
    (tab: typeof builderTab) => {
      if (tab === builderTab) {
        refreshCurrentTab();
        return;
      }
      setBuilderTab(tab);
    },
    [builderTab, refreshCurrentTab, setBuilderTab]
  );

  return (
    <>
      <ScrollView
        style={styles.builderScroll}
        contentContainerStyle={styles.builderContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCurrentTab} />}
      >
        {builderTab === 'home' && <BuilderHomeScreen key={`home-${refreshTick}`} />}
        {builderTab === 'jobs' && <BuilderJobsScreen key={`jobs-${refreshTick}`} />}
        {builderTab === 'messages' && <BuilderMessagesScreen key={`messages-${refreshTick}`} />}
        {builderTab === 'quotes' && <BuilderQuotesScreen key={`quotes-${refreshTick}`} />}
        {builderTab === 'pay' && <BuilderPayScreen key={`pay-${refreshTick}`} />}
        {builderTab === 'profile' && <BuilderProfileScreen key={`profile-${refreshTick}`} />}
      </ScrollView>
      <BuilderBottomTabs activeTab={builderTab} onChange={handleTabChange} />
    </>
  );
}
