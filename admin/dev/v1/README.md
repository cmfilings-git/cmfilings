# CM Filings Admin App

Mobile-first admin app with a floating header, left-swipe sidebar, light/dark mode, searchable modules, Firebase Authentication, and Firestore tools for clients, compliance, credentials, tasks, invoices, admins, and the company profile. The company profile is stored in `settings/company_profile`. The profile's preferred language (English, French, or Arabic) is applied throughout the app and persists across sessions.

## First-time Firebase setup
1. In Firebase Console for project `cmb-40001`, enable Authentication → Email/Password. Enable Google only if you want Google sign-in.
2. Create/enable Firestore Database.
3. Publish `firestore.rules` in Firestore → Rules, or deploy the checked-in rules with `firebase deploy --only firestore:rules`.
4. Create the first admin user in Authentication and copy the user's UID.
5. In Firestore, create collection `admins`, document ID exactly equal to that UID. Add fields `displayName` (string), `email` (string), `role` (string, `admin`), and `active` (boolean, `true`).
6. Add your deployed site domain to Authentication → Settings → Authorized domains.

The first admin document must be created manually in Firebase Console because the rules intentionally block non-admins from bootstrapping admin access. App access is checked both in the UI and Firestore Rules.

## Run locally
Serve this folder on localhost (do not open `index.html` as a `file://` URL):

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy with Firebase Hosting
Install Firebase CLI and run in this directory:

```bash
firebase login
firebase use cmb-40001
firebase deploy --only hosting,firestore:rules
```

`firebase.json` configures Hosting and deploys the root `firestore.rules` file. For GitHub Pages, publish these files at the site root and add the GitHub Pages domain to Firebase Auth authorized domains.

## Data and security notes
- Clients use fields including `clientId`, `clientName`, `personalName`, `legalName`, `clientMobile`, `clientEmail`, `constitution`, `gstin`, `pan`, `adhar`, `branchName`, `documentFolder`, `clientStatus`, `notes`, `createdAt`, `updatedAt`.
- Compliance uses `complianceId`, `clientId`, `clientName`, `complianceName`, `compliancePeriod`, `complianceAct`, `complianceDate`, `dueDate`, `filedAt`, `complianceStatus`, `paymentStatus`, `priority`, `taskFolderLink`, `Notes`, `createdAt`, `updatedAt`.
- Ledgers are stored in the admin-only `ledgers` collection with generated IDs (`LED00001`, etc.), name, category, opening balance, balance type, creator UID, and creation time. The next-ID counter is stored in `settings/ledger_counter`.
- Credentials use `credentialId`, `clientId`, `clientName`, `PortalName`, `PortalDocNo`, `UserName`, `Password`, `_source`, `Notes`, `createdAt`, `updatedAt`.
- Passwords are not encrypted by this frontend. The password input is masked visually, but that is not encryption. Prefer storing a secure secret reference and avoid storing Aadhaar/PAN or portal passwords as plaintext. Use server-side encryption or a secrets vault for sensitive values.
- Firestore rules grant full read/write access to any document path only to authenticated users whose `admins/{uid}` document has `active: true` and role `admin` or `owner`. Non-admin access remains limited to explicitly permitted user-profile operations. This allows current and future admin modules to create, view, edit, and delete their data without adding a collection rule each time. Test rules before using real client data.
