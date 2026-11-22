export const pick = (object, keys) =>
  Object.fromEntries(keys.filter((key) => object[key] !== undefined).map((key) => [key, object[key]]));
