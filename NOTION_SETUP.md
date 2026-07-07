# NOTION_SETUP.md — Setting Up Notion Integration

## Step 1: Create a Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "New Integration"
3. Fill in:
   - Name: "Notely"
   - Associated workspace: Select your workspace
   - Type: **Public** (required for OAuth)
4. Under Capabilities, enable:
   - Read content
   - Insert content
   - Read user information (including email)
5. Click "Submit"

## Step 2: Configure OAuth

1. In your integration settings, go to the "Distribution" tab
2. Toggle on "Public integration"
3. Add your redirect URI:
   - Development: `http://localhost:8000/api/notion/callback`
   - Production: `https://your-backend.onrender.com/api/notion/callback`
4. Note down:
   - **OAuth client ID** (starts with something like `xxxxxxx-xxxx-...`)
   - **OAuth client secret**

## Step 3: Add to Environment Variables

In your backend `.env`:
```
NOTION_CLIENT_ID=your-client-id
NOTION_CLIENT_SECRET=your-client-secret
NOTION_REDIRECT_URI=http://localhost:8000/api/notion/callback
```

In your frontend `.env`:
```
VITE_NOTION_CLIENT_ID=your-client-id
```

## Step 4: How the OAuth Flow Works

1. User clicks "Connect Notion" in Notely
2. Redirected to Notion's authorization page
3. User selects which pages/databases to share
4. Notion redirects back to your callback URL with a code
5. Backend exchanges code for an access token
6. Token is stored securely in the database
7. User can now list and sync to their Notion databases

## Important Notes

- Users must explicitly share databases with the integration
- The integration can only access pages/databases the user has shared
- Tokens don't expire but can be revoked by the user in Notion settings
- Free Notion accounts work fine for this integration
