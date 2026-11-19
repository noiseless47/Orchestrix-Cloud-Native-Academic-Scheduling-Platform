# Google sign-in setup

Google sign-in uses Google Identity Services. The API verifies the Google ID token and creates an eight-hour, HTTP-only session cookie. The API gateway requires that session for application data routes.

## Google Cloud Console

Create an OAuth client with application type **Web application** and configure:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`

For a deployed environment, add its frontend origin and exact API callback URL as well. Keep the same client ID in the frontend and API configuration. This flow does not require a client secret.

## Environment

Set these variables in the root `.env` used by Docker Compose:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
COOKIE_SECURE=true
```

The frontend Docker build embeds `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, so rebuild the frontend after changing it. The gateway reads `GOOGLE_CLIENT_ID` at runtime. `JWT_SECRET` must be a private, randomly generated value; do not use the example value.

To restrict sign-in to a Google Workspace organization, set `GOOGLE_ALLOWED_DOMAIN` to the verified hosted domain. Leave it empty to allow any Google account with a verified email.

For running Next.js directly from the `frontend` directory, copy `frontend/.env.example` to `.env.local` and set the same `NEXT_PUBLIC_GOOGLE_CLIENT_ID` there. Ensure the API's `CORS_ORIGIN` and `FRONTEND_URL` match the browser origin.
