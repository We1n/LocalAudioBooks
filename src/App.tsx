import { useEffect } from 'react';
import { AppProvider, useApp } from './ui';
import { LibraryScreen } from './ui/screens/LibraryScreen';
import { PlayerScreen } from './ui/screens/PlayerScreen';
import { CarModeScreen } from './ui/screens/CarModeScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { saveProgress as savePlayerProgress } from './player';

function AppContent() {
  const { currentScreen, settings } = useApp();
  
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
  
  // Если включён Car Mode и открыт плеер, показываем Car Mode экран
  if (settings?.carModeEnabled && currentScreen === 'player') {
    return <CarModeScreen />;
  }
  
  switch (currentScreen) {
    case 'library':
      return <LibraryScreen />;
    case 'player':
      return <PlayerScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <LibraryScreen />;
  }
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

