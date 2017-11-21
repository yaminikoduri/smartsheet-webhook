const config = require('../config/config');

const noop = function () {};

const consoleLog = config.logging ? console.log.bind(console) : noop;

function logger() {
  const logLevel = {
    info: 'INFO',
    warning: 'WARNING',
    error: 'ERROR',
  };

  function log(type, message) {
    consoleLog(`[${type}] ${message}`);
  }

  function info(message) {
    log(logLevel.info, message);
  }

  function warning(message) {
    log(logLevel.warning, message);
  }

  function error(message) {
    log(logLevel.error, message);
  }

  return { info, warning, error };
}

module.exports = logger();
