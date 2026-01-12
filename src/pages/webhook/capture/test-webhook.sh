#!/bin/bash

# Webhook Capture Test Script
# This script sends sample webhooks to test the capture system

BASE_URL="http://localhost:4321"
WEBHOOK_URL="$BASE_URL/webhook/capture"

echo "🔍 Webhook Capture Test Script"
echo "================================"
echo ""

# Test 1: Simple JSON POST
echo "Test 1: Simple JSON POST"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestScript/1.0" \
  -d '{
    "event": "test.webhook",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "data": {
      "message": "Hello from test script",
      "number": 42,
      "nested": {
        "key": "value"
      }
    }
  }'
echo -e "\n"

# Test 2: Webhook with query parameters
echo "Test 2: Webhook with query parameters"
curl -X POST "$WEBHOOK_URL?source=test&version=1.0&env=dev" \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestScript/1.0" \
  -d '{
    "event": "query.params.test",
    "message": "This webhook includes query parameters"
  }'
echo -e "\n"

# Test 3: Form data
echo "Test 3: Form-encoded data"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "User-Agent: TestScript/1.0" \
  -d "name=John+Doe&email=john%40example.com&action=subscribe"
echo -e "\n"

# Test 4: Plain text
echo "Test 4: Plain text data"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: text/plain" \
  -H "User-Agent: TestScript/1.0" \
  -d "This is a plain text webhook payload. It could be anything!"
echo -e "\n"

# Test 5: PUT request
echo "Test 5: PUT request"
curl -X PUT "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: TestScript/1.0" \
  -d '{
    "action": "update",
    "id": "12345",
    "changes": {
      "status": "active"
    }
  }'
echo -e "\n"

# Test 6: Large JSON payload (simulating real webhook)
echo "Test 6: Complex nested JSON (simulating CMP webhook)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: OptimizelyPreviewWebhook/1.0" \
  -d '{
    "event": "preview.requested",
    "data": {
      "preview_id": "prev_'$(date +%s)'",
      "assets": {
        "structured_contents": [
          {
            "id": "content_12345",
            "version_id": "v1",
            "content_body": {
              "content_type": {
                "api_identifier": "saas_cms_content"
              },
              "content_guid": "12345678-1234-1234-1234-123456789abc",
              "fields_version": {
                "content_hash": "abc123def456",
                "fields": {
                  "heading": [{
                    "field_values": [{
                      "text_value": "Test Article Heading"
                    }]
                  }],
                  "subHeading": [{
                    "field_values": [{
                      "text_value": "Test subheading text"
                    }]
                  }],
                  "body": [{
                    "field_values": [{
                      "rich_text_value": "<p>This is test article content</p>"
                    }]
                  }]
                }
              },
              "updated_by": "test@example.com"
            }
          }
        ]
      }
    }
  }'
echo -e "\n"

echo "================================"
echo "✅ All test webhooks sent!"
echo ""
echo "View them at: $BASE_URL/webhook/capture/viewer"
echo ""
