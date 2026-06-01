import chalk from 'chalk';
import logger from '../utils/logger.js';

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    let statusColor = chalk.white;
    if (statusCode >= 200 && statusCode < 300) statusColor = chalk.green;
    else if (statusCode >= 300 && statusCode < 400) statusColor = chalk.cyan;
    else if (statusCode >= 400 && statusCode < 500) statusColor = chalk.yellow;
    else if (statusCode >= 500) statusColor = chalk.red;
    
    const logMessage = `${method} ${originalUrl} ${statusColor(statusCode)} - ${duration}ms`;
    
    if (statusCode >= 400) {
        logger.error(logMessage);
    } else {
        logger.info(logMessage);
    }
  });
  
  next();
};

export default loggerMiddleware;
