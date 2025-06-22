// Debug utility for name detection issues
export const debugNameDetection = (sampleText: string) => {
  console.log('🔍 DEBUG: Testing name detection with sample text');
  console.log('📝 Sample text:', sampleText);
  
  const lines = sampleText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log('📋 Lines found:', lines);
  
  // Test the same patterns as in the scan function
  const regexPatterns = {
    name: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+$/,
    nameSimple: /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,
    nameWithMiddle: /^[A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+$/,
    nameWithHyphen: /^[A-Z][a-z]+-[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/,
    nameWithApostrophe: /^[A-Z][a-z]+'[a-z]+\s+[A-Z][a-z]+$/,
    nameWithTitle: /^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Miss)\s+[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+$/,
    nameWithSuffix: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+\s+(Jr\.|Sr\.|II|III|IV|V)$/,
    nameWithNumbers: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)$/,
    // ALL CAPS name patterns
    nameAllCaps: /^[A-Z]+\s+[A-Z]+$/,
    nameAllCapsWithMiddle: /^[A-Z]+\s+[A-Z]\s+[A-Z]+$/,
    nameAllCapsWithTitle: /^(DR|PROF|MR|MRS|MS|MISS)\s+[A-Z]+\s+[A-Z]+$/,
  };
  
  const titleWords = [
    'director', 'manager', 'president', 'ceo', 'cfo', 'attorney', 'lawyer', 
    'doctor', 'dr', 'md', 'engineer', 'consultant', 'specialist', 'coordinator', 
    'assistant', 'associate', 'partner', 'founder', 'owner'
  ];
  
  let foundName = '';
  
  lines.forEach((line, index) => {
    console.log(`\n🔍 Testing line ${index}: "${line}"`);
    
    // Test each pattern
    Object.entries(regexPatterns).forEach(([patternName, pattern]) => {
      const matches = pattern.test(line);
      console.log(`  ${patternName}: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
      if (matches && !foundName) {
        foundName = line;
        console.log(`  🎯 FOUND NAME: ${line}`);
      }
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
    if (fallbackMatch && !foundName) {
      foundName = line;
      console.log(`  🎯 FOUND NAME (fallback): ${line}`);
    }
  });
  
  console.log(`\n🎯 FINAL RESULT: ${foundName || 'No name found'}`);
  return foundName;
};

// Sample business card texts for testing
export const sampleBusinessCards = [
  {
    name: 'John Doe',
    text: `John Doe
CEO
Acme Corporation
john.doe@acme.com
(555) 123-4567`
  },
  {
    name: 'Dr. Sarah Johnson',
    text: `Dr. Sarah Johnson
Senior Manager
Tech Solutions Inc.
sarah.johnson@techsolutions.com
555-987-6543`
  },
  {
    name: 'Robert A. Smith',
    text: `Robert A. Smith
Marketing Director
Global Industries
robert.smith@global.com
(555) 456-7890`
  },
  {
    name: 'MELISSA HIDALGO',
    text: `MAM
THE INJURY ASSISTANCE LAW FIRM
Injuryassi
MELISSA HIDALGO
Director of Business Development
mhidalgo@injuryassistance.org
321-234-2900
407-747-3057
407-826-1607
ORLANDO
823 N. Thornton Avenue
Orlando, FL 32803
WINTER HAVEN, FL
20 3rd Street SW, Ste 302
Winter Haven, FL 33880
MWEN PALE KREVÓL
HABLAMOS ESPAÑOL`
  }
];

// Test all sample cards
export const testAllSampleCards = () => {
  console.log('🧪 Testing all sample business cards...');
  sampleBusinessCards.forEach((card, index) => {
    console.log(`\n=== Testing Card ${index + 1}: ${card.name} ===`);
    const foundName = debugNameDetection(card.text);
    console.log(`Expected: ${card.name}, Found: ${foundName}`);
    console.log(`✅ ${foundName === card.name ? 'PASS' : 'FAIL'}`);
  });
}; 