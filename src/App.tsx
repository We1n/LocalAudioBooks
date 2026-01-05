import { useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp, OfflineIndicator, BottomNavigation } from './ui';
import { saveProgress as savePlayerProgress } from './player';

// Ленивая загрузка экранов для оптимизации производительности
const LibraryScreen = lazy(() => import('./ui/screens/LibraryScreen').then(m => ({ default: m.LibraryScreen })));
const PlayerScreen = lazy(() => import('./ui/screens/PlayerScreen').then(m => ({ default: m.PlayerScreen })));
const SettingsScreen = lazy(() => import('./ui/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const StatisticsScreen = lazy(() => import('./ui/screens/StatisticsScreen').then(m => ({ default: m.StatisticsScreen })));

function AppContent() {
  const { currentScreen } = useApp();
  
  // Сохранение прогресса при закрытии приложения
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Сохраняем прогресс при закрытии (синхронно, так как async не работает в beforeunload)
      // Используем sendBeacon или navigator.sendBeacon для асинхронного сохранения
      savePlayerProgress().catch((error) => {
        console.error('Ошибка при сохранении прогресса при закрытии:', error);
      });
    };
    
    const handleVisibilityChange = () => {
      // Сохраняем прогресс при скрытии вкладки/окна
      if (document.visibilityState === 'hidden') {
        savePlayerProgress().catch((error) => {
          console.error('Ошибка при сохранении прогресса при скрытии:', error);
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-16">
        <Suspense fallback={<LoadingScreen />}>
          {currentScreen === 'library' && <LibraryScreen />}
          {currentScreen === 'player' && <PlayerScreen />}
          {currentScreen === 'profile' && <SettingsScreen />}
          {currentScreen === 'settings' && <SettingsScreen />}
          {currentScreen === 'statistics' && <StatisticsScreen />}
          {/* home и search перенаправляются на library */}
          {(currentScreen === 'home' || currentScreen === 'search') && <LibraryScreen />}
        </Suspense>
      </div>
      <BottomNavigation />
    </div>
  );
}

// Компонент загрузки
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <OfflineIndicator />
      <AppContent />
    </AppProvider>
  );
}

export default App;

