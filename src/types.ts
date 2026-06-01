export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO date-time string
  history: string[]; // Array of YYYY-MM-DD strings of days marked done
}
