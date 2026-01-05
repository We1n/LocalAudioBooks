/**
 * Экран настроек - управление настройками приложения
 */

import { useApp } from '../AppContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function SettingsScreen() {
  const { settings, updateSettings, setCurrentScreen, clearLibrary } = useApp();
  
  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Загрузка настроек...</p>
        </div>
      </div>
    );
  }
  
  const handleSkipIntervalChange = (interval: 15 | 30 | 60) => {
    updateSettings({ preferredSkipInterval: interval });
  };
  
  const handleSpeedChange = async (speed: number) => {
    await updateSettings({ playbackSpeed: speed });
  };
  
  const handleClearLibrary = async () => {
    if (!confirm('Вы уверены, что хотите очистить всю библиотеку? Это удалит все книги, прогресс прослушивания и выбранные папки. Настройки и статистика сохранятся.')) {
      return;
    }
    
    try {
      await clearLibrary();
      alert('Библиотека успешно очищена');
    } catch (error) {
      console.error('Ошибка очистки библиотеки:', error);
      alert(`Ошибка очистки библиотеки: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pb-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Настройки
          </h2>
          
          {/* Статистика */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Статистика
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Просмотр статистики прослушивания
            </p>
            <Button
              variant="primary"
              onClick={() => setCurrentScreen('statistics')}
            >
              📊 Открыть статистику
            </Button>
          </div>
          
          {/* Предпочтительный интервал перемотки */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Предпочтительный интервал перемотки
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Выберите интервал для быстрой перемотки (используется по умолчанию)
            </p>
            <div className="flex gap-2">
              {([15, 30, 60] as const).map((interval) => (
                <Button
                  key={interval}
                  variant={settings.preferredSkipInterval === interval ? 'primary' : 'secondary'}
                  onClick={() => handleSkipIntervalChange(interval)}
                >
                  {interval} сек
                </Button>
              ))}
            </div>
          </div>
          
          {/* Скорость воспроизведения по умолчанию */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Скорость воспроизведения по умолчанию
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Скорость, которая будет использоваться при загрузке новой книги
            </p>
            <div className="flex gap-2 flex-wrap">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((speed) => (
                <Button
                  key={speed}
                  variant={settings.playbackSpeed === speed ? 'primary' : 'secondary'}
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}×
                </Button>
              ))}
            </div>
          </div>
          
          {/* Очистка библиотеки */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Управление библиотекой
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Очистить всю библиотеку (книги, прогресс, папки). Настройки и статистика сохранятся.
            </p>
            <Button
              variant="secondary"
              onClick={handleClearLibrary}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              🗑️ Очистить библиотеку
            </Button>
          </div>
          
        </Card>
      </div>
    </div>
  );
}

