import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'evaluaciones/index',
};

export default function EvaluationsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
