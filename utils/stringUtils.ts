// Safe string utility functions to prevent undefined trim() errors

export const safeTrim = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

export const safeString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export const isEmpty = (value: unknown): boolean => {
  return safeTrim(value) === '';
};

export const isNotEmpty = (value: unknown): boolean => {
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
    à: 'a',
    á: 'a',
    ả: 'a',
    ã: 'a',
    ạ: 'a',
    ă: 'a',
    ằ: 'a',
    ắ: 'a',
    ẳ: 'a',
    ẵ: 'a',
    ặ: 'a',
    â: 'a',
    ầ: 'a',
    ấ: 'a',
    ẩ: 'a',
    ẫ: 'a',
    ậ: 'a',
    è: 'e',
    é: 'e',
    ẻ: 'e',
    ẽ: 'e',
    ẹ: 'e',
    ê: 'e',
    ề: 'e',
    ế: 'e',
    ể: 'e',
    ễ: 'e',
    ệ: 'e',
    ì: 'i',
    í: 'i',
    ỉ: 'i',
    ĩ: 'i',
    ị: 'i',
    ò: 'o',
    ó: 'o',
    ỏ: 'o',
    õ: 'o',
    ọ: 'o',
    ô: 'o',
    ồ: 'o',
    ố: 'o',
    ổ: 'o',
    ỗ: 'o',
    ộ: 'o',
    ơ: 'o',
    ờ: 'o',
    ớ: 'o',
    ở: 'o',
    ỡ: 'o',
    ợ: 'o',
    ù: 'u',
    ú: 'u',
    ủ: 'u',
    ũ: 'u',
    ụ: 'u',
    ư: 'u',
    ừ: 'u',
    ứ: 'u',
    ử: 'u',
    ữ: 'u',
    ự: 'u',
    ỳ: 'y',
    ý: 'y',
    ỷ: 'y',
    ỹ: 'y',
    ỵ: 'y',

    // Consonants with diacritics
    đ: 'd',

    // Common Vietnamese name patterns (keep these for better pronunciation)
    thị: 'thi',
    văn: 'van',
    đức: 'duc',
    minh: 'minh',
    hoàng: 'hoang',
    nguyễn: 'nguyen',
    trần: 'tran',
    lê: 'le',
    phạm: 'pham',
    huỳnh: 'huynh',
    võ: 'vo',
    đặng: 'dang',
  };

  let processedName = fullName.toLowerCase().trim();

  // Step 1: Apply Vietnamese character mappings first
  Object.entries(vietnameseMap).forEach(([vietnamese, latin]) => {
    processedName = processedName.replace(new RegExp(vietnamese, 'g'), latin);
  });

  // Step 2: Remove combining diacritical marks (NFD normalization)
  processedName = processedName.normalize('NFD');

  // Step 3: Remove all remaining diacritical marks
  processedName = processedName.replace(/[\u0300-\u036f]/g, '');

  // Step 4: Remove special characters and keep only letters, numbers, and spaces
  processedName = processedName.replace(/[^a-z0-9\s]/g, '');

  // Step 5: Remove extra spaces and convert to single spaces
  processedName = processedName.replace(/\s+/g, ' ').trim();

  // Step 6: Remove all spaces to create username
  processedName = processedName.replace(/\s/g, '');

  // Step 7: Ensure minimum length
  if (processedName.length < 3) {
    processedName += 'user';
  }

  // Step 8: Limit length for usability
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

/**
 * Format date to dd/mm/yyyy format
 * @param dateString - Date string or Date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export const formatDateDDMMYYYY = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format date to mm/dd/yyyy format (US format)
 * @param dateString - Date string or Date object
 * @returns Formatted date string in mm/dd/yyyy format
 */
export const formatDateMMDDYYYY = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format date to dd/mm/yyyy hh:mm format
 * @param dateString - Date string or Date object
 * @returns Formatted date string in dd/mm/yyyy hh:mm format
 */
export const formatDateTimeDDMMYYYY = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '-';
  }
};

/**
 * Convert dd/mm/yyyy format to yyyy-mm-dd format for date input
 * @param dateString - Date string in dd/mm/yyyy format
 * @returns Date string in yyyy-mm-dd format
 */
export const convertDDMMYYYYToInputFormat = (dateString: string): string => {
  if (!dateString || !dateString.includes('/')) {
    return dateString;
  }
  
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return dateString;
  }
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Convert yyyy-mm-dd format to dd/mm/yyyy format for display
 * @param dateString - Date string in yyyy-mm-dd format
 * @returns Date string in dd/mm/yyyy format
 */
export const convertInputFormatToDDMMYYYY = (dateString: string): string => {
  if (!dateString || !dateString.includes('-')) {
    return dateString;
  }
  
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return dateString;
  }
  
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Get current date in dd/mm/yyyy format
 * @returns Current date string in dd/mm/yyyy format
 */
export const getCurrentDateDDMMYYYY = (): string => {
  return formatDateDDMMYYYY(new Date());
};

/**
 * Validate date in dd/mm/yyyy format
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export const isValidDDMMYYYYDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
};
