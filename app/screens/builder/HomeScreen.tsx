import { Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BuilderActionButton } from '../../components/BuilderActionButton';
import { BuilderStatCard } from '../../components/BuilderStatCard';
import { styles } from '../../styles';

export function BuilderHomeScreen() {
  const { builderName, builderStats, setBuilderTab } = useApp();

  return (
    <>
      <View style={styles.builderHeader}>
        <Text style={styles.builderWelcome}>Welcome Back,</Text>
        <Text style={styles.builderCompany}>{builderName}</Text>
      </View>

      <View style={styles.builderStatRow}>
        <BuilderStatCard title="Active Chats" value={String(builderStats.activeChats)} />
        <BuilderStatCard title="Pending Jobs" value={String(builderStats.pendingOffers)} />
      </View>
      <View style={styles.builderStatRow}>
        <BuilderStatCard title="Saved Tradies" value={String(builderStats.savedTradies)} />
        <BuilderStatCard title="Pending Pay" value={String(builderStats.pendingPay)} />
      </View>

      <View style={styles.builderActionsWrap}>
        <Text style={styles.builderActionsTitle}>Quick Actions</Text>
        <BuilderActionButton
          label="Browse Jobs"
          subtitle="Review all posted, active, and completed jobs"
          tone="brand"
          onPress={() => setBuilderTab('jobs')}
        />
        <BuilderActionButton
          label="Messages"
          subtitle="View conversations with tradies"
          onPress={() => setBuilderTab('messages')}
        />
        <BuilderActionButton
          label="View Quotes"
          subtitle="Review pending, approved, and declined quotes"
          tone="brand"
          onPress={() => setBuilderTab('quotes')}
        />
      </View>
    </>
  );
}
