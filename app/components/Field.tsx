import { Text, TextInput, View } from 'react-native';
import { styles } from '../styles';

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address';
};

export function Field({ label, multiline, ...rest }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}
