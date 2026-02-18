import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { styles } from '../../styles';

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled UI error:', error);
  }

  reset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={[styles.safe, styles.safeLight]}>
        <View style={styles.builderContent}>
          <Text style={styles.jobsHeaderTitle}>Something went wrong</Text>
          <Text style={styles.builderPaneBody}>{this.state.errorMessage}</Text>
          <Pressable style={styles.profileSaveBtn} onPress={this.reset}>
            <Text style={styles.profileSaveText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}
