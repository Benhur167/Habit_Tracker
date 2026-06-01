import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flame, Plus, Calendar, Trash2, Award, CheckCircle } from 'lucide-react-native';
import { Habit } from '../types';
import { calculateStreak, getLocalDateString } from '../utils/streak';

const STORAGE_KEY = '@habits_data';

export default function HabitListScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayStr, setTodayStr] = useState('');

  // Load habits whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setTodayStr(getLocalDateString());
      loadHabits();
    }, [])
  );

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHabits(JSON.parse(stored));
      } else {
        // Seed default habits for demonstration on first load
        const defaultHabits: Habit[] = [
          {
            id: '1',
            name: 'Drink 3L Water',
            createdAt: new Date().toISOString(),
            history: [
              getLocalDateString(new Date(Date.now() - 86400000 * 3)), // 3 days ago
              getLocalDateString(new Date(Date.now() - 86400000 * 2)), // 2 days ago
              getLocalDateString(new Date(Date.now() - 86400000)),     // yesterday
            ],
          },
          {
            id: '2',
            name: 'Read 10 Pages',
            createdAt: new Date().toISOString(),
            history: [
              getLocalDateString(new Date(Date.now() - 86400000 * 2)), // 2 days ago
              getLocalDateString(new Date(Date.now() - 86400000)),     // yesterday
            ],
          },
          {
            id: '3',
            name: 'Exercise 30 mins',
            createdAt: new Date().toISOString(),
            history: [],
          },
        ];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHabits));
        setHabits(defaultHabits);
      }
    } catch (e) {
      console.error('Failed to load habits', e);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      const updated = habits.map((habit) => {
        if (habit.id === habitId) {
          const hasDoneToday = habit.history.includes(todayStr);
          let newHistory;
          if (hasDoneToday) {
            newHistory = habit.history.filter((date) => date !== todayStr);
          } else {
            newHistory = [...habit.history, todayStr];
          }
          return { ...habit, history: newHistory };
        }
        return habit;
      });

      setHabits(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to toggle habit', e);
    }
  };

  const handleDeleteHabit = (habitId: string, name: string) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = habits.filter((h) => h.id !== habitId);
              setHabits(updated);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
              console.error('Failed to delete habit', e);
            }
          },
        },
      ]
    );
  };

  // Calculate overall progress for today
  const completedTodayCount = habits.filter((h) => h.history.includes(todayStr)).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? completedTodayCount / totalCount : 0;

  const getMotivationalMessage = () => {
    if (totalCount === 0) return 'Add a habit below to get started!';
    if (progressPercent === 0) return 'Start today strong! Check off your first habit.';
    if (progressPercent === 1) return 'Incredible! You completed all habits for today! 🎉';
    if (progressPercent >= 0.5) return 'More than halfway there! Keep it up!';
    return 'Good start! Keep ticking them off.';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Welcome back,</Text>
            <Text style={styles.headerTitle}>Maruthi Benhur</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Award color="#6366f1" size={24} />
          </View>
        </View>

        {/* Progress Card */}
        {totalCount > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressSub}>
                  {completedTodayCount} of {totalCount} completed
                </Text>
              </View>
              <Text style={styles.progressPercent}>{Math.round(progressPercent * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
            </View>
            <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
          </View>
        )}

        {/* Habits Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle color="#334155" size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyDesc}>
              Track your routines and build your streak by adding your first daily habit.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add')}
              activeOpacity={0.8}
            >
              <Plus color="#ffffff" size={20} style={{ marginRight: 6 }} />
              <Text style={styles.emptyButtonText}>Add First Habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isDone = item.history.includes(todayStr);
              const streak = calculateStreak(item.history, todayStr);
              
              return (
                <HabitRow
                  habit={item}
                  isDone={isDone}
                  streak={streak}
                  onToggle={() => handleToggleHabit(item.id)}
                  onDelete={() => handleDeleteHabit(item.id, item.name)}
                  onViewHistory={() => router.push(`/history?id=${item.id}`)}
                />
              );
            }}
          />
        )}

        {/* Floating Action Button */}
        {habits.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/add')}
            activeOpacity={0.85}
          >
            <Plus color="#ffffff" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Separate component for row to handle independent animation values
interface HabitRowProps {
  habit: Habit;
  isDone: boolean;
  streak: number;
  onToggle: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
}

function HabitRow({ habit, isDone, streak, onToggle, onDelete, onViewHistory }: HabitRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Elegant checkmark spring animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  return (
    <View style={styles.habitCard}>
      {/* Checkbox Trigger Area */}
      <TouchableOpacity
        onPress={handlePress}
        style={styles.checkboxArea}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.checkbox,
            isDone && styles.checkboxChecked,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {isDone && <CheckCircle color="#ffffff" size={20} fill="#ffffff" />}
        </Animated.View>
        <Text style={[styles.habitName, isDone && styles.habitNameDone]}>
          {habit.name}
        </Text>
      </TouchableOpacity>

      {/* Right-side Action Badges */}
      <View style={styles.actionsContainer}>
        {/* Streak Indicator */}
        <View style={styles.streakBadge}>
          <Flame color={streak > 0 ? '#f59e0b' : '#64748b'} size={16} fill={streak > 0 ? '#f59e0b' : 'transparent'} />
          <Text style={[styles.streakText, streak > 0 && styles.streakTextActive]}>
            {streak}
          </Text>
        </View>

        {/* History Details Button */}
        <TouchableOpacity
          onPress={onViewHistory}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Calendar color="#94a3b8" size={18} />
        </TouchableOpacity>

        {/* Delete Habit Button */}
        <TouchableOpacity
          onPress={onDelete}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Trash2 color="#ef4444" size={18} />
        </TouchableOpacity>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressCard: {
    backgroundColor: '#1e293b', // Slate 800
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  progressSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1', // Indigo 500
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  motivationalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  listContainer: {
    paddingBottom: 100,
    gap: 12,
  },
  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkboxArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#10b981', // Emerald 500
    backgroundColor: '#10b981',
    borderWidth: 0,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  habitNameDone: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  streakTextActive: {
    color: '#f59e0b', // Amber 500
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
