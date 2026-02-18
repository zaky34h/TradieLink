import { Text, View } from 'react-native';
import { styles } from '../../styles';

export function BuilderPayScreen() {
  return (
    <View style={styles.builderSectionPage}>
      <Text style={styles.jobsHeaderTitle}>Pay</Text>
      <View style={styles.builderSectionCard}>
        <Text style={styles.builderPaneBody}>Payment tracking and pending payouts will appear here.</Text>
      </View>
    </View>
  );
}
