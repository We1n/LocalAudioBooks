/**
 * Экран поиска - поиск по книгам
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { formatTime } from '../../utils';
import type { Book } from '../../storage';

export function SearchScreen() {
  const { books, getBookProgress, openBook } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
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

  // Фильтрация книг по поисковому запросу
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    
    const query = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        (book.author && book.author.toLowerCase().includes(query))
    );
  }, [books, searchQuery]);

  // Вычисление процента прослушанного
  const getProgressPercent = (book: Book): number => {
    if (!book.duration) return 0;
    const position = bookProgresses.get(book.id) || 0;
    return Math.min(100, Math.round((position / book.duration) * 100));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Поиск
          </h1>
          <Input
            type="text"
            placeholder="Поиск по названию или автору..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>

        {searchQuery.trim() && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Книги не найдены
            </p>
          </div>
        )}

        {filteredBooks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map((book) => {
              const progressPercent = getProgressPercent(book);
              const position = bookProgresses.get(book.id) || 0;
              
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
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate flex-1">
                        {book.title}
                      </h3>
                      <span className="text-blue-600 dark:text-blue-400 ml-2" title="Нажмите для воспроизведения">
                        ▶️
                      </span>
                    </div>
                    {book.author && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
                        {book.author}
                      </p>
                    )}
                    {progressPercent > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span className="font-semibold">{progressPercent}%</span>
                          {book.duration && (
                            <span>
                              {formatTime(position)} / {formatTime(book.duration)}
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                          <div
                            className="h-3 rounded-full bg-blue-600 dark:bg-blue-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!searchQuery.trim() && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Введите запрос для поиска книг
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

