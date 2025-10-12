import twilio from 'twilio';
import type { Request, Response, NextFunction } from 'express';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();
  
  return await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
    body: message
  });
}

export async function verifyTwilioWebhook(req: Request, res: Response, next: NextFunction) {
  // Skip verification in development if TWILIO_AUTH_TOKEN is not set
  if (process.env.NODE_ENV !== 'production' && !process.env.TWILIO_AUTH_TOKEN) {
    return next();
  }
  
  try {
    const { accountSid, apiKeySecret } = await getCredentials();
    const authToken = process.env.TWILIO_AUTH_TOKEN || apiKeySecret;
    
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    
    if (!twilioSignature) {
      return res.status(403).json({ message: 'Missing Twilio signature' });
    }
    
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const params = req.body;
    
    const validator = twilio.validateRequest(
      authToken,
      twilioSignature,
      url,
      params
    );
    
    if (!validator) {
      return res.status(403).json({ message: 'Invalid Twilio signature' });
    }
    
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({ message: 'Webhook verification failed' });
  }
}
