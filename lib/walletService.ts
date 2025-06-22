import { Platform, Alert } from 'react-native';

// Dynamically import for iOS only to prevent crashing on other platforms
let PassKit: any;
if (Platform.OS === 'ios') {
  try {
    PassKit = require('react-native-passkit-wallet');
  } catch (e) {
    console.warn("PassKit library not found. Wallet features will be disabled for iOS.", e);
  }
}

export interface WalletPassData {
  eventName: string;
  eventDate: Date;
  eventLocation?: string;
  ticketType: string;
  ticketId: string;
  organizerName: string;
  eventImage?: string;
  eventTime?: string;
  price?: string;
}

class WalletService {
  /**
   * Add ticket to platform-specific wallet
   */
  async addToWallet(passData: WalletPassData): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await this.addToAppleWallet(passData);
      } else if (Platform.OS === 'android') {
        return await this.addToGoogleWallet(passData);
      } else {
        Alert.alert(
          'Wallet Not Supported',
          'Adding to wallet is not supported on this platform.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error adding to wallet:', error);
      Alert.alert(
        'Error',
        'Failed to add ticket to wallet. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Add to Apple Wallet (iOS)
   * Requires: react-native-passkit-wallet
   */
  private async addToAppleWallet(passData: WalletPassData): Promise<boolean> {
    try {
      console.log('Adding to Apple Wallet:', passData);
      
      if (!PassKit) {
        Alert.alert(
          'Apple Wallet Not Supported',
          'This feature is only available on iOS devices.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      // You need to replace this URL with your actual server endpoint
      // that generates and serves .pkpass files using your certificates
      const passUrl = `http://localhost:3000/api/passes/${passData.ticketId}.pkpass`;
      
      try {
        // Try to add the pass using the URL method
        await PassKit.addPass(passUrl);
        console.log('Successfully added pass to Apple Wallet');
        return true;
      } catch (passError) {
        console.log('Pass URL method failed:', passError);
        
        // Show detailed setup instructions
        Alert.alert(
          'Apple Wallet Setup Required',
          'To complete Apple Wallet integration:\n\n' +
          '1. Set up a server endpoint at: /api/passes/{ticketId}.pkpass\n' +
          '2. Use your Apple certificates to generate .pkpass files\n' +
          '3. Update the passUrl in walletService.ts\n\n' +
          'Current URL: ' + passUrl,
          [
            { text: 'Copy URL', onPress: () => console.log('URL:', passUrl) },
            { text: 'OK' }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error adding to Apple Wallet:', error);
      Alert.alert(
        'Apple Wallet Error',
        'Failed to add ticket to Apple Wallet. Please check your setup and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Add to Google Wallet (Android)
   * Requires: react-native-google-wallet
   */
  private async addToGoogleWallet(passData: WalletPassData): Promise<boolean> {
    try {
      console.log('Adding to Google Wallet:', passData);
      
      // TODO: Implement with react-native-google-wallet
      // Example implementation:
      // 
      // import GoogleWallet from 'react-native-google-wallet';
      // 
      // const eventTicket = {
      //   eventName: {
      //     defaultValue: {
      //       language: 'en-US',
      //       value: passData.eventName,
      //     },
      //   },
      //   eventDateTime: {
      //     defaultValue: {
      //       language: 'en-US',
      //       value: passData.eventDate.toISOString(),
      //     },
      //   },
      //   venueName: {
      //     defaultValue: {
      //       language: 'en-US',
      //       value: passData.eventLocation || 'TBD',
      //     },
      //   },
      //   seatInfo: {
      //     defaultValue: {
      //       language: 'en-US',
      //       value: `Ticket Type: ${passData.ticketType}`,
      //     },
      //   },
      // };
      // 
      // const success = await GoogleWallet.saveEventTicket(eventTicket);
      // return success;

      // Placeholder implementation
      Alert.alert(
        'Google Wallet',
        'This feature requires react-native-google-wallet library to be installed and configured.\n\n' +
        'To implement:\n' +
        '1. Install: npm install react-native-google-wallet\n' +
        '2. Configure Google Pay API\n' +
        '3. Set up Google Cloud project\n' +
        '4. Implement pass generation logic',
        [{ text: 'OK' }]
      );
      
      return false;
    } catch (error) {
      console.error('Error adding to Google Wallet:', error);
      return false;
    }
  }

  /**
   * Check if wallet is available on the current platform
   */
  isWalletAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Get platform-specific wallet name
   */
  getWalletName(): string {
    if (Platform.OS === 'ios') {
      return 'Apple Wallet';
    } else if (Platform.OS === 'android') {
      return 'Google Wallet';
    }
    return 'Wallet';
  }
}

export const walletService = new WalletService(); 