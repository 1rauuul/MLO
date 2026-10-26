import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Red de seguridad de UI: evita que un error de render tumbe toda la app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error('[ui] render error', error, info.componentStack);
    }
  }

  private retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.message}>La pantalla no pudo mostrarse. Puedes intentarlo de nuevo.</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          onPress={this.retry}
          style={styles.button}>
          <Text style={styles.buttonLabel}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  message: { fontSize: 14, color: '#555', textAlign: 'center' },
  button: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  buttonLabel: { color: '#fff', fontWeight: '700' },
});
