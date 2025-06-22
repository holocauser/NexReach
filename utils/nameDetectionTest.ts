// Test utility for name detection patterns
export const testNameDetection = (text: string) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const regexPatterns = {
    name: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+$/,
    nameSimple: /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,
    nameWithMiddle: /^[A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+$/,
    nameWithHyphen: /^[A-Z][a-z]+-[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/,
    nameWithApostrophe: /^[A-Z][a-z]+'[a-z]+\s+[A-Z][a-z]+$/,
  };
  
  const titleWords = [
    'director', 'manager', 'president', 'ceo', 'cfo', 'attorney', 'lawyer', 
    'doctor', 'dr', 'md', 'engineer', 'consultant', 'specialist', 'coordinator', 
    'assistant', 'associate', 'partner', 'founder', 'owner'
  ];
  
  console.log('🧪 Testing name detection patterns...');
  console.log('📝 Input text:', text);
  console.log('📋 Lines found:', lines);
  
  lines.forEach((line, index) => {
    console.log(`\n🔍 Testing line ${index}: "${line}"`);
    
    // Test each pattern
    Object.entries(regexPatterns).forEach(([patternName, pattern]) => {
      const matches = pattern.test(line);
      console.log(`  ${patternName}: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
    });
    
    // Test fallback pattern
    const fallbackMatch = (
      line.length >= 4 && 
      line.length <= 50 && 
      /^[A-Z][a-z]/.test(line) && // Starts with capital letter
      !/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g.test(line) && // Not an email
      !/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g.test(line) && // Not a phone number
      !/(www\.|https?:\/\/)[^\s]+/gi.test(line) && // Not a website
      !/\d+.*\b(st|street|ave|avenue|rd|road|blvd|boulevard|suite|ste|floor|fl)\b/i.test(line) && // Not an address
      !titleWords.some(word => line.toLowerCase().includes(word)) && // Not a title
      /^[A-Za-z\s\-'\.]+$/.test(line) && // Only letters, spaces, hyphens, apostrophes, periods
      (line.split(' ').length >= 2 && line.split(' ').length <= 4) // 2-4 words
    );
    
    console.log(`  fallback: ${fallbackMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
  });
  
  return lines;
};

// Common name formats to test
export const testNameFormats = () => {
  const testNames = [
    'John Doe',
    'Mary Jane Smith',
    'Robert A. Johnson',
    'Sarah O\'Connor',
    'Jean-Pierre Dubois',
    'Dr. Michael Brown',
    'Prof. Emily Davis',
    'John Smith Jr.',
    'Maria Garcia-Lopez',
    'David van der Berg',
    'Li Wei Chen',
    'Aisha Al-Rashid',
    'José María Rodríguez',
    'Anna-Maria Schmidt',
    'William H. Gates III',
    'Elizabeth II',
    'John Q. Public',
    'Mary Jane Watson',
    'Robert Downey Jr.',
    'Catherine Zeta-Jones'
  ];
  
  console.log('🧪 Testing common name formats...');
  testNames.forEach(name => {
    console.log(`\nTesting: "${name}"`);
    testNameDetection(name);
  });
}; 