# WhatsApp Bot Setup Guide

## Overview
Your gaming center now has a WhatsApp bot that automatically responds to customer inquiries about device availability. When customers send messages asking about availability, the bot will instantly reply with real-time information about all your gaming devices.

## How It Works

### Customer Experience
Customers can message your WhatsApp business number with queries like:
- "How many PCs are available?"
- "Check availability"
- "Any PS5 free?"
- "Available slots?"

The bot will automatically respond with:
```
📊 Current Availability

✅ PC: 5/10 available (50%)
✅ PS5: 2/4 available (50%)
❌ VR: 0/2 available (0%)
✅ Car Simulator: 1/1 available (100%)

Updated: 11/10/2025, 8:00:00 AM
```

### What Triggers the Bot
The bot responds to messages containing these keywords:
- available
- availability
- how many
- pc, ps5, vr (device names)
- free
- check

## Setup Steps

### 1. Twilio Configuration (Already Done ✅)
- Twilio integration has been set up through Replit
- Your Twilio account is connected and ready to use

### 2. Configure Twilio Webhook
You need to tell Twilio where to send incoming WhatsApp messages:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Messaging** → **Settings** → **WhatsApp Sandbox Settings** (for testing) or your WhatsApp Business number settings
3. Find the **"When a message comes in"** webhook field
4. Enter your webhook URL:
   ```
   https://your-replit-app-url.com/api/whatsapp/webhook
   ```
   Replace `your-replit-app-url.com` with your actual Replit app URL
5. Set the HTTP method to **POST**
6. Click **Save**

### 3. Testing the Bot

#### Option 1: Using Twilio WhatsApp Sandbox (for testing)
1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join your sandbox (usually send a code like "join <your-code>" to the Twilio number)
3. Once joined, send test messages like "how many pc available?"
4. The bot should respond with availability information

#### Option 2: Using Your WhatsApp Business Number (for production)
1. Make sure you have a verified WhatsApp Business number in Twilio
2. Configure the webhook as described above
3. Customers can now message your business number directly

## API Endpoints

### GET /api/whatsapp/availability
Programmatic endpoint to get current availability (no authentication required for external queries)

**Response:**
```json
[
  {
    "category": "PC",
    "total": 10,
    "available": 5,
    "occupied": 5
  },
  {
    "category": "PS5",
    "total": 4,
    "available": 2,
    "occupied": 2
  }
]
```

### POST /api/whatsapp/webhook
Twilio webhook endpoint that receives and processes incoming WhatsApp messages.

## Important Notes

1. **Read-Only**: The bot only provides availability information. Customers cannot make bookings through WhatsApp.

2. **Real-Time Data**: The bot shows current availability based on active bookings (running and paused sessions).

3. **All Devices**: The response includes availability for ALL device categories configured in your system.

4. **No Authentication Required**: The WhatsApp webhook endpoints are public (no login required) so Twilio can access them.

5. **Future Enhancement Ideas**:
   - Add booking capability through WhatsApp
   - Send notifications when devices become available
   - Allow customers to check pricing
   - Schedule reminders for upcoming bookings

## Troubleshooting

### Bot Not Responding
1. Check that the webhook URL is correctly configured in Twilio
2. Verify your app is running and accessible
3. Check the server logs for any errors

### Wrong Availability Shown
1. Make sure bookings are properly updated in the dashboard
2. Verify that expired/completed sessions are refreshed
3. Check that device configurations are correct in Settings

### Can't Receive Messages
1. Verify Twilio sandbox is set up (for testing)
2. Check that your WhatsApp Business number is verified (for production)
3. Ensure webhook configuration is saved in Twilio console

## Next Steps

1. Deploy your app to get a permanent URL for the webhook
2. Set up your WhatsApp Business number in Twilio (if not already done)
3. Configure the webhook with your production URL
4. Test with real customers!

---

For technical support, check the application logs or contact your developer.
