import { AppProvider, useApp } from './ui';
import { LibraryScreen } from './ui/screens/LibraryScreen';
import { PlayerScreen } from './ui/screens/PlayerScreen';
import { CarModeScreen } from './ui/screens/CarModeScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';

function AppContent() {
  const { currentScreen, settings } = useApp();
  
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

