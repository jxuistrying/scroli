import * as React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Scroly Dashboard</Text>
            <Text style={styles.subtitle}>Minimal Test Version</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Usage</Text>
              <Text style={styles.bigNumber}>2.3</Text>
              <Text style={styles.label}>hours today</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View style={[styles.progressBar, { width: 138 }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0</Text>
                <Text style={styles.progressLabel}>3h goal</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Status</Text>
              <View style={styles.row}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Screen Time</Text>
                  <Text style={styles.statValue}>2h 23m</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>At Stake</Text>
                  <Text style={[styles.statValue, styles.purple]}>$5</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Streak</Text>
              <Text style={styles.emoji}>🔥🔥🔥</Text>
              <Text style={styles.label}>6 days</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  bigNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    width: 300,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    alignSelf: 'center',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  purple: {
    color: '#7C3AED',
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: 8,
  },
});

export default App;
