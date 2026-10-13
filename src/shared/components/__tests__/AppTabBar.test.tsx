import { fireEvent, render } from '@testing-library/react-native';

import type { LocationSection } from '@/shared/model/entities';

import { AppTabBar } from '@/shared/components/AppTabBar';

const mockNavigate = jest.fn();
let mockPathname = '/';
let mockLocation: {
  unitId: string | null;
  lessonId: string | null;
  lessonCode: string | null;
  section: LocationSection | null;
} = { unitId: 'u1', lessonId: 'lesson-2', lessonCode: '2.1', section: 'lesson' };

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ navigate: mockNavigate }),
}));
jest.mock('@/shared/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: { surface: '#fff', line: '#ddd', primary: '#00f', muted: '#777', text: '#111' },
    fonts: { mono: 'monospace' },
    scale: 1,
  }),
}));
jest.mock('@/features/auth/viewmodel/useSession', () => ({
  useSession: () => ({
    location: mockLocation,
    resumeHref: null,
    record: jest.fn(),
    clear: jest.fn(),
  }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockPathname = '/';
  mockLocation = { unitId: 'u1', lessonId: 'lesson-2', lessonCode: '2.1', section: 'lesson' };
});

it('keeps the Módulos, Evaluaciones and Perfil bar outside subtopics', () => {
  const onNavigateTab = jest.fn();
  const { getByRole, queryByRole } = render(
    <AppTabBar routeName="(modules)" onNavigateTab={onNavigateTab} bottomInset={0} />,
  );

  expect(getByRole('tab', { name: 'Módulos' })).toBeTruthy();
  expect(getByRole('tab', { name: 'Perfil' })).toBeTruthy();
  expect(queryByRole('tab', { name: 'Inicio' })).toBeNull();

  fireEvent.press(getByRole('tab', { name: 'Perfil' }));
  expect(onNavigateTab).toHaveBeenCalledWith('profile');
});

it('renders Inicio and Tema inside a subtopic with working targets', () => {
  mockPathname = '/lecciones/lesson-2';
  const { getByRole, queryByRole } = render(
    <AppTabBar routeName="(modules)" onNavigateTab={jest.fn()} bottomInset={0} />,
  );

  expect(queryByRole('tab', { name: 'Módulos' })).toBeNull();

  fireEvent.press(getByRole('tab', { name: 'Inicio' }));
  expect(mockNavigate).toHaveBeenCalledWith('/');

  fireEvent.press(getByRole('tab', { name: 'Tema' }));
  expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/tema/[id]', params: { id: 'lesson-2' } });
});

it('marks Tema active while on the topic hub', () => {
  mockPathname = '/tema/lesson-2';
  const { getByRole } = render(
    <AppTabBar routeName="(modules)" onNavigateTab={jest.fn()} bottomInset={0} />,
  );

  expect(getByRole('tab', { name: 'Tema' }).props.accessibilityState).toEqual({ selected: true });
});
