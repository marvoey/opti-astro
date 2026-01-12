# CMS Preview API

This directory contains a flexible CMS preview system that accepts raw content/properties JSON via POST requests.

## Overview

The preview system consists of two parts:

1. **API Endpoint** (`index.ts`) - Accepts POST requests with content data and stores it temporarily
2. **Render Page** (`render.astro`) - Renders the preview based on stored data

## Usage

### 1. Submit Preview Data

Send a POST request to `/cms/preview` with your content data:

```bash
curl -X POST http://localhost:4321/cms/preview \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "Button",
    "properties": {
      "Text": "Click Me",
      "Link": {
        "Url": "https://example.com",
        "Text": "Learn More",
        "Target": "_blank"
      },
      "displaySettings": {
        "buttonColor": "primary",
        "buttonSize": "medium"
      }
    },
    "locale": "en",
    "displayName": "My Test Button"
  }'
```

**Response:**

```json
{
  "success": true,
  "previewUrl": "http://localhost:4321/cms/preview/render?id=abc123",
  "previewId": "abc123",
  "expiresAt": "2026-01-09T12:00:00.000Z"
}
```

### 2. View the Preview

Open the `previewUrl` in your browser to see the rendered preview.

## Request Format

### Required Fields

- **`contentType`** (string): The type of content to preview (e.g., "Button", "Hero", "ArticlePage")
- **`properties`** (object): The content properties to render

### Optional Fields

- **`locale`** (string): Content locale (defaults to "en")
- **`displayName`** (string): Display name for the preview (defaults to "Preview: {contentType}")
- **`renderMode`** (string): "url" or "html" (defaults to "url")
  - "url": Returns a JSON response with a preview URL
  - "html": Redirects directly to the preview page

## Supported Content Types

### Components

- Text
- CallToAction
- Image
- Video
- Paragraph
- Card
- Hero
- Carousel
- Collapse
- ArticleList
- Grid
- Button
- Iframe
- VideoExternal
- Divider
- OdpForm
- FacetedSearch
- OptiFormsContainerData

### Pages

- ArticlePage
- LandingPage
- MockupPage
- FolderPage

## Example Requests

### Preview a Button Component

```json
{
  "contentType": "Button",
  "properties": {
    "Text": "Get Started",
    "Link": {
      "Url": "/signup",
      "Text": "Sign Up",
      "Target": "_self"
    },
    "displaySettings": {
      "buttonColor": "primary",
      "buttonSize": "large"
    }
  }
}
```

### Preview a Hero Component

```json
{
  "contentType": "Hero",
  "properties": {
    "Heading": "Welcome to Our Platform",
    "SubHeading": "Build amazing experiences",
    "BackgroundImage": {
      "Url": "https://example.com/hero-bg.jpg"
    },
    "CallToAction": {
      "Text": "Learn More",
      "Url": "/about"
    },
    "displaySettings": {
      "heroHeight": "tall",
      "textAlignment": "center"
    }
  },
  "locale": "en",
  "displayName": "Homepage Hero"
}
```

### Preview an Article Page

```json
{
  "contentType": "ArticlePage",
  "properties": {
    "Heading": "My Article Title",
    "SubHeading": "Article subtitle",
    "Body": "<p>This is the article content...</p>",
    "SeoSettings": {
      "Title": "My Article",
      "Description": "Article description",
      "GraphType": "article"
    }
  },
  "locale": "en",
  "displayName": "My Article"
}
```

## Implementation Details

### Data Storage

Preview data is stored in-memory with automatic expiration:
- **Expiration Time**: 15 minutes
- **Cleanup**: Expired entries are removed every 5 minutes
- **Production**: Consider using Redis or another persistent store for production environments

### Preview ID Generation

Preview IDs are generated using a combination of timestamp and random string:
```
{timestamp_base36}-{random_string}
```

### Error Handling

The API returns appropriate HTTP status codes:
- **200**: Success
- **400**: Invalid request (missing required fields, invalid JSON)
- **404**: Preview not found
- **410**: Preview expired
- **500**: Server error

## JavaScript Example

```javascript
async function createPreview(contentType, properties) {
  const response = await fetch('/cms/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contentType,
      properties,
      locale: 'en',
      displayName: `Preview: ${contentType}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Preview failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.previewUrl;
}

// Usage
const previewUrl = await createPreview('Button', {
  Text: 'Click Me',
  Link: { Url: '/test', Text: 'Test', Target: '_self' },
});

console.log('Preview URL:', previewUrl);
window.open(previewUrl, '_blank');
```

## Notes

- Preview data expires after 15 minutes
- Preview IDs are unique and cannot be reused
- The preview page includes a banner and info section to indicate preview mode
- Display settings and template keys are optional but recommended for proper styling
