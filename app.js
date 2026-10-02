(function () {
  'use strict';

  const core = window.ScheduleCore;
  const config = window.RETRO_SCHEDULE;
  const $ = id => document.getElementById(id);
  const clockFormat = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', weekday: 'long' });
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'long' });
  const shortDateFormat = new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'short' });
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

  function dateLabel(timestamp, short) {
    return (short ? shortDateFormat : dateFormat).format(timestamp + core.OFFSET_MS);
  }

  function timeRange(slot) {
    return slot.startLabel + ' — ' + (slot.endLabel || '?');
  }

  function slotTimeMarkup(slot) {
    return '<time datetime="' + new Date(slot.start).toISOString() + '">' + escape(slot.startLabel) + '</time> — ' + (slot.end === null ? '<span aria-label="Время окончания неизвестно">?</span>' : '<time datetime="' + new Date(slot.end).toISOString() + '">' + escape(slot.endLabel) + '</time>');
  }

  function pluralSlots(count) {
    const last = count % 10;
    const teen = count % 100;
    return count + ' ' + (teen >= 11 && teen <= 14 ? 'слотов' : last === 1 ? 'слот' : last >= 2 && last <= 4 ? 'слота' : 'слотов');
  }

  function renderTabs() {
    $('day-tabs').innerHTML = schedule.days.map(day => {
      const isCurrent = state.current && state.current.dayId === day.id;
      return '<button class="day-tab" type="button" data-day="' + day.id + '" aria-controls="schedule-content" aria-pressed="' + (selectedDay === day.id) + '" aria-label="' + day.number + ' ' + escape(day.month) + ', ' + escape(weekdayFormat.format(day.date)) + '"><span class="day-number">' + String(day.number).padStart(2, '0') + '</span><span class="day-text">' + escape(day.month) + '<small>' + escape(weekdayFormat.format(day.date)) + '</small></span>' + (isCurrent ? '<span class="tab-live-dot" aria-label="Идёт сейчас"></span>' : '') + '</button>';
    }).join('') + '<button class="day-tab all-days-tab" type="button" data-day="all" aria-controls="schedule-content" aria-pressed="' + (selectedDay === 'all') + '">Все дни <span aria-hidden="true">↗</span></button>';
  }

  function renderBroadcast() {
    const current = state.current || state.open;
    const isUnknown = state.phase === 'unknown';
    let nowCard;
    const decoration = '<svg class="now-decoration" viewBox="0 0 88 64" fill="currentColor" aria-hidden="true"><path d="M16 0h8v8h-8zM64 0h8v8h-8zM24 8h8v8h-8zM56 8h8v8h-8zM16 16h56v8H16zM8 24h16v8H8zM32 24h24v8H32zM64 24h16v8H64zM0 32h88v8H0zM0 40h8v16H0zM16 40h56v8H16zM80 40h8v16h-8zM16 48h8v8h-8zM64 48h8v8h-8zM24 56h16v8H24zM48 56h16v8H48z"/></svg>';
    if (current) {
      nowCard = '<article class="now-card ' + (isUnknown ? 'is-unknown' : 'is-live') + '"><p class="eyebrow"><span class="live-dot"></span>' + (isUnknown ? 'ПОСЛЕДНИЙ ЗАПЛАНИРОВАННЫЙ СЛОТ' : 'СЕЙЧАС ПО РАСПИСАНИЮ') + '</p><h2>' + prettyParticipant(current.participant) + '</h2><p class="now-game">' + escape(current.game) + '<span class="inline-platform">' + escape(current.platform) + '</span></p>' + decoration + '<div class="now-bottom"><span class="now-time">' + slotTimeMarkup(current) + ' <span class="muted">· ' + escape(dateLabel(current.start, true)) + '</span></span><span id="now-remaining">' + (isUnknown ? 'Окончание неизвестно' : '') + '</span></div>' + (isUnknown ? '' : '<div class="now-progress" role="progressbar" aria-label="Время текущего слота" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="now-progress"></span></div>') + '</article>';
    } else {
      const titles = { before: 'Скоро нажмём START.', break: 'Пауза между уровнями.', finished: 'Спасибо за игру!' };
      const copy = { before: 'Марафон начнётся ' + (state.next ? dateLabel(state.next.start) + ' в ' + state.next.startLabel : '') + '. Выбирай, что посмотреть.', break: 'Сейчас в расписании перерыв. Следующий участник уже на подходе.', finished: 'Все слоты по расписанию завершены. Любимые игры и участники остаются здесь.' };
      nowCard = '<article class="now-card is-idle"><p class="eyebrow">' + ({ before: 'ДО НАЧАЛА МАРАФОНА', break: 'МЕЖДУ ЭФИРАМИ', finished: 'ИВЕНТ ЗАВЕРШЁН' }[state.phase]) + '</p><h2>' + titles[state.phase] + '</h2><p class="now-game">' + escape(copy[state.phase]) + '</p><div class="now-bottom"><span id="now-remaining"></span><span>UTC+3</span></div></article>';
    }
    let nextCard;
    if (state.next) {
      const next = state.next;
      nextCard = '<article class="next-card"><div class="next-heading"><p class="eyebrow">СЛЕДУЮЩИЙ УРОВЕНЬ</p><span id="next-countdown" class="next-countdown"></span></div><h3>' + prettyParticipant(next.participant) + '</h3><p class="next-game">' + escape(next.game) + '</p><div class="next-footer"><span class="next-time">' + escape(timeRange(next)) + (core.eventDate(next.start) !== core.eventDate(Date.now()) ? '<br>' + escape(dateLabel(next.start, true)) : '') + '</span><span>' + badge(next) + '</span><span class="next-arrow" aria-hidden="true">↗</span></div></article>';
    } else {
      nextCard = '<article class="next-card"><div class="next-heading"><p class="eyebrow">ФИНАЛЬНЫЙ УРОВЕНЬ</p><span aria-hidden="true">✦</span></div><h3>Вот это марафон.</h3><p class="next-game">' + (isUnknown ? 'Это последний слот программы. Время его завершения не указано.' : 'Впереди нет запланированных слотов. Спасибо всем, кто был с нами!') + '</p><div class="next-footer"><span class="next-time">' + pluralSlots(schedule.slots.length) + ' · ' + schedule.days.length + ' дня</span><span class="next-arrow" aria-hidden="true">♡</span></div></article>';
    }
    $('broadcast').innerHTML = nowCard + nextCard;
    $('slot-announcement').textContent = state.current ? 'Сейчас по расписанию: ' + state.current.participant + ', ' + state.current.game : state.open ? 'Последний запланированный слот: ' + state.open.participant + '. Время окончания неизвестно.' : 'Сейчас нет активного слота.';
    $('jump-label').textContent = state.current ? 'К текущему слоту' : state.open ? 'К последнему слоту' : state.next ? 'К следующему слоту' : 'К последнему слоту';
    $('jump-current').disabled = !state.focus;
  }

  function renderRow(slot, now) {
    const status = core.slotStatus(slot, state, now);
    const statusText = { active: '<span class="live-dot"></span>СЕЙЧАС', open: 'Окончание<br>неизвестно', past: '<span class="status-check" aria-hidden="true">✓</span>Слот прошёл', upcoming: 'Впереди' }[status];
    const sub = [];
    if (slot.overnight) sub.push(dateLabel(slot.start, true));
    if (!slot.overnight && slot.endDate && slot.endDate !== slot.actualDate) sub.push('до ' + dateLabel(slot.end, true));
    if (slot.duration !== null) sub.push(duration(slot.duration));
    else if (status !== 'open') sub.push('конец не указан');
    return '<tr id="' + slot.id + '" class="is-' + status + '" tabindex="-1"' + (status === 'active' ? ' aria-current="true"' : '') + '><td><span class="slot-time">' + slotTimeMarkup(slot) + '</span><span class="slot-subtime ' + (slot.overnight ? 'slot-date' : '') + '">' + escape(sub.join(' · ')) + '</span></td><td><div class="slot-game">' + escape(slot.game) + '</div><span class="slot-participant">' + participant(slot.participant) + '</span></td><td>' + badge(slot) + '</td><td><span class="slot-status">' + statusText + '</span></td></tr>';
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
      return '<div class="day-group">' + (selectedDay === 'all' ? '<h3 class="day-group-title">' + escape(dayTitle) + '<span>' + escape(weekdayFormat.format(day.date)) + '</span></h3>' : '') + '<table class="schedule-table"><caption class="sr-only">Расписание на ' + escape(dayTitle) + '. Время UTC+3.</caption><colgroup><col class="time-col"><col><col class="platform-col"><col class="status-col"></colgroup><thead><tr><th scope="col">Время · UTC+3</th><th scope="col">Игра / участник</th><th scope="col">Платформа</th><th scope="col">Статус</th></tr></thead><tbody>' + visible.map(slot => renderRow(slot, now)).join('') + '</tbody></table></div>';
    }).join('');
    $('schedule-content').innerHTML = content;
    $('schedule-content').setAttribute('aria-busy', 'false');
    $('empty-state').hidden = count > 0;
    $('result-count').textContent = pluralSlots(count);
  }

  function tick() {
    const now = Date.now();
    $('clock').textContent = clockFormat.format(now + core.OFFSET_MS);
    $('clock').dateTime = new Date(now).toISOString();
    if (!schedule) return;
    state = core.getState(schedule, now);
    const newSignature = [state.phase, state.current?.id, state.open?.id, state.next?.id, core.eventDate(now)].join('|');
    if (signature !== newSignature) {
      signature = newSignature;
      if (!manualDay && state.focus) selectedDay = state.focus.dayId;
      renderTabs();
      renderBroadcast();
      renderSchedule();
    }
    if (state.current) {
      const progress = Math.max(0, Math.min(100, 100 * (now - state.current.start) / (state.current.end - state.current.start)));
      $('now-remaining').textContent = 'До конца слота ' + countdown(state.current.end - now);
      $('now-progress').style.width = progress.toFixed(2) + '%';
      $('now-progress').parentElement.setAttribute('aria-valuenow', String(Math.floor(progress)));
    } else if (state.phase === 'before' || state.phase === 'break') {
      $('now-remaining').textContent = 'До начала ' + countdown(state.next.start - now);
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
