# Organizer Settings Profile Form

## Overview
The Organizer Settings Profile Form allows event organizers to edit their organization information and view their Stripe connection status. This provides a comprehensive profile management system for organizers to maintain their business information.

## ✅ Features Implemented

### Profile Information Management
- **Organization Name**: Required field for business identification
- **Full Name**: Required field for personal identification
- **Contact Email**: Optional email for business communications
- **Phone Number**: Optional phone number for contact
- **Website**: Optional website URL for the organization
- **Company**: Optional company name
- **Job Title**: Optional job title/position

### Stripe Integration Status
- **Connection Status Display**: Shows current Stripe account status
- **Visual Indicators**: Color-coded status indicators
- **Status Descriptions**: Clear explanations of each status
- **Real-time Updates**: Displays current connection state

### Form Validation & User Experience
- **Required Field Validation**: Ensures essential information is provided
- **Input Validation**: Proper keyboard types for different fields
- **Loading States**: Activity indicators during data operations
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation when profile is updated

## 🗄️ Database Requirements

### Required Migration
Run the migration to add organizer fields to the profiles table:

```sql
-- Run in Supabase SQL editor
-- See: database/migration_add_organizer_fields.sql
```

### New Fields Added
The `profiles` table now includes:
- `org_name` (text) - Organization name
- `contact_email` (text) - Contact email address
- `phone` (text) - Phone number
- `website` (text) - Website URL

### Existing Fields Used
- `full_name` (text) - Full name
- `company` (text) - Company name
- `title` (text) - Job title
- `stripe_account_status` (text) - Stripe connection status

## 🔧 Technical Implementation

### Database Schema Updates
Updated `types/database.ts` to include new organizer fields:
- Added `org_name`, `contact_email`, `phone`, `website` to profiles interface
- Maintained backward compatibility with existing fields
- Proper TypeScript typing for all new fields

### OrganizerService Methods
Added new methods to `lib/organizerService.ts`:

#### `getOrganizerProfile(organizerId: string): Promise<OrganizerProfile | null>`
- Fetches complete organizer profile information
- Includes Stripe connection status
- Returns formatted profile data

#### `updateOrganizerProfile(organizerId: string, profileData): Promise<boolean>`
- Updates organizer profile information
- Handles partial updates (only changed fields)
- Returns success/failure status

### Components

#### OrganizerProfileForm (`components/OrganizerProfileForm.tsx`)
- **Form Fields**: All organizer information fields with proper validation
- **Stripe Status**: Visual display of Stripe connection status
- **Save/Cancel**: Form submission and cancellation handling
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

#### Updated Settings Screen (`app/organizer/settings.tsx`)
- **Profile Section**: New "Organization Profile" setting item
- **Modal Integration**: Full-screen modal for profile editing
- **Navigation**: Seamless integration with existing settings

## 🎨 User Interface

### Form Design
- **Clean Layout**: Organized sections with clear labels
- **Input Validation**: Visual indicators for required fields
- **Keyboard Types**: Appropriate keyboard types for each field
- **Responsive Design**: Works well on different screen sizes

### Stripe Status Display
- **Status Card**: Dedicated card showing Stripe connection status
- **Color Coding**: 
  - Green: Active/Connected
  - Orange: Pending verification
  - Red: Restricted
  - Gray: Not connected
- **Descriptive Text**: Clear explanations of each status

### Modal Presentation
- **Full-screen Modal**: Page sheet presentation for profile editing
- **Header**: Clear title with close button
- **Scrollable Content**: Handles long forms gracefully
- **Action Buttons**: Save and cancel options

## 🔒 Security & Validation

### Input Validation
- **Required Fields**: Full name and organization name are mandatory
- **Email Validation**: Proper email format for contact email
- **URL Validation**: Website field accepts valid URLs
- **Phone Validation**: Phone field uses phone-pad keyboard

### Data Security
- **User-specific Access**: Only organizers can edit their own profiles
- **Database Policies**: Existing RLS policies ensure data security
- **Input Sanitization**: Proper handling of user input

## 📊 Data Flow

### Profile Loading
1. User opens organizer settings
2. Clicks "Organization Profile"
3. Modal opens with profile form
4. `getOrganizerProfile()` fetches current data
5. Form populates with existing information

### Profile Saving
1. User fills out form and clicks "Save"
2. Form validates required fields
3. `updateOrganizerProfile()` updates database
4. Success/error feedback shown to user
5. Modal closes on successful save

### Stripe Status
1. Profile loads with current Stripe status
2. Status displayed with appropriate color and text
3. Description explains current state
4. Updates automatically when status changes

## 🚀 Future Enhancements

### Profile Features
- **Avatar Upload**: Profile picture management
- **Social Links**: Social media profile links
- **Business Hours**: Operating hours information
- **Location**: Business address and location

### Stripe Integration
- **Direct Connection**: Connect Stripe account from profile
- **Account Management**: Manage Stripe account settings
- **Payout Preferences**: Configure payout settings

### Advanced Features
- **Profile Templates**: Pre-built profile templates
- **Import/Export**: Profile data import/export
- **Profile Analytics**: Profile completion metrics
- **Multi-language**: Internationalization support

## 🧪 Testing

### Test Scenarios
1. **New Profile**: Create profile for new organizer
2. **Existing Profile**: Edit existing profile information
3. **Validation**: Test required field validation
4. **Stripe Status**: Test different Stripe connection states
5. **Error Handling**: Test network and validation errors

### Data Validation
- Verify required fields are enforced
- Check email format validation
- Test URL format validation
- Validate phone number input

## 📱 Usage

### For Organizers
1. Navigate to organizer settings
2. Click "Organization Profile"
3. Fill out required information
4. Add optional contact details
5. Review Stripe connection status
6. Save changes

### Profile Management
- **Edit Information**: Update any profile field
- **View Status**: Check Stripe connection status
- **Save Changes**: Persist updates to database
- **Cancel**: Discard changes and close form

The Organizer Settings Profile Form provides a comprehensive solution for organizers to manage their business information and monitor their payment integration status, ensuring they have all the tools needed to run successful events. 