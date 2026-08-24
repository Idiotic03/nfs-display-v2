document.addEventListener('DOMContentLoaded', function () {
  var elements = [];
  var e2 = document.getElementById('duplicate-zia-lines');
  var e3 = document.getElementById('news-box');
  if (e2) elements.push(e2);
  if (e3) elements.push(e3);

  var currentIndex = 0;
  var newsFiles = [];
  var cycleTimer = null;

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
      if (newsFiles.length > 0) {
        cycleThroughNews();
      }
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
    if (!newsBox || newsFiles.length === 0) return;

    fetchNewsContent(newsFiles[currentIndex], function (_err, content) {
      newsBox.innerHTML = '';
      var wrapper = document.createElement('div');
      wrapper.className = 'event-html';
      wrapper.innerHTML = (content || '');
      newsBox.appendChild(wrapper);

      showNewsElements();

      if (cycleTimer) {
        clearTimeout(cycleTimer);
      }

      cycleTimer = setTimeout(function () {
        hideNewsElements();
        currentIndex = (currentIndex + 1) % newsFiles.length;
        cycleTimer = setTimeout(cycleThroughNews, 10000);
      }, 10000);
    });
  }

  loadNewsFiles();
});