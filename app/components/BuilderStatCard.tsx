import { Text, View } from 'react-native';
import { styles } from '../styles';

export function BuilderStatCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.builderStatCard}>
      <Text style={styles.builderStatValue}>{value}</Text>
      <Text style={styles.builderStatTitle}>{title}</Text>
    </View>
  );
}
