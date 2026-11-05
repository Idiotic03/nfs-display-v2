document.addEventListener('DOMContentLoaded', function () {
  var elements = [
    document.getElementById('duplicate-complete-zia'),
    document.getElementById('news-box')
  ];

  var currentIndex = 0;
  var newsFiles = [];
  var cycleTimer = null;
  var currentAnnouncement = '';
  var currentAnnouncementPeriod = '';
  var cycleRequestId = 0;

  function normalizeFiles(files) {
    var normalized = [];
    var seen = {};

    (files || []).forEach(function (file) {
      if (typeof file !== 'string') return;
      var clean = file.trim();
      if (!clean || seen[clean]) return;
      seen[clean] = true;
      normalized.push(clean);
    });

    return normalized;
  }

  function resolveContentPath(fileName) {
    if (!fileName) return '';
    var file = String(fileName).trim().replace(/\\/g, '/');
    if (!file) return '';
    if (file.indexOf('contents/') === 0 || file.indexOf('/contents/') !== -1) return file;
    if (file.indexOf('contents') === 0) return file;
    return 'contents/' + file;
  }

  function getLocalMonday(d) {
    var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = date.getDay();
    var diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function parseDateAsLocal(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    var parts = String(dateStr).trim().split('-');
    if (parts.length === 3) {
      var year = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1;
      var day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
    var parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function isAWeek(nowDate) {
    nowDate = nowDate || new Date();
    var config = window.WEEK_CONFIG || {};
    var curMonday = getLocalMonday(nowDate);
    var curMondayStr = curMonday.getFullYear() + '-' +
      ('0' + (curMonday.getMonth() + 1)).slice(-2) + '-' +
      ('0' + curMonday.getDate()).slice(-2);

    var refDateStr = config.referenceDate || config.startDate;
    var refWeek = (config.referenceWeek || config.startWeek || '').toUpperCase();

    var configuredType = (config.currentType || '').toUpperCase();
    if (!refDateStr && (configuredType === 'A' || configuredType === 'B')) {
      try {
        var lastSaved = window.localStorage ? window.localStorage.getItem('week_config_saved_type') : null;
        if (lastSaved !== configuredType && window.localStorage) {
          window.localStorage.setItem('week_config_saved_type', configuredType);
          window.localStorage.setItem('week_config_anchor_monday', curMondayStr);
          window.localStorage.setItem('week_config_anchor_type', configuredType);
        }
      } catch (e) {
        // LocalStorage may be unavailable in some environments
      }
    }

    var baseMonday;
    var baseType;

    if (refDateStr) {
      var parsedRef = parseDateAsLocal(refDateStr);
      baseMonday = parsedRef ? getLocalMonday(parsedRef) : getLocalMonday(new Date(2026, 3, 6));
      baseType = (refWeek === 'B') ? 'B' : 'A';
    } else {
      var anchorMonday = null;
      var anchorType = null;
      try {
        if (window.localStorage) {
          anchorMonday = window.localStorage.getItem('week_config_anchor_monday');
          anchorType = window.localStorage.getItem('week_config_anchor_type');
        }
      } catch (e) {}

      if (anchorMonday && anchorType && (configuredType === 'A' || configuredType === 'B')) {
        var parsedAnchor = parseDateAsLocal(anchorMonday);
        baseMonday = parsedAnchor ? getLocalMonday(parsedAnchor) : getLocalMonday(new Date(2026, 3, 6));
        baseType = anchorType;
      } else {
        baseMonday = getLocalMonday(new Date(2026, 3, 6));
        baseType = (refWeek === 'B' || configuredType === 'B') ? 'B' : 'A';
      }
    }

    var diffMs = curMonday.getTime() - baseMonday.getTime();
    var weeksPassed = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    var isEven = (Math.abs(weeksPassed) % 2 === 0);

    if (baseType === 'B') {
      return isEven ? 'B' : 'A';
    }
    return isEven ? 'A' : 'B';
  }

  function getCurrentType(now) {
    now = now || new Date();
    var config = window.WEEK_CONFIG || {};
    var mode = (config.mode || 'AUTO').toUpperCase();

    if (mode === 'MANUAL') {
      return config.currentType || 'REGULAR';
    }

    return isAWeek(now);
  }

  function getWeekConfig() {
    var config = window.WEEK_CONFIG || {};
    var types = config.types || {};
    var type = getCurrentType();

    if (types[type]) {
      return types[type];
    }

    if (config.mode === 'MANUAL' && config.currentType) {
      return { label: config.currentType, color: '#0275d8' };
    }

    return { label: type + '-WEEK', color: '#0275d8' };
  }

  function makeBlock(start, end, label, periodWord) {
    return { start: start, end: end, label: label, periodWord: periodWord || '' };
  }

  function getScheduleBlocks(type, day) {
    var monday = day === 1;
    var friday = day === 5;
    var blocks;

    if (day < 1 || day > 5) return [];

    if (type === 'A' || type === 'B' || type === 'REGULAR') {
      if ((type === 'A' || type === 'REGULAR') && monday) {
        blocks = [
          makeBlock('09:15', '10:25', '1st Period', 'first'),
          makeBlock('10:26', '11:40', '2nd Period', 'second'),
          makeBlock('11:41', '12:16', 'Advisory'),
          makeBlock('12:17', '12:53', 'Lunch'),
          makeBlock('12:54', '14:27', '3rd Period', 'third'),
          makeBlock('14:28', '16:00', '4th Period', 'fourth')
        ];
      } else if ((type === 'A' || type === 'REGULAR') && friday) {
        blocks = [
          makeBlock('09:15', '10:10', '1st Period', 'first'),
          makeBlock('10:11', '11:10', '2nd Period', 'second'),
          makeBlock('11:11', '12:16', 'Discovery Hour'),
          makeBlock('12:17', '12:53', 'Lunch'),
          makeBlock('12:54', '14:27', '3rd Period', 'third'),
          makeBlock('14:28', '16:00', '4th Period', 'fourth')
        ];
      } else if (type === 'B' && monday) {
        blocks = [
          makeBlock('09:15', '10:43', '1st Period', 'first'),
          makeBlock('10:44', '12:16', '2nd Period', 'second'),
          makeBlock('12:17', '12:53', 'Lunch'),
          makeBlock('12:54', '13:29', 'Advisory'),
          makeBlock('13:30', '14:45', '3rd Period', 'third'),
          makeBlock('14:46', '16:00', '4th Period', 'fourth')
        ];
      } else if (type === 'B' && friday) {
        blocks = [
          makeBlock('09:15', '10:10', '1st Period', 'first'),
          makeBlock('10:11', '11:10', '2nd Period', 'second'),
          makeBlock('11:11', '11:45', 'Lunch'),
          makeBlock('11:46', '12:50', 'Discovery Hour'),
          makeBlock('12:51', '13:59', '3rd Period', 'third'),
          makeBlock('14:04', '16:00', '4th Period', 'fourth')
        ];
      } else if (type === 'B') {
        blocks = [
          makeBlock('09:15', '10:43', '1st Period', 'first'),
          makeBlock('10:48', '12:16', '2nd Period', 'second'),
          makeBlock('12:23', '12:53', 'Lunch'),
          makeBlock('12:59', '13:29', 'Tutoring'),
          makeBlock('13:34', '14:45', '3rd Period', 'third'),
          makeBlock('14:50', '16:00', '4th Period', 'fourth')
        ];
      } else {
        blocks = [
          makeBlock('09:15', '10:25', '1st Period', 'first'),
          makeBlock('10:30', '11:40', '2nd Period', 'second'),
          makeBlock('11:45', '12:16', 'Tutoring'),
          makeBlock('12:23', '12:53', 'Lunch'),
          makeBlock('12:59', '14:27', '3rd Period', 'third'),
          makeBlock('14:32', '16:00', '4th Period', 'fourth')
        ];
      }
      return blocks;
    }

    if (type === 'EVENT') {
      return [
        makeBlock('09:15', '10:21', '1st Period', 'first'),
        makeBlock('10:26', '11:31', '2nd Period', 'second'),
        makeBlock('11:36', '12:16', 'Event'),
        makeBlock('12:23', '12:53', 'Lunch'),
        makeBlock('12:59', '14:27', '3rd Period', 'third'),
        makeBlock('14:32', '16:00', '4th Period', 'fourth')
      ];
    }

    if (type === 'GARDEN') {
      return [
        makeBlock('09:15', '10:43', '1st Period', 'first'),
        makeBlock('10:48', '12:16', '2nd Period', 'second'),
        makeBlock('12:23', '12:53', 'Lunch'),
        makeBlock('12:59', '14:09', '3rd Period', 'third'),
        makeBlock('14:10', '14:50', 'Garden'),
        makeBlock('14:55', '16:00', '4th Period', 'fourth')
      ];
    }

    if (type === 'LONG_ADVISORY') {
      return [
        makeBlock('09:15', '09:55', 'Long Advisory'),
        makeBlock('10:00', '11:05', '1st Period', 'first'),
        makeBlock('11:10', '12:16', '2nd Period', 'second'),
        makeBlock('12:23', '12:53', 'Lunch'),
        makeBlock('12:59', '14:27', '3rd Period', 'third'),
        makeBlock('14:32', '16:00', '4th Period', 'fourth')
      ];
    }

    if (type === 'DELAYED') {
      return [
        makeBlock('11:15', '12:13', '1st Period', 'first'),
        makeBlock('12:20', '12:50', 'Lunch'),
        makeBlock('12:56', '13:54', '2nd Period', 'second'),
        makeBlock('13:59', '14:57', '3rd Period', 'third'),
        makeBlock('15:02', '16:00', '4th Period', 'fourth')
      ];
    }

    return [];
  }

  function getCurrentBlock(now) {
    now = now || new Date();
    var blocks = getScheduleBlocks(getCurrentType(), now.getDay());
    var currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (var i = 0; i < blocks.length; i++) {
      var startParts = blocks[i].start.split(':');
      var endParts = blocks[i].end.split(':');
      var startMinutes = Number(startParts[0]) * 60 + Number(startParts[1]);
      var endMinutes = Number(endParts[0]) * 60 + Number(endParts[1]);
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return blocks[i];
    }
    return null;
  }

  function updateCurrentPeriod() {
    var status = document.getElementById('current-period-label');
    var block = getCurrentBlock();
    var periodLabel = block && block.periodWord ? block.label : '';
    var announcement = block && block.periodWord
      ? 'It is currently ' + block.label + '. Please report to your ' + block.periodWord + ' period class.'
      : '';

    if (status) status.textContent = block ? block.label : '';
    if (announcement === currentAnnouncement) return;

    currentAnnouncement = announcement;
  currentAnnouncementPeriod = periodLabel;
    currentIndex = currentAnnouncement ? newsFiles.length : 0;
    if (cycleTimer) clearTimeout(cycleTimer);
    cycleThroughNews();
  }

  function updateWeekLabel() {
    var config = getWeekConfig();
    var currentType = getCurrentType();
    var container = document.getElementById('week-label-container');
    var label = document.getElementById('week-label');
    if (!container || !label) return;

    var displayLabel = config.label || 'A-WEEK';
    if (displayLabel.indexOf('BELL SCHEDULE') === -1 && displayLabel.indexOf('Bell Schedule') === -1) {
      displayLabel += ' BELL SCHEDULE';
    }

    label.textContent = displayLabel;

    container.className = container.className
      .replace(/\ba-week\b/g, '')
      .replace(/\bb-week\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (currentType === 'A') {
      container.classList.add('a-week');
    } else if (currentType === 'B') {
      container.classList.add('b-week');
    }

    container.style.backgroundColor = config.color || '#0275d8';
  }
  updateWeekLabel();
  setInterval(updateWeekLabel, 60000);
  updateCurrentPeriod();
  setInterval(updateCurrentPeriod, 1000);

  function xhrGet(url, asJson, cb) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          if (asJson) {
            try {
              cb(null, JSON.parse(xhr.responseText));
            } catch (e) {
              cb(null, []);
            }
            return;
          }

          cb(null, xhr.responseText);
          return;
        }

        cb(new Error('HTTP ' + xhr.status));
      };
      xhr.onerror = function () { cb(new Error('Network error')); };
      xhr.send(null);
    } catch (err) {
      cb(err);
    }
  }

  function loadNewsFiles() {
    xhrGet('filelist.json', true, function (err, files) {
      if (err) {
        console.log('Error fetching file list:', err);
        return;
      }

      newsFiles = normalizeFiles(files);
      currentIndex = currentAnnouncement ? newsFiles.length : 0;
      cycleThroughNews();
    });
  }

  function fetchNewsContent(fileName, cb) {
    var candidatePath = resolveContentPath(fileName);
    xhrGet(candidatePath, false, function (err, text) {
      if (err || !text || !text.trim()) {
        console.log('Error fetching news:', err || 'empty content', candidatePath);
        cb(null, '<div class="event-html">Unable to load: ' + (fileName || 'content') + '</div>');
        return;
      }

      cb(null, text);
    });
  }

  function hideNewsElements() {
    elements.forEach(function (element) {
      if (element) element.classList.remove('visible');
    });
  }

  function showNewsElements() {
    elements.forEach(function (element) {
      if (element) element.classList.add('visible');
    });
  }

  function cycleThroughNews() {
    var newsBox = document.getElementById('news-box');
    var slides = newsFiles.slice();
    if (currentAnnouncement) {
      slides.push({ announcement: currentAnnouncement, period: currentAnnouncementPeriod });
    }
    if (!newsBox) return;
    if (slides.length === 0) {
      newsBox.innerHTML = '';
      hideNewsElements();
      return;
    }

    currentIndex = currentIndex % slides.length;
    var slide = slides[currentIndex];
    var requestId = ++cycleRequestId;
    var displayContent = function (content, announcementPeriod) {
      if (requestId !== cycleRequestId) return;
      newsBox.innerHTML = '';
      var wrapper = document.createElement('div');
      wrapper.className = announcementPeriod ? 'event-html schedule-announcement' : 'event-html';
      if (announcementPeriod) {
        var icon = document.createElement('div');
        icon.className = 'announcement-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '\uD83D\uDCDA';

        var copy = document.createElement('div');
        copy.className = 'announcement-copy';

        var kicker = document.createElement('div');
        kicker.className = 'announcement-kicker';
        kicker.textContent = 'IT IS CURRENTLY';

        var period = document.createElement('div');
        period.className = 'announcement-period';
        period.textContent = announcementPeriod;

        var instruction = document.createElement('div');
        instruction.className = 'announcement-instruction';
        instruction.textContent = content.replace(/^It is currently .+?\. /, '');

        copy.appendChild(kicker);
        copy.appendChild(period);
        copy.appendChild(instruction);
        wrapper.appendChild(icon);
        wrapper.appendChild(copy);
      } else {
        wrapper.innerHTML = (content || '');
      }
      newsBox.appendChild(wrapper);

      showNewsElements();

      if (cycleTimer) {
        clearTimeout(cycleTimer);
      }

      cycleTimer = setTimeout(function () {
        hideNewsElements();
        var currentSlides = newsFiles.slice();
        if (currentAnnouncement) {
          currentSlides.push({ announcement: currentAnnouncement, period: currentAnnouncementPeriod });
        }
        currentIndex = currentSlides.length ? (currentIndex + 1) % currentSlides.length : 0;
        cycleTimer = setTimeout(cycleThroughNews, 10000);
      }, 10000);
    };

    if (slide && slide.announcement) displayContent(slide.announcement, slide.period);
    else fetchNewsContent(slide, function (_err, content) {
      displayContent(content, '');
    });
  }

  loadNewsFiles();
});