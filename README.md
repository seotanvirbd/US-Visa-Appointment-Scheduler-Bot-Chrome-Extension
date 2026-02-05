# 🤖 US Visa Appointment Scheduler Bot

> **Automated Chrome Extension for US Visa Slot Monitoring**  
> Continuously monitors [usvisascheduling.com](https://www.usvisascheduling.com), detects available appointment slots using multi-layer DOM analysis, and sends instant Gmail notifications — all with precise timing control and automatic memory management.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)](https://github.com/seotanvirbd/US-Visa-Scheduler-Bot)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2017+-orange?logo=javascript)](https://github.com/seotanvirbd/US-Visa-Scheduler-Bot)

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🎬 Demo](#-demo)
- [🔧 How It Works](#-how-it-works)
- [🚀 Installation](#-installation)
- [💡 Usage](#-usage)
- [📸 Screenshots](#-screenshots)
- [⚙️ Configuration](#-configuration)
- [🧠 Technical Deep Dive](#-technical-deep-dive)
  - [Slot Detection Logic](#slot-detection-logic)
  - [Timing System](#timing-system)
  - [Gmail Tab Management](#gmail-tab-management)
- [🛠️ Tech Stack](#-tech-stack)
- [📁 File Structure](#-file-structure)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📝 Changelog](#-changelog)
- [👨‍💻 Author](#-author)
- [📜 License](#-license)

---

## 🎯 Overview

Getting a US visa appointment in DHAKA is extremely competitive — slots open without warning and disappear within seconds. This Chrome extension solves that problem by:

- **Automated Monitoring** — Checks for slots at precise, configurable intervals (recommended 30-60 seconds)
- **Intelligent Detection** — Uses a two-layer detection system (page text + calendar DOM parsing) to eliminate false positives
- **Instant Notifications** — Sends Gmail compose window with pre-filled email the moment slots become available
- **Memory Optimized** — Automatically manages Gmail tabs, keeping only the 5 newest to prevent memory overflow
- **Persistent Timing** — Maintains accurate cycle timing even across page reloads using `chrome.storage.local`

**Built to solve a real problem:** Securing a US visa appointment when slots are scarce and disappear in seconds.

---

## ✨ Features

### Core Functionality
- 🔄 **Automated Loop Cycling** — Continuously navigates the site and checks for slots at precise intervals
- 🎯 **Two-Layer Slot Detection** — Checks page text first, then parses jQuery UI datepicker calendar DOM
- ⚡ **Instant Slot Alerts** — Zero cooldown when slots are available (immediate notification)
- 📧 **Smart Email Cooldown** — Configurable throttling for "No Slots" emails to prevent inbox spam
- 🔁 **Auto-Resume After Reload** — Automatically restarts if the browser is closed and reopened
- 👥 **Multi-Recipient Support** — Send notifications to multiple email addresses (comma-separated)

### Performance & Optimization
- 💾 **Memory Management** — Automatically closes old Gmail tabs, keeps only 5 newest
- ⏱️ **Persistent Timing** — Survives page reloads and browser restarts
- 🔒 **Concurrency Control** — Prevents overlapping cycle executions
- 📊 **Real-Time Status** — Live countdown and status display in popup

### User Experience
- 🖥️ **Clean UI** — Simple popup with configuration options
- 🔔 **Desktop Notifications** — Browser notification as backup alert
- 📝 **Comprehensive Logging** — Detailed console output for debugging
- 🆓 **100% Free** — No paid subscriptions, no account required

---

## 🎬 Demo

### Quick Start

1. Install the extension
2. Enter your email(s)
3. Set check interval (e.g., 50 seconds)
4. Set notification interval (e.g., 200 seconds)
5. Click "Start Bot"

The bot runs in the background and notifies you instantly when slots appear!

---

## 🔧 How It Works

The bot operates in a continuous cycle, navigating between two pages on the visa scheduling site:

### Automation Cycle Flow

```
┌─────────────────────────────────────────────────────────┐
│                    START / RESUME                        │
│         (reads timing state from chrome.storage)        │
└────────────────────────┬────────────────────────────────┘
                         │  wait exactly N seconds
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PAGE 1 — Home Page  (usvisascheduling.com/en-US/)      │
│                                                         │
│  Bot clicks → "Schedule Appointment" link               │
│  Selector: #continue_application                        │
│  Waits 2s for navigation                                │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PAGE 2 — Schedule Page  (.../en-US/schedule/)          │
│                                                         │
│  1. Selects "DHAKA" from Consular Posts dropdown        │
│     Selector: #post_select                              │
│     Value: 906af614-b0db-ec11-a7b4-001dd80234f6        │
│     Dispatches 'change' event → waits 3s                │
│                                                         │
│  2. Runs slot detection (see below)                     │
│                                                         │
│  3. Sends email if applicable (with cooldown check)     │
│                                                         │
│  4. Navigates back to Home Page → cycle repeats         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites

- **Google Chrome** browser (latest version recommended)
- **Gmail account** (logged in to Chrome)
- **usvisascheduling.com account** (you must log in manually first)

### Steps

1. **Clone or Download the Repository**

   ```bash
   git clone https://github.com/seotanvirbd/US-Visa-Scheduler-Bot.git
   cd US-Visa-Scheduler-Bot
   ```

2. **Open Chrome Extensions Page**

   Navigate to: `chrome://extensions/`

3. **Enable Developer Mode**

   Toggle the switch in the top-right corner

4. **Load the Extension**

   - Click "Load unpacked"
   - Select the `US-Visa-Scheduler-Bot` folder
   - Extension will appear in your toolbar

5. **Pin the Extension** (Optional but Recommended)

   Click the puzzle icon in Chrome toolbar → Pin "Visa Scheduler"

---

## 💡 Usage

### Step-by-Step Guide

1. **Log into Gmail**

   Make sure you're logged into your Gmail account in Chrome

2. **Log into US Visa Scheduling Site**

   Visit [usvisascheduling.com](https://www.usvisascheduling.com) and log in manually

3. **Open the Extension Popup**

   Click the extension icon in your Chrome toolbar

4. **Configure Settings**

   - **Email(s):** Enter notification email(s) (comma-separated for multiple)
   - **Loop Cycle Interval:** How often to check for slots (30-60 seconds recommended)
   - **Email Notification Interval:** How often to send "No Slots" emails (150-300 seconds recommended)

5. **Start the Bot**

   Click "▶️ Start Bot" button

6. **Monitor Status**

   - Watch the status bar in the popup
   - Open DevTools Console (`F12`) for detailed logs
   - Bot will notify you instantly when slots appear!

7. **Stop the Bot** (Optional)

   Click "⏹️ Stop Bot" at any time

### Example Configuration

```
Email(s): user1@gmail.com, user2@gmail.com
Loop Cycle Interval: 50 seconds
Email Notification Interval: 200 seconds

Result:
- Bot checks every 50 seconds
- "No Slots" emails sent every 200 seconds
- "Slots Available" emails sent IMMEDIATELY (no cooldown)
- Maximum 5 Gmail tabs kept open at any time
```

---

## 📸 Screenshots

### Home Page — Starting Point

The bot automatically clicks "Schedule Appointment" in the left sidebar.

![Home Page - Schedule Appointment](1.png)

### Consular Posts Dropdown

Bot opens the dropdown to select the consular post.

![Consular Posts Dropdown](2.png)

### DHAKA Selection

Bot programmatically selects DHAKA and triggers the change event.

![DHAKA Selected](3.png)

### Slot Check Result

Bot reads the page state and determines slot availability.

![No Slots Available Result](4.png)

---

## ⚙️ Configuration

### Settings Reference

| Setting | Min | Max | Default | Description |
|---------|-----|-----|---------|-------------|
| **Email(s)** | 1 | Unlimited | — | Comma-separated list of notification email addresses |
| **Loop Cycle Interval** | 10s | 300s | 50s | How often the bot runs one full check cycle |
| **Email Notification Interval** | 30s | 3600s | 200s | Cooldown between consecutive "No Slots" emails |
| **Max Gmail Tabs** | — | — | 5 | Maximum Gmail compose tabs kept open (configurable in code) |

### Advanced Configuration

**To change the maximum Gmail tabs limit:**

Edit `content.js` and find this line:

```javascript
const MAX_GMAIL_TABS = 5;
```

Change to your preferred limit (e.g., `10` for 10 tabs).

**To change the consular post:**

Edit `content.js` and find:

```javascript
const dhakaValue = '906af614-b0db-ec11-a7b4-001dd80234f6';
```

Replace with your desired consular post value (inspect the dropdown on the site to find the value).

---

## 🧠 Technical Deep Dive

### Slot Detection Logic

The site has an inconsistency: sometimes it displays a "No Slots Available" banner, but other times it shows a calendar where *every date* is marked unavailable. A simple text check would cause false positives.

#### Two-Step Detection Pipeline

**Step 1 — Page Text Check**

```javascript
const bodyText = document.body.innerText;
const noSlotsAvailable = bodyText.includes('No Slots Available');

if (noSlotsAvailable) {
  // Definite no slots
  return false;
}
// Proceed to Step 2
```
```
Scan full page text for "No Slots Available"
        │
        ├── FOUND  →  ❌ No slots. Done.
        │
        └── NOT FOUND  →  Proceed to Step 2
```

If the banner text exists anywhere in the page body, the decision is immediate — no slots.

**Step 2 — Calendar DOM Inspection**

```javascript
const datepicker = document.querySelector('#datepicker');

// Find all date cells
const allDateCells = datepicker.querySelectorAll('td:not(.ui-datepicker-other-month)');

// A date is UNAVAILABLE if it has any of these:
// - class "redday"
// - class "ui-state-disabled"  
// - title="No Available Appointments"

const availableDates = Array.from(allDateCells).filter(cell => {
  return !cell.classList.contains('redday')
      && !cell.classList.contains('ui-state-disabled')
      && cell.getAttribute('title') !== 'No Available Appointments';
});

return availableDates.length > 0; // true = slots available
```
When the banner is missing, the bot parses the jQuery UI Datepicker calendar rendered on the page. It locates the `#datepicker` container and inspects every `<td>` element representing a date:

```
Find #datepicker container
        │
        ├── NOT FOUND  →  ❌ No slots (safe default)
        │
        └── FOUND
                │
                ▼
        Scan all <td> date cells
        Exclude cells with class: ui-datepicker-other-month
                │
                ▼
        A date is UNAVAILABLE if ANY of these are true:
          • has class "redday"
          • has class "ui-state-disabled"
          • has title="No Available Appointments"
                │
                ▼
        A date is AVAILABLE only if NONE of the above apply
                │
                ├── Available dates > 0  →  ✅ Slots available!
                └── Available dates = 0  →  ❌ No slots
```
#### All Detection Scenarios

| # | "No Slots" Banner | Calendar State | Result |
|---|---|---|---|
| 1 | ✅ Found | — (not checked) | ❌ No Slots |
| 2 | ❌ Not found | ❌ Calendar not found | ❌ No Slots (safe default) |
| 3 | ❌ Not found | All dates red/disabled | ❌ No Slots |
| 4 | ❌ Not found | ≥1 date available | ✅ **Slots Available** |

**Why the safe default?**

If neither text nor calendar is found (e.g., during page transition), defaulting to "no slots" prevents false-positive alerts. A false negative (missing slots for one 50s cycle) is far less costly than a false positive.

### Timing System

**The Problem:** Every cycle navigates away from the schedule page, reloading the content script and destroying all JavaScript variables. A naive `setInterval` would reset on every reload.

**The Solution:** Store absolute timestamps in `chrome.storage.local`, which persists across page loads.

#### Timing Variables

| Key | Purpose |
|---|---|
| `nextCycleTime` | Exact Unix timestamp (ms) when next cycle should fire |
| `lastCycleTime` | Timestamp of most recent cycle |
| `lastNoSlotsEmailTime` | Last "no slots" email sent |
| `lastSlotsAvailableEmailTime` | Last "slots available" email sent |
| `cycleCounter` | Running count of total cycles |

#### Core Timing Logic

```javascript
// Runs every 1 second
setInterval(() => {
  chrome.storage.local.get(['nextCycleTime'], (result) => {
    const now = Date.now();
    
    if (now >= result.nextCycleTime) {
      // Save next target BEFORE navigating
      chrome.storage.local.set({
        nextCycleTime: now + botConfig.interval,
        lastCycleTime: now
      });
      
      runBotCycle(); // This will navigate the page
    }
  });
}, 1000);
```

#### Notification Cooldown

| Condition | Email Behavior |
|---|---|
| Slots **available** | ✉️ **Immediate** — zero cooldown |
| No slots **(first check)** | ✉️ **Immediate** — no previous timestamp |
| No slots **(repeating)** | ⏳ **Throttled** — only after cooldown period |

#### Timing Example

```
Settings: Loop = 50s, Email Notification = 200s

Time 0:00  →  Cycle 1  →  No slots  →  ✉️ Email sent (first)
Time 0:50  →  Cycle 2  →  No slots  →  ⏳ Cooldown (150s left)
Time 1:40  →  Cycle 3  →  No slots  →  ⏳ Cooldown (100s left)
Time 2:30  →  Cycle 4  →  No slots  →  ⏳ Cooldown (50s left)
Time 3:20  →  Cycle 5  →  No slots  →  ✉️ Email sent (200s elapsed)
Time 4:10  →  Cycle 6  →  SLOTS!    →  ✉️ Sent IMMEDIATELY ⚡
                                         Bot stops automatically
```

### Gmail Tab Management

**The Problem:** After running for 1-2 hours, dozens of Gmail compose tabs accumulate, consuming memory.

**The Solution:** Automatically track and close old tabs, keeping only the 5 newest.

#### How It Works

1. **Track Tab IDs**

   Every time a Gmail tab opens, its ID is stored in `chrome.storage.local`:

   ```javascript
   gmailTabIds: [12345, 12346, 12347, 12348, 12349]
   ```

2. **Auto-Close Old Tabs**

   When the 6th tab opens:
   - The oldest tab (12345) is closed via `chrome.tabs.remove()`
   - Array updated: `[12346, 12347, 12348, 12349, 67890]`

3. **Memory Stays Low**

   ```
   Before: Unlimited tabs → Memory full after 2 hours ❌
   After:  Max 5 tabs → Memory stays low indefinitely ✅
   ```

#### Console Output

```
📑 MANAGING GMAIL TABS
📑 New tab ID: 67890
📋 Current Gmail tabs: [12345, 12346, 12347, 12348, 12349]
📊 Current count: 5
➕ Added new tab ID: 67890
⚠️ Too many Gmail tabs!
📊 Total tabs: 6
🗑️ Need to close: 1 oldest tab(s)
🎯 Tabs to close: [12345]
✅ Closed tab: 12345
✂️ Trimmed tab list to newest 5
💾 Final Gmail tabs: [12346, 12347, 12348, 12349, 67890]
📊 Final count: 5
✅ TAB MANAGEMENT COMPLETE
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Runtime** | Chrome Extension Manifest V3 |
| **Core Scripts** | JavaScript (ES2017+ async/await) |
| **DOM Manipulation** | `querySelector`, `querySelectorAll`, jQuery UI Datepicker parsing |
| **State Management** | `chrome.storage.local` (persistent across page loads) |
| **Messaging** | `chrome.runtime.onMessage`, `chrome.tabs.sendMessage` |
| **Tab Management** | `chrome.tabs.create`, `chrome.tabs.remove` |
| **Notifications** | Chrome Notifications API + Gmail Compose automation |
| **Permissions** | `activeTab`, `storage`, `tabs`, `notifications`, `scripting` |

---

## 📁 File Structure

```
US-Visa-Scheduler-Bot/
│
├── manifest.json              # Chrome extension manifest (v3)
│                              # Declares permissions, content scripts, service worker
│
├── popup.html                 # Extension popup UI
│                              # Inputs for email, intervals, start/stop buttons
│
├── popup.js                   # Popup logic
│                              # Validation, storage read/write, message passing
│
├── background.js              # Service worker
│                              # Handles desktop notifications and tab management
│
├── content.js                 # Main bot logic (22KB)
│                              # Cycle loop, slot detection, email cooldown,
│                              # persistent timing, Gmail tab management
│
├── gmail-composer.js          # Gmail content script (12KB)
│                              # Auto-fills compose window with pending email data
│
├── README.md                  # This file
├── LICENSE                    # MIT License
└── images/                    # Screenshots
    ├── 1.png
    ├── 2.png
    ├── 3.png
    └── 4.png
```

### Role of Each File

**`manifest.json`**  
Declares the extension configuration, registers content scripts for `usvisascheduling.com` and `mail.google.com`, requests necessary permissions.

**`popup.html` / `popup.js`**  
User interface for configuration. Validates inputs, saves to `chrome.storage.local`, sends messages to content script.

**`content.js`**  
The heart of the extension. Runs on `usvisascheduling.com`. Handles:
- Automated cycle loop with persistent timing
- Two-layer slot detection
- Email cooldown logic
- Gmail tab management
- Auto-resume after reload

**`background.js`**  
Service worker that handles:
- Chrome desktop notifications
- Opening Gmail tabs via `chrome.tabs.create()`
- Closing old tabs via `chrome.tabs.remove()`

**`gmail-composer.js`**  
Runs on `mail.google.com`. Reads pending email data from storage, auto-fills compose window fields, clicks Send.

---

## 🐛 Troubleshooting

### Common Issues

#### Bot stops after page reload

**Cause:** The bot was not configured to auto-resume  
**Solution:** Make sure `botRunning: true` is set in storage. The bot should auto-resume after a 2-second delay.

#### Too many Gmail tabs still accumulating

**Cause:** Old tabs from before the tab management update are not tracked  
**Solution:** Manually close all old Gmail tabs once, then the 5-tab limit will apply.

#### Bot fires immediately instead of waiting

**Cause:** Timing variables in storage were corrupted or cleared  
**Solution:** Stop and restart the bot. Timing will reset correctly.

#### "No Slots" emails sending too frequently

**Cause:** Email notification interval is set too low  
**Solution:** Increase the notification interval (recommended: 200+ seconds).

#### Gmail tabs not closing automatically

**Cause:** Permission issue or background worker not running  
**Solution:** 
1. Check that `tabs` permission is in `manifest.json`
2. Reload the extension: `chrome://extensions/` → Click reload icon
3. Check console for error messages

#### Bot not detecting available slots

**Cause:** Calendar structure changed on the website  
**Solution:** Check console logs. If the datepicker selector or date cell classes changed, update `content.js` accordingly.

### Debug Mode

To see detailed logs:

1. Open DevTools: `F12` or Right-click → Inspect
2. Go to **Console** tab
3. Navigate to `usvisascheduling.com`
4. Start the bot
5. Watch for emoji-prefixed logs:
   - 🤖 Bot initialization
   - ⚙️ Configuration
   - 🔄 Cycle execution
   - 🔍 Slot checking
   - 📧 Email notifications
   - 📑 Tab management

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Bug Reports

Found a bug? Please open an issue with:
- Chrome version
- Extension version
- Steps to reproduce
- Console error messages (if any)
- Screenshots (if applicable)

### Feature Requests

Have an idea? Open an issue describing:
- The feature
- Why it would be useful
- How it should work

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add your feature'`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update README if needed
- Test with different intervals and scenarios

---

## 📝 Changelog

### Version 2.1.0 (2026-02-05)
- ✨ **NEW:** Gmail tab management — automatically closes old tabs, keeps only 5 newest
- 🐛 **FIX:** Memory optimization to prevent browser slowdown after long runs
- 📝 **IMPROVED:** Enhanced console logging for tab operations

### Version 2.0.0 (2026-02-03)
- ✨ **NEW:** Two-layer slot detection (page text + calendar DOM parsing)
- ✨ **NEW:** Persistent timing using `chrome.storage.local`
- ✨ **NEW:** Separate email notification cooldown interval
- ✨ **NEW:** Auto-resume after page reload
- 🐛 **FIX:** Timing accuracy — no more instant-fire bugs
- 🐛 **FIX:** False positive detection eliminated
- 📝 **IMPROVED:** Comprehensive logging system

### Version 1.0.0 (2026-01-28)
- 🎉 Initial release
- ✅ Basic automation loop
- ✅ Gmail notification system
- ✅ Simple slot detection

---

## 👨‍💻 Author

**Mohammad Tanvir**  
Python Web Scraping & AI Automation Specialist

| Platform | Link |
|---|---|
| 🌐 Portfolio | [seotanvirbd.com](https://seotanvirbd.com) |
| 💼 GitHub | [@seotanvirbd](https://github.com/seotanvirbd) |
| 🏆 Upwork | Top Rated • 100% Job Success Rate |
| 📧 Email | tanvirafra1@gmail.com |
| 📝 Blog | [Technical Deep Dive](https://seotanvirbd.com/blog/us-visa-appointment-scheduler-bot) |

### Skills Demonstrated

- Chrome Extension Architecture (Manifest V3)
- Service Workers & Content Scripts
- Persistent State Management
- DOM Parsing & Web Automation
- Asynchronous Control Flow
- Browser API Integration
- Memory Optimization
- Event-Driven Programming

---

## 📜 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Mohammad Tanvir

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## ⭐ Show Your Support

If this extension helped you secure a visa appointment, please:

- ⭐ Star this repository
- 🔀 Fork and contribute
- 📢 Share with others who need it
- 🐛 Report bugs or suggest features

---

## 🙏 Acknowledgments

- Built to solve a real-world problem faced by thousands of visa applicants
- Thanks to the open-source community for Chrome extension documentation
- Special thanks to everyone who provided feedback and testing

---

## 📞 Support

Need help? Have questions?

1. 📖 Check the [Troubleshooting](#-troubleshooting) section
2. 🐛 Open an [Issue](https://github.com/seotanvirbd/US-Visa-Scheduler-Bot/issues)
3. 📧 Email: tanvirafra1@gmail.com
4. 💬 [LinkedIn](https://linkedin.com/in/seotanvirbd)

---

<div align="center">

**Built with ❤️ by [Mohammad Tanvir](https://seotanvirbd.com)**

*Solving real problems with automation*

⭐ Star this repo if you found it helpful! ⭐

</div>
