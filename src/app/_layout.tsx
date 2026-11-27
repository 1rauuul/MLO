import { useEffect, useRef, useState } from 'react';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  FiraCode_400Regular,
  FiraCode_500Medium,
  FiraCode_600SemiBold,
  FiraCode_700Bold,
} from '@expo-google-fonts/fira-code';
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ContentUpdateNotice } from '@/shared/components/ContentUpdateNotice';
import { SplashSlides } from '@/shared/components/SplashSlides';
import { DATABASE_NAME, migrateAndSeed } from '@/shared/services/db/database';
import { ContentSyncProvider } from '@/shared/services/content/ContentSyncProvider';
import { DataProvider } from '@/shared/services/data/DataProvider';
import { AppThemeProvider } from '@/shared/theme/ThemeProvider';
import { AuthProvider, useAuth } from '@/features/auth/viewmodel/useAuth';
import { ClassesProvider } from '@/features/classes/viewmodel/useClasses';
import { LearnerProfileProvider } from '@/features/profile/viewmodel/useLearnerProfile';
import { ProgressSyncProvider } from '@/features/profile/viewmodel/useProgressSync';
import { SessionProvider } from '@/features/auth/viewmodel/useSession';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts([
    {
      fontFamily: 'SourceSans3',
      fontDefinitions: [
        { path: SourceSans3_400Regular, weight: 400 },
        { path: SourceSans3_500Medium, weight: 500 },
        { path: SourceSans3_600SemiBold, weight: 600 },
        { path: SourceSans3_700Bold, weight: 700 },
      ],
    },
    {
      fontFamily: 'FiraCode',
      fontDefinitions: [
        { path: FiraCode_400Regular, weight: 400 },
        { path: FiraCode_500Medium, weight: 500 },
        { path: FiraCode_600SemiBold, weight: 600 },
        { path: FiraCode_700Bold, weight: 700 },
      ],
    },
  ]);

  // El splash nativo se retira cuando las fuentes están listas (o fallan).
  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateAndSeed}>
          <DataProvider>
            <ContentSyncProvider>
              <AuthProvider>
                <ProgressSyncProvider>
                  <ClassesProvider>
                    <SessionProvider>
                      <LearnerProfileProvider>
                        <AppThemeProvider>
                          <StatusBar style="auto" />
                          <ErrorBoundary onError={() => setReady(true)}>
                            <RootNavigator onReady={() => setReady(true)} />
                          </ErrorBoundary>
                          <ContentUpdateNotice />
                        </AppThemeProvider>
                      </LearnerProfileProvider>
                    </SessionProvider>
                  </ClassesProvider>
                </ProgressSyncProvider>
              </AuthProvider>
            </ContentSyncProvider>
          </DataProvider>
        </SQLiteProvider>
        {!ready && <SplashSlides />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ onReady }: { onReady: () => void }) {
  const { account, isLoading, needsRemoteLink } = useAuth();
  const router = useRouter();
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      onReady();
    }
  }, [isLoading, onReady]);

  useEffect(() => {
    if (!isLoading && account && needsRemoteLink && !promptedRef.current) {
      promptedRef.current = true;
      router.push('/vincular-cuenta' as never);
    }
  }, [account, isLoading, needsRemoteLink, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!account}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!account}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}
