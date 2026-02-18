import { Pressable, Text } from 'react-native';
import { styles } from '../styles';

export function BuilderActionButton({
  label,
  subtitle,
  onPress,
  tone,
}: {
  label: string;
  subtitle: string;
  onPress?: () => void;
  tone?: 'default' | 'brand';
}) {
  const isBrand = tone === 'brand';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.builderActionButton,
        isBrand ? styles.builderActionButtonBrand : styles.builderActionButtonDark,
      ]}
    >
      <Text
        style={[
          styles.builderActionLabel,
          isBrand ? styles.builderActionLabelDark : styles.builderActionLabelBrand,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.builderActionSubtitle,
          isBrand ? styles.builderActionSubtitleDark : styles.builderActionSubtitleBrand,
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}
