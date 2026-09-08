export function objectOptions(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Options must be an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError(`Unknown option: ${key}`);
  return value;
}

export function integer(value, name, min, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${name} must be an integer from ${min} to ${max}`);
  return value;
}

export function boolean(value, name) {
  if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean`);
  return value;
}

export function choice(value, name, allowed) {
  if (!allowed.includes(value)) throw new RangeError(`${name} must be one of: ${allowed.join(', ')}`);
  return value;
}
