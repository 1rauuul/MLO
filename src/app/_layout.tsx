import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateAndSeed } from '@/data/db';
import { AppThemeProvider } from '@/theme/theme-provider';
import { LearnerProfileProvider } from '@/viewmodels/useLearnerProfile';
import { SessionProvider } from '@/viewmodels/useSession';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateAndSeed}>
          <LearnerProfileProvider>
            <SessionProvider>
              <AppThemeProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }} />
              </AppThemeProvider>
            </SessionProvider>
          </LearnerProfileProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
