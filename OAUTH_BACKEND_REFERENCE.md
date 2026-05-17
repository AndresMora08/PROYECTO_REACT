# OAuth Backend Implementation Reference

## Required Endpoints

Tu backend necesita implementar 3 nuevos endpoints OAuth. El frontend envía el `code` de autorización y espera a cambio un `user` y `access_token`.

---

## 1. GitHub OAuth Endpoint

**Endpoint:** `POST /api/auth/auth/github`

**Request:**
```json
{
  "code": "github_authorization_code"
}
```

**Response (Success):**
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nombre": "User Name",
      "apellido": "Last Name"
    },
    "access_token": "jwt_token_here"
  }
}
```

**Error Response:**
```json
{
  "message": "Failed to authenticate with GitHub"
}
```

**What to do in the endpoint:**
1. Receive the `code` parameter
2. Exchange it with GitHub API: `POST https://github.com/login/oauth/access_token`
3. Use the access token to get user info: `GET https://api.github.com/user`
4. Create or update user in your database
5. Generate JWT token
6. Return user data and token

---

## 2. Google OAuth Endpoint

**Endpoint:** `POST /api/auth/auth/google`

**Request:**
```json
{
  "code": "google_authorization_code"
}
```

**Response (Success):**
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nombre": "User Name",
      "apellido": "Last Name"
    },
    "access_token": "jwt_token_here"
  }
}
```

**Error Response:**
```json
{
  "message": "Failed to authenticate with Google"
}
```

**What to do in the endpoint:**
1. Receive the `code` parameter
2. Exchange it with Google API: `POST https://oauth2.googleapis.com/token`
3. Use the access token to get user info: `GET https://www.googleapis.com/oauth2/v2/userinfo`
4. Create or update user in your database
5. Generate JWT token
6. Return user data and token

---

## 3. X (Twitter) OAuth Endpoint

**Endpoint:** `POST /api/auth/auth/x`

**Request:**
```json
{
  "code": "x_authorization_code"
}
```

**Response (Success):**
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nombre": "User Name",
      "apellido": "Last Name"
    },
    "access_token": "jwt_token_here"
  }
}
```

**Error Response:**
```json
{
  "message": "Failed to authenticate with X"
}
```

**What to do in the endpoint:**
1. Receive the `code` parameter
2. Exchange it with X API: `POST https://twitter.com/i/oauth2/token`
3. Use the access token to get user info: `GET https://api.twitter.com/2/users/me`
4. Create or update user in your database
5. Generate JWT token
6. Return user data and token

---

## Frontend Flow

1. User clicks OAuth button
2. Frontend redirects to OAuth provider (GitHub/Google/X)
3. User authorizes the app
4. OAuth provider redirects back to your app with a `code` parameter
   - GitHub: `http://localhost:3000/auth/github/callback?code=xxx`
   - Google: `http://localhost:3000/auth/google/callback?code=xxx`
   - X: `http://localhost:3000/auth/x/callback?code=xxx`
5. Frontend extracts the `code` and sends it to your backend endpoint
6. Backend exchanges code for token and returns user
7. Frontend stores token and user, then redirects to dashboard

---

## Common Errors to Check

If you see errors, check:
1. Are the endpoints at the correct path? (`/api/auth/auth/github`, etc.)
2. Does the backend return the correct response structure? (must have `data.user` and `data.access_token`)
3. Is the token valid and being stored correctly?
4. Are CORS headers set up correctly?
5. Is the backend actually calling the OAuth providers?

---

## Testing the Integration

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click an OAuth button
4. Look for logs like:
   - "GitHub Callback - Code: xxx"
   - "SecurityService: Calling endpoint: http://localhost:5000/api/auth/auth/github"
   - If error appears, it will show the exact message

---

## Environment Variables (Frontend)

Make sure these are configured in `meta.env`:
```
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_X_CLIENT_ID=your_x_client_id
```

---

## OAuth Provider Setup

### GitHub
- Go to: https://github.com/settings/developers
- Create OAuth App
- Set Authorization Callback URL: `http://localhost:3000/auth/github/callback`
- Copy Client ID

### Google
- Go to: https://console.cloud.google.com
- Create OAuth 2.0 credentials
- Add Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
- Copy Client ID

### X (Twitter)
- Go to: https://developer.twitter.com/en/portal/dashboard
- Create app
- Add Callback URLs: `http://localhost:3000/auth/x/callback`
- Copy Client ID (API Key)
