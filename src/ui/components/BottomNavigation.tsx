/**
 * Компонент нижней навигации (Bottom Navigation Bar)
 */

import { useApp } from '../AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  screen: 'player' | 'library' | 'profile';
}

const navItems: NavItem[] = [
  { id: 'player', label: 'Плеер', icon: '▶', screen: 'player' },
  { id: 'library', label: 'Каталог', icon: '📚', screen: 'library' },
  { id: 'profile', label: 'Настройки', icon: '⚙️', screen: 'profile' },
];

export function BottomNavigation() {
  const { currentScreen, setCurrentScreen } = useApp();

  // Экраны settings и statistics должны подсвечивать таб profile
  // Экраны home и search не используются в навигации
  const getActiveScreen = (screen: string) => {
    if (screen === 'settings' || screen === 'statistics') {
      return 'profile';
    }
    if (screen === 'home' || screen === 'search') {
      return 'library'; // home и search ведут на библиотеку
    }
    return screen;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-800 border-t border-gray-700 dark:border-gray-600">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = getActiveScreen(currentScreen) === item.screen;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.screen)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200
                ${isActive 
                  ? 'text-orange-500 dark:text-orange-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-300 dark:hover:text-gray-400'
                }
                min-h-[44px] touch-manipulation
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

