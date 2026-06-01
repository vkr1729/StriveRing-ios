import React from 'react';
import '@/utils/styles';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, useWindowDimensions, Text, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong at startup</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.errorText}>
              {this.state.error ? this.state.error.toString() : 'Unknown Error'}
            </Text>
            <Text style={errorStyles.stackText}>
              {this.state.error?.stack || ''}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a10',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  scroll: {
    backgroundColor: '#0d1117',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1c2128',
  },
  errorText: {
    color: '#f0f3f5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stackText: {
    color: '#6e7681',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
});

function RootLayoutInner() {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width >= 500;

  if (isLargeScreen) {
    // Proportional dimensions: iPhone 15 Pro ratio (approx 1:2.16)
    // Max out at 852px tall (standard height) and ensure there is at least 80px vertical margin
    const frameHeight = Math.min(852, height - 80);
    const frameWidth = Math.min(393, frameHeight * 0.46);

    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: frameWidth, height: frameHeight },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <View style={[styles.webWrapper, { height }]}>
          <StatusBar style="light" />
          <View style={[styles.phoneFrame, { width: frameWidth, height: frameHeight }]}>
            <View style={styles.notch} />
            <View style={styles.phoneContent}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }} />
            </View>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }} />
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#0a0d14', // Sleek dark outer background
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  phoneFrame: {
    borderRadius: 48,
    borderWidth: 12,
    borderColor: '#16181d', // Solid dark phone bezel
    backgroundColor: Colors.background,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 28,
    backgroundColor: '#16181d',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 9999,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3e4451', // Subtle gray indicator
    zIndex: 9999,
  },
  phoneContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

