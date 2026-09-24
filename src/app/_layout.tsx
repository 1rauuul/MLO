import { SplashScreen, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateAndSeed } from '@/data/db';
import { AppThemeProvider } from '@/theme/theme-provider';
import { AuthProvider, useAuth } from '@/viewmodels/useAuth';
import { LearnerProfileProvider } from '@/viewmodels/useLearnerProfile';
import { SessionProvider } from '@/viewmodels/useSession';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateAndSeed}>
          <AuthProvider>
            <SessionProvider>
              <LearnerProfileProvider>
                <AppThemeProvider>
                  <StatusBar style="auto" />
                  <RootNavigator />
                </AppThemeProvider>
              </LearnerProfileProvider>
            </SessionProvider>
          </AuthProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { account, isLoading } = useAuth();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!account}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!account}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
