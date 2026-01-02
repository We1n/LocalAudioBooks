/**
 * Тесты для компонента CarModeScreen
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CarModeScreen } from '../CarModeScreen';
import { useApp } from '../../AppContext';
import * as playerModule from '../../../player';
import type { Book, Settings } from '../../../storage';
import type { PlayerState } from '../../../player';

// Моки
jest.mock('../../AppContext');
jest.mock('../../../player');
jest.mock('../../../utils', () => ({
  formatTime: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
}));

// Мок для navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate,
});

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockTogglePlayPause = playerModule.togglePlayPause as jest.MockedFunction<typeof playerModule.togglePlayPause>;
const mockSkipBackward = playerModule.skipBackward as jest.MockedFunction<typeof playerModule.skipBackward>;
const mockSkipForward = playerModule.skipForward as jest.MockedFunction<typeof playerModule.skipForward>;
const mockGetCurrentPosition = playerModule.getCurrentPosition as jest.MockedFunction<typeof playerModule.getCurrentPosition>;
const mockGetDuration = playerModule.getDuration as jest.MockedFunction<typeof playerModule.getDuration>;

// Вспомогательные функции
function createTestBook(): Book {
  return {
    id: 'test-book-1',
    title: 'Test Book',
    author: 'Test Author',
    filePath: '/path/to/test.mp3',
    fileType: 'mp3',
    addedAt: Date.now(),
  };
}

function createTestSettings(): Settings {
  return {
    preferredSkipInterval: 30,
    carModeEnabled: true,
    playbackSpeed: 1.0,
    selectedFolders: [],
  };
}

function createTestPlayerState(): PlayerState {
  return {
    isPlaying: false,
    currentPosition: 125.5,
    duration: 3600,
    volume: 1.0,
    speed: 1.0,
    currentBookId: 'test-book-1',
  };
}

describe('CarModeScreen', () => {
  const mockSetCurrentScreen = jest.fn();
  const mockUpdateSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockClear();
    
    // Настройка моков по умолчанию
    mockGetCurrentPosition.mockReturnValue(125.5);
    mockGetDuration.mockReturnValue(3600);
    
    mockUseApp.mockReturnValue({
      currentScreen: 'player',
      setCurrentScreen: mockSetCurrentScreen,
      books: [],
      isLoadingBooks: false,
      refreshBooks: jest.fn(),
      addFolder: jest.fn(),
      currentBook: createTestBook(),
      setCurrentBook: jest.fn(),
      openBook: jest.fn(),
      playerState: createTestPlayerState(),
      settings: createTestSettings(),
      updateSettings: mockUpdateSettings,
      getBookProgress: jest.fn(),
    });
  });

  describe('Рендеринг', () => {
    it('должен отображать название книги и автора', () => {
      render(<CarModeScreen />);
      
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('должен отображать текущую позицию и длительность', () => {
      render(<CarModeScreen />);
      
      expect(screen.getByText('2:05')).toBeInTheDocument(); // 125.5 секунд
      expect(screen.getByText('/ 1:00:00')).toBeInTheDocument(); // 3600 секунд
    });

    it('должен отображать кнопку Play/Pause', () => {
      render(<CarModeScreen />);
      
      const playButton = screen.getByRole('button', { name: /▶/ });
      expect(playButton).toBeInTheDocument();
    });

    it('должен отображать кнопки перемотки назад', () => {
      render(<CarModeScreen />);
      
      expect(screen.getByText('← 15 сек')).toBeInTheDocument();
      expect(screen.getByText('← 30 сек')).toBeInTheDocument();
      expect(screen.getByText('← 60 сек')).toBeInTheDocument();
    });

    it('должен отображать кнопки перемотки вперёд', () => {
      render(<CarModeScreen />);
      
      expect(screen.getByText('15 сек →')).toBeInTheDocument();
      expect(screen.getByText('30 сек →')).toBeInTheDocument();
      expect(screen.getByText('60 сек →')).toBeInTheDocument();
    });

    it('должен отображать кнопку "Назад в библиотеку"', () => {
      render(<CarModeScreen />);
      
      const backButton = screen.getByText('← Назад');
      expect(backButton).toBeInTheDocument();
    });

    it('должен отображать индикатор текущего интервала', () => {
      render(<CarModeScreen />);
      
      expect(screen.getByText(/Текущий интервал: 30 сек/)).toBeInTheDocument();
    });

    it('должен показывать сообщение, если книга не выбрана', () => {
      mockUseApp.mockReturnValue({
        currentScreen: 'player',
        setCurrentScreen: mockSetCurrentScreen,
        books: [],
        isLoadingBooks: false,
        refreshBooks: jest.fn(),
        addFolder: jest.fn(),
        currentBook: null,
        setCurrentBook: jest.fn(),
        openBook: jest.fn(),
        playerState: null,
        settings: createTestSettings(),
        updateSettings: mockUpdateSettings,
        getBookProgress: jest.fn(),
      });

      render(<CarModeScreen />);
      
      expect(screen.getByText('Книга не выбрана')).toBeInTheDocument();
      expect(screen.getByText('Вернуться в библиотеку')).toBeInTheDocument();
    });
  });

  describe('Взаимодействие', () => {
    it('должен вызывать togglePlayPause при нажатии на кнопку Play/Pause', () => {
      render(<CarModeScreen />);
      
      const playButton = screen.getByRole('button', { name: /▶/ });
      fireEvent.click(playButton);
      
      expect(mockTogglePlayPause).toHaveBeenCalledTimes(1);
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('должен вызывать skipBackward при нажатии на кнопку перемотки назад', () => {
      render(<CarModeScreen />);
      
      const backButton = screen.getByText('← 30 сек');
      fireEvent.click(backButton);
      
      expect(mockSkipBackward).toHaveBeenCalledWith(30);
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('должен вызывать skipForward при нажатии на кнопку перемотки вперёд', () => {
      render(<CarModeScreen />);
      
      const forwardButton = screen.getByText('30 сек →');
      fireEvent.click(forwardButton);
      
      expect(mockSkipForward).toHaveBeenCalledWith(30);
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('должен переключаться на экран библиотеки при нажатии "Назад"', () => {
      render(<CarModeScreen />);
      
      const backButton = screen.getByText('← Назад');
      fireEvent.click(backButton);
      
      expect(mockSetCurrentScreen).toHaveBeenCalledWith('library');
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('должен использовать правильный интервал из настроек', () => {
      const settings = createTestSettings();
      settings.preferredSkipInterval = 60;
      
      mockUseApp.mockReturnValue({
        currentScreen: 'player',
        setCurrentScreen: mockSetCurrentScreen,
        books: [],
        isLoadingBooks: false,
        refreshBooks: jest.fn(),
        addFolder: jest.fn(),
        currentBook: createTestBook(),
        setCurrentBook: jest.fn(),
        openBook: jest.fn(),
        playerState: createTestPlayerState(),
        settings,
        updateSettings: mockUpdateSettings,
        getBookProgress: jest.fn(),
      });

      render(<CarModeScreen />);
      
      expect(screen.getByText(/Текущий интервал: 60 сек/)).toBeInTheDocument();
    });
  });

  describe('Жесты', () => {
    it('должен перематывать назад при свайпе вправо', () => {
      render(<CarModeScreen />);
      
      const container = screen.getByText('Test Book').closest('div');
      if (!container) return;
      
      // Симулируем свайп вправо
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      expect(mockSkipBackward).toHaveBeenCalledWith(30);
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('должен перематывать вперёд при свайпе влево', () => {
      render(<CarModeScreen />);
      
      const container = screen.getByText('Test Book').closest('div');
      if (!container) return;
      
      // Симулируем свайп влево
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      expect(mockSkipForward).toHaveBeenCalledWith(30);
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('не должен реагировать на вертикальные свайпы', () => {
      render(<CarModeScreen />);
      
      const container = screen.getByText('Test Book').closest('div');
      if (!container) return;
      
      // Симулируем вертикальный свайп
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 200 }],
      });
      fireEvent.touchEnd(container);
      
      expect(mockSkipBackward).not.toHaveBeenCalled();
      expect(mockSkipForward).not.toHaveBeenCalled();
    });

    it('не должен реагировать на короткие свайпы (меньше порога)', () => {
      render(<CarModeScreen />);
      
      const container = screen.getByText('Test Book').closest('div');
      if (!container) return;
      
      // Симулируем короткий свайп (меньше 50px)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(container, {
        touches: [{ clientX: 130, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      expect(mockSkipBackward).not.toHaveBeenCalled();
      expect(mockSkipForward).not.toHaveBeenCalled();
    });
  });

  describe('Обновление позиции', () => {
    it('должен обновлять позицию во время воспроизведения', async () => {
      const playerState = createTestPlayerState();
      playerState.isPlaying = true;
      
      mockUseApp.mockReturnValue({
        currentScreen: 'player',
        setCurrentScreen: mockSetCurrentScreen,
        books: [],
        isLoadingBooks: false,
        refreshBooks: jest.fn(),
        addFolder: jest.fn(),
        currentBook: createTestBook(),
        setCurrentBook: jest.fn(),
        openBook: jest.fn(),
        playerState,
        settings: createTestSettings(),
        updateSettings: mockUpdateSettings,
        getBookProgress: jest.fn(),
      });

      mockGetCurrentPosition
        .mockReturnValueOnce(125.5)
        .mockReturnValueOnce(126.5)
        .mockReturnValueOnce(127.5);

      render(<CarModeScreen />);
      
      // Ждём обновления позиции
      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Вибрация', () => {
    it('должен вызывать вибрацию при нажатии кнопок', () => {
      render(<CarModeScreen />);
      
      const playButton = screen.getByRole('button', { name: /▶/ });
      fireEvent.click(playButton);
      
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('должен работать без вибрации, если API не поддерживается', () => {
      // Удаляем vibrate из navigator
      const originalVibrate = navigator.vibrate;
      delete (navigator as any).vibrate;
      
      render(<CarModeScreen />);
      
      const playButton = screen.getByRole('button', { name: /▶/ });
      fireEvent.click(playButton);
      
      // Не должно быть ошибок
      expect(mockTogglePlayPause).toHaveBeenCalled();
      
      // Восстанавливаем
      (navigator as any).vibrate = originalVibrate;
    });
  });

  describe('Отображение состояния воспроизведения', () => {
    it('должен показывать кнопку Pause, когда воспроизведение активно', () => {
      const playerState = createTestPlayerState();
      playerState.isPlaying = true;
      
      mockUseApp.mockReturnValue({
        currentScreen: 'player',
        setCurrentScreen: mockSetCurrentScreen,
        books: [],
        isLoadingBooks: false,
        refreshBooks: jest.fn(),
        addFolder: jest.fn(),
        currentBook: createTestBook(),
        setCurrentBook: jest.fn(),
        openBook: jest.fn(),
        playerState,
        settings: createTestSettings(),
        updateSettings: mockUpdateSettings,
        getBookProgress: jest.fn(),
      });

      render(<CarModeScreen />);
      
      expect(screen.getByRole('button', { name: /⏸/ })).toBeInTheDocument();
    });

    it('должен показывать кнопку Play, когда воспроизведение приостановлено', () => {
      const playerState = createTestPlayerState();
      playerState.isPlaying = false;
      
      mockUseApp.mockReturnValue({
        currentScreen: 'player',
        setCurrentScreen: mockSetCurrentScreen,
        books: [],
        isLoadingBooks: false,
        refreshBooks: jest.fn(),
        addFolder: jest.fn(),
        currentBook: createTestBook(),
        setCurrentBook: jest.fn(),
        openBook: jest.fn(),
        playerState,
        settings: createTestSettings(),
        updateSettings: mockUpdateSettings,
        getBookProgress: jest.fn(),
      });

      render(<CarModeScreen />);
      
      expect(screen.getByRole('button', { name: /▶/ })).toBeInTheDocument();
    });
  });
});

