export function mixin<T>(baseClass: new (...args: any[]) => T, ...mixins: any[]) {
  return mixins.reduce((accumulator, currentValue) => {
    return currentValue(
      accumulator,
    );
  }, baseClass);
}
