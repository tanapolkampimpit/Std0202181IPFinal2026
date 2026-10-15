# BlueHR — HR Manager & Salary Analytics System

Internet Programming Final 2026 · Student ID `6730202181` · last seven digits `0202181`.

A working React Native + Expo mobile application with an Express REST API. Login, employee CRUD, status counts and salary analysis use the running backend. No database or external service is required. Expo web is an additional preview of the same React Native components.

## Project structure

```text
Std0202181IPFinal2026/
├── .gitattributes
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── algorithms/kmeans.js
│   │   ├── data/employees.js
│   │   └── middleware/auth.js
│   └── test/
│       ├── api.test.js
│       └── kmeans.test.js
└── frontend/
    ├── .env.example
    ├── App.js
    ├── app.json
    ├── index.js
    ├── jest.config.cjs
    ├── package.json
    ├── package-lock.json
    ├── playwright.config.js
    ├── src/
    │   ├── config.js
    │   ├── theme.js
    │   ├── validation.js
    │   ├── components/
    │   │   ├── AddEmployeeModal.js
    │   │   ├── EmployeeCard.js
    │   │   ├── SummaryCards.js
    │   │   └── ui.js
    │   ├── context/AuthContext.js
    │   ├── hooks/useEmployees.js
    │   ├── screens/
    │   │   ├── LoginScreen.js
    │   │   ├── DashboardScreen.js
    │   │   └── AnalyticsScreen.js
    │   └── services/client.js
    └── test/
        ├── setup.js
        ├── client.test.js
        ├── screens.test.js
        ├── validation.test.js
        ├── integration.test.mjs
        └── browser/app.spec.js
```

Generated/ignored files include `node_modules`, `.expo`, `dist`, `.env` and browser test artifacts.

## Prerequisites

- Node.js **22.13+ LTS** (Node 24.12.0 was used for verification) and npm.
- Expo Go compatible with **Expo SDK 57** on a phone, or an Android emulator. Check [Expo Go SDK compatibility](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) if your installed version differs.
- Phone and computer on the same Wi-Fi for physical-device use. iOS Simulator requires macOS; Android Studio is needed only for an Android emulator.
- Git and a GitHub account only for submission. No account is needed to run the app locally.

## Run the app

Open two terminals. These PowerShell commands assume the supplied Windows folder; on another computer, use the corresponding clone location.

**Terminal 1 — backend**

```powershell
cd C:\Users\tanap\Documents\Exam_ip\Std0202181IPFinal2026\backend
npm ci
npm start
```

The server binds to `0.0.0.0:3000`. Optional: copy `backend/.env.example` to `backend/.env` to change `PORT`. `npm run dev` enables Node's file watcher.

**Terminal 2 — frontend**

```powershell
cd C:\Users\tanap\Documents\Exam_ip\Std0202181IPFinal2026\frontend
npm ci
Copy-Item .env.example .env
```

Edit `.env` to point to the computer running Express, then start Expo:

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3000
```

```powershell
npm start
```

Scan the QR code in Expo Go. `npm run android` opens an installed Android emulator; `npm run ios` is available on macOS. `npm run web` opens the optional browser preview. The app is implemented with React Native `View`, `Text`, `TextInput`, `FlatList`, `Modal`, `StyleSheet` and safe-area/keyboard handling.

**Login:** username `admin`, password `password123`.

The working copy already has an ignored `.env` configured to the Wi-Fi address observed during setup, `http://10.64.105.36:3000`. Do not overwrite it with the example unless you intend to reconfigure it. This address can change after switching networks.

### Network configuration

| Running on | `EXPO_PUBLIC_API_URL` example |
| --- | --- |
| Physical Android/iPhone | `http://192.168.1.10:3000` (replace with computer's LAN IPv4) |
| Android Studio emulator | `http://10.0.2.2:3000` |
| iOS Simulator on the backend computer | `http://localhost:3000` |
| Browser on the backend computer | `http://localhost:3000` |

Use `ipconfig` in PowerShell to find the Wi-Fi/Ethernet IPv4 address. A phone's `localhost` refers to the phone, so it cannot reach your computer's server. Use the LAN address rather than VPN/Tailscale or virtual-network addresses. Allow Node.js through Windows Firewall for your trusted private network, and ensure ports 3000 (API) and 8081 (Metro) are reachable. School/public Wi-Fi may isolate devices; use a shared private hotspot if necessary.

Restart Expo with `npx expo start --clear` after changing `.env`. The URL must include `http://`, the port, and **no `/api` suffix**. `EXPO_PUBLIC_*` variables are bundled into the client and must never contain secrets. Without an environment value, the app defaults to `10.0.2.2:3000` on Android and `localhost:3000` elsewhere.

## App workflow

1. Sign in. The token is held in React context; the employee screens cannot mount without it.
2. Dashboard loads the current employees, status badges, monthly THB salaries and three summary counts. Pull to refresh is supported.
3. Add Employee validates text and salary before posting a numeric salary. All new employees start Active.
4. Toggle Status updates the server, then refreshes the list. Delete opens a native `Alert.alert` with Cancel/Delete on Android/iOS before sending any DELETE request. The optional web preview uses a React Native confirmation modal because native Alert buttons are unavailable there.
5. **Analyze Salary Structure** opens Analytics, immediately shows an activity indicator, and requests current clusters. Failures display Retry. Refresh analysis repeats the calculation.
6. Logout clears the token and returns to Login. Relaunch/reload also requires a fresh login. An authenticated 401 clears the session.

## API

All bodies/responses are JSON. Login is public; every employee endpoint requires `Authorization: Bearer mock-jwt-token`. CORS is enabled for development.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/login` | `{username,password}` → 200 `{success:true,token:"mock-jwt-token"}`; wrong credentials → 401 |
| GET | `/api/employees` | 200 employee array |
| POST | `/api/employees` | `{name,position,salary}` → 201 created employee with string UUID and Active status; validation → 400 |
| PUT | `/api/employees/:id/status` | 200 updated employee, toggles Active ↔ On Leave; unknown ID → 404 |
| DELETE | `/api/employees/:id` | 200 `{success:true,message:"Employee deleted."}`; unknown ID → 404 |
| GET | `/api/employees/salary-clusters` | 200 `{success:true,clusters:[{group,centroid,count},…]}` with exactly three tiers |

Example POST body:

```json
{ "name": "Somchai Jaidee", "position": "Software Engineer", "salary": 45000 }
```

The API deliberately requires salary as a **JSON number**, not a numeric string. It rejects missing/blank text, wrong types, nonfinite numbers, zero and negative salaries. The frontend converts a decimal input string to Number before sending. Error responses have `success:false` and a meaningful `error`; validation responses also include field-level `errors`.

### K-Means implementation

`backend/src/algorithms/kmeans.js` implements deterministic 1D Lloyd K-Means with k=3. It starts at quantiles of distinct observed salaries, assigns each salary to its nearest centroid (ties choose the lower one), recomputes means, and repeats until relative movement is at most `1e-10` or 100 iterations. Groups are sorted by centroid and labelled Tier 1–3. JSON centroids are rounded to two decimal places.

When there are fewer than three distinct salaries, the algorithm uses only available salary levels and pads the result with empty groups (`count:0, centroid:null`). Empty groups sort last. Identical salaries remain together; no employees or salary values are invented. With no employees all three groups are empty. The UI displays `—` for a null centroid. Counts always total the current employee count; every nonempty centroid is the mean of its members. Scaled mean accumulation also handles very large finite values without numeric overflow.

## Automated verification

Install both folders' dependencies first (`npm ci` in each). Tests create isolated in-memory server instances on temporary ports; they do not need your development API to run.

```powershell
# backend/
npm test
npm run test:coverage

# frontend/
npm test
npm run test:integration
npm run check
npx expo-doctor
npm run export
```

- Backend tests cover login success/failure, authentication on every method, initial schema/count, invalid input, create/list, both status directions, deletion/404s, malformed JSON, current analytics counts/means, empty/one/two/duplicate datasets, rounding, determinism, 50 seeded datasets and large finite values.
- React Native component tests cover protected screens, secure password input, login Alert/logout, form validation/numeric payload, status toggle, native delete confirmation, immediate analytics loading, response-derived tiers, failure and Retry. Fetch tests cover network failure, malformed response and timeout.
- `test:integration` uses the **same frontend Fetch helper against real Express HTTP routes**, including authenticated CRUD, analytics and invalid-token logout.
- `check` and Expo Doctor validate dependencies. `export` bundles Android, iOS and web; this is a JavaScript/Hermes compilation check, not an installed APK/IPA or a device test.

Optional end-to-end browser verification of the same React Native app:

```powershell
# frontend/
npx playwright install chromium
npm run test:browser
```

Playwright starts/reuses local backend and Metro servers. Keep the initial John Doe record (ID `1`), or restart the backend to restore it before this test. The test reads the current employee count and cleans up its added record and status changes. It checks widths 320/375/414/768 (plus 1440 login), real sign-in failure/success, CRUD, cancel/confirm delete, three current analytics tiers and logout. Screenshots and failure traces are saved under ignored `frontend/test-results/`. Native Alerts are verified by component tests; their on-device appearance needs a phone/emulator.

### Results verified on 15 October 2026

| Check | Result |
| --- | --- |
| Backend HTTP and K-Means tests | 27 passed, 0 failed |
| Backend source coverage (loaded modules) | 97.83% lines; K-Means 100% lines |
| React Native component, validation and Fetch tests | 22 passed, 0 failed |
| Frontend Fetch ↔ real Express integration | 1 passed |
| Real Expo web end-to-end workflow and responsive checks | 1 passed; no uncaught browser errors |
| Expo dependency compatibility | Passed |
| Expo Doctor | 21/21 checks passed |
| Android, iOS and web export | All bundled successfully |
| Development server startup | Express on 0.0.0.0:3000; Expo/Metro on 8081 |

### Verification limits and known behavior

- Data is only a JavaScript array. Every backend restart restores six initial employees. No database/file persistence.
- `mock-jwt-token` is a fixed development token, **not a signed or secure production JWT**. No token expiry, password hashing or production access control is claimed.
- Development uses HTTP and permissive CORS. Use Expo Go for the exam workflow. A standalone mobile build needs its own platform networking and release configuration.
- This Windows environment has no Android SDK/emulator or iOS Simulator. Android/iOS compilation and native component tests can run here; physical-device networking, keyboard behavior and native Alert presentation still require a device smoke test.
- npm reports transitive advisories in the Expo/Metro/Jest development toolchain. Compatible `npm audit fix` was attempted; remaining fixes suggested incompatible framework changes. The tested SDK dependency set is retained; no forced Expo downgrade is applied. Run `npm audit` for the current report.

## Public GitHub repository and LMS submission

The required repository name is exactly **`Std0202181IPFinal2026`**. Publishing is a separate step requiring the owner's permission; this project is not automatically pushed.

1. On GitHub, create an empty repository named `Std0202181IPFinal2026` and select **Public**. Do not initialize a second README there.
2. From this project root, review the files and run:

```powershell
git init -b main
git add .
git status
git commit -m "Build BlueHR mobile HR manager and salary analytics"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Std0202181IPFinal2026.git
git push -u origin main
```

3. `.gitignore` excludes dependencies, local `.env` files and generated output; commit both lockfiles and `.env.example` files.
4. Open the repository URL in a logged-out/private browser to confirm it is public and includes `backend/`, `frontend/` and this README.
5. Submit `https://github.com/YOUR_GITHUB_USERNAME/Std0202181IPFinal2026` to LMS. Verify a fresh clone using the commands above before submission.
