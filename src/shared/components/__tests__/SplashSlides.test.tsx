import { act, render, screen } from '@testing-library/react-native';

import { SplashSlides } from '@/shared/components/SplashSlides';

describe('SplashSlides', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rota los logos y vuelve al primero', () => {
    render(<SplashSlides />);

    expect(screen.getByTestId('splash-slide-0')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1500));
    expect(screen.getByTestId('splash-slide-1')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1500));
    expect(screen.getByTestId('splash-slide-2')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1500));
    expect(screen.getByTestId('splash-slide-0')).toBeTruthy();
  });
});
