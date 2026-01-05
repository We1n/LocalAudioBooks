/**
 * Экран статистики - отображение статистики прослушивания
 */

import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { getYearlyStats } from '../../storage';
import { formatTime } from '../../utils';

export function StatisticsScreen() {
  const { setCurrentScreen } = useApp();
  const [yearlyStats, setYearlyStats] = useState<{ totalSeconds: number; booksCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const stats = await getYearlyStats(selectedYear);
        setYearlyStats(stats);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [selectedYear]);
  
  const formatHours = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentScreen('library')}
          >
            ← Назад
          </Button>
        </div>
        
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Статистика прослушивания
          </h2>
          
          {/* Выбор года */}
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Год
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Загрузка статистики...</p>
            </div>
          ) : yearlyStats ? (
            <>
              {/* Всего прослушано за год */}
              <div className="text-center py-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Всего прослушано за {selectedYear} год</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {formatHours(yearlyStats.totalSeconds)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {formatTime(yearlyStats.totalSeconds)}
                </p>
              </div>
              
              {/* Количество книг */}
              <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Книг прослушано</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {yearlyStats.booksCount}
                </p>
              </div>
              
              {yearlyStats.totalSeconds === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    За {selectedYear} год статистика отсутствует
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Не удалось загрузить статистику
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

