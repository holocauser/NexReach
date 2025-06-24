import QRCode from 'react-native-qrcode-svg';

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

export const sampleTicketData: TestTicketData = {
  ticketId: "550e8400-e29b-41d4-a716-446655440000",
  eventId: "550e8400-e29b-41d4-a716-446655440001", 
  eventTitle: "Tech Conference 2024",
  ticketType: "General Admission",
  userId: "550e8400-e29b-41d4-a716-446655440002",
  timestamp: new Date().toISOString()
};

export const sampleInvalidTicketData = {
  ticketId: "invalid-ticket-id",
  eventId: "invalid-event-id",
  eventTitle: "Invalid Event",
  ticketType: "Invalid Type",
  userId: "invalid-user-id",
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
  eventId: "550e8400-e29b-41d4-a716-446655440005",
  eventTitle: "Different Event",
  ticketType: "General Admission",
  userId: "550e8400-e29b-41d4-a716-446655440002", 
  timestamp: new Date().toISOString()
};

/**
 * Generate test QR codes for different scenarios
 */
export const generateTestScenarios = () => {
  return {
    validTicket: generateTestQRCode(sampleTicketData),
    invalidTicket: JSON.stringify(sampleInvalidTicketData),
    alreadyValidated: generateTestQRCode(sampleAlreadyValidatedTicketData),
    wrongEvent: generateTestQRCode(sampleWrongEventTicketData),
    malformedData: "invalid-json-data",
    emptyData: "",
  };
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
   - QR Code: ${JSON.stringify(sampleInvalidTicketData)}
   - Expected: ❌ Ticket not found

3. **Already Validated Test**:
   - QR Code: ${generateTestQRCode(sampleAlreadyValidatedTicketData)}
   - Expected: ❌ Already checked in

4. **Wrong Event Test**:
   - QR Code: ${generateTestQRCode(sampleWrongEventTicketData)}
   - Expected: ❌ Wrong event

5. **Malformed Data Test**:
   - QR Code: invalid-json-data
   - Expected: ❌ Invalid QR code format

To test:
1. Generate QR codes using online QR generators
2. Scan with the app
3. Verify expected results
4. Check database for validation records
  `;
};

export default {
  generateTestQRCode,
  sampleTicketData,
  generateTestScenarios,
  getTestingInstructions
}; 