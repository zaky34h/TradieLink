import { Text, View } from 'react-native';
import { BuilderActionButton } from '../../components/BuilderActionButton';
import { BuilderStatCard } from '../../components/BuilderStatCard';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';

export function TradieHomeScreen() {
  const { firstName, tradieJobs, threads, setTradieTab } = useApp();

  return (
    <>
      <View style={styles.builderHeader}>
        <Text style={styles.builderWelcome}>Welcome Back,</Text>
        <Text style={styles.builderCompany}>{firstName || 'Tradie'}</Text>
      </View>

      <View style={styles.builderStatRow}>
        <BuilderStatCard title="Available Jobs" value={String(tradieJobs.length)} />
        <BuilderStatCard title="Active Chats" value={String(threads.length)} />
      </View>
      <View style={styles.builderStatRow}>
        <BuilderStatCard title="Pending Quotes" value="0" />
        <BuilderStatCard title="Pending Pay" value="0" />
      </View>

      <View style={styles.builderActionsWrap}>
        <Text style={styles.builderActionsTitle}>Quick Actions</Text>
        <BuilderActionButton
          label="Browse Jobs"
          subtitle="View jobs posted by builders and enquire"
          tone="brand"
          onPress={() => setTradieTab('jobs')}
        />
        <BuilderActionButton
          label="Messages"
          subtitle="View conversations with builders"
          onPress={() => setTradieTab('messages')}
        />
        <BuilderActionButton
          label="Create Quote"
          subtitle="Create and manage pending, approved, and declined quotes"
          tone="brand"
          onPress={() => setTradieTab('quotes')}
        />
      </View>
    </>
  );
}
