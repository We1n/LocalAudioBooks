/**
 * Утилиты для работы с PWA
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Регистрирует Service Worker и обрабатывает обновления
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // В dev режиме не регистрируем Service Worker
      if (import.meta.env.DEV) {
        console.log('Service Worker отключен в dev режиме');
        return;
      }
      
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker зарегистрирован:', registration.scope);

          // Проверка обновлений каждые 60 секунд
          setInterval(() => {
            registration.update();
          }, 60000);

          // Обработка обновления Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Новый Service Worker установлен, но старый ещё активен
                  // Можно показать уведомление пользователю о доступном обновлении
                  console.log('Доступно обновление приложения');
                }
              });
            }
          });

          // Обработка активации нового Service Worker
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              // Перезагрузка страницы для применения обновления
              window.location.reload();
            }
          });
        })
        .catch((error) => {
          console.error('Ошибка регистрации Service Worker:', error);
        });
    });
  }
}

/**
 * Обработка события beforeinstallprompt для установки PWA
 */
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем автоматическое отображение подсказки
    e.preventDefault();
    // Сохраняем событие для последующего использования
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('PWA готово к установке');
  });
}

/**
 * Показывает подсказку об установке PWA
 * @returns Promise, который резолвится с результатом (accepted/dismissed)
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) {
    return null;
  }

  try {
    // Показываем подсказку об установке
    await deferredPrompt.prompt();
    // Ждём выбора пользователя
    const { outcome } = await deferredPrompt.userChoice;
    // Очищаем сохранённое событие
    deferredPrompt = null;
    return outcome;
  } catch (error) {
    console.error('Ошибка при показе подсказки об установке:', error);
    return null;
  }
}

/**
 * Проверяет, установлено ли приложение как PWA
 */
export function isInstalled(): boolean {
  // Проверка для standalone режима (iOS, Android)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // Проверка для Windows (через navigator.standalone не работает)
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  return false;
}

/**
 * Проверяет, поддерживается ли установка PWA
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Инициализация всех PWA функций
 */
export function initPWA(): void {
  registerServiceWorker();
  setupInstallPrompt();
}

