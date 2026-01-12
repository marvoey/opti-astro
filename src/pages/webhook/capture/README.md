# Webhook Capture Tool

A powerful webhook inspection tool for capturing and exploring webhook payloads from external services.

## Overview

This tool captures incoming webhook requests and stores them for easy inspection. Perfect for:
- 🔍 **Exploring webhook structures** from third-party services
- 🐛 **Debugging webhook integrations**
- 📋 **Documenting API payloads**
- 🧪 **Testing webhook handling**

## Quick Start

### 1. Start Your Dev Server

```bash
yarn dev
```

### 2. Open the Viewer

Navigate to: `http://localhost:4321/webhook/capture/viewer`

### 3. Configure Your Webhook

In your external service (Optimizely CMP, Stripe, GitHub, etc.), set the webhook URL to:

```
http://localhost:4321/webhook/capture
```

**For production/external testing**, use a tunneling service like ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Create tunnel to your dev server
ngrok http 4321

# Use the ngrok URL for your webhook:
# https://your-subdomain.ngrok.io/webhook/capture
```

### 4. Trigger the Webhook

Perform an action in the external service that triggers the webhook. The payload will be captured instantly.

### 5. Explore the Data

The viewer will show:
- ✅ Request method (POST, PUT, etc.)
- ✅ Full URL and query parameters
- ✅ All request headers
- ✅ Parsed body (JSON/form data)
- ✅ Raw body text
- ✅ Timestamps

## Features

### Capture Capabilities

- **Multiple HTTP Methods**: POST, PUT, PATCH, GET, DELETE
- **Content Types**: JSON, form data, plain text, and more
- **Auto-parsing**: Automatically parses JSON and form-encoded data
- **Headers**: Captures all request headers including User-Agent
- **Query Params**: Extracts and displays query parameters

### Storage

- **In-memory cache**: Fast access to captured webhooks
- **File persistence**: Survives server restarts (stored in `data/webhook-captures/webhooks.json`)
- **Auto-cleanup**: Keeps last 50 webhooks automatically
- **Retention**: 15-minute auto-refresh in viewer

### Viewer Interface

- **Smart auto-refresh**: Updates webhook list every 10 seconds while preserving your expanded/collapsed JSON state
- **Interactive JSON tree**: Click arrows to expand/collapse nested objects and arrays
- **Expand/Collapse controls**: Expand All / Collapse All buttons for each section
- **Dark theme**: Easy on the eyes for long debugging sessions
- **Copy buttons**: Copy any payload section with one click
- **Delete options**: Clear individual webhooks or all at once
- **Manual reload**: Reload button in detail view to refresh a specific webhook

## API Reference

### Capture Endpoint

```
POST/PUT/PATCH /webhook/capture
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook captured successfully",
  "webhookId": "wh_1234567890_abc123",
  "timestamp": "2026-01-09T12:00:00.000Z",
  "viewUrl": "/webhook/capture/viewer"
}
```

### List Webhooks

```
GET /webhook/capture
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "webhooks": [...]
}
```

### Get Specific Webhook

```
GET /webhook/capture?id=wh_1234567890_abc123
```

**Response:**

```json
{
  "success": true,
  "webhook": {
    "id": "wh_1234567890_abc123",
    "timestamp": "2026-01-09T12:00:00.000Z",
    "method": "POST",
    "url": "/webhook/capture",
    "headers": {...},
    "query": {...},
    "body": {...},
    "rawBody": "...",
    "contentType": "application/json",
    "userAgent": "..."
  }
}
```

### Delete Webhook

```
DELETE /webhook/capture?id=wh_1234567890_abc123
```

### Clear All Webhooks

```
DELETE /webhook/capture
```

## Use Cases

### 1. Exploring Optimizely CMP Webhooks

```bash
# Configure your CMP webhook to point to:
http://localhost:4321/webhook/capture

# Or with ngrok:
https://your-subdomain.ngrok.io/webhook/capture

# Trigger a preview request in CMP
# View the captured payload structure in the viewer
# Use this to understand the data format for your integration
```

### 2. Testing Third-Party Integrations

```javascript
// From your application, send a test webhook
await fetch('http://localhost:4321/webhook/capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event: 'test.webhook',
    data: {
      foo: 'bar'
    }
  })
});

// View it immediately in the viewer
```

### 3. Debugging Production Issues

```bash
# Temporarily point production webhook to your dev server
# (using ngrok for secure tunneling)

ngrok http 4321

# Update webhook URL in production service
# Reproduce the issue
# Capture and analyze the exact payload
```

### 4. Documenting API Payloads

1. Capture multiple webhook examples
2. Copy the JSON payloads
3. Use them for documentation or test fixtures
4. Share with team members

## Tips & Tricks

### Use with ngrok for External Services

Many services require HTTPS webhooks. Use ngrok:

```bash
# Start your dev server
yarn dev

# In another terminal, start ngrok
ngrok http 4321

# Use the HTTPS URL provided by ngrok
# Example: https://abc123.ngrok.io/webhook/capture
```

### Filter by Content Type

Click on webhooks in the sidebar to see their content type. Helps you quickly identify:
- JSON payloads
- Form submissions
- Plain text data

### Copy Webhook Data

Every section has a "Copy JSON" button:
- Copy headers for authentication debugging
- Copy body for test fixtures
- Copy entire payloads for documentation
- JSON is automatically formatted when copied

### Expand/Collapse JSON

Navigate complex webhook structures easily:
- Click ▶ arrows to expand nested objects/arrays
- Click ▼ arrows to collapse them
- Use "Expand All" / "Collapse All" buttons for quick navigation
- Your expand/collapse state is preserved during auto-refresh

### Delete Old Webhooks

Keep your workspace clean:
- Delete individual webhooks with the delete button
- Clear all at once with "Clear All" button
- Automatic cleanup keeps last 50 webhooks

### Persistent Storage

Webhooks are saved to disk, so:
- They survive server restarts
- You can close the viewer and come back later
- Location: `data/webhook-captures/webhooks.json`

## Testing the Capture

Want to test the capture system? Use curl:

```bash
# Simple POST
curl -X POST http://localhost:4321/webhook/capture \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "timestamp": "2026-01-09T12:00:00Z"}'

# With query parameters
curl -X POST "http://localhost:4321/webhook/capture?source=test&version=1" \
  -H "Content-Type: application/json" \
  -d '{"event": "test.webhook"}'

# Form data
curl -X POST http://localhost:4321/webhook/capture \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=John&email=john@example.com"

# Plain text
curl -X POST http://localhost:4321/webhook/capture \
  -H "Content-Type: text/plain" \
  -d "This is plain text data"
```

## Troubleshooting

### Webhooks Not Appearing

1. **Check the endpoint URL** - Make sure it's exactly `/webhook/capture`
2. **Verify your dev server is running** - Should be on port 4321
3. **Check CORS/network issues** - Use ngrok for external services
4. **Look at server logs** - Check console for capture confirmations

### Cannot Access from External Service

1. **Use ngrok or similar** - Local dev servers aren't accessible publicly
2. **Check firewall settings** - Ensure port 4321 isn't blocked
3. **Verify HTTPS requirement** - Some services require HTTPS (use ngrok)

### Data Not Persisting

1. **Check file permissions** - Ensure `data/` directory is writable
2. **Verify disk space** - Ensure enough space for `webhooks.json`
3. **Check logs** - Look for file write errors in console

### Viewer Not Updating

1. **Manual refresh** - Click the "Refresh" button
2. **Check auto-refresh** - Should update every 5 seconds
3. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)

## Security Notes

⚠️ **Important Security Considerations:**

- **Development Only**: This tool is designed for development environments
- **No Authentication**: The capture endpoint has no authentication
- **Sensitive Data**: Be careful capturing webhooks with sensitive data
- **Production Use**: Add authentication if deploying to production
- **Data Retention**: Webhooks are stored on disk - secure your server

## Related Tools

After capturing webhook data, you might want to:

- **Create previews**: Use `/cms/preview` to preview content
- **Test integrations**: Copy payloads to test your webhook handlers
- **Document APIs**: Export webhook examples for documentation

## Example Workflow

1. **Setup ngrok**: `ngrok http 4321`
2. **Open viewer**: Navigate to `http://localhost:4321/webhook/capture/viewer`
3. **Configure webhook**: Use ngrok URL in external service
4. **Trigger webhook**: Perform action in external service
5. **Explore payload**: View captured data in viewer
6. **Copy relevant data**: Use copy buttons to extract needed information
7. **Build integration**: Use captured structure to build your handler

## Support

Need help? Check:
- Server console logs for capture events
- Browser console for viewer errors
- Network tab for API request/response details

---

Built for Astro v5 + Optimizely SaaS CMS integration
