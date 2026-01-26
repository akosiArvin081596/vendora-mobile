export const DEFAULT_TIME_ZONE = 'Asia/Manila';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const withDefaultTimeZone = (options) => {
  if (isPlainObject(options) && options.timeZone) {
    return options;
  }

  return {
    ...(isPlainObject(options) ? options : {}),
    timeZone: DEFAULT_TIME_ZONE,
  };
};

const wrapDateMethod = (methodName) => {
  const original = Date.prototype[methodName];

  if (typeof original !== 'function') {
    return;
  }

  Date.prototype[methodName] = function (locales, options) {
    return original.call(this, locales, withDefaultTimeZone(options));
  };
};

wrapDateMethod('toLocaleString');
wrapDateMethod('toLocaleDateString');
wrapDateMethod('toLocaleTimeString');
