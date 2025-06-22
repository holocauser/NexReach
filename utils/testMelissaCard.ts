// Test specifically for the Melissa Hidalgo business card
export const testMelissaCard = () => {
  const melissaCardText = `MAM
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
HABLAMOS ESPAÑOL`;

  console.log('🧪 Testing Melissa Hidalgo business card...');
  
  const lines = melissaCardText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log('📋 Lines found:', lines);
  
  // Test logo detection
  console.log('\n🏷️ Testing logo detection:');
  lines.forEach((line, index) => {
    if (index < 3 && line.length <= 6 && line.split(' ').length === 1 && 
        /^[A-Za-z]+$/.test(line)) {
      console.log(`✅ Logo detected at line ${index}: "${line}"`);
    }
  });
  
  // Test ALL CAPS name pattern specifically
  const nameAllCapsPattern = /^[A-Z]+\s+[A-Z]+$/;
  
  console.log('\n👤 Testing name detection:');
  lines.forEach((line, index) => {
    console.log(`Line ${index}: "${line}"`);
    if (nameAllCapsPattern.test(line)) {
      console.log(`✅ ALL CAPS name pattern matches: "${line}"`);
    }
  });
  
  // Test the specific line "MELISSA HIDALGO"
  const melissaLine = "MELISSA HIDALGO";
  console.log(`\n🔍 Testing specific line: "${melissaLine}"`);
  console.log(`ALL CAPS pattern match: ${nameAllCapsPattern.test(melissaLine)}`);
  
  // Test company detection
  console.log('\n🏢 Testing company detection:');
  const companyCandidates = lines.filter((line, index) => 
    index < 5 && 
    line.length > 4 && 
    line.split(' ').length > 1 &&
    !/^[A-Za-z]+$/.test(line) // Not a single word
  );
  console.log('Company candidates:', companyCandidates);
  
  return {
    logo: 'MAM',
    name: melissaLine,
    company: 'THE INJURY ASSISTANCE LAW FIRM'
  };
}; 