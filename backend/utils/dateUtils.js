/**
 * Returns current date in YYYY-MM-DD format based on IST.
 */
export function getISTDateStr(date = new Date()) {
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10);
}

/**
 * Returns current time in HH:MM:SS format based on IST.
 */
export function getISTTimeStr(date = new Date()) {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().slice(11, 19);
}
