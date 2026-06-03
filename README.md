# נחש אותי — משחק מסיבה ישראלי

משחק מסיבה "מי אני?" עם קטגוריות ישראליות ומולטיפלייר בזמן אמת (**React**, **Vite**, **Firebase Firestore**).

## דרישות

- Node.js 18+
- פרויקט Firebase עם Firestore (ראה להלן)

## הגדרת Firebase

1. [Firebase Console](https://console.firebase.google.com/) → פרויקט חדש → אפליקציית Web.
2. העתק את ערכי הקונפיג ל-`.env` (העתק מ-`.env.example`).
3. Firestore → Rules → העלה את `firestore.rules`.
4. Authentication → Settings → **Authorized domains**: הוסף `localhost` ודומיין ה-production (Vercel/Netlify).

```bash
cp .env.example .env
# ערוך .env עם הערכים מהקונסול
```

## הרצה מקומית

```bash
npm install
npm run dev
```

http://localhost:3000

```bash
npm run build
npm run preview
```

## פריסה (Vercel / Netlify)

- Build: `npm run build`
- Output: `dist`
- הגדר ב-hosting את משתני הסביבה `VITE_FIREBASE_*` (אותם ערכים כמו ב-`.env`)

`vercel.json` ו-`netlify.toml` כבר מוגדרים ל-SPA.

## PWA ואייקון

מקור האייקון: `public/icon-source.png`. יצירת גדלים: `npm run icons`.

אחרי deploy ב-HTTPS: התקנה למסך הבית.

## גרסאות

מקור: `package.json` → `version`. לפני build רץ `version:sync` (יוצר `version.json`).

| פקודה | שימוש |
|--------|--------|
| `npm run version:patch` | 1.0.0 → 1.0.1 |
| `npm run version:minor` | 1.0.0 → 1.1.0 |
| `npm run version:sync` | עדכון build + iOS Info.plist |

## iOS (Capacitor)

```bash
brew install cocoapods   # פעם ראשונה
npm run cap:ios          # setup + אייקונים + sync + Xcode
```

דרישות: macOS, Xcode, CocoaPods.

## מבנה

```
src/App.tsx
src/lib/firebase.ts
src/components/
firestore.rules
```
