// Safe string utility functions to prevent undefined trim() errors

export const safeTrim = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value).trim();
};

export const safeString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export const isEmpty = (value: any): boolean => {
  return safeTrim(value) === '';
};

export const isNotEmpty = (value: any): boolean => {
  return !isEmpty(value);
}; 