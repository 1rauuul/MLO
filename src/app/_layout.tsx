import { SplashScreen, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateAndSeed } from '@/shared/services/db/database';
import { AppThemeProvider } from '@/shared/theme/ThemeProvider';
import { AuthProvider, useAuth } from '@/features/auth/viewmodel/useAuth';
import { LearnerProfileProvider } from '@/features/profile/viewmodel/useLearnerProfile';
import { SessionProvider } from '@/features/auth/viewmodel/useSession';

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
