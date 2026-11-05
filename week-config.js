window.WEEK_CONFIG = {
  // Mode: 'AUTO' or 'MANUAL'
  // - 'AUTO': Automatically alternates between A-WEEK and B-WEEK every Monday.
  // - 'MANUAL': Locks the schedule to whatever is set in 'currentType' below.
  mode: 'AUTO',

  // Current schedule type (used when mode is 'MANUAL', or as the initial week in 'AUTO'):
  // Options: 'A', 'B', 'EVENT', 'GARDEN', 'LONG_ADVISORY', 'DELAYED', 'REGULAR'
  currentType: 'A',

  // AUTO mode reference Monday and week type:
  // Every following Monday, it will automatically alternate (A -> B -> A -> B...)
  referenceDate: '2026-11-02',
  referenceWeek: 'A',

  types: {
    A: { label: 'A-WEEK', color: '#d9534f' },
    B: { label: 'B-WEEK', color: '#0275d8' },
    EVENT: { label: 'EVENT DAY', color: '#f39c12' },
    GARDEN: { label: 'Garden Day', color: '#2ecc71' },
    LONG_ADVISORY: { label: 'Long Advisory', color: '#fffb00' },
    DELAYED: { label: 'Delayed Start', color: '#209aaf' },
    REGULAR: { label: 'Regular Bell Schedule', color: '#9b59b6' }
  }
};
