/**
 * Модуль Utils - общие утилиты для проекта LocalAudioBooks
 * 
 * Содержит:
 * - Утилиты для обработки файлов
 * - Обработка ошибок
 * - Утилиты для работы со временем
 */

// Типы аудиофайлов
export type AudioFileType = 'mp3' | 'm4a' | 'wav' | 'aac' | 'ogg';

// Поддерживаемые MIME-типы
const AUDIO_MIME_TYPES: Record<AudioFileType, string[]> = {
  mp3: ['audio/mpeg', 'audio/mp3'],
  m4a: ['audio/mp4', 'audio/m4a', 'audio/x-m4a'],
  wav: ['audio/wav', 'audio/wave', 'audio/x-wav'],
  aac: ['audio/aac', 'audio/aacp'],
  ogg: ['audio/ogg', 'audio/vorbis'],
};

// Расширения файлов
const AUDIO_EXTENSIONS: Record<AudioFileType, string[]> = {
  mp3: ['.mp3'],
  m4a: ['.m4a', '.m4b'],
  wav: ['.wav'],
  aac: ['.aac'],
  ogg: ['.ogg', '.oga'],
};

/**
 * Определяет тип аудиофайла по имени файла или MIME-типу
 * @param filename - имя файла или путь
 * @param mimeType - опциональный MIME-тип
 * @returns тип аудиофайла или null, если не поддерживается
 */
export function getAudioFileType(
  filename: string,
  mimeType?: string
): AudioFileType | null {
  // Проверка по расширению (приоритет)
  const lowerFilename = filename.toLowerCase();
  
  for (const [type, extensions] of Object.entries(AUDIO_EXTENSIONS)) {
    if (extensions.some(ext => lowerFilename.endsWith(ext))) {
      return type as AudioFileType;
    }
  }

  // Проверка по MIME-типу
  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    for (const [type, mimes] of Object.entries(AUDIO_MIME_TYPES)) {
      if (mimes.some(mime => lowerMime.includes(mime))) {
        return type as AudioFileType;
      }
    }
  }

  return null;
}

/**
 * Проверяет, является ли файл поддерживаемым аудиофайлом
 * @param filename - имя файла или путь
 * @param mimeType - опциональный MIME-тип
 * @returns true, если файл поддерживается
 */
export function isAudioFile(filename: string, mimeType?: string): boolean {
  return getAudioFileType(filename, mimeType) !== null;
}

/**
 * Нормализует путь к файлу (убирает лишние слеши, приводит к единому формату)
 * @param path - путь к файлу
 * @returns нормализованный путь
 */
export function normalizePath(path: string): string {
  // Заменяем обратные слеши на прямые (для Windows)
  let normalized = path.replace(/\\/g, '/');
  
  // Убираем множественные слеши
  normalized = normalized.replace(/\/+/g, '/');
  
  // Убираем ведущий слеш, если это не абсолютный путь
  if (normalized.startsWith('./')) {
    normalized = normalized.substring(2);
  }
  
  return normalized;
}

/**
 * Извлекает имя файла из пути
 * @param path - путь к файлу
 * @returns имя файла
 */
export function getFileName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || path;
}

/**
 * Извлекает директорию из пути
 * @param path - путь к файлу
 * @returns путь к директории
 */
export function getDirectory(path: string): string {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '';
  return normalized.substring(0, lastSlash);
}

/**
 * Проверяет, являются ли два пути дубликатами (одинаковое имя файла)
 * @param path1 - первый путь
 * @param path2 - второй путь
 * @returns true, если пути указывают на один файл
 */
export function isDuplicate(path1: string, path2: string): boolean {
  const file1 = getFileName(path1).toLowerCase();
  const file2 = getFileName(path2).toLowerCase();
  return file1 === file2;
}

/**
 * Создаёт уникальный идентификатор для файла на основе пути
 * @param path - путь к файлу
 * @returns уникальный идентификатор
 */
export function createFileId(path: string): string {
  const normalized = normalizePath(path);
  // Используем хэш-функцию для создания ID
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `file_${Math.abs(hash).toString(36)}`;
}

// ==================== Обработка ошибок ====================

/**
 * Базовый класс для всех ошибок приложения
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
    // Поддержка Error.cause в старых версиях
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Ошибка при работе с файловой системой
 */
export class FileSystemError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'FILE_SYSTEM_ERROR', cause);
    this.name = 'FileSystemError';
  }
}

/**
 * Ошибка при парсинге метаданных
 */
export class MetadataError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'METADATA_ERROR', cause);
    this.name = 'MetadataError';
  }
}

/**
 * Ошибка при воспроизведении аудио
 */
export class PlaybackError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'PLAYBACK_ERROR', cause);
    this.name = 'PlaybackError';
  }
}

/**
 * Ошибка при работе с хранилищем
 */
export class StorageError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'STORAGE_ERROR', cause);
    this.name = 'StorageError';
  }
}

/**
 * Ошибка валидации данных
 */
export class ValidationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

/**
 * Обрабатывает ошибку и возвращает понятное сообщение для пользователя
 * @param error - ошибка для обработки
 * @returns понятное сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Произошла неизвестная ошибка';
}

/**
 * Проверяет, является ли ошибка определённого типа
 * @param error - ошибка для проверки
 * @param errorClass - класс ошибки
 * @returns true, если ошибка является экземпляром указанного класса
 */
export function isErrorOfType<T extends AppError>(
  error: unknown,
  errorClass: new (...args: any[]) => T
): error is T {
  return error instanceof errorClass;
}

// ==================== Утилиты для работы со временем ====================

/**
 * Форматирует секунды в формат mm:ss
 * @param seconds - количество секунд
 * @returns строка в формате mm:ss
 */
export function formatTimeShort(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Форматирует секунды в формат hh:mm:ss
 * @param seconds - количество секунд
 * @returns строка в формате hh:mm:ss
 */
export function formatTimeLong(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '00:00:00';
  }
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Форматирует секунды в читаемый формат (автоматически выбирает короткий или длинный)
 * @param seconds - количество секунд
 * @returns строка в формате mm:ss или hh:mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  
  // Если больше часа, используем длинный формат
  if (hours > 0) {
    return formatTimeLong(seconds);
  }
  
  return formatTimeShort(seconds);
}

/**
 * Парсит строку времени в формате mm:ss или hh:mm:ss в секунды
 * @param timeString - строка времени
 * @returns количество секунд или null, если не удалось распарсить
 */
export function parseTime(timeString: string): number | null {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }
  
  const parts = timeString.trim().split(':');
  
  if (parts.length === 2) {
    // mm:ss
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    if (isNaN(minutes) || isNaN(seconds)) {
      return null;
    }
    
    return minutes * 60 + seconds;
  }
  
  if (parts.length === 3) {
    // hh:mm:ss
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return null;
    }
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return null;
}

/**
 * Конвертирует секунды в читаемый формат с единицами измерения
 * @param seconds - количество секунд
 * @returns строка вида "1 ч 30 мин" или "45 мин" или "30 сек"
 */
export function formatTimeReadable(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '0 сек';
  }
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'ч' : 'ч'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'мин' : 'мин'}`);
  }
  
  if (secs > 0 && hours === 0) {
    // Показываем секунды только если нет часов
    parts.push(`${secs} ${secs === 1 ? 'сек' : 'сек'}`);
  }
  
  return parts.length > 0 ? parts.join(' ') : '0 сек';
}
