/**
 * QR Code Generator Utility for Testing
 * This utility helps generate test QR codes for ticket validation testing
 */

export interface TestTicketData {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  ticketType: string;
  userId: string;
  timestamp: string;
}

export class QRCodeGenerator {
  /**
   * Generate a test ticket QR code data
   */
  static generateTestTicketData(
    ticketId: string,
    eventId: string,
    eventTitle: string = 'Test Event',
    ticketType: string = 'general',
    userId: string = 'test-user-id'
  ): TestTicketData {
    return {
      ticketId,
      eventId,
      eventTitle,
      ticketType,
      userId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convert ticket data to JSON string for QR code
   */
  static toQRCodeString(data: TestTicketData): string {
    return JSON.stringify(data);
  }

  /**
   * Generate a simple ticket ID for testing
   */
  static generateTestTicketId(): string {
    return `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a test event ID
   */
  static generateTestEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a complete test QR code string
   */
  static createTestQRCode(
    eventTitle: string = 'Test Event',
    ticketType: string = 'general'
  ): string {
    const ticketId = this.generateTestTicketId();
    const eventId = this.generateTestEventId();
    const data = this.generateTestTicketData(ticketId, eventId, eventTitle, ticketType);
    return this.toQRCodeString(data);
  }

  /**
   * Generate multiple test QR codes for different scenarios
   */
  static generateTestScenarios(): Array<{ name: string; qrData: string }> {
    return [
      {
        name: 'Valid General Ticket',
        qrData: this.createTestQRCode('Tech Conference 2024', 'general')
      },
      {
        name: 'VIP Ticket',
        qrData: this.createTestQRCode('Tech Conference 2024', 'vip')
      },
      {
        name: 'Workshop Ticket',
        qrData: this.createTestQRCode('React Native Workshop', 'workshop')
      },
      {
        name: 'Simple Ticket ID',
        qrData: this.generateTestTicketId()
      }
    ];
  }
}

/**
 * Instructions for testing:
 * 
 * 1. Use an online QR code generator (like qr-code-generator.com)
 * 2. Copy the output from QRCodeGenerator.createTestQRCode()
 * 3. Generate the QR code
 * 4. Display it on another device or print it
 * 5. Scan with your app to test validation
 * 
 * Example usage:
 * 
 * const qrData = QRCodeGenerator.createTestQRCode('My Test Event', 'vip');
 * console.log('QR Code Data:', qrData);
 * 
 * // Or generate multiple test scenarios
 * const scenarios = QRCodeGenerator.generateTestScenarios();
 * scenarios.forEach(scenario => {
 *   console.log(`${scenario.name}:`, scenario.qrData);
 * });
 */ 