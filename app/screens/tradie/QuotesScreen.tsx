import { Pressable, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import type { QuoteStatus } from '../../types';
import { styles } from '../../styles';

export function TradieQuotesScreen() {
  const { quotesStatusTab, setQuotesStatusTab } = useApp();

  return (
    <View style={styles.builderSectionPage}>
      <Text style={styles.jobsHeaderTitle}>Quotes</Text>
      <View style={styles.jobsStatusTabs}>
        {(['pending', 'declined', 'approved'] as QuoteStatus[]).map((status) => {
          const active = quotesStatusTab === status;
          const label = status === 'pending' ? 'Pending' : status === 'declined' ? 'Declined' : 'Approved';
          return (
            <Pressable
              key={status}
              onPress={() => setQuotesStatusTab(status)}
              style={[styles.jobsStatusTabButton, active && styles.jobsStatusTabButtonActive]}
            >
              <Text style={[styles.jobsStatusTabText, active && styles.jobsStatusTabTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.builderSectionCard}>
        <Text style={styles.builderPaneBody}>
          {quotesStatusTab === 'pending'
            ? 'Pending quotes will appear here.'
            : quotesStatusTab === 'declined'
              ? 'Declined quotes will appear here.'
              : 'Approved quotes will appear here.'}
        </Text>
      </View>
    </View>
  );
}
