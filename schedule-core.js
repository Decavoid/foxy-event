/* The parser and clock logic are shared by the browser and the Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScheduleCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const OFFSET_MS = 3 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function minutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    if (hour > 23 || minute > 59) throw new Error('Некорректное время: ' + time);
    return hour * 60 + minute;
  }

  function eventDate(timestamp) {
    return new Date(timestamp + OFFSET_MS).toISOString().slice(0, 10);
  }

  function parseSchedule(text, year) {
    if (!Number.isInteger(year) || year < 2000 || year > 9998) throw new Error('Не указан корректный год ивента.');
    const days = [];
    const slots = [];
    let day = null;
    let rollover = 0;
    let previousStartMinutes = -1;

    // Editors can mix CRLF, LF, and standalone CR line endings in the same file.
    for (const [lineIndex, raw] of text.replace(/^\uFEFF/, '').split(/\r\n?|\n/).entries()) {
      const line = raw.trim();
      if (!line || /^РАСПИСАНИЕ(?:\s|:|$)/iu.test(line) || line.startsWith('#')) continue;
      const heading = line.match(/^-+\s*(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?\s*-+$/iu);
      if (heading) {
        const month = MONTHS.indexOf(heading[2].toLowerCase());
        if (month < 0) throw new Error('Неизвестный месяц в строке ' + (lineIndex + 1));
        const headingYear = heading[3] ? Number(heading[3]) : year;
        const date = new Date(Date.UTC(headingYear, month, Number(heading[1])));
        if (date.getUTCDate() !== Number(heading[1])) throw new Error('Некорректная дата в строке ' + (lineIndex + 1));
        const id = date.toISOString().slice(0, 10);
        if (days.some(item => item.id === id)) throw new Error('Повторяется дата: ' + id);
        day = { id, number: Number(heading[1]), month: heading[2].toLowerCase(), date: date.getTime(), slots: [] };
        days.push(day);
        rollover = 0;
        previousStartMinutes = -1;
        continue;
      }
      // Preserve parentheses in names, ampersands, and the extra slash in Jurassic Park / (SNES).
      const match = line.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(?:(\d{1,2}:\d{2})\s+)?(.+?)\s*\/\s*(.+?)\s*\(([^()]*)\)\s*$/u);
      if (!match || !day) throw new Error('Не удалось разобрать строку ' + (lineIndex + 1) + ': ' + line);
      const startMinutes = minutes(match[1]);
      const endMinutes = match[2] ? minutes(match[2]) : null;
      if (startMinutes < previousStartMinutes) rollover += 1;
      previousStartMinutes = startMinutes;
      const start = day.date + rollover * DAY_MS + startMinutes * 60000 - OFFSET_MS;
      const end = endMinutes === null ? null : day.date + (rollover + (endMinutes <= startMinutes ? 1 : 0)) * DAY_MS + endMinutes * 60000 - OFFSET_MS;
      const [platform, ...tags] = match[5].split(',').map(value => value.trim());
      const game = match[4].replace(/\s*\/\s*$/, '').trim();
      const slot = {
        id: 'slot-' + (slots.length + 1), dayId: day.id, start, end,
        startLabel: match[1].padStart(5, '0'), endLabel: match[2] ? match[2].padStart(5, '0') : null,
        participant: match[3].trim(), game, platform, tags,
        actualDate: eventDate(start), endDate: end === null ? null : eventDate(end),
        overnight: rollover > 0, duration: end === null ? null : (end - start) / 60000,
        searchText: normalize([match[3], game, platform, ...tags].join(' '))
      };
      if (!game || !platform) throw new Error('Не указана игра или платформа в строке ' + (lineIndex + 1));
      const previous = slots[slots.length - 1];
      if (previous && start <= previous.start) throw new Error('Слоты должны идти по порядку времени: ' + line);
      if (previous && previous.end !== null && start < previous.end) throw new Error('Пересекаются слоты: ' + line);
      day.slots.push(slot);
      slots.push(slot);
    }
    if (!slots.length || days.some(item => !item.slots.length)) throw new Error('Расписание не содержит слотов или содержит пустой день.');
    return { days, slots, platforms: [...new Set(slots.map(slot => slot.platform))].sort((a, b) => a.localeCompare(b)) };
  }

  function normalize(value) {
    return value.normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/@/g, '').trim();
  }

  function getState(schedule, now) {
    const { slots } = schedule;
    const current = slots.find(slot => slot.start <= now && slot.end !== null && now < slot.end) || null;
    const next = slots.find(slot => slot.start > now) || null;
    // An open slot is uncertain, not proof that a stream is still live.
    const previous = [...slots].reverse().find(slot => slot.start <= now) || null;
    const open = !current && previous && previous.end === null ? previous : null;
    const phase = current ? 'active' : open ? 'unknown' : next ? (previous ? 'break' : 'before') : 'finished';
    return { current, open, next, previous, phase, focus: current || open || next || previous };
  }

  function slotStatus(slot, state, now) {
    if (state.current && state.current.id === slot.id) return 'active';
    if (state.open && state.open.id === slot.id) return 'open';
    if (now >= slot.start) return 'past';
    return 'upcoming';
  }

  function filterSlots(slots, query, platform) {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return slots.filter(slot => (platform === 'all' || slot.platform === platform) && words.every(word => slot.searchText.includes(word)));
  }

  return { parseSchedule, getState, slotStatus, filterSlots, eventDate, normalize, OFFSET_MS, DAY_MS };
});
