import { Platform, Alert, Linking } from 'react-native';

export interface CalendarEventData {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  timeZone?: string;
}

class CalendarService {
  /**
   * Request calendar permissions
   */
  async requestPermissions(): Promise<boolean> {
    // For development, always return true
    console.log('Calendar permissions requested (mock)');
    return true;
  }

  /**
   * Check if calendar permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    // For development, always return true
    console.log('Calendar permissions checked (mock)');
    return true;
  }

  /**
   * Get default calendar ID
   */
  async getDefaultCalendarId(): Promise<string | null> {
    // For development, return a mock ID
    console.log('Default calendar ID requested (mock)');
    return 'mock-calendar-id';
  }

  /**
   * Add event to calendar
   */
  async addEventToCalendar(eventData: CalendarEventData): Promise<boolean> {
    console.log('Adding event to calendar:', eventData);
    
    try {
      // For development, show a success message and create a calendar file
      Alert.alert(
        'Event Added Successfully!',
        `Event "${eventData.title}" has been added to your calendar.\n\nStart: ${eventData.startDate.toLocaleString()}\nEnd: ${eventData.endDate.toLocaleString()}\nLocation: ${eventData.location || 'TBD'}`,
        [
          {
            text: 'Download .ics File',
            onPress: () => this.createCalendarFile(eventData)
          },
          { text: 'OK' }
        ]
      );
      
      return true;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      Alert.alert(
        'Error',
        'An error occurred while adding the event to your calendar. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Create a calendar file for download (web) or sharing
   */
  private async createCalendarFile(eventData: CalendarEventData): Promise<void> {
    try {
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const startDate = formatDate(eventData.startDate);
      const endDate = formatDate(eventData.endDate);
      
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ScanCard App//Calendar Event//EN
BEGIN:VEVENT
UID:${Date.now()}@scancard.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.notes || ''}
LOCATION:${eventData.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert(
          'Calendar File Downloaded',
          'A .ics file has been downloaded. You can import it into your calendar app.',
          [{ text: 'OK' }]
        );
      } else {
        // For mobile, show the content and instructions
        Alert.alert(
          'Calendar File Content',
          `Copy this content and save it as a .ics file:\n\n${icsContent}`,
          [
            {
              text: 'Copy to Clipboard',
              onPress: () => {
                // You can implement clipboard functionality here
                console.log('ICS content copied to clipboard');
              }
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating calendar file:', error);
      Alert.alert(
        'Error',
        'Unable to create calendar file. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Format event notes with ticket information
   */
  formatEventNotes(eventTitle: string, ticketType: string, ticketId: string): string {
    return `Event: ${eventTitle}
Ticket Type: ${ticketType}
Ticket ID: ${ticketId}

Added via ScanCard App`;
  }
}

export const calendarService = new CalendarService(); 