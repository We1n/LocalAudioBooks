/**
 * E2E тесты для PWA функциональности (Этап 8)
 * 
 * Тестирует:
 * - Регистрацию Service Worker
 * - Оффлайн-режим и индикацию
 * - Установку PWA
 */

describe('PWA функциональность', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('должен зарегистрировать Service Worker', () => {
    cy.window().then((win) => {
      if ('serviceWorker' in navigator) {
        return win.navigator.serviceWorker.ready.then((registration) => {
          expect(registration).to.exist;
          expect(registration.scope).to.include('/');
        });
      } else {
        cy.log('Service Worker не поддерживается в этом браузере');
      }
    });
  });

  it('должен показывать индикатор оффлайн-режима при потере соединения', () => {
    // Симулируем оффлайн-режим
    cy.window().then((win) => {
      // Используем Chrome DevTools Protocol для симуляции оффлайн-режима
      // В Cypress это можно сделать через cy.intercept или напрямую через window
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      // Триггерим событие offline
      const offlineEvent = new Event('offline');
      win.dispatchEvent(offlineEvent);

      // Проверяем, что индикатор появился
      cy.contains('Работа в оффлайн-режиме', { timeout: 1000 }).should('be.visible');
    });
  });

  it('должен показывать индикатор восстановления соединения', () => {
    // Сначала устанавливаем оффлайн-режим
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const offlineEvent = new Event('offline');
      win.dispatchEvent(offlineEvent);

      // Затем восстанавливаем соединение
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });

      const onlineEvent = new Event('online');
      win.dispatchEvent(onlineEvent);

      // Проверяем, что индикатор восстановления появился
      cy.contains('Соединение восстановлено', { timeout: 1000 }).should('be.visible');
    });
  });

  it('должен иметь правильный manifest.json', () => {
    cy.request('/manifest.webmanifest').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name', 'LocalAudioBooks');
      expect(response.body).to.have.property('short_name', 'AudioBooks');
      expect(response.body).to.have.property('display', 'standalone');
      expect(response.body).to.have.property('icons');
      expect(response.body.icons).to.be.an('array');
      expect(response.body.icons.length).to.be.greaterThan(0);
    });
  });

  it('должен иметь иконки для PWA', () => {
    // Проверяем наличие иконок в manifest
    cy.request('/manifest.webmanifest').then((response) => {
      const icons = response.body.icons;
      expect(icons).to.be.an('array');
      
      // Проверяем наличие основных размеров
      const sizes = icons.map((icon: any) => icon.sizes);
      expect(sizes).to.include('192x192');
      expect(sizes).to.include('512x512');
    });

    // Проверяем, что иконки доступны
    cy.request('/pwa-192x192.png').then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.request('/pwa-512x512.png').then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('должен работать в оффлайн-режиме после первой загрузки', () => {
    // После первой загрузки приложение должно быть закэшировано
    cy.reload();
    
    // Симулируем оффлайн-режим
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const offlineEvent = new Event('offline');
      win.dispatchEvent(offlineEvent);

      // Приложение должно продолжать работать
      cy.contains('Библиотека', { timeout: 2000 }).should('be.visible');
    });
  });

  it('должен иметь правильные мета-теги для iOS', () => {
    cy.get('meta[name="apple-mobile-web-app-capable"]').should('have.attr', 'content', 'yes');
    cy.get('meta[name="apple-mobile-web-app-status-bar-style"]').should('exist');
    cy.get('meta[name="apple-mobile-web-app-title"]').should('have.attr', 'content', 'AudioBooks');
    cy.get('link[rel="apple-touch-icon"]').should('exist');
  });

  it('должен иметь правильный theme-color', () => {
    cy.get('meta[name="theme-color"]').should('have.attr', 'content', '#1f2937');
  });
});

