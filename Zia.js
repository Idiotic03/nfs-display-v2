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

  function isAWeek() {
    var startDate = new Date('2026-04-06');
    var nowDate = new Date();
    var diffInDays = Math.floor((nowDate - startDate) / (1000 * 60 * 60 * 24));
    var weeksPassed = Math.floor(diffInDays / 7);
    return (weeksPassed % 2 === 0) ? 'A' : 'B';
  }

  function getWeekConfig() {
    var config = window.WEEK_CONFIG || {};
    var types = config.types || {};
    var currentType = config.currentType;

    if (currentType && types[currentType]) {
      return types[currentType];
    }

    if (config.mode === 'MANUAL' && currentType && !types[currentType]) {
      return { label: currentType, color: '#0275d8' };
    }

    var autoType = isAWeek();
    return types[autoType] || { label: autoType + '-WEEK', color: '#0275d8' };
  }

  function getCurrentType() {
    var config = window.WEEK_CONFIG || {};
    var types = config.types || {};
    if (config.currentType && (types[config.currentType] || config.mode === 'MANUAL')) {
      return config.currentType;
    }
    return isAWeek();
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
          makeBlock('10:30', '11:40', '2nd Period', 'second'),
          makeBlock('11:45', '12:16', 'Advisory'),
          makeBlock('12:23', '12:53', 'Lunch'),
          makeBlock('12:59', '14:27', '3rd Period', 'third'),
          makeBlock('14:32', '16:00', '4th Period', 'fourth')
        ];
      } else if ((type === 'A' || type === 'REGULAR') && friday) {
        blocks = [
          makeBlock('09:15', '10:10', '1st Period', 'first'),
          makeBlock('10:15', '11:10', '2nd Period', 'second'),
          makeBlock('11:15', '12:16', 'Discovery Hour'),
          makeBlock('12:23', '12:53', 'Lunch'),
          makeBlock('12:59', '14:27', '3rd Period', 'third'),
          makeBlock('14:32', '16:00', '4th Period', 'fourth')
        ];
      } else if (type === 'B' && monday) {
        blocks = [
          makeBlock('09:15', '10:43', '1st Period', 'first'),
          makeBlock('10:48', '12:16', '2nd Period', 'second'),
          makeBlock('12:23', '12:53', 'Lunch'),
          makeBlock('12:59', '13:29', 'Advisory'),
          makeBlock('13:34', '14:45', '3rd Period', 'third'),
          makeBlock('14:50', '16:00', '4th Period', 'fourth')
        ];
      } else if (type === 'B' && friday) {
        blocks = [
          makeBlock('09:15', '10:10', '1st Period', 'first'),
          makeBlock('10:15', '11:10', '2nd Period', 'second'),
          makeBlock('11:15', '11:45', 'Lunch'),
          makeBlock('11:50', '12:50', 'Discovery Hour'),
          makeBlock('12:55', '13:59', '3rd Period', 'third'),
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
