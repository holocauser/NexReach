# Organizer Dashboard Setup

This document explains how to set up the Organizer Dashboard functionality that fetches real data from Supabase.

## 🚀 Features Implemented

### ✅ Dashboard Overview
- **Real-time data fetching** from Supabase for events where user is the organizer
- **Aggregated statistics**: total events, tickets sold, gross revenue, upcoming events
- **Performance optimized** with Supabase RPC function and database indexes
- **Fallback queries** if RPC function is not available
- **Simple bar chart visualization** of key metrics
- **Recent activity feed** showing events and ticket sales

## 📊 Database Setup

### 1. Run the SQL Setup Script

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Run the complete setup script from: database/run_organizer_dashboard_setup.sql
```

This will create:
- **RPC Function**: `get_organizer_dashboard_stats(organizer_user_id UUID)`
- **Database Indexes** for optimal performance
- **Proper permissions** for authenticated users

### 2. Database Schema Requirements

The dashboard expects these tables to exist:

```sql
-- Events table (already exists)
events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- This is the organizer
  title TEXT,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  image TEXT,
  attending_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tickets table (already exists)
tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Ticket buyer
  event_id UUID REFERENCES events(id),
  ticket_type TEXT,
  status TEXT DEFAULT 'active',
  calendar_ics_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Implementation Details

### Data Fetching Strategy

1. **Primary Method**: Uses Supabase RPC function for single-query efficiency
2. **Fallback Method**: Individual queries if RPC function fails
3. **Error Handling**: Graceful degradation with user-friendly error messages

### Performance Optimizations

- **Database Indexes**: Created on `user_id` and `created_at` fields
- **Single Query**: RPC function aggregates all data in one database call
- **JSON Aggregation**: Recent events and activity returned as JSON for efficiency
- **Caching**: React state management for data persistence

### Revenue Calculation

Currently uses a mock calculation:
```sql
COUNT(*) * 50 as gross_revenue -- $50 per ticket
```

**To implement real revenue tracking:**
1. Create a `payments` table
2. Update the RPC function to join with payments
3. Calculate actual revenue from payment amounts

## 📱 UI Components

### Dashboard Overview Screen
- **Location**: `app/organizer/dashboard-overview.tsx`
- **Features**:
  - Loading states with activity indicators
  - Error handling with retry functionality
  - Responsive stat cards with trend indicators
  - Simple bar chart visualization
  - Recent activity feed
  - Quick action buttons

### Simple Bar Chart Component
- **Location**: `components/SimpleBarChart.tsx`
- **Features**:
  - Customizable colors and heights
  - Responsive bar sizing
  - Optional value labels
  - Clean, modern design

## 🔄 Data Flow

```
User opens Dashboard Overview
    ↓
Check if user is authenticated
    ↓
Call Supabase RPC function
    ↓
If RPC fails → Fallback to individual queries
    ↓
Process and format data
    ↓
Update React state
    ↓
Render dashboard with charts and stats
```

## 🧪 Testing

### Test the RPC Function

```sql
-- Replace with actual user ID
SELECT * FROM get_organizer_dashboard_stats('your-user-id-here');
```

### Expected Response

```json
{
  "total_events": 5,
  "total_tickets_sold": 25,
  "gross_revenue": 1250.00,
  "upcoming_events": 2,
  "recent_events": [...],
  "recent_activity": [...]
}
```

## 🚨 Troubleshooting

### Common Issues

1. **RPC Function Not Found**
   - Ensure the SQL setup script was executed
   - Check Supabase function permissions

2. **No Data Showing**
   - Verify user has created events
   - Check if `user_id` matches the authenticated user
   - Ensure events table has data

3. **Performance Issues**
   - Verify database indexes were created
   - Check Supabase query performance in dashboard

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection
3. Test RPC function directly in SQL editor
4. Check user authentication status

## 🔮 Future Enhancements

### Planned Features
- **Real-time updates** with Supabase subscriptions
- **Advanced charts** with react-native-chart-kit
- **Export functionality** for reports
- **Date range filtering**
- **Real payment integration**

### Revenue Tracking
- Create `payments` table
- Integrate with Stripe
- Update RPC function for real revenue calculation
- Add payment status tracking

## 📝 Notes

- The current implementation uses mock revenue calculation
- Database indexes are crucial for performance with large datasets
- The RPC function approach is significantly faster than multiple queries
- Error handling ensures the app remains functional even if database queries fail 