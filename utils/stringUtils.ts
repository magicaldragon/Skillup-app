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

// Enhanced Vietnamese name handling for username generation
export const generateVietnameseUsername = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // Vietnamese character mappings for better pronunciation
  const vietnameseMap: { [key: string]: string } = {
    // Vowels with diacritics
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    
    // Consonants with diacritics
    'đ': 'd',
    
    // Common Vietnamese name patterns
    'thị': 'thi', 'văn': 'van', 'đức': 'duc', 'minh': 'minh',
    'hoàng': 'hoang', 'nguyễn': 'nguyen', 'trần': 'tran', 'lê': 'le',
    'phạm': 'pham', 'huỳnh': 'huynh', 'võ': 'vo', 'đặng': 'dang'
  };

  let processedName = fullName.toLowerCase().trim();
  
  // Apply Vietnamese character mappings
  Object.entries(vietnameseMap).forEach(([vietnamese, latin]) => {
    processedName = processedName.replace(new RegExp(vietnamese, 'g'), latin);
  });
  
  // Remove remaining diacritics and special characters, but preserve vowels
  processedName = processedName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/[^a-z0-9\s]/g, '') // Keep only letters, numbers, and spaces
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[aeiou]+/g, (match) => match) // Preserve vowel sequences
    .replace(/[bcdfghjklmnpqrstvwxyz]+/g, (match) => match); // Preserve consonant sequences
  
  // Ensure minimum length and add numbers if too short
  if (processedName.length < 3) {
    processedName += 'user';
  }
  
  // Limit length for usability
  if (processedName.length > 20) {
    processedName = processedName.substring(0, 20);
  }
  
  return processedName;
};

// Debounced username generation for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 