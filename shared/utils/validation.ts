export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function isMaxLength(value: string, max: number): boolean {
  return value.trim().length <= max;
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

export function passwordsMatch(a: string, b: string): boolean {
  return a === b;
}
