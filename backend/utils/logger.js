import chalk from 'chalk';

const logger = {
  info: (message, ...args) => {
    console.log(chalk.green(`[INFO] ${new Date().toLocaleTimeString()}:`), message, ...args);
  },
  error: (message, ...args) => {
    console.log(chalk.red.bold(`[ERROR] ${new Date().toLocaleTimeString()}:`), message, ...args);
  },
  warn: (message, ...args) => {
    console.log(chalk.yellow(`[WARN] ${new Date().toLocaleTimeString()}:`), message, ...args);
  },
  debug: (message, ...args) => {
    console.log(chalk.cyan(`[DEBUG] ${new Date().toLocaleTimeString()}:`), message, ...args);
  },
  success: (message, ...args) => {
    console.log(chalk.green.bold(`[SUCCESS] ${new Date().toLocaleTimeString()}:`), message, ...args);
  }
};

export default logger;
