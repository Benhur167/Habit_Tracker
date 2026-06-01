import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Flame, Award, Calendar, Check, X } from 'lucide-react-native';
import { Habit } from '../types';
import { calculateStreak, calculateMaxStreak, getRecent7Days, getLocalDateString } from '../utils/streak';

const STORAGE_KEY = '@habits_data';

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const habitId = params.id as string;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    loadHabitDetails();
  }, [habitId]);

  const loadHabitDetails = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const habits: Habit[] = JSON.parse(stored);
        const found = habits.find((h) => h.id === habitId);
        if (found) {
          setHabit(found);
          const todayStr = getLocalDateString();
          setCurrentStreak(calculateStreak(found.history, todayStr));
          setMaxStreak(calculateMaxStreak(found.history));
        }
      }
    } catch (e) {
      console.error('Failed to load habit details', e);
    }
  };

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading history...</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorBackButton}>
            <Text style={styles.errorBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const todayStr = getLocalDateString();
  const recentDays = getRecent7Days(todayStr);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={{ width: 40 }} /> {/* Spacer */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Streak Banner */}
          <View style={styles.streakBanner}>
            <View style={styles.streakIconWrapper}>
              <Flame color="#f59e0b" size={40} fill="#f59e0b" />
            </View>
            <Text style={styles.streakValue}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>

          {/* 7-Day History Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Last 7 Days</Text>
            <View style={styles.historyGrid}>
              {recentDays.map((day) => {
                const isCompleted = habit.history.includes(day.dateStr);
                const isToday = day.dateStr === todayStr;

                return (
                  <View key={day.dateStr} style={styles.dayCol}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                    
                    <View
                      style={[
                        styles.statusCircle,
                        isCompleted && styles.circleCompleted,
                        !isCompleted && isToday && styles.circleTodayPending,
                        !isCompleted && !isToday && styles.circleMissed,
                      ]}
                    >
                      {isCompleted ? (
                        <Check color="#ffffff" size={16} strokeWidth={3} />
                      ) : isToday ? (
                        <Text style={styles.pendingDot}>•</Text>
                      ) : (
                        <X color="#64748b" size={14} strokeWidth={2.5} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Statistics Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Lifetime Stats</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Calendar color="#10b981" size={22} />
                </View>
                <Text style={styles.statNumber}>{habit.history.length}</Text>
                <Text style={styles.statLabel}>Total Completions</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Award color="#f59e0b" size={22} />
                </View>
                <Text style={styles.statNumber}>{maxStreak}</Text>
                <Text style={styles.statLabel}>Longest Streak</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate 900
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  errorBackButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorBackButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  streakBanner: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingVertical: 24,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  streakIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
  },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: '#10b981', // Emerald 500
  },
  circleTodayPending: {
    borderWidth: 2,
    borderColor: '#6366f1', // Indigo 500
    borderStyle: 'dashed',
  },
  circleMissed: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  pendingDot: {
    color: '#6366f1',
    fontSize: 20,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
});
