// Корневой модуль common
export * from '../storage';
export * from '../utils';
// Экспортируем library с переименованием removeBook для избежания конфликта
export {
  requestFolderAccess,
  scanFolder,
  getAllBooks,
  getBook,
  removeBook,
  type ScanProgress,
  type ScanProgressCallback,
} from '../library';
// Экспортируем player с переименованием для избежания конфликта с storage
export {
  loadBook as loadBookToPlayer,
  saveProgress as savePlayerProgress,
  togglePlayPause,
  play,
  pause,
  seek,
  skipBackward,
  skipForward,
  setSpeed,
  setVolume,
  getCurrentPosition,
  getDuration,
  getState,
  onStateChange,
  type PlayerState,
  type PlayerStateCallback,
} from '../player';
export * from '../ui';

