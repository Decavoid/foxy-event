(function () {
  'use strict';

  const messages = {
    ru: {
      pageTitle: 'Ретро-марафон · 2–4 октября',
      description: 'Три дня любимых ретро-игр. Расписание стримерского марафона 2–4 октября 2026: участники, игры и текущий эфир. Время — в вашем часовом поясе.',
      skipLink: 'Перейти к расписанию',
      homeLabel: 'Ретро-марафон — главная',
      brand: 'РЕТРО<span class="brand-slash"> / </span>МАРАФОН',
      headerDate: '02—04 ОКТЯБРЯ <span class="muted">2026</span>',
      languageLabel: 'Язык',
      darkTheme: 'Тёмная тема',
      enableDarkTheme: 'Включить тёмную тему',
      enableLightTheme: 'Включить светлую тему',
      eventEyebrow: 'СТРИМЕРСКИЙ ИВЕНТ · TWITCH / YOUTUBE',
      heroTitle: 'Старые игры.<br><span>Новая встреча.</span>',
      heroDescription: 'Три дня, любимые консоли и люди по ту сторону экрана.<br class="desktop-break"> Выбирай игру, находи своего стримера и присоединяйся.',
      viewSchedule: 'Смотреть расписание <span aria-hidden="true">↘</span>',
      nostalgia: 'НОСТАЛЬГИЯ',
      eventFacts: 'Об ивенте',
      eventDays: 'дня марафона',
      gamesLabel: 'игр',
      participantsLabel: 'участников',
      platformsLabel: 'платформ',
      timezoneNote: 'Время — в вашем часовом поясе',
      streamTitle: 'Трансляция FoxyShadow',
      streamDescription: 'Статус эфира — по расписанию марафона.',
      watchYouTube: 'Смотреть на YouTube',
      watchTwitch: 'Смотреть на Twitch',
      newTab: ' (откроется в новой вкладке)',
      broadcastLabel: 'Текущая и следующая игра',
      loadingEyebrow: 'ЗАГРУЖАЕМ РАСПИСАНИЕ',
      loadingTitle: 'Готовим следующий уровень…',
      scheduleEyebrow: 'ВЫБИРАЙ СВОЙ УРОВЕНЬ',
      scheduleTitle: 'Расписание',
      jumpCurrent: 'К текущей игре',
      jumpNext: 'К следующей игре',
      jumpLast: 'К последней игре',
      dayLabel: 'День марафона',
      searchLabel: 'Найти игру или участника',
      searchPlaceholder: 'Найти игру или участника…',
      platform: 'Платформа',
      allPlatforms: 'Все платформы',
      emptyTitle: 'Ничего не нашлось',
      emptyDescription: 'Попробуй другую игру, участника или платформу.',
      resetFilters: 'Сбросить фильтры',
      scheduleNote: 'Вкладки — дни программы марафона. Если местная дата начала игры отличается от дня программы, она указана рядом со временем.',
      closingTitle: 'Сохраняй расписание. Возвращайся за ностальгией.',
      closingDescription: 'Текущая игра подсвечивается автоматически. Время указано по расписанию и может отличаться от фактического эфира.',
      downloadSchedule: 'Расписание .txt (UTC+3)',
      footerBrand: 'РЕТРО / МАРАФОН',
      footerTagline: 'Играем вместе. Как раньше.',
      backToTop: 'Наверх ↑',
      hourShort: 'ч',
      minuteShort: 'мин',
      dayShort: 'д',
      games: { one: 'игра', few: 'игры', many: 'игр', other: 'игры' },
      participants: { one: 'участник', few: 'участника', many: 'участников', other: 'участника' },
      platforms: { one: 'платформа', few: 'платформы', many: 'платформ', other: 'платформы' },
      days: { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
      marathonDays: { one: 'день марафона', few: 'дня марафона', many: 'дней марафона', other: 'дня марафона' },
      unknownEndTime: 'Время окончания неизвестно',
      liveNow: 'Идёт сейчас',
      allDays: 'Все дни',
      streamActive: 'Марафон в прямом эфире',
      streamBefore: 'Сейчас не в эфире',
      streamEnded: 'Трансляция завершена',
      streamUnknown: 'Статус эфира неизвестен',
      joinStream: 'Присоединяйся к трансляции FoxyShadow.',
      nextStream: 'Следующий эфир — {date} в {time} по вашему времени.',
      lastEndMissing: 'Время окончания последней игры не указано.',
      marathonFinished: 'Марафон завершён. Спасибо всем, кто был с нами!',
      lastScheduledGame: 'ПОСЛЕДНЯЯ ЗАПЛАНИРОВАННАЯ ИГРА',
      currentGame: 'СЕЙЧАС ПО РАСПИСАНИЮ · ИГРА #{number}',
      unknownEnd: 'Окончание неизвестно',
      gameProgress: 'Время текущей игры',
      beforeTitle: 'Скоро нажмём START.',
      breakTitle: 'Эфир завершён.',
      finishedTitle: 'Спасибо за игру!',
      beforeCopy: 'Марафон начнётся {date} в {time}. Выбирай, что посмотреть.',
      breakCopy: 'Сейчас перерыв. Вернёмся к началу следующей игры.',
      finishedCopy: 'Все игры по расписанию завершены. Любимые игры и участники остаются здесь.',
      beforeEyebrow: 'ДО НАЧАЛА МАРАФОНА',
      breakEyebrow: 'МЕЖДУ ЭФИРАМИ',
      finishedEyebrow: 'ИВЕНТ ЗАВЕРШЁН',
      localTime: 'Местное время',
      nextLevel: 'СЛЕДУЮЩИЙ УРОВЕНЬ',
      finalLevel: 'ФИНАЛЬНЫЙ УРОВЕНЬ',
      finalTitle: 'Вот это марафон.',
      finalUnknown: 'Это последняя игра программы. Время её завершения не указано.',
      finalCopy: 'Впереди нет запланированных игр. Спасибо всем, кто был с нами!',
      currentAnnouncement: 'Сейчас по расписанию, игра #{number}: {participant}, {game}',
      unknownAnnouncement: 'Последняя запланированная игра: {participant}. Время окончания неизвестно.',
      rowNow: 'СЕЙЧАС',
      rowGame: 'ИГРА #{number}',
      rowUnknown: 'Окончание<br>неизвестно',
      rowPast: 'Игра завершена',
      rowUpcoming: 'Впереди',
      untilDate: 'до {date}',
      endMissing: 'конец не указан',
      tableCaption: 'Программа на {date}. Время в вашем часовом поясе.',
      timeColumn: 'Время · местное',
      gameColumn: 'Игра / участник',
      statusColumn: 'Статус',
      clockTitle: 'Ваше местное время · {zone}',
      gameRemaining: 'До конца игры {time}',
      streamRemaining: 'До начала эфира: {time}',
      nextRemaining: 'через {time}',
      localNotice: 'Локальный просмотр: используется сохранённая копия расписания. На сайте данные загружаются из Schedule.txt.',
      fallbackNotice: 'Не удалось обновить Schedule.txt. Показана сохранённая версия; повторим попытку через минуту.',
      unavailableStatus: 'Статус эфира недоступен',
      unavailableDescription: 'Не удалось загрузить расписание. Попробуй обновить страницу.',
      errorTitle: 'Не удалось загрузить расписание',
      errorCopy: 'Проверьте файл Schedule.txt и обновите страницу.',
      openSchedule: 'Открыть текстовое расписание'
    },
    en: {
      pageTitle: 'Retro Marathon · 2–4 October',
      description: 'Three days of favourite retro games. The 2–4 October 2026 streaming marathon schedule: players, games and the current stream. All times in your timezone.',
      skipLink: 'Skip to schedule',
      homeLabel: 'Retro Marathon — home',
      brand: 'RETRO<span class="brand-slash"> / </span>MARATHON',
      headerDate: '02—04 OCTOBER <span class="muted">2026</span>',
      languageLabel: 'Language',
      darkTheme: 'Dark theme',
      enableDarkTheme: 'Switch to dark theme',
      enableLightTheme: 'Switch to light theme',
      eventEyebrow: 'STREAMING EVENT · TWITCH / YOUTUBE',
      heroTitle: 'Old games.<br><span>New memories.</span>',
      heroDescription: 'Three days, favourite consoles and the people behind the screen.<br class="desktop-break"> Pick a game, find your streamer and join in.',
      viewSchedule: 'View schedule <span aria-hidden="true">↘</span>',
      nostalgia: 'NOSTALGIA',
      eventFacts: 'About the event',
      eventDays: 'marathon days',
      gamesLabel: 'games',
      participantsLabel: 'players',
      platformsLabel: 'platforms',
      timezoneNote: 'All times in your timezone',
      streamTitle: 'FoxyShadow stream',
      streamDescription: 'Stream status follows the marathon schedule.',
      watchYouTube: 'Watch on YouTube',
      watchTwitch: 'Watch on Twitch',
      newTab: ' (opens in a new tab)',
      broadcastLabel: 'Current and next game',
      loadingEyebrow: 'LOADING THE SCHEDULE',
      loadingTitle: 'Getting the next level ready…',
      scheduleEyebrow: 'CHOOSE YOUR LEVEL',
      scheduleTitle: 'Schedule',
      jumpCurrent: 'Current game',
      jumpNext: 'Next game',
      jumpLast: 'Last game',
      dayLabel: 'Marathon day',
      searchLabel: 'Find a game or player',
      searchPlaceholder: 'Find a game or player…',
      platform: 'Platform',
      allPlatforms: 'All platforms',
      emptyTitle: 'No results found',
      emptyDescription: 'Try another game, player or platform.',
      resetFilters: 'Reset filters',
      scheduleNote: 'Tabs group games by marathon programme day. If a game starts on a different date in your timezone, that date appears beside its time.',
      closingTitle: 'Save the schedule. Come back for the nostalgia.',
      closingDescription: 'The current game is highlighted automatically. Times follow the schedule and may differ from the actual stream.',
      downloadSchedule: 'Schedule .txt (Russian, UTC+3)',
      footerBrand: 'RETRO / MARATHON',
      footerTagline: 'Playing together. Just like old times.',
      backToTop: 'Back to top ↑',
      hourShort: 'h',
      minuteShort: 'min',
      dayShort: 'd',
      games: { one: 'game', other: 'games' },
      participants: { one: 'player', other: 'players' },
      platforms: { one: 'platform', other: 'platforms' },
      days: { one: 'day', other: 'days' },
      marathonDays: { one: 'marathon day', other: 'marathon days' },
      unknownEndTime: 'End time unknown',
      liveNow: 'On now',
      allDays: 'All days',
      streamActive: 'The marathon is live',
      streamBefore: 'Currently offline',
      streamEnded: 'The stream has ended',
      streamUnknown: 'Stream status unknown',
      joinStream: 'Join the FoxyShadow stream.',
      nextStream: 'Next stream: {date} at {time} in your timezone.',
      lastEndMissing: 'The last game has no scheduled end time.',
      marathonFinished: 'The marathon is over. Thanks to everyone who joined us!',
      lastScheduledGame: 'LAST SCHEDULED GAME',
      currentGame: 'ON NOW · GAME #{number}',
      unknownEnd: 'End time unknown',
      gameProgress: 'Current game progress',
      beforeTitle: 'Pressing START soon.',
      breakTitle: 'The stream has ended.',
      finishedTitle: 'Thanks for playing!',
      beforeCopy: 'The marathon starts on {date} at {time}. Pick something to watch.',
      breakCopy: 'We’re taking a break. See you at the start of the next game.',
      finishedCopy: 'All scheduled games are complete. Your favourite games and players are still listed here.',
      beforeEyebrow: 'BEFORE THE MARATHON',
      breakEyebrow: 'BETWEEN STREAMS',
      finishedEyebrow: 'EVENT COMPLETE',
      localTime: 'Local time',
      nextLevel: 'NEXT LEVEL',
      finalLevel: 'FINAL LEVEL',
      finalTitle: 'What a marathon.',
      finalUnknown: 'This is the last game in the programme. Its end time is not specified.',
      finalCopy: 'No more games are scheduled. Thanks to everyone who joined us!',
      currentAnnouncement: 'On now, game #{number}: {participant}, {game}',
      unknownAnnouncement: 'Last scheduled game: {participant}. End time unknown.',
      rowNow: 'ON NOW',
      rowGame: 'GAME #{number}',
      rowUnknown: 'End time<br>unknown',
      rowPast: 'Game finished',
      rowUpcoming: 'Upcoming',
      untilDate: 'until {date}',
      endMissing: 'end not specified',
      tableCaption: 'Programme for {date}. All times in your timezone.',
      timeColumn: 'Time · local',
      gameColumn: 'Game / player',
      statusColumn: 'Status',
      clockTitle: 'Your local time · {zone}',
      gameRemaining: '{time} left in this game',
      streamRemaining: 'Stream starts in: {time}',
      nextRemaining: 'in {time}',
      localNotice: 'Local preview: using a saved schedule. The website loads the latest data from Schedule.txt.',
      fallbackNotice: 'Could not update Schedule.txt. Showing the saved schedule; we’ll try again in a minute.',
      unavailableStatus: 'Stream status unavailable',
      unavailableDescription: 'Could not load the schedule. Try refreshing the page.',
      errorTitle: 'Could not load the schedule',
      errorCopy: 'Check Schedule.txt and refresh the page.',
      openSchedule: 'Open the schedule text (Russian, UTC+3)'
    }
  };

  const storageKey = 'retro-marathon-language';
  let language = 'ru';
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (Object.hasOwn(messages, saved)) language = saved;
  } catch {
    // Language switching also works when browser storage is unavailable.
  }

  function t(key, values = {}) {
    return messages[language][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  }

  function plural(key, count) {
    const forms = messages[language][key];
    return forms[new Intl.PluralRules(language).select(count)] || forms.other;
  }

  function translatePage() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]').content = t('description');
    for (const element of document.querySelectorAll('[data-i18n]')) {
      element.textContent = t(element.dataset.i18n);
    }
    // HTML translations contain only trusted, static markup from this dictionary.
    for (const element of document.querySelectorAll('[data-i18n-html]')) {
      element.innerHTML = t(element.dataset.i18nHtml);
    }
    for (const attribute of ['aria-label', 'placeholder']) {
      for (const element of document.querySelectorAll('[data-i18n-' + attribute + ']')) {
        element.setAttribute(attribute, t(element.getAttribute('data-i18n-' + attribute)));
      }
    }
    document.getElementById('language-select').value = language;
  }

  function setLanguage(value, persist = true) {
    if (!Object.hasOwn(messages, value)) return;
    if (persist) {
      try { window.localStorage.setItem(storageKey, value); } catch { /* Keep the choice for this page. */ }
    }
    if (value === language) return;
    language = value;
    translatePage();
    window.dispatchEvent(new Event('retro-languagechange'));
  }

  window.RetroI18n = {
    get language() { return language; },
    get locale() { return language === 'en' ? 'en-GB' : 'ru-RU'; },
    t, plural, setLanguage
  };
  translatePage();
  document.getElementById('language-control').hidden = false;
  document.getElementById('language-select').addEventListener('change', event => setLanguage(event.target.value));
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) setLanguage(event.newValue || 'ru', false);
  });
})();
