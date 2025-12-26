# Resend Email Setup

This guide will help you set up Resend for sending verification and password reset emails.

## Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your API Key

1. Once logged in, go to **API Keys** in the sidebar
2. Click **Create API Key**
3. Give it a name (e.g., "Task Master Production")
4. Select the permissions (at minimum, you need "Send emails")
5. Copy the API key (you'll only see it once!)

## Step 3: Verify Your Domain (Recommended for Production)

For production, you should verify your own domain:

1. Go to **Domains** in the Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

**Note:** For development/testing, you can use Resend's default domain `onboarding@resend.dev`, but this is limited and not recommended for production.

## Step 4: Add Environment Variables

Add these to your `.env` file:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Email sender address (use your verified domain for production)
# For development, you can use: onboarding@resend.dev
EMAIL_FROM=noreply@yourdomain.com

# Alternative: You can also use RESEND_FROM
# RESEND_FROM=noreply@yourdomain.com
```

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try signing up a new user
3. Check your email inbox for the verification email
4. Check the Resend dashboard for email delivery status

## Email Behavior

- **Development Mode**: Emails are logged to console (no actual emails sent)
- **Production Mode with Resend**: Emails are sent via Resend
- **Production Mode without Resend**: Emails are logged to console with a warning

## Troubleshooting

### Emails not sending?

1. **Check your API key**: Make sure `RESEND_API_KEY` is set correctly in your `.env` file
2. **Check Resend dashboard**: Look for any errors or delivery issues
3. **Verify domain**: If using a custom domain, make sure it's verified in Resend
4. **Check logs**: Look at your server console for any error messages

### Using a custom domain?

1. Make sure your domain is verified in Resend
2. Set `EMAIL_FROM` to an email address using your verified domain
3. Example: If your domain is `example.com`, use `noreply@example.com`

### Free tier limits?

Resend's free tier includes:
- 3,000 emails/month
- 100 emails/day

For higher limits, upgrade to a paid plan.

## Next Steps

Once Resend is configured:
- ✅ Verification emails will be sent automatically after signup
- ✅ Password reset emails will be sent when requested
- ✅ All emails will be tracked in your Resend dashboard
