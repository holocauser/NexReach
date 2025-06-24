import QRCode from 'react-native-qrcode-svg';
import { TicketValidationService, QRCodeData } from '@/lib/ticketValidationService';

/**
 * Test utility for QR scanner functionality
 * This generates sample QR codes for testing ticket validation
 */

export interface TestTicketData {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  ticketType: string;
  userId: string;
  timestamp: string;
}

export const generateTestQRCode = (ticketData: TestTicketData): string => {
  return JSON.stringify(ticketData);
};

// Sample test data for different scenarios
export const sampleTicketData: TestTicketData = {
  ticketId: "550e8400-e29b-41d4-a716-446655440000",
  eventId: "550e8400-e29b-41d4-a716-446655440001", 
  eventTitle: "Tech Conference 2024",
  ticketType: "General Admission",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

export const sampleInvalidTicketData: TestTicketData = {
  ticketId: "invalid-ticket-id",
  eventId: "550e8400-e29b-41d4-a716-446655440001",
  eventTitle: "Tech Conference 2024",
  ticketType: "General Admission",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

export const sampleAlreadyValidatedTicketData: TestTicketData = {
  ticketId: "550e8400-e29b-41d4-a716-446655440003",
  eventId: "550e8400-e29b-41d4-a716-446655440001",
  eventTitle: "Tech Conference 2024",
  ticketType: "VIP Pass",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

export const sampleWrongEventTicketData: TestTicketData = {
  ticketId: "550e8400-e29b-41d4-a716-446655440004",
  eventId: "550e8400-e29b-41d4-a716-446655440005", // Different event
  eventTitle: "Different Event",
  ticketType: "General Admission",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

export const samplePendingTicketData: TestTicketData = {
  ticketId: "550e8400-e29b-41d4-a716-446655440006",
  eventId: "550e8400-e29b-41d4-a716-446655440001",
  eventTitle: "Tech Conference 2024",
  ticketType: "Student Pass",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

export const sampleCancelledTicketData: TestTicketData = {
  ticketId: "550e8400-e29b-41d4-a716-446655440007",
  eventId: "550e8400-e29b-41d4-a716-446655440001",
  eventTitle: "Tech Conference 2024",
  ticketType: "General Admission",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

// Test scenarios
export const testScenarios = [
  {
    name: "Valid Ticket",
    data: sampleTicketData,
    expectedResult: "✅ Success validation",
    description: "Should validate successfully"
  },
  {
    name: "Invalid Ticket ID",
    data: sampleInvalidTicketData,
    expectedResult: "❌ Ticket not found",
    description: "Should fail with invalid ticket ID"
  },
  {
    name: "Already Validated",
    data: sampleAlreadyValidatedTicketData,
    expectedResult: "❌ Already checked in",
    description: "Should fail if already validated"
  },
  {
    name: "Wrong Event",
    data: sampleWrongEventTicketData,
    expectedResult: "❌ Wrong event",
    description: "Should fail for different event"
  },
  {
    name: "Pending Ticket",
    data: samplePendingTicketData,
    expectedResult: "❌ Ticket status is pending",
    description: "Should fail for pending tickets"
  },
  {
    name: "Cancelled Ticket",
    data: sampleCancelledTicketData,
    expectedResult: "❌ Ticket status is cancelled",
    description: "Should fail for cancelled tickets"
  }
];

/**
 * Test QR code decoding
 */
export const testQRCodeDecoding = () => {
  console.log('🧪 Testing QR Code Decoding...');
  
  testScenarios.forEach((scenario, index) => {
    const qrData = generateTestQRCode(scenario.data);
    const decoded = TicketValidationService.decodeQRCode(qrData);
    
    console.log(`\n${index + 1}. ${scenario.name}:`);
    console.log(`   QR Data: ${qrData}`);
    console.log(`   Decoded:`, decoded);
    console.log(`   Expected: ${scenario.expectedResult}`);
    console.log(`   Status: ${decoded ? '✅ Decoded' : '❌ Failed to decode'}`);
  });
};

/**
 * Generate test tickets in database for comprehensive testing
 */
export const generateTestTicketsInDatabase = async () => {
  console.log('🗄️ Generating test tickets in database...');
  
  // This would typically be called from a development environment
  // to populate the database with test data
  const testTickets = [
    {
      id: sampleTicketData.ticketId,
      event_id: sampleTicketData.eventId,
      user_id: sampleTicketData.userId,
      ticket_type: sampleTicketData.ticketType,
      status: 'confirmed',
      attendee_name: 'John Doe',
      attendee_email: 'john@example.com',
      amount: 50.00,
      currency: 'USD'
    },
    {
      id: sampleAlreadyValidatedTicketData.ticketId,
      event_id: sampleAlreadyValidatedTicketData.eventId,
      user_id: sampleAlreadyValidatedTicketData.userId,
      ticket_type: sampleAlreadyValidatedTicketData.ticketType,
      status: 'confirmed',
      validated_at: new Date().toISOString(),
      validated_by: 'test-organizer-id',
      attendee_name: 'Jane Smith',
      attendee_email: 'jane@example.com',
      amount: 100.00,
      currency: 'USD'
    },
    {
      id: samplePendingTicketData.ticketId,
      event_id: samplePendingTicketData.eventId,
      user_id: samplePendingTicketData.userId,
      ticket_type: samplePendingTicketData.ticketType,
      status: 'pending',
      attendee_name: 'Bob Wilson',
      attendee_email: 'bob@example.com',
      amount: 25.00,
      currency: 'USD'
    },
    {
      id: sampleCancelledTicketData.ticketId,
      event_id: sampleCancelledTicketData.eventId,
      user_id: sampleCancelledTicketData.userId,
      ticket_type: sampleCancelledTicketData.ticketType,
      status: 'cancelled',
      attendee_name: 'Alice Brown',
      attendee_email: 'alice@example.com',
      amount: 75.00,
      currency: 'USD'
    }
  ];
  
  console.log('Test tickets data:', testTickets);
  return testTickets;
};

/**
 * Instructions for testing the QR scanner
 */
export const getTestingInstructions = () => {
  return `
QR Scanner Testing Instructions:

1. **Valid Ticket Test**:
   - QR Code: ${generateTestQRCode(sampleTicketData)}
   - Expected: ✅ Success validation

2. **Invalid Ticket Test**:
   - QR Code: ${generateTestQRCode(sampleInvalidTicketData)}
   - Expected: ❌ Ticket not found

3. **Already Validated Test**:
   - QR Code: ${generateTestQRCode(sampleAlreadyValidatedTicketData)}
   - Expected: ❌ Already checked in

4. **Wrong Event Test**:
   - QR Code: ${generateTestQRCode(sampleWrongEventTicketData)}
   - Expected: ❌ Wrong event

5. **Pending Ticket Test**:
   - QR Code: ${generateTestQRCode(samplePendingTicketData)}
   - Expected: ❌ Ticket status is pending

6. **Cancelled Ticket Test**:
   - QR Code: ${generateTestQRCode(sampleCancelledTicketData)}
   - Expected: ❌ Ticket status is cancelled

7. **Malformed Data Test**:
   - QR Code: invalid-json-data
   - Expected: ❌ Invalid QR code format

To test:
1. Generate QR codes using online QR generators with the JSON data above
2. Scan with the app
3. Verify expected results
4. Check database for validation records

Testing Tips:
- Use different QR code generators to test compatibility
- Test with various lighting conditions
- Test with different distances and angles
- Test manual entry with ticket IDs
- Verify scan history functionality
- Test camera controls (flash, switch camera)
- Test error handling and edge cases
  `;
};

/**
 * Performance testing utilities
 */
export const performanceTest = {
  /**
   * Test QR code generation performance
   */
  testQRGeneration: (iterations: number = 1000) => {
    console.log(`🚀 Testing QR generation performance (${iterations} iterations)...`);
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      generateTestQRCode(sampleTicketData);
    }
    
    const end = performance.now();
    const duration = end - start;
    const avgTime = duration / iterations;
    
    console.log(`✅ Generated ${iterations} QR codes in ${duration.toFixed(2)}ms`);
    console.log(`📊 Average time per QR code: ${avgTime.toFixed(4)}ms`);
    
    return { totalTime: duration, averageTime: avgTime };
  },
  
  /**
   * Test QR code decoding performance
   */
  testQRDecoding: (iterations: number = 1000) => {
    console.log(`🚀 Testing QR decoding performance (${iterations} iterations)...`);
    const qrData = generateTestQRCode(sampleTicketData);
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      TicketValidationService.decodeQRCode(qrData);
    }
    
    const end = performance.now();
    const duration = end - start;
    const avgTime = duration / iterations;
    
    console.log(`✅ Decoded ${iterations} QR codes in ${duration.toFixed(2)}ms`);
    console.log(`📊 Average time per decode: ${avgTime.toFixed(4)}ms`);
    
    return { totalTime: duration, averageTime: avgTime };
  }
};

/**
 * Export all test data for easy access
 */
export const testData = {
  valid: sampleTicketData,
  invalid: sampleInvalidTicketData,
  alreadyValidated: sampleAlreadyValidatedTicketData,
  wrongEvent: sampleWrongEventTicketData,
  pending: samplePendingTicketData,
  cancelled: sampleCancelledTicketData,
  scenarios: testScenarios
}; 