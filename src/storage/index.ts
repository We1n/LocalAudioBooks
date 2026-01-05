/**
 * Модуль Storage - локальное хранение данных (прогресс, настройки, папки)
 * 
 * Использует IndexedDB для хранения данных в браузере.
 */

import { StorageError } from '../utils';

// Константы для работы с IndexedDB
const DB_NAME = 'LocalAudioBooks';
const DB_VERSION = 2; // Увеличена версия для добавления статистики

// Названия хранилищ (object stores)
const STORE_BOOKS = 'books';
const STORE_PROGRESS = 'progress';
const STORE_SETTINGS = 'settings';
const STORE_FOLDERS = 'folders';
const STORE_STATISTICS = 'statistics';

// Типы данных
export interface Book {
  id: string;
  title: string;
  author?: string;
  cover?: string;
  filePath: string;
  fileType: string;
  duration?: number;
  chapters?: Chapter[];
  addedAt: number;
}

export interface Chapter {
  title: string;
  startTime: number;
  endTime?: number;
}

export interface Progress {
  bookId: string;
  position: number; // позиция в секундах
  lastUpdated: number;
}

export interface Settings {
  preferredSkipInterval: 15 | 30 | 60;
  playbackSpeed: number;
}

export interface SelectedFolder {
  handle: FileSystemDirectoryHandle;
  path: string;
  name: string;
}

export interface DailyStats {
  date: string; // Primary Key "YYYY-MM-DD"
  totalSeconds: number;
  booksListened: string[]; // Массив ID книг, которые слушали в этот день
}

// Настройки по умолчанию
const DEFAULT_SETTINGS: Settings = {
  preferredSkipInterval: 30,
  playbackSpeed: 1.0,
};

// Обёртка для работы с IndexedDB
class Database {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Инициализирует базу данных
   */
  private async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(new StorageError(`Не удалось открыть базу данных: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Создаём хранилище для книг
        if (!db.objectStoreNames.contains(STORE_BOOKS)) {
          const booksStore = db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
          booksStore.createIndex('filePath', 'filePath', { unique: true });
        }

        // Создаём хранилище для прогресса
        if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
          const progressStore = db.createObjectStore(STORE_PROGRESS, { keyPath: 'bookId' });
          progressStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Создаём хранилище для настроек
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }

        // Создаём хранилище для папок
        if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
          db.createObjectStore(STORE_FOLDERS, { keyPath: 'path' });
        }

        // Создаём хранилище для статистики
        if (!db.objectStoreNames.contains(STORE_STATISTICS)) {
          const statsStore = db.createObjectStore(STORE_STATISTICS, { keyPath: 'date' });
          statsStore.createIndex('date', 'date', { unique: true });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Получает базу данных (инициализирует при необходимости)
   */
  async getDB(): Promise<IDBDatabase> {
    return this.init();
  }

  /**
   * Закрывает соединение с базой данных
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }
}

// Единый экземпляр базы данных
const database = new Database();

// ==================== API для работы с книгами ====================

/**
 * Сохраняет книгу в базу данных
 */
export async function saveBook(book: Book): Promise<void> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_BOOKS], 'readwrite');
    const store = transaction.objectStore(STORE_BOOKS);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(book);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(`Не удалось сохранить книгу: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при сохранении книги: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Загружает книгу по ID
 */
export async function loadBook(bookId: string): Promise<Book | null> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_BOOKS], 'readonly');
    const store = transaction.objectStore(STORE_BOOKS);
    
    return new Promise<Book | null>((resolve, reject) => {
      const request = store.get(bookId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new StorageError(`Не удалось загрузить книгу: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при загрузке книги: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Загружает все книги
 */
export async function loadAllBooks(): Promise<Book[]> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_BOOKS], 'readonly');
    const store = transaction.objectStore(STORE_BOOKS);
    
    return new Promise<Book[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new StorageError(`Не удалось загрузить книги: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при загрузке книг: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Удаляет книгу по ID
 */
export async function removeBook(bookId: string): Promise<void> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_BOOKS], 'readwrite');
    const store = transaction.objectStore(STORE_BOOKS);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(bookId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(`Не удалось удалить книгу: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при удалении книги: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

// ==================== API для работы с прогрессом ====================

/**
 * Сохраняет прогресс прослушивания книги
 */
export async function saveProgress(bookId: string, position: number): Promise<void> {
  try {
    if (position < 0) {
      throw new StorageError('Позиция не может быть отрицательной');
    }

    const db = await database.getDB();
    const transaction = db.transaction([STORE_PROGRESS], 'readwrite');
    const store = transaction.objectStore(STORE_PROGRESS);
    
    const progress: Progress = {
      bookId,
      position,
      lastUpdated: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(`Не удалось сохранить прогресс: ${request.error?.message}`));
    });
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(`Ошибка при сохранении прогресса: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Загружает прогресс прослушивания книги
 */
export async function loadProgress(bookId: string): Promise<number | null> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_PROGRESS], 'readonly');
    const store = transaction.objectStore(STORE_PROGRESS);
    
    return new Promise<number | null>((resolve, reject) => {
      const request = store.get(bookId);
      request.onsuccess = () => {
        const progress = request.result as Progress | undefined;
        resolve(progress?.position ?? null);
      };
      request.onerror = () => reject(new StorageError(`Не удалось загрузить прогресс: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при загрузке прогресса: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Удаляет прогресс книги
 */
export async function removeProgress(bookId: string): Promise<void> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_PROGRESS], 'readwrite');
    const store = transaction.objectStore(STORE_PROGRESS);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(bookId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(`Не удалось удалить прогресс: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при удалении прогресса: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

// ==================== API для работы с настройками ====================

/**
 * Сохраняет настройки
 */
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    // Загружаем текущие настройки (до создания транзакции)
    const currentSettings = await loadSettings();
    
    // Объединяем с новыми настройками
    const mergedSettings: Settings = {
      ...currentSettings,
      ...settings,
    };
    
    // Теперь создаём транзакцию для сохранения
    const db = await database.getDB();
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    
    // Сохраняем каждую настройку отдельно
    const settingsToSave = [
      { key: 'preferredSkipInterval', value: mergedSettings.preferredSkipInterval },
      { key: 'playbackSpeed', value: mergedSettings.playbackSpeed },
    ];
    
    await Promise.all(
      settingsToSave.map(
        (item) =>
          new Promise<void>((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new StorageError(`Не удалось сохранить настройку ${item.key}: ${request.error?.message}`));
          })
      )
    );
  } catch (error) {
    throw new StorageError(`Ошибка при сохранении настроек: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Загружает настройки
 */
export async function loadSettings(): Promise<Settings> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    
    return new Promise<Settings>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result as Array<{ key: string; value: any }>;
        
        if (items.length === 0) {
          // Если настроек нет, возвращаем значения по умолчанию
          resolve({ ...DEFAULT_SETTINGS });
          return;
        }
        
        // Преобразуем массив в объект настроек
        // Игнорируем устаревшие поля (например, carModeEnabled)
        const settings: Settings = {
          preferredSkipInterval: items.find((item) => item.key === 'preferredSkipInterval')?.value ?? DEFAULT_SETTINGS.preferredSkipInterval,
          playbackSpeed: items.find((item) => item.key === 'playbackSpeed')?.value ?? DEFAULT_SETTINGS.playbackSpeed,
        };
        
        resolve(settings);
      };
      request.onerror = () => reject(new StorageError(`Не удалось загрузить настройки: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при загрузке настроек: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

// ==================== API для работы с папками ====================

/**
 * Сохраняет выбранные папки
 * 
 * Примечание: FileSystemDirectoryHandle не может быть напрямую сохранён в IndexedDB,
 * поэтому сохраняем только метаданные (path, name). Handle нужно будет запрашивать заново.
 */
export async function saveSelectedFolders(folders: Omit<SelectedFolder, 'handle'>[]): Promise<void> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_FOLDERS], 'readwrite');
    const store = transaction.objectStore(STORE_FOLDERS);
    
    // Очищаем старые папки
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(`Не удалось очистить папки: ${request.error?.message}`));
    });
    
    // Сохраняем новые папки
    await Promise.all(
      folders.map(
        (folder) =>
          new Promise<void>((resolve, reject) => {
            const request = store.put(folder);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new StorageError(`Не удалось сохранить папку: ${request.error?.message}`));
          })
      )
    );
  } catch (error) {
    throw new StorageError(`Ошибка при сохранении папок: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Загружает выбранные папки
 * 
 * Примечание: FileSystemDirectoryHandle не сохраняется, поэтому возвращаем только метаданные.
 * Handle нужно будет запрашивать заново через File System Access API.
 */
export async function loadSelectedFolders(): Promise<Omit<SelectedFolder, 'handle'>[]> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_FOLDERS], 'readonly');
    const store = transaction.objectStore(STORE_FOLDERS);
    
    return new Promise<Omit<SelectedFolder, 'handle'>[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const folders = request.result as Omit<SelectedFolder, 'handle'>[];
        resolve(folders || []);
      };
      request.onerror = () => reject(new StorageError(`Не удалось загрузить папки: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при загрузке папок: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

// ==================== API для работы со статистикой ====================

/**
 * Сохраняет статистику за день
 * Добавляет время к текущему дню и обновляет список книг
 */
export async function saveDailyStats(seconds: number, bookId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const db = await database.getDB();
    const transaction = db.transaction([STORE_STATISTICS], 'readwrite');
    const store = transaction.objectStore(STORE_STATISTICS);
    
    // Получаем текущую статистику за день
    const existingStats = await new Promise<DailyStats | null>((resolve, reject) => {
      const request = store.get(today);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new StorageError(`Не удалось загрузить статистику: ${request.error?.message}`));
    });
    
    // Обновляем или создаём статистику
    const stats: DailyStats = existingStats
      ? {
          date: today,
          totalSeconds: existingStats.totalSeconds + seconds,
          booksListened: existingStats.booksListened.includes(bookId)
            ? existingStats.booksListened
            : [...existingStats.booksListened, bookId],
        }
      : {
          date: today,
          totalSeconds: seconds,
          booksListened: [bookId],
        };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(stats);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new StorageError(`Не удалось сохранить статистику: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при сохранении статистики: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Получает статистику за год
 */
export async function getYearlyStats(year: number): Promise<{ totalSeconds: number; booksCount: number }> {
  try {
    const db = await database.getDB();
    const transaction = db.transaction([STORE_STATISTICS], 'readonly');
    const store = transaction.objectStore(STORE_STATISTICS);
    
    return new Promise<{ totalSeconds: number; booksCount: number }>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allStats = request.result as DailyStats[];
        
        // Фильтруем по году
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        const yearStats = allStats.filter(
          (stat) => stat.date >= yearStart && stat.date <= yearEnd
        );
        
        // Агрегируем данные
        const totalSeconds = yearStats.reduce((sum, stat) => sum + stat.totalSeconds, 0);
        const uniqueBooks = new Set<string>();
        yearStats.forEach((stat) => {
          stat.booksListened.forEach((bookId) => uniqueBooks.add(bookId));
        });
        
        resolve({
          totalSeconds,
          booksCount: uniqueBooks.size,
        });
      };
      request.onerror = () => reject(new StorageError(`Не удалось загрузить статистику: ${request.error?.message}`));
    });
  } catch (error) {
    throw new StorageError(`Ошибка при загрузке статистики: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Очищает библиотеку (книги, прогресс, папки), но сохраняет настройки и статистику
 */
export async function clearLibrary(): Promise<void> {
  try {
    const db = await database.getDB();
    const stores = [STORE_BOOKS, STORE_PROGRESS, STORE_FOLDERS];
    
    await Promise.all(
      stores.map(
        (storeName) =>
          new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new StorageError(`Не удалось очистить ${storeName}: ${request.error?.message}`));
          })
      )
    );
  } catch (error) {
    throw new StorageError(`Ошибка при очистке библиотеки: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}

/**
 * Очищает все данные из базы данных (для тестирования)
 */
export async function clearAll(): Promise<void> {
  try {
    const db = await database.getDB();
    const stores = [STORE_BOOKS, STORE_PROGRESS, STORE_SETTINGS, STORE_FOLDERS, STORE_STATISTICS];
    
    await Promise.all(
      stores.map(
        (storeName) =>
          new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new StorageError(`Не удалось очистить ${storeName}: ${request.error?.message}`));
          })
      )
    );
  } catch (error) {
    throw new StorageError(`Ошибка при очистке данных: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
  }
}
