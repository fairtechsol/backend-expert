const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Create separate transports for different log levels
const errorTransport = new DailyRotateFile({
  level: 'error',
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const infoTransport = new DailyRotateFile({
  level: 'info',
  filename: 'logs/info-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const debugTransport = new DailyRotateFile({
  level: 'debug',
  filename: 'logs/debug-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const combineTransport = new DailyRotateFile({
  level: 'silly',
  filename: 'logs/combine-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '20d'
});

// Create a logger and add transports
const infoLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    infoTransport,
    combineTransport
  ]
});

const errorLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    errorTransport,
    combineTransport
  ]
});

const debugLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    debugTransport,
    combineTransport
  ]
});

const logger = {
  info: (params) => {
    return infoLogger.info(params);
  },
  error: (params) => {
    return errorLogger.error(params);
  },
  debug: (params) => {
    return debugLogger.debug(params);
  },
};

exports.logger = logger