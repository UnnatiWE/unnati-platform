# UNNATI – React + Firebase

## What is included
- React + Vite frontend
- Responsive UNNATI visual system using the supplied official logo
- English, Hindi and Marathi UI switching
- All 36 Maharashtra districts
- Email/password Firebase authentication
- Firestore user profiles
- Firestore saved resources
- Personalized My Unnati dashboard
- Schemes, Skills, SHG Finder and Help pages
- Clearly labelled SHG demo data
- Website tour using react-joyride
- Firebase security rules

## Important production note
The sample resource cards are placeholders where verified government/official data must be inserted. Do not publish placeholder scheme eligibility or helpline information as official facts.

## Run
1. Install Node.js.
2. Open the project folder in VS Code.
3. Copy `.env.example` to `.env`.
4. Add your Firebase web app configuration.
5. Run:
   npm install
   npm run dev

## Firebase setup
1. Create a Firebase project.
2. Add a Web App and copy its configuration into `.env`.
3. Enable Authentication → Email/Password.
4. Enable Cloud Firestore.
5. Deploy/copy `firestore.rules` into Firestore Rules.
6. For phone OTP, enable Phone Authentication and add Firebase reCAPTCHA/RecaptchaVerifier flow.

## Suggested next step
Replace `src/data/resources.js` with verified official Maharashtra government scheme/help data and add Firestore collections for admin-managed resources if required.
