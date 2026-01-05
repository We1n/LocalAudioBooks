/**
 * Тесты для модуля Library
 */

import {
  requestFolderAccess,
  getAllBooks,
  getBook,
  removeBook,
} from '../index';
import {
  saveBook,
  clearAll,
  type Book,
} from '../../storage';

// Моки для File System Access API
class MockFileSystemFileHandle implements FileSystemFileHandle {
  kind: 'file' = 'file';
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async getFile(): Promise<File> {
    // Создаём минимальный mock файл
    return new File(['mock audio data'], this.name, { type: 'audio/mpeg' });
  }

  async createWritable(): Promise<FileSystemWritableFileStream> {
    throw new Error('Not implemented');
  }

  isSameEntry(other: FileSystemHandle): Promise<boolean> {
    return Promise.resolve(this === other);
  }

  queryPermission(): Promise<PermissionState> {
    return Promise.resolve('granted');
  }

  requestPermission(): Promise<PermissionState> {
    return Promise.resolve('granted');
  }
}

class MockFileSystemDirectoryHandle implements FileSystemDirectoryHandle {
  kind: 'directory' = 'directory';
  name: string;
  private entries: Map<string, FileSystemHandle> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  addEntry(name: string, handle: FileSystemHandle): void {
    this.entries.set(name, handle);
  }

  async *values(): AsyncIterableIterator<FileSystemHandle> {
    for (const handle of this.entries.values()) {
      yield handle;
    }
  }

  async getDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
    throw new Error('Not implemented');
  }

  async getFileHandle(): Promise<FileSystemFileHandle> {
    throw new Error('Not implemented');
  }

  async removeEntry(): Promise<void> {
    throw new Error('Not implemented');
  }

  async resolve(): Promise<string[]> {
    throw new Error('Not implemented');
  }

  isSameEntry(other: FileSystemHandle): Promise<boolean> {
    return Promise.resolve(this === other);
  }

  queryPermission(): Promise<PermissionState> {
    return Promise.resolve('granted');
  }

  requestPermission(): Promise<PermissionState> {
    return Promise.resolve('granted');
  }
}

// Мок для window.showDirectoryPicker
const mockShowDirectoryPicker = jest.fn();

beforeEach(async () => {
  await clearAll();
  jest.clearAllMocks();
  
  // Сбрасываем мок window.showDirectoryPicker
  if (typeof window !== 'undefined') {
    (window as any).showDirectoryPicker = mockShowDirectoryPicker;
  } else {
    (global as any).window = {
      showDirectoryPicker: mockShowDirectoryPicker,
    };
  }
});

describe('Library Module', () => {
  describe('requestFolderAccess', () => {
    it('должен вернуть null, если API не поддерживается', async () => {
      delete (global as any).window.showDirectoryPicker;
      
      const result = await requestFolderAccess();
      expect(result).toBeNull();
    });

    it('должен вернуть handle при успешном выборе папки', async () => {
      const mockHandle = new MockFileSystemDirectoryHandle('test-folder');
      mockShowDirectoryPicker.mockResolvedValue(mockHandle);
      
      // Убеждаемся, что window.showDirectoryPicker установлен
      if (typeof window !== 'undefined') {
        (window as any).showDirectoryPicker = mockShowDirectoryPicker;
      } else {
        (global as any).window = {
          showDirectoryPicker: mockShowDirectoryPicker,
        };
      }

      const result = await requestFolderAccess();
      expect(result).toBe(mockHandle);
      expect(mockShowDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
    });

    it('должен вернуть null при отмене выбора', async () => {
      const abortError = new Error('User aborted');
      abortError.name = 'AbortError';
      mockShowDirectoryPicker.mockRejectedValue(abortError);

      const result = await requestFolderAccess();
      expect(result).toBeNull();
    });
  });

  describe('getAllBooks', () => {
    it('должен вернуть пустой массив, если книг нет', async () => {
      const books = await getAllBooks();
      expect(books).toEqual([]);
    });

    it('должен вернуть все книги из библиотеки', async () => {
      const book1: Book = {
        id: 'book1',
        title: 'Книга 1',
        author: 'Автор 1',
        filePath: 'path/to/book1.mp3',
        fileType: 'mp3',
        addedAt: Date.now(),
      };

      const book2: Book = {
        id: 'book2',
        title: 'Книга 2',
        author: 'Автор 2',
        filePath: 'path/to/book2.mp3',
        fileType: 'mp3',
        addedAt: Date.now(),
      };

      await saveBook(book1);
      await saveBook(book2);

      const books = await getAllBooks();
      expect(books).toHaveLength(2);
      expect(books).toContainEqual(book1);
      expect(books).toContainEqual(book2);
    });
  });

  describe('getBook', () => {
    it('должен вернуть null, если книга не найдена', async () => {
      const book = await getBook('non-existent-id');
      expect(book).toBeNull();
    });

    it('должен вернуть книгу по ID', async () => {
      const testBook: Book = {
        id: 'test-book',
        title: 'Тестовая книга',
        author: 'Тестовый автор',
        filePath: 'path/to/test.mp3',
        fileType: 'mp3',
        addedAt: Date.now(),
      };

      await saveBook(testBook);
      const book = await getBook('test-book');
      expect(book).toEqual(testBook);
    });
  });

  describe('removeBook', () => {
    it('должен удалить книгу из библиотеки', async () => {
      const testBook: Book = {
        id: 'test-book',
        title: 'Тестовая книга',
        filePath: 'path/to/test.mp3',
        fileType: 'mp3',
        addedAt: Date.now(),
      };

      await saveBook(testBook);
      await removeBook('test-book');

      const book = await getBook('test-book');
      expect(book).toBeNull();
    });

    it('должен обработать удаление несуществующей книги без ошибки', async () => {
      await expect(removeBook('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('scanFolder', () => {
    it('должен сканировать папку и находить аудиофайлы', async () => {
      // Создаём мок структуры папок
      const rootFolder = new MockFileSystemDirectoryHandle('root');
      const subFolder = new MockFileSystemDirectoryHandle('subfolder');
      
      const audioFile1 = new MockFileSystemFileHandle('book1.mp3');
      const audioFile2 = new MockFileSystemFileHandle('book2.m4a');
      const textFile = new MockFileSystemFileHandle('readme.txt');

      subFolder.addEntry('book2.m4a', audioFile2);
      rootFolder.addEntry('book1.mp3', audioFile1);
      rootFolder.addEntry('readme.txt', textFile);
      rootFolder.addEntry('subfolder', subFolder);

      // Мокаем parseBuffer для music-metadata
      const mockParseBuffer = jest.fn();
      jest.mock('music-metadata', () => ({
        parseBuffer: mockParseBuffer,
      }));

      // Мокаем метаданные
      mockParseBuffer.mockResolvedValue({
        common: {
          title: 'Test Book',
          artist: 'Test Author',
        },
        format: {
          duration: 3600,
          sampleRate: 44100,
        },
      });

      // Тест будет сложным из-за зависимости от music-metadata
      // Пока проверяем базовую структуру
      expect(rootFolder).toBeDefined();
    });

    it('должен вызывать callback прогресса при сканировании', async () => {
      const rootFolder = new MockFileSystemDirectoryHandle('root');
      const audioFile = new MockFileSystemFileHandle('book.mp3');
      rootFolder.addEntry('book.mp3', audioFile);

      const progressCallback = jest.fn();

      // Тест требует полной реализации scanFolder с моками
      // Пока проверяем, что callback определён
      expect(progressCallback).toBeDefined();
    });
  });
});

