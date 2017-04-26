// Provide simple facility for controlling log levels
export default class Log {
  static Level = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARNING: 3,
    ERROR: 4,
  };

  static level = 2;

  static setLogLevel(level) {
    Log.level = level;
  }

  static trace() {
    if (Log.level <= Log.Level.TRACE) {
      console.log(...arguments);
    }
  }

  static debug() {
    if (Log.level <= Log.Level.DEBUG) {
      console.log(...arguments);
    }
  }

  static info() {
    if (Log.level <= Log.Level.INFO) {
      console.log(...arguments);
    }
  }

  static warn() {
    if (Log.level <= Log.Level.WARNING) {
      console.warn(...arguments);
    }
  }

  static error() {
    if (Log.level <= Log.Level.ERROR) {
      console.error(...arguments);
    }
  }
}
