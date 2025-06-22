/**
 * Apple Wallet Pass Generator - Server Side
 * 
 * This is an example of how to generate .pkpass files on your server
 * using your Apple certificates.
 * 
 * You'll need to install: npm install node-passkit
 */

const PassKit = require('node-passkit');
const fs = require('fs');
const path = require('path');

class ApplePassGenerator {
  constructor() {
    // Path to your Apple certificates
    this.certPath = path.join(__dirname, 'certs', 'certificate.pem');
    this.keyPath = path.join(__dirname, 'certs', 'privateKey.pem');
    this.wwdrPath = path.join(__dirname, 'certs', 'wwdr.pem');
    
    // Your Apple Developer details
    this.teamIdentifier = 'YOUR_TEAM_ID'; // Replace with your Team ID
    this.passTypeIdentifier = 'pass.com.yourapp.event'; // Replace with your Pass Type ID
  }

  /**
   * Generate a .pkpass file for a ticket
   */
  async generatePass(ticketData) {
    try {
      // Create pass data structure
      const passData = {
        passTypeIdentifier: this.passTypeIdentifier,
        serialNumber: ticketData.ticketId,
        teamIdentifier: this.teamIdentifier,
        organizationName: ticketData.organizerName,
        description: ticketData.eventName,
        generic: {
          primaryFields: [
            {
              key: 'event',
              label: 'EVENT',
              value: ticketData.eventName,
            },
          ],
          secondaryFields: [
            {
              key: 'date',
              label: 'DATE',
              value: ticketData.eventDate.toLocaleDateString(),
            },
            {
              key: 'time',
              label: 'TIME',
              value: ticketData.eventTime || ticketData.eventDate.toLocaleTimeString(),
            },
          ],
          auxiliaryFields: [
            {
              key: 'location',
              label: 'LOCATION',
              value: ticketData.eventLocation || 'TBD',
            },
            {
              key: 'ticketType',
              label: 'TICKET TYPE',
              value: ticketData.ticketType,
            },
          ],
        },
        eventTicket: {
          headerFields: [
            {
              key: 'price',
              label: 'PRICE',
              value: ticketData.price || 'Free',
            },
          ],
        },
        barcodes: [
          {
            format: 'PKBarcodeFormatQR',
            message: ticketData.ticketId,
            messageEncoding: 'utf-8',
          },
        ],
      };

      // Generate the pass
      const pass = new PassKit(passData, {
        wwdr: this.wwdrPath,
        signerCert: this.certPath,
        signerKey: this.keyPath,
        signerKeyPassphrase: 'YOUR_KEY_PASSPHRASE', // If your key has a passphrase
      });

      // Add pass images (optional)
      // pass.images.add('icon', fs.readFileSync(path.join(__dirname, 'images', 'icon.png')));
      // pass.images.add('logo', fs.readFileSync(path.join(__dirname, 'images', 'logo.png')));

      // Generate the .pkpass file
      const passBuffer = await pass.generate();
      return passBuffer;

    } catch (error) {
      console.error('Error generating pass:', error);
      throw error;
    }
  }

  /**
   * Save pass to file system
   */
  async savePass(ticketId, passBuffer) {
    const outputPath = path.join(__dirname, 'passes', `${ticketId}.pkpass`);
    
    // Ensure passes directory exists
    const passesDir = path.dirname(outputPath);
    if (!fs.existsSync(passesDir)) {
      fs.mkdirSync(passesDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, passBuffer);
    return outputPath;
  }
}

// Express.js endpoint example
/*
const express = require('express');
const app = express();

app.get('/api/passes/:ticketId.pkpass', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Fetch ticket data from your database
    const ticketData = await getTicketData(ticketId);
    
    // Generate pass
    const passGenerator = new ApplePassGenerator();
    const passBuffer = await passGenerator.generatePass(ticketData);
    
    // Set response headers
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${ticketId}.pkpass"`,
    });
    
    // Send the pass
    res.send(passBuffer);
    
  } catch (error) {
    console.error('Error serving pass:', error);
    res.status(500).json({ error: 'Failed to generate pass' });
  }
});

app.listen(3000, () => {
  console.log('Pass server running on port 3000');
});
*/

module.exports = ApplePassGenerator; 