import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { Habit } from '../types';

const STORAGE_KEY = '@habits_data';

export default function AddHabitScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a habit name');
      return;
    }

    try {
      // Load current habits
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const habits: Habit[] = stored ? JSON.parse(stored) : [];

      // Check for duplicate names (case-insensitive)
      if (habits.some(h => h.name.toLowerCase() === trimmedName.toLowerCase())) {
        setError('A habit with this name already exists');
        return;
      }

      // Create new habit
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: trimmedName,
        createdAt: new Date().toISOString(),
        history: [], // empty list initially
      };

      // Save habits
      const updatedHabits = [...habits, newHabit];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHabits));

      // Navigate back
      router.back();
    } catch (e) {
      console.error('Failed to save habit', e);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            <Text style={styles.headerTitle}>New Habit</Text>
            <View style={{ width: 40 }} /> {/* Spacer */}
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>What habit do you want to build?</Text>
            
            <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Drink 3L Water, Read 10 pages..."
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError('');
                }}
                maxLength={40}
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.tipText}>
              Tip: Keep it small and actionable. E.g. "Read 10 pages" is easier to start than "Read a book".
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Plus color="#fff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate 900
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
    backgroundColor: '#1e293b', // Slate 800
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155', // Slate 700
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    marginTop: 40,
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  input: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  tipText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1', // Indigo 500
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
