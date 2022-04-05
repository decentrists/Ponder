export function unixTimestamp(date = null) {
  return `${Math.floor(date ? date.getTime() : Date.now() / 1000)}`;
}

export function toISOString(date) {
  try {
    return date.toISOString();
  }
  catch (error) {
    return '';
  }
}

export function toDate(dateString) {
  if (!dateString) return null;
  const dateObj = new Date(dateString);
  return Number.isNaN(dateObj.getYear()) ? null : dateObj;
}

/* Returns true if the given array or object is empty or not an object */
export function isEmpty(obj) {
  return (typeof obj !== 'object' || Object.keys(obj).length === 0);
}

export function corsApiHeaders() {
  switch (corsProxyURL()) {
    case 'https://cors.bridged.cc/':
      /* See: https://github.com/gridaco/base/issues/23 */
      return { 'x-cors-grida-api-key': 'MyAPIKey' };
    default:
      return {};
  }
}

export function corsProxyURL() {
  return 'https://corsanywhere.herokuapp.com/';
}

export function withCorsProxy(url) {
  return corsProxyURL() + url;
}
