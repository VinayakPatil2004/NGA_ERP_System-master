/**
 * romanUtils - Utility to convert numeric grade strings to Roman numerals.
 */
export const toRoman = (str) => {
    if (!str) return "";
    
    // Extract the numeric part (e.g., "5th" -> "5", "Class 10" -> "10")
    const match = str.match(/\d+/);
    if (!match) return str; // If no number, return original (e.g., "Nursery")
    
    const num = parseInt(match[0]);
    const romanMap = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 
        6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
        11: 'XI', 12: 'XII'
    };
    
    const roman = romanMap[num] || num.toString();
    
    // Check if it was something like "5th Class" -> "V Class"
    return str.replace(match[0] + (str.includes(match[0]+'th') ? 'th' : ''), roman).trim();
};

export const formatGrade = (gradeName) => {
    if (!gradeName) return "";
    const roman = toRoman(gradeName);
    return roman;
};
