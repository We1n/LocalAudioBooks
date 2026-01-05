/**
 * Экран главной страницы - отображение разделов "Слушаю" и "Мои книги"
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { Book } from '../../storage';

export function HomeScreen() {
  const { books, isLoadingBooks, addFolder, openBook, getBookProgress } = useApp();
  const [bookProgresses, setBookProgresses] = useState<Map<string, number>>(new Map());
  
  // Загрузка прогресса для всех книг
  React.useEffect(() => {
    const loadProgresses = async () => {
      const progresses = new Map<string, number>();
      const progressPromises = books.map(async (book) => {
        const progress = await getBookProgress(book.id);
        if (progress) {
          return { bookId: book.id, position: progress.position };
        }
        return null;
      });
      
      const results = await Promise.all(progressPromises);
      results.forEach((result) => {
        if (result) {
          progresses.set(result.bookId, result.position);
        }
      });
      
      setBookProgresses(progresses);
    };
    
    if (books.length > 0) {
      loadProgresses();
    }
  }, [books.length, getBookProgress]);

  // Получение книг, которые слушаются (с прогрессом > 0)
  const listeningBooks = useMemo(() => {
    return books.filter((book) => {
      const progress = bookProgresses.get(book.id);
      return progress !== undefined && progress > 0;
    }).slice(0, 5); // Показываем только первые 5
  }, [books, bookProgresses]);

  // Вычисление процента прослушанного
  const getProgressPercent = (book: Book): number => {
    if (!book.duration) return 0;
    const position = bookProgresses.get(book.id) || 0;
    return Math.min(100, Math.round((position / book.duration) * 100));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Мои книги
          </h1>
        </div>

        {/* Раздел "Слушаю" */}
        {listeningBooks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Слушаю
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {listeningBooks.length}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {listeningBooks.map((book) => {
                const progressPercent = getProgressPercent(book);
                
                return (
                  <Card
                    key={book.id}
                    onClick={() => openBook(book)}
                    className="min-w-[160px] max-w-[160px] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-4xl text-gray-400 dark:text-gray-500">
                          📚
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate mb-1">
                        {book.title}
                      </h3>
                      {progressPercent > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-orange-500 dark:bg-orange-400"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {progressPercent}%
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Раздел "Мои" (все книги) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Мои
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">📁</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {books.length}
            </span>
          </div>
        </div>

        {isLoadingBooks && books.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Сканирование папки...</p>
          </div>
        )}

        {!isLoadingBooks && books.length === 0 && (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Библиотека пуста
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Добавьте папку с аудиокнигами, чтобы начать прослушивание
            </p>
            <Button 
              onClick={addFolder}
              size="lg"
              className="text-xl px-8 py-4 min-h-[60px]"
            >
              + Добавить первую книгу
            </Button>
          </div>
        )}

        {books.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {books.map((book) => {
              const progressPercent = getProgressPercent(book);
              
              return (
                <Card
                  key={book.id}
                  onClick={() => openBook(book)}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl text-gray-400 dark:text-gray-500">
                        📚
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate mb-1">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                        {book.author}
                      </p>
                    )}
                    {progressPercent > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {progressPercent}%
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

