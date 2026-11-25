# Unnati

Unnati is a web platform designed to support users with access to opportunities and services through a simple web interface. This repository contains the frontend application and the authentication backend.

## Project Structure

```text
unnati-platform/
├── server/                 # Express authentication API
│   ├── server.js           # API routes, Twilio OTP and Firebase Admin
│   └── package.json        # Backend dependencies and scripts
├── src/                    # Frontend application source
├── public/                 # Static frontend assets
├── package.json             # Frontend dependencies and scripts
└── README.md
```

## Technology Stack

- Frontend: React and Vite
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Phone verification: Twilio Verify (SMS OTP)
- Backend: Node.js and Express
- Backend deployment: Render
- Frontend deployment: Vercel

## Features

- Phone-number registration and login using SMS OTP
- OTP verification through Twilio Verify
- Firebase Authentication user creation and custom-token generation
- User profile storage in Firestore
- Profile fields include name, phone number, district, age group and occupation
- API rate limiting for OTP and authentication requests
- CORS configuration for the deployed frontend
- Health-check endpoint for backend monitoring

## Prerequisites

Install the following before running the project locally:

- Node.js and npm
- A Firebase project with Authentication and Firestore enabled
- A Twilio account and a Twilio Verify service

## Run the Frontend

From the repository root:

```bash
npm install
npm run dev
```

Vite will print the local development URL in the terminal (usually `http://localhost:5173`).

Create a root `.env` file for the frontend configuration. Use the variable names expected by the Firebase configuration and API URL in the frontend source. Do not commit real environment values.

The frontend needs the backend API base URL configured through:

```env
VITE_AUTH_API_URL=http://localhost:5000
```

For deployment, set `VITE_AUTH_API_URL` to the public Render backend URL.

## Run the Backend

Open a second terminal and run:

```bash
cd server
npm install
npm start
```

The backend starts on port `5000` locally by default. It uses `PORT` when the hosting platform provides one.

Available backend scripts:

```bash
npm start       # Start the API
npm run dev     # Start with Node's watch mode
```

## Backend API

The authentication API is implemented in `server/server.js`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check whether the API is running |
| `POST` | `/api/otp/send` | Send an SMS OTP for signup or login |
| `POST` | `/api/auth/signup` | Verify OTP and create a phone-based user profile |
| `POST` | `/api/auth/login` | Verify OTP and sign in an existing phone-based user |

### Example request: send OTP

```json
{
  "phone": "+919876543210",
  "purpose": "signup"
}
```

Use an international phone number in E.164 format, or a supported 10-digit Indian mobile number. The `purpose` value must be `signup` or `login`.

### Example signup request

```json
{
  "phone": "+919876543210",
  "code": "123456",
  "name": "Sample User",
  "district": "Sample District",
  "ageGroup": "",
  "occupation": ""
}
```

The OTP must be valid and approved by Twilio before the backend creates the Firebase user.

## Backend Environment Variables

Create `server/.env` for local development:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id"}
FRONTEND_URL=http://localhost:5173
PORT=5000
```

`FIREBASE_SERVICE_ACCOUNT_JSON` must contain the complete Firebase Admin service-account JSON as a valid JSON string. The sample above is only a placeholder and is not a complete credential.

For Render, add these variables in the service's Environment settings. Set `FRONTEND_URL` to the exact deployed frontend origin, such as `https://your-app.vercel.app`. Multiple allowed origins can be separated by commas.

Never commit `.env` files, Twilio credentials, Firebase service-account JSON files, or private keys.

## Deployment

### Backend — Render

Configure the Render Web Service:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Add the backend environment variables listed above in Render's Environment Variables section. Render provides the `PORT` variable automatically.

After deployment, test:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

Expected response:

```json
{
  "ok": true,
  "service": "unnati-auth"
}
```

### Frontend — Vercel

Import the repository into Vercel and configure the frontend project using the repository root:

- Build Command: `npm run build`
- Output Directory: `dist`

Add the frontend environment variables required by the frontend source, including `VITE_AUTH_API_URL` pointing to the Render backend URL and the Firebase web configuration variables. Redeploy after changing environment variables.

Then update the Render `FRONTEND_URL` value to the deployed Vercel origin.

## Security Notes

- Keep all Twilio and Firebase Admin credentials private.
- Firebase Admin service-account credentials belong only on the backend.
- Frontend `VITE_` variables are bundled into client-side code; never put private keys or server secrets in them.
- Keep secret files out of Git. The repository should contain only placeholder values in `.env.example`.
- Use HTTPS URLs for deployed frontend and backend services.

## Troubleshooting

- **Missing environment variable:** Check that all required backend variables are set in Render.
- **Firebase JSON parse error:** Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON and includes the full service-account object.
- **CORS error:** Set Render's `FRONTEND_URL` to the exact frontend origin, without a trailing path.
- **OTP not delivered:** Check the Twilio Verify service, account trial restrictions, destination number format and Twilio logs.
- **Frontend cannot reach API:** Confirm `VITE_AUTH_API_URL` points to the live Render service and redeploy the frontend after changing it.
