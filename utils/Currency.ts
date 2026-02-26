export function parseCurrency(value: string): number | null {
    // Use a regular expression to remove the dollar sign and any commas
    const cleanedValue = value.replace(/[$€£,\s]/g, '');
  
    // Use parseFloat to convert the cleaned string into a number
    const num = parseFloat(cleanedValue);
  
    // Check if the result is NaN (Not a Number) to handle invalid inputs gracefully
    if (isNaN(num)) {
      return null;
    }
    
    return num;
  }