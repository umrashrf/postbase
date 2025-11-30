![Postbase Logo](https://github.com/umrashrf/postbase/blob/main/logo.png?raw=true)

# 🐘 Postbase (Demo)

Open Source, localhost supported, Drop-in Replacement and Self-Hosted Alternative for Firebase using Node.js, Express.js, BetterAuth and PostgreSQL (JSONB), node-pg-migrate

Firebase 💔 | Supabase 💔 | Postbase ❤️

Demo Preact app is included !

## Features

### Authentication Features

- [x] Sign Up ➕👤
- [x] Sign In 🔑
- [x] Forgot Password ❓🔐
- [x] Reset Password ♻️🔐
- [x] Email Verification Email ✉️✔️
- [x] Phone Verification Codes 📱✔️

### Database Features

- [x] NoSQL Document Storage 🗄️
- [x] Collections 📁
- [x] Query functions 🔍
- [x] CRUD Functions 🛠️
- [x] Security Rules 🛡️

### File Upload / Storage

- [x] HTTPS File Storage 🌐📦
- [x] Security Rules 🛡️

### Admin & System

- [x] Admin SDK 👑🗄️
- [x] Nginx Config 🧱
- [x] Systemd Config ⚙️
- [x] Git Push Deployment ⬆️🐙

## Disclaimer !!!

Brand new project launched 02 Nov 2025, this is boiler plate but working! Expect heavy changes coming every few hours until stable

Mostly all code is ChatGPT generated but manually tested by human.

## Getting Started

To create a new project with Postbase, all you have to do is clone this repo.

```
git clone https://github.com/umrashrf/postbase.git
```

then start backend and frontend servers and modify as needed!

Both backend/ and frontend/ folders have their own README.md

## Docs

### Authentication (Firebase Like API)

#### Sign Up

```javascript
import { signIn } from './auth';

await signUp.email({ 
    email: 'umrashrf@gmail.com', 
    password: 'secure-password', 
    name: 'Umair Ashraf', 
    callbackURL: "/dashboard",
});
```

#### Sign In

```javascript
import { signIn } from './auth';

await signIn.email({ 
    email: 'umrashrf@gmail.com',
    password: 'secure-password',
    callbackURL: '/dashboard',
});
```

#### auth.onAuthStateChanged, auth.currentUser and auth.currentUser.getIdToken()

```javascript
import { auth } from './auth';

auth.onAuthStateChanged(user => {
    // user
    auth.currentUser === user // true
});

const token = auth.currentUser.getIdToken();
// token for API authentication and rules engine
```

### Document Storage (Firestore Like API)

#### Collections, get/set/where/orderBy/limit/delete

```javascript
import { db } from "./postbase";

const data = await db.collection('users').doc('docId').get();

await db.collection('users').set({ name: "Umair" }, { merge: true });

const reference = db.collection('users')
    .where('name', '==', 'Umair')
    .orderBy('createdAt')
    .limit(5);

const docs = await reference.get();

reference.onSnapshot(docs => {
    // use docs
});
```

#### Admin Client

```javascript
import { createAdminClient } from './lib/postbase/compat/admin.js';
import { authClient } from './auth.js';

const admin = createAdminClient({ authClient });

const user = await admin.auth().getUser(userId);

const doc = await admin.firestore().collection('collection').doc('docId').get();
```

### Todo
- [ ] Firebase Functions Replacement (Backend API can be used for now)
- [ ] Firebase Storage Replacement (Support S3 and other backend)

### In Progress
- [ ] Testing

### Done
- [x] Firebase Authentication Replacement
- [x] Firebase Firestore Replacement
- [x] Firebase Storage Replacement (Filebased Only)
- [x] Firebase Storage Replacement (HTTPS Based Upload)

## License 

MIT
