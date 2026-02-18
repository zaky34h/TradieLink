import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { BuilderTab } from '../types';
import { styles } from '../styles';

export function BuilderBottomTabs({
  activeTab,
  onChange,
}: {
  activeTab: BuilderTab;
  onChange: (tab: BuilderTab) => void;
}) {
  return (
    <View style={styles.bottomTabs}>
      {(['home', 'jobs', 'messages', 'quotes', 'pay', 'profile'] as BuilderTab[]).map((tab) => {
        const active = activeTab === tab;
        const color = active ? '#111111' : '#444444';
        return (
          <Pressable key={tab} onPress={() => onChange(tab)} style={styles.bottomTabItem}>
            <View style={styles.bottomTabIconWrap}>
              <Ionicons
                name={
                  tab === 'home'
                    ? 'home'
                    : tab === 'jobs'
                      ? 'briefcase'
                      : tab === 'messages'
                        ? 'chatbubble'
                        : tab === 'quotes'
                          ? 'document-text'
                          : tab === 'pay'
                            ? 'card'
                            : 'person'
                }
                size={22}
                color={color}
              />
            </View>
            <Text style={[styles.bottomTabText, { color }]}>
              {tab === 'home'
                ? 'Home'
                : tab === 'jobs'
                  ? 'Jobs'
                  : tab === 'messages'
                    ? 'Messages'
                    : tab === 'quotes'
                      ? 'Quotes'
                      : tab === 'pay'
                        ? 'Pay'
                        : 'Profile'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
