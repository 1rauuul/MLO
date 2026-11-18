import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SLIDES: ImageSourcePropType[] = [
  require('../../../assets/images/logocinves.png'),
  require('../../../assets/images/logocinves_zacatenco.png'),
  require('../../../assets/images/logocinves_computacion_bco.png'),
];

const SLIDE_MS = 1400;
const FADE_MS = 260;

/** Portada de arranque: los logos se turnan mientras la app carga. */
export function SplashSlides() {
  const [index, setIndex] = useState(0);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [index, opacity]);

  return (
    <View style={styles.overlay} testID="splash-slides">
      <StatusBar style="light" />
      <Animated.Image
        testID={`splash-slide-${index}`}
        source={SLIDES[index]}
        resizeMode="contain"
        style={[styles.logo, { opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    // Mismo color que el splash nativo en app.json para que el cambio no se note.
    backgroundColor: '#0D4B75',
  },
  logo: { width: '74%', height: 120 },
});
