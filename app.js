(function () {
  'use strict';

  const core = window.ScheduleCore;
  const config = window.RETRO_SCHEDULE;
  const $ = id => document.getElementById(id);
  const clockFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const shortDateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
  // Programme headings are calendar dates, not instants to convert to local time.
  const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', weekday: 'long' });
  let schedule = null;
  let selectedDay = null;
  let manualDay = false;
  let state = null;
  let signature = '';
  let source = '';
  let loading = false;

  function escape(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function participant(value) {
    return escape(value).replace(/@/g, '<span class="handle">@</span>');
  }

  function prettyParticipant(value) {
    return escape(value.replace(/@/g, ''));
  }

  function family(platform) {
    if (['SEGA', 'Dreamcast'].includes(platform)) return 'sega';
    if (['PC', 'DOS'].includes(platform)) return 'pc';
    if (platform === 'Arcade') return 'arcade';
    if (platform === 'PS1') return 'sony';
    return 'nintendo';
  }

  function badge(slot) {
    return '<span class="platform-badge" data-family="' + family(slot.platform) + '">' + escape(slot.platform) + '</span>' + (slot.tags.length ? '<span class="platform-tag">' + escape(slot.tags.join(' · ')) + '</span>' : '');
  }

  function duration(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return [hours ? hours + ' ч' : '', rest ? rest + ' мин' : ''].filter(Boolean).join(' ') || '0 мин';
  }

  function countdown(milliseconds) {
    const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
    if (totalMinutes >= 1440) return Math.floor(totalMinutes / 1440) + ' д ' + Math.floor((totalMinutes % 1440) / 60) + ' ч';
    return duration(totalMinutes);
  }

  function countdownClock(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const days = Math.floor(seconds / 86400);
    const time = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
    return (days ? days + ' д ' : '') + time.map(value => String(value).padStart(2, '0')).join(':');
  }

  function dateLabel(timestamp, short) {
    return (short ? shortDateFormat : dateFormat).format(timestamp);
  }

  function localDate(timestamp) {
    const date = new Date(timestamp);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function timezoneLabel(timestamp) {
    const offset = -new Date(timestamp).getTimezoneOffset();
    const minutes = Math.abs(offset) % 60;
    return 'UTC' + (offset === 0 ? '' : (offset > 0 ? '+' : '−') + Math.floor(Math.abs(offset) / 60) + (minutes ? ':' + String(minutes).padStart(2, '0') : ''));
  }

  function crossesLocalMidnight(slot) {
    return slot.end !== null && localDate(slot.start) !== localDate(slot.end);
  }

  function slotDateLabel(slot) {
    return dateLabel(slot.start, true) + (crossesLocalMidnight(slot) ? ' — ' + dateLabel(slot.end, true) : '');
  }

  function timeRange(slot) {
    return timeFormat.format(slot.start) + ' — ' + (slot.end === null ? '?' : timeFormat.format(slot.end));
  }

  function slotTimeMarkup(slot) {
    return '<time datetime="' + new Date(slot.start).toISOString() + '">' + escape(timeFormat.format(slot.start)) + '</time> — ' + (slot.end === null ? '<span aria-label="Время окончания неизвестно">?</span>' : '<time datetime="' + new Date(slot.end).toISOString() + '">' + escape(timeFormat.format(slot.end)) + '</time>');
  }

  function pluralGames(count) {
    const last = count % 10;
    const teen = count % 100;
    return count + ' ' + (teen >= 11 && teen <= 14 ? 'игр' : last === 1 ? 'игра' : last >= 2 && last <= 4 ? 'игры' : 'игр');
  }

  function renderTabs() {
    $('day-tabs').innerHTML = schedule.days.map(day => {
      const isCurrent = state.current && state.current.dayId === day.id;
      return '<button class="day-tab" type="button" data-day="' + day.id + '" aria-controls="schedule-content" aria-pressed="' + (selectedDay === day.id) + '" aria-label="' + day.number + ' ' + escape(day.month) + ', ' + escape(weekdayFormat.format(day.date)) + '"><span class="day-number">' + String(day.number).padStart(2, '0') + '</span><span class="day-text">' + escape(day.month) + '<small>' + escape(weekdayFormat.format(day.date)) + '</small></span>' + (isCurrent ? '<span class="tab-live-dot" aria-label="Идёт сейчас"></span>' : '') + '</button>';
    }).join('') + '<button class="day-tab all-days-tab" type="button" data-day="all" aria-controls="schedule-content" aria-pressed="' + (selectedDay === 'all') + '">Все дни <span aria-hidden="true">↗</span></button>';
  }

  function renderStreamBanner() {
    const titles = {
      active: 'Марафон в прямом эфире',
      before: 'Сейчас не в эфире',
      break: 'Трансляция завершена',
      finished: 'Трансляция завершена',
      unknown: 'Статус эфира неизвестен'
    };
    $('stream-banner').dataset.state = state.phase;
    $('stream-status').textContent = titles[state.phase];
    $('stream-description').textContent = state.current
      ? 'Присоединяйся к трансляции FoxyShadow.'
      : state.next
        ? 'Следующий эфир — ' + dateLabel(state.next.start) + ' в ' + timeFormat.format(state.next.start) + ' по вашему времени.'
        : state.open
          ? 'Время окончания последней игры не указано.'
          : 'Марафон завершён. Спасибо всем, кто был с нами!';
    $('stream-countdown').hidden = !!state.current || !state.next;
    $('stream-countdown').textContent = '';
  }

  function renderBroadcast() {
    renderStreamBanner();
    const current = state.current || state.open;
    const isUnknown = state.phase === 'unknown';
    let nowCard;
    const decoration = '<svg class="now-decoration" viewBox="0 0 88 64" fill="currentColor" aria-hidden="true"><path d="M16 0h8v8h-8zM64 0h8v8h-8zM24 8h8v8h-8zM56 8h8v8h-8zM16 16h56v8H16zM8 24h16v8H8zM32 24h24v8H32zM64 24h16v8H64zM0 32h88v8H0zM0 40h8v16H0zM16 40h56v8H16zM80 40h8v16h-8zM16 48h8v8h-8zM64 48h8v8h-8zM24 56h16v8H24zM48 56h16v8H48z"/></svg>';
    if (current) {
      nowCard = '<article class="now-card ' + (isUnknown ? 'is-unknown' : 'is-live') + '"><p class="eyebrow"><span class="live-dot"></span><span>' + (isUnknown ? 'ПОСЛЕДНЯЯ ЗАПЛАНИРОВАННАЯ ИГРА' : 'СЕЙЧАС ПО РАСПИСАНИЮ · ИГРА #' + current.numberInDay) + '</span></p><h2>' + prettyParticipant(current.participant) + '</h2><p class="now-game">' + escape(current.game) + '<span class="inline-platform">' + escape(current.platform) + '</span></p>' + decoration + '<div class="now-bottom"><span class="now-time">' + slotTimeMarkup(current) + ' <span class="muted">· ' + escape(slotDateLabel(current)) + '</span></span><span id="now-remaining">' + (isUnknown ? 'Окончание неизвестно' : '') + '</span></div>' + (isUnknown ? '' : '<div class="now-progress" role="progressbar" aria-label="Время текущей игры" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="now-progress"></span></div>') + '</article>';
    } else {
      const titles = { before: 'Скоро нажмём START.', break: 'Эфир завершён.', finished: 'Спасибо за игру!' };
      const copy = { before: 'Марафон начнётся ' + (state.next ? dateLabel(state.next.start) + ' в ' + timeFormat.format(state.next.start) : '') + '. Выбирай, что посмотреть.', break: 'Сейчас перерыв. Вернёмся к началу следующей игры.', finished: 'Все игры по расписанию завершены. Любимые игры и участники остаются здесь.' };
      nowCard = '<article class="now-card is-idle"><p class="eyebrow">' + ({ before: 'ДО НАЧАЛА МАРАФОНА', break: 'МЕЖДУ ЭФИРАМИ', finished: 'ИВЕНТ ЗАВЕРШЁН' }[state.phase]) + '</p><h2>' + titles[state.phase] + '</h2><p class="now-game">' + escape(copy[state.phase]) + '</p><div class="now-bottom"><span id="now-remaining"></span><span>Местное время</span></div></article>';
    }
    let nextCard;
    if (state.next) {
      const next = state.next;
      nextCard = '<article class="next-card"><div class="next-heading"><p class="eyebrow">СЛЕДУЮЩИЙ УРОВЕНЬ</p><span id="next-countdown" class="next-countdown"></span></div><h3>' + prettyParticipant(next.participant) + '</h3><p class="next-game">' + escape(next.game) + '</p><div class="next-footer"><span class="next-time">' + escape(timeRange(next)) + (localDate(next.start) !== localDate(Date.now()) || crossesLocalMidnight(next) ? '<br>' + escape(slotDateLabel(next)) : '') + '</span><span>' + badge(next) + '</span><span class="next-arrow" aria-hidden="true">↗</span></div></article>';
    } else {
      nextCard = '<article class="next-card"><div class="next-heading"><p class="eyebrow">ФИНАЛЬНЫЙ УРОВЕНЬ</p><span aria-hidden="true">✦</span></div><h3>Вот это марафон.</h3><p class="next-game">' + (isUnknown ? 'Это последняя игра программы. Время её завершения не указано.' : 'Впереди нет запланированных игр. Спасибо всем, кто был с нами!') + '</p><div class="next-footer"><span class="next-time">' + pluralGames(schedule.slots.length) + ' · ' + schedule.days.length + ' дня</span><span class="next-arrow" aria-hidden="true">♡</span></div></article>';
    }
    $('broadcast').innerHTML = nowCard + nextCard;
    $('slot-announcement').textContent = state.current ? 'Сейчас по расписанию, игра #' + state.current.numberInDay + ': ' + state.current.participant + ', ' + state.current.game : state.open ? 'Последняя запланированная игра: ' + state.open.participant + '. Время окончания неизвестно.' : $('stream-status').textContent + '. ' + $('stream-description').textContent;
    $('jump-label').textContent = state.current ? 'К текущей игре' : state.open ? 'К последней игре' : state.next ? 'К следующей игре' : 'К последней игре';
    $('jump-live-dot').hidden = !state.current;
    $('jump-current').disabled = !state.focus;
  }

  function renderRow(slot, now) {
    const status = core.slotStatus(slot, state, now);
    const statusText = { active: '<span class="live-dot"></span><span>СЕЙЧАС<br>ИГРА #' + slot.numberInDay + '</span>', open: 'Окончание<br>неизвестно', past: '<span class="status-check" aria-hidden="true">✓</span>Игра завершена', upcoming: 'Впереди' }[status];
    const sub = [];
    const differentDate = localDate(slot.start) !== slot.dayId;
    const crossesMidnight = crossesLocalMidnight(slot);
    if (differentDate) sub.push(dateLabel(slot.start, true));
    if (crossesMidnight) sub.push('до ' + dateLabel(slot.end, true));
    if (slot.duration !== null) sub.push(duration(slot.duration));
    else if (status !== 'open') sub.push('конец не указан');
    return '<tr id="' + slot.id + '" class="is-' + status + '" tabindex="-1"' + (status === 'active' ? ' aria-current="true"' : '') + '><td><span class="slot-time">' + slotTimeMarkup(slot) + '</span><span class="slot-subtime ' + (differentDate || crossesMidnight ? 'slot-date' : '') + '">' + escape(sub.join(' · ')) + '</span></td><td><div class="slot-game">' + escape(slot.game) + '</div><span class="slot-participant">' + participant(slot.participant) + '</span></td><td>' + badge(slot) + '</td><td><span class="slot-status">' + statusText + '</span></td></tr>';
  }

  function renderSchedule() {
    if (!schedule) return;
    const query = $('search').value;
    const platform = $('platform').value;
    const now = Date.now();
    const days = selectedDay === 'all' ? schedule.days : schedule.days.filter(day => day.id === selectedDay);
    let count = 0;
    const content = days.map(day => {
      const visible = core.filterSlots(day.slots, query, platform);
      count += visible.length;
      if (!visible.length) return '';
      const dayTitle = day.number + ' ' + day.month;
      return '<div class="day-group">' + (selectedDay === 'all' ? '<h3 class="day-group-title">' + escape(dayTitle) + '<span>' + escape(weekdayFormat.format(day.date)) + '</span></h3>' : '') + '<table class="schedule-table"><caption class="sr-only">Программа на ' + escape(dayTitle) + '. Время в вашем часовом поясе.</caption><colgroup><col class="time-col"><col><col class="platform-col"><col class="status-col"></colgroup><thead><tr><th scope="col">Время · местное</th><th scope="col">Игра / участник</th><th scope="col">Платформа</th><th scope="col">Статус</th></tr></thead><tbody>' + visible.map(slot => renderRow(slot, now)).join('') + '</tbody></table></div>';
    }).join('');
    $('schedule-content').innerHTML = content;
    $('schedule-content').setAttribute('aria-busy', 'false');
    $('empty-state').hidden = count > 0;
    $('result-count').textContent = pluralGames(count);
  }

  function tick() {
    const now = Date.now();
    $('clock').textContent = clockFormat.format(now);
    $('clock').dateTime = new Date(now).toISOString();
    $('clock-zone').textContent = timezoneLabel(now);
    $('clock-zone').title = 'Ваше местное время · ' + clockFormat.resolvedOptions().timeZone;
    if (!schedule) return;
    state = core.getState(schedule, now);
    const newSignature = [state.phase, state.current?.id, state.open?.id, state.next?.id, localDate(now)].join('|');
    if (signature !== newSignature) {
      signature = newSignature;
      if (!manualDay && state.focus) selectedDay = state.focus.dayId;
      renderTabs();
      renderBroadcast();
      renderSchedule();
    }
    if (state.current) {
      const progress = Math.max(0, Math.min(100, 100 * (now - state.current.start) / (state.current.end - state.current.start)));
      $('now-remaining').textContent = 'До конца игры ' + countdown(state.current.end - now);
      $('now-progress').style.width = progress.toFixed(2) + '%';
      $('now-progress').parentElement.setAttribute('aria-valuenow', String(Math.floor(progress)));
    } else if (state.next) {
      const remaining = 'До начала эфира: ' + countdownClock(state.next.start - now);
      $('stream-countdown').textContent = remaining;
      if (state.phase !== 'unknown') $('now-remaining').textContent = remaining;
    }
    if (state.next) $('next-countdown').textContent = 'через ' + countdown(state.next.start - now);
  }

  function applySchedule(text) {
    if (text === source && schedule) return;
    const parsed = core.parseSchedule(text, config.year);
    schedule = parsed;
    source = text;
    signature = '';
    if (selectedDay !== 'all' && !schedule.days.some(day => day.id === selectedDay)) {
      manualDay = false;
      selectedDay = null;
    }
    const oldPlatform = $('platform').value;
    $('platform').innerHTML = '<option value="all">Все платформы</option>' + schedule.platforms.map(platform => '<option value="' + escape(platform) + '">' + escape(platform) + '</option>').join('');
    if (schedule.platforms.includes(oldPlatform)) $('platform').value = oldPlatform;
    $('slot-count').textContent = String(schedule.slots.length).padStart(2, '0');
    $('platform-count').textContent = String(schedule.platforms.length).padStart(2, '0');
    tick();
  }

  function showNotice(text) {
    $('source-notice').textContent = text;
    $('source-notice').hidden = !text;
  }

  async function loadSchedule() {
    if (loading) return;
    loading = true;
    try {
      if (window.location.protocol === 'file:') {
        applySchedule(config.sourceText);
        showNotice('Локальный просмотр: используется сохранённая копия расписания. На сайте данные загружаются из Schedule.txt.');
      } else {
        const response = await fetch('./Schedule.txt', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const text = await response.text();
        applySchedule(text);
        showNotice('');
      }
    } catch (error) {
      if (!schedule && config.sourceText) {
        try {
          applySchedule(config.sourceText);
        } catch (fallbackError) {
          console.error('Schedule fallback:', fallbackError);
        }
      }
      if (schedule) {
        showNotice('Не удалось обновить Schedule.txt. Показана сохранённая версия; повторим попытку через минуту.');
      } else {
        $('stream-status').textContent = 'Статус эфира недоступен';
        $('stream-description').textContent = 'Не удалось загрузить расписание. Попробуй обновить страницу.';
        $('broadcast').innerHTML = '<div class="error-panel"><h3>Не удалось загрузить расписание</h3><p>Проверьте файл Schedule.txt и обновите страницу.</p><a href="./Schedule.txt">Открыть текстовое расписание ↗</a></div>';
        $('schedule-content').setAttribute('aria-busy', 'false');
        $('jump-current').disabled = true;
      }
      console.error('Schedule:', error);
    } finally {
      loading = false;
    }
  }

  function resetFilters() {
    $('search').value = '';
    $('platform').value = 'all';
    renderSchedule();
  }

  $('day-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-day]');
    if (!button) return;
    selectedDay = button.dataset.day;
    manualDay = true;
    // Keep focus on the button when changing days with the keyboard.
    for (const tab of $('day-tabs').querySelectorAll('[data-day]')) tab.setAttribute('aria-pressed', String(tab.dataset.day === selectedDay));
    renderSchedule();
  });
  $('search').addEventListener('input', renderSchedule);
  $('platform').addEventListener('change', renderSchedule);
  $('reset-filters').addEventListener('click', () => {
    resetFilters();
    $('search').focus();
  });
  $('jump-current').addEventListener('click', () => {
    if (!state?.focus) return;
    manualDay = false;
    selectedDay = state.focus.dayId;
    resetFilters();
    renderTabs();
    const row = $(state.focus.id);
    if (row) {
      row.focus({ preventScroll: true });
      row.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
      row.classList.remove('highlight-pulse');
      requestAnimationFrame(() => row.classList.add('highlight-pulse'));
    }
  });
  document.addEventListener('keydown', event => {
    const editable = event.target.closest('input, textarea, select, [contenteditable]');
    if (event.key === '/' && !editable && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      $('search').focus();
    }
    if (event.key === 'Escape' && event.target === $('search')) {
      $('search').value = '';
      renderSchedule();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      tick();
      loadSchedule();
    }
  });
  window.addEventListener('pageshow', tick);
  loadSchedule();
  tick();
  setInterval(tick, 1000);
  setInterval(() => { if (!document.hidden) loadSchedule(); }, 60000);
})();
