import { ScrollView } from 'react-native';
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

  return (
    <>
      <ScrollView style={styles.builderScroll} contentContainerStyle={styles.builderContent} showsVerticalScrollIndicator={false}>
        {builderTab === 'home' && <BuilderHomeScreen />}
        {builderTab === 'jobs' && <BuilderJobsScreen />}
        {builderTab === 'messages' && <BuilderMessagesScreen />}
        {builderTab === 'quotes' && <BuilderQuotesScreen />}
        {builderTab === 'pay' && <BuilderPayScreen />}
        {builderTab === 'profile' && <BuilderProfileScreen />}
      </ScrollView>
      <BuilderBottomTabs activeTab={builderTab} onChange={setBuilderTab} />
    </>
  );
}
