# SRE Command Center - Testing Guide

> **Step-by-step guide to test the application as an end user.**

---

## 🎯 Testing Overview

This guide walks you through testing every feature of SRE Command Center, from login to remediation execution. Follow these steps sequentially to verify the system works correctly.

---

## 📋 Pre-requisites Checklist

Before testing, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Application running (`npm run dev`)
- [ ] Supabase project created with Auth enabled
- [ ] `.env.local` configured with:
  ```env
  NEXT_PUBLIC_TAMBO_API_KEY=your_key
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

---

## 🧪 Test Scenarios

### Test 1: Authentication Flow

#### 1.1 Email/Password Registration

| Step | Action                                    | Expected Result                          |
| ---- | ----------------------------------------- | ---------------------------------------- |
| 1    | Navigate to `http://localhost:3000`       | Landing page loads with cyber aesthetic  |
| 2    | Click "INITIALIZE_COMMAND_CTR"            | Redirected to `/login` (protected route) |
| 3    | Click "CREATE_OPERATOR_PROFILE"           | Navigate to `/signup` page               |
| 4    | Enter email: `test@example.com`           | Field accepts input                      |
| 5    | Enter password: `testpassword123`         | Field shows dots                         |
| 6    | Enter confirm password: `testpassword123` | Field shows dots                         |
| 7    | Click "REGISTER_OPERATOR"                 | Loading spinner appears                  |
| 8    | Check email inbox                         | Confirmation email received              |
| 9    | Click confirmation link in email          | Redirected to login page                 |
| 10   | Login with credentials                    | Redirected to `/sre` dashboard           |

**Pass Criteria**: User can register, confirm email, and login successfully.

---

#### 1.2 OAuth Login (GitHub)

| Step | Action                  | Expected Result                  |
| ---- | ----------------------- | -------------------------------- |
| 1    | Navigate to `/login`    | Login page loads                 |
| 2    | Click "GitHub" button   | Redirected to GitHub OAuth page  |
| 3    | Authorize the app       | Redirected back to app           |
| 4    | Observe URL             | Should be `/sre` (authenticated) |
| 5    | Check User Nav dropdown | Shows GitHub email               |

**Pass Criteria**: OAuth flow completes and user is authenticated.

---

#### 1.3 Session Persistence

| Step | Action                                                | Expected Result                         |
| ---- | ----------------------------------------------------- | --------------------------------------- |
| 1    | Login successfully                                    | On `/sre` page                          |
| 2    | Close browser tab                                     | -                                       |
| 3    | Open new tab, navigate to `http://localhost:3000/sre` | Still authenticated (no login required) |
| 4    | Click "TERMINATE_SESSION" in user dropdown            | Redirected to landing page              |
| 5    | Navigate to `/sre`                                    | Redirected to `/login`                  |

**Pass Criteria**: Session persists across tabs, logout works correctly.

---

### Test 2: Chat Interface

#### 2.1 Basic Message Send

| Step | Action                                 | Expected Result                     |
| ---- | -------------------------------------- | ----------------------------------- |
| 1    | Navigate to `/sre` while authenticated | Dashboard loads with chat interface |
| 2    | Type "Hello" in message input          | Text appears in input field         |
| 3    | Press Enter or click Send              | Message appears in thread           |
| 4    | Observe AI response                    | AI responds with text               |

**Pass Criteria**: Messages send and receive successfully.

---

#### 2.2 Component Generation

| Step | Action                                | Expected Result                       |
| ---- | ------------------------------------- | ------------------------------------- |
| 1    | Type: "Show me the system status"     | Message sent                          |
| 2    | Wait for AI response                  | `ServiceStatusGrid` component renders |
| 3    | Type: "Show me anomalies"             | Message sent                          |
| 4    | Wait for AI response                  | `AnomalyHeatmap` component renders    |
| 5    | Type: "What's the root cause?"        | Message sent                          |
| 6    | Wait for AI response                  | `RootCauseAnalysis` component renders |
| 7    | Type: "Show me the incident timeline" | Message sent                          |
| 8    | Wait for AI response                  | `IncidentTimeline` component renders  |

**Pass Criteria**: AI correctly selects and renders appropriate components.

---

#### 2.3 Tool Execution

| Step | Action                                            | Expected Result          |
| ---- | ------------------------------------------------- | ------------------------ |
| 1    | Type: "Copy this text to clipboard: INCIDENT-001" | Message sent             |
| 2    | Wait for AI response                              | AI confirms text copied  |
| 3    | Paste (Ctrl+V) in a text editor                   | "INCIDENT-001" pasted    |
| 4    | Type: "Play a critical alert sound"               | Message sent             |
| 5    | Wait for AI response                              | Beep sound plays         |
| 6    | Type: "What timezone am I in?"                    | Message sent             |
| 7    | Wait for AI response                              | Shows your timezone info |

**Pass Criteria**: Local browser tools execute correctly.

---

### Test 3: Component Interactions

#### 3.1 Service Status Grid

| Step | Action                        | Expected Result                             |
| ---- | ----------------------------- | ------------------------------------------- |
| 1    | Ask: "Show me service health" | Grid renders with services                  |
| 2    | Hover over a service card     | Card highlights                             |
| 3    | Check status colors           | Green=healthy, amber=degraded, red=critical |
| 4    | Check metrics display         | Uptime, latency, error rate visible         |

**Pass Criteria**: Grid displays correctly with interactive elements.

---

#### 3.2 Anomaly Heatmap

| Step | Action                         | Expected Result                        |
| ---- | ------------------------------ | -------------------------------------- |
| 1    | Ask: "Show me anomaly heatmap" | Heatmap renders                        |
| 2    | Hover over a cell              | Tooltip shows service, time, and score |
| 3    | Check color coding             | Green=low, yellow=medium, red=high     |
| 4    | Check legend                   | Legend explains colors                 |

**Pass Criteria**: Heatmap is interactive with tooltips.

---

#### 3.3 Incident Timeline

| Step | Action                           | Expected Result              |
| ---- | -------------------------------- | ---------------------------- |
| 1    | Ask: "Show me incident timeline" | Timeline renders             |
| 2    | Check event list                 | Events shown chronologically |
| 3    | Check metric overlay             | Error rate bars visible      |
| 4    | Check severity badge             | Shows incident severity      |

**Pass Criteria**: Timeline displays events and metrics correctly.

---

#### 3.4 Root Cause Analysis

| Step | Action                           | Expected Result                |
| ---- | -------------------------------- | ------------------------------ |
| 1    | Ask: "What's causing the issue?" | RCA component renders          |
| 2    | Check suspected cause            | Clear explanation displayed    |
| 3    | Check confidence score           | Percentage shown (0-100%)      |
| 4    | Check evidence list              | Bullet points with evidence    |
| 5    | Check recommended action         | Action suggestion displayed    |
| 6    | Check related commits (if any)   | Commit SHAs and messages shown |

**Pass Criteria**: All RCA sections populate correctly.

---

### Test 4: Remediation Actions

#### 4.1 List Remediation Options

| Step | Action                                         | Expected Result            |
| ---- | ---------------------------------------------- | -------------------------- |
| 1    | Ask: "What remediation options are available?" | List/component renders     |
| 2    | Check action names                             | Multiple options shown     |
| 3    | Check risk levels                              | Low/medium/high indicators |
| 4    | Check action descriptions                      | Clear explanations         |

**Pass Criteria**: Remediation options displayed correctly.

---

#### 4.2 Execute Remediation (Mock)

| Step | Action                                     | Expected Result            |
| ---- | ------------------------------------------ | -------------------------- |
| 1    | Ask: "Execute the scale horizontal action" | AI processes request       |
| 2    | Check response                             | Success message with steps |
| 3    | Check estimated completion                 | Time estimate shown        |

**Pass Criteria**: Mock remediation executes and returns success.

---

### Test 5: User Interface

#### 5.1 Landing Page

| Step | Action                         | Expected Result                     |
| ---- | ------------------------------ | ----------------------------------- |
| 1    | Navigate to `/`                | Landing page loads                  |
| 2    | Check for scanline animation   | Subtle scanline effect visible      |
| 3    | Check hero section             | Title, tagline, CTAs visible        |
| 4    | Check feature cards            | Three features displayed            |
| 5    | Click "INITIALIZE_COMMAND_CTR" | Navigates to SRE dashboard or login |

**Pass Criteria**: Landing page renders with all elements.

---

#### 5.2 Responsive Design

| Step | Action                    | Expected Result             |
| ---- | ------------------------- | --------------------------- |
| 1    | Open DevTools (F12)       | DevTools opens              |
| 2    | Toggle device toolbar     | Mobile view enabled         |
| 3    | Check login page          | Form fits on mobile         |
| 4    | Check SRE dashboard       | Chat interface adapts       |
| 5    | Check component rendering | Components stack vertically |

**Pass Criteria**: UI is usable on mobile screens.

---

#### 5.3 User Navigation

| Step | Action                         | Expected Result              |
| ---- | ------------------------------ | ---------------------------- |
| 1    | While logged in, find user nav | User avatar/initials visible |
| 2    | Click user nav                 | Dropdown opens               |
| 3    | Check email display            | Your email shown             |
| 4    | Check "PROFILE_SETTINGS" link  | Link present                 |
| 5    | Click "TERMINATE_SESSION"      | Logged out, redirected       |

**Pass Criteria**: User nav dropdown works correctly.

---

### Test 6: Error Handling

#### 6.1 Invalid Login

| Step | Action                     | Expected Result         |
| ---- | -------------------------- | ----------------------- |
| 1    | Navigate to `/login`       | Login page loads        |
| 2    | Enter wrong email/password | -                       |
| 3    | Click "INITIATE_SESSION"   | Error message displayed |
| 4    | Check error styling        | Red border, error icon  |

**Pass Criteria**: Invalid credentials show clear error message.

---

#### 6.2 Password Mismatch (Signup)

| Step | Action                            | Expected Result                 |
| ---- | --------------------------------- | ------------------------------- |
| 1    | Navigate to `/signup`             | Signup page loads               |
| 2    | Enter email                       | -                               |
| 3    | Enter password: `test123`         | -                               |
| 4    | Enter confirm password: `test456` | -                               |
| 5    | Click "REGISTER_OPERATOR"         | Error: "Passwords do not match" |

**Pass Criteria**: Password mismatch validation works.

---

#### 6.3 Protected Route Redirect

| Step | Action                      | Expected Result                             |
| ---- | --------------------------- | ------------------------------------------- |
| 1    | Log out completely          | -                                           |
| 2    | Navigate directly to `/sre` | Redirected to `/login`                      |
| 3    | Check URL                   | `/login?redirectTo=%2Fsre`                  |
| 4    | Login successfully          | Redirected to `/sre` (original destination) |

**Pass Criteria**: Protected routes redirect to login with return URL.

---

## ✅ Test Summary Checklist

| Category    | Test                    | Status |
| ----------- | ----------------------- | ------ |
| Auth        | Email registration      | ⬜     |
| Auth        | Email login             | ⬜     |
| Auth        | GitHub OAuth            | ⬜     |
| Auth        | Google OAuth            | ⬜     |
| Auth        | Session persistence     | ⬜     |
| Auth        | Logout                  | ⬜     |
| Auth        | Protected routes        | ⬜     |
| Chat        | Send message            | ⬜     |
| Chat        | Receive AI response     | ⬜     |
| Components  | ServiceStatusGrid       | ⬜     |
| Components  | AnomalyHeatmap          | ⬜     |
| Components  | IncidentTimeline        | ⬜     |
| Components  | RootCauseAnalysis       | ⬜     |
| Components  | AlertSummary            | ⬜     |
| Tools       | copyToClipboard         | ⬜     |
| Tools       | playAlertSound          | ⬜     |
| Tools       | getTimezoneInfo         | ⬜     |
| Tools       | sendBrowserNotification | ⬜     |
| Remediation | List options            | ⬜     |
| Remediation | Execute (mock)          | ⬜     |
| UI          | Landing page            | ⬜     |
| UI          | Responsive design       | ⬜     |
| UI          | User nav                | ⬜     |
| Errors      | Invalid login           | ⬜     |
| Errors      | Password mismatch       | ⬜     |
| Errors      | Protected redirect      | ⬜     |

---

## 🐛 Reporting Issues

If a test fails:

1. Note the test number and step
2. Capture browser console logs (F12 > Console)
3. Capture network requests (F12 > Network)
4. Take a screenshot
5. Create an issue with reproduction steps

---

_Last Updated: 2026-02-07_
