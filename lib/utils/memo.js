module.exports = function fn()  {
  let result = null;

  const singletonFunction = function(...args) {
    if (result) {
      return result;
    }

    result = fn(...args);

    return result;
  };

  Reflect.defineProperty(singletonFunction, 'reset', {
    value: () => {
      result = null;
    },
    writable: false,
    enumerable: true,
    configurable: false
  });

  return singletonFunction;
};
