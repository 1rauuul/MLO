import { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle, type ViewInstance } from 'react-native';

import { PrimaryButton } from '@/shared/components/Buttons';
import { useRevealElement } from '@/shared/components/Screen';

interface ContinuationButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Increment after each check, including repeated checks of the same example. */
  revealSignal: number;
  style?: StyleProp<ViewStyle>;
}

export function ContinuationButton({ label, onPress, disabled, revealSignal, style }: ContinuationButtonProps) {
  const target = useRef<ViewInstance>(null);
  const previousSignal = useRef(0);
  const reveal = useRevealElement();

  useEffect(() => {
    if (revealSignal <= 0 || revealSignal === previousSignal.current) return;
    previousSignal.current = revealSignal;
    reveal(target);
  }, [revealSignal, reveal]);

  return (
    <View ref={target} collapsable={false} style={style}>
      <PrimaryButton label={label} onPress={onPress} disabled={disabled} />
    </View>
  );
}
