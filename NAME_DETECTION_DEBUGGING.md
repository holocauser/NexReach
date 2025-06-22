# Name Detection Debugging Guide

## Issue Description
The scan function is detecting names in the raw text but not populating the name field in the extracted information display.

## Debugging Steps

### 1. **Check Console Logs**
The updated scan function now includes extensive logging. Look for these log messages:

```
🔍 Extracted info before setting state: {name: "John Doe", ...}
🔍 Name field value: John Doe
🔍 Name field type: string
🔍 Extracted data changed: {name: "John Doe", ...}
🔍 Object.entries result: [["name", "John Doe"], ...]
```

### 2. **Use Debug Utility**
Import and use the debug utility to test name detection:

```javascript
import { debugNameDetection, testAllSampleCards } from '@/utils/debugNameDetection';

// Test specific text
debugNameDetection("John Doe\nCEO\njohn.doe@company.com");

// Test all sample cards
testAllSampleCards();
```

### 3. **Check Data Flow**
The data flow should be:
1. Raw text detected by Google Vision API
2. Text processed by `extractBusinessCardData()`
3. Name detected and set in data object
4. Data object set in state with `setExtractedData()`
5. Data displayed in UI using `Object.entries()`

### 4. **Common Issues and Solutions**

#### Issue: Name detected but not displayed
**Possible causes:**
- Name field is empty string instead of undefined
- Data structure is missing the name field
- UI rendering logic has issues

**Solutions:**
- Check console logs for name field value and type
- Ensure name field is always included in data structure
- Verify UI rendering logic handles empty strings

#### Issue: Name not detected at all
**Possible causes:**
- Text format doesn't match any patterns
- Text is being processed incorrectly
- OCR quality issues

**Solutions:**
- Use debug utility to test text patterns
- Check raw detected text quality
- Verify regex patterns match the text format

#### Issue: Name detected in wrong field
**Possible causes:**
- Text is being misclassified
- Multiple lines match name patterns
- Priority order of detection is wrong

**Solutions:**
- Check which pattern is matching
- Verify line processing order
- Test with different text formats

### 5. **Testing Different Name Formats**

Test these common formats:

```javascript
// Basic names
debugNameDetection("John Doe");

// Names with titles
debugNameDetection("Dr. Sarah Johnson");

// Names with middle initials
debugNameDetection("Robert A. Smith");

// Names with suffixes
debugNameDetection("John Smith Jr.");

// Hyphenated names
debugNameDetection("Jean-Pierre Dubois");

// Names with apostrophes
debugNameDetection("Sarah O'Connor");
```

### 6. **Manual Testing Steps**

1. **Scan a business card** and check console logs
2. **Look for these specific log messages:**
   - `🔍 Initial data structure:` - Should show empty name field
   - `👤 Found name (pattern):` - Should show which pattern matched
   - `📊 Final extracted data:` - Should show name field populated
   - `🔍 Extracted data changed:` - Should show name in state

3. **Check the UI display:**
   - Name field should appear in "Extracted Information"
   - Value should show the detected name or "Not detected"

### 7. **If Name is Still Not Showing**

1. **Check the raw text quality:**
   ```javascript
   console.log('📝 Raw detected business card text:', detectedText);
   ```

2. **Test the extraction function directly:**
   ```javascript
   const testData = extractBusinessCardData(detectedText);
   console.log('Test extraction result:', testData);
   ```

3. **Verify the data structure:**
   ```javascript
   console.log('Data structure keys:', Object.keys(extractedData));
   console.log('Name field exists:', 'name' in extractedData);
   ```

### 8. **Common Debugging Commands**

```javascript
// Test specific business card text
debugNameDetection("Your business card text here");

// Test all sample formats
testAllSampleCards();

// Check if name field exists in data
console.log('name' in extractedData);

// Check name field value
console.log('Name value:', extractedData?.name);

// Check name field type
console.log('Name type:', typeof extractedData?.name);
```

### 9. **Expected Behavior**

When working correctly, you should see:
1. Name detected in console logs
2. Name field populated in extracted data
3. Name displayed in UI under "Extracted Information"
4. Name field shows actual name or "Not detected"

### 10. **Reporting Issues**

When reporting name detection issues, include:
1. Raw detected text from console
2. Console logs showing extraction process
3. Screenshot of UI showing missing name
4. Expected name vs detected name
5. Business card format/type

This will help identify the specific issue and provide targeted solutions. 