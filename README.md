# Postbase (Demo)

Open Source, Drop-in Replacement and Self-Hosted Alternative for Firebase using Node.js, Express.js, BetterAuth and PostgreSQL (JSONB), node-pg-migrate

Firebase 💔 | Supabase 💔 | Postbase ❤️

Demo Preact app is included !

## Disclaimer !!!

Brand new project launched 02 Nov 2025, this is boiler plate but working! Expect heavy changes coming every few hours until stable

Mostly all code is ChatGPT generated but manually tested by human.

## Docs

### Authentication (Firebase Like API)

#### auth.js

```javascript
import { createAuthClient as createBetterAuthClient } from 'better-auth/client';
import { createAuthClient } from './lib/postbase/auth';

export const authClient = createBetterAuthClient({
    // baseURL: import.meta.env.VITE_API_BASE + '/auth', // Optional, only specify if on a different domain/path,
});

export const auth = createAuthClient(authClient);

export const { signUp, signIn, signOut, getSession } = authClient;
```

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
