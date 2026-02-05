# TrackingTokenStripper Pro v2 - Design Document

**Date:** 2026-02-05
**Status:** Draft
**Author:** AI-assisted brainstorming session

## Overview

Major upgrade of TrackingTokenStripper Pro from URL parameter cleaning to comprehensive anti-tracking solution with modular architecture.

## Problem Statement

Current script only handles URL parameter tracking (Link Decoration). Modern tracking uses layered architecture - if one layer fails, another takes over:

1. URL Parameters → cleaned by current script
2. Storage (localStorage, cookies) → zombie cookie respawn
3. Fingerprinting (Canvas, Audio, Sensors) → stateless identification
4. Network (Beacon, Pixels) → invisible data exfiltration

## Goals

- Extend protection to cover multiple tracking layers
- Focus on social media platforms (Facebook, TikTok, Twitter, LinkedIn, etc.)
- Modular architecture - users enable/disable features via CONFIG
- Fail-safe - one module failure doesn't affect others
- Mobile device support (sensors, hardware fingerprinting)

## Architecture

```
TrackingTokenStripper Pro v2
├── CONFIG
│   ├── modules (enable/disable individual protections)
│   ├── urlCleaner (existing token settings)
│   ├── fingerprint (spoofing settings)
│   ├── mobileSpoofing (sensor settings)
│   └── debug/performance (existing)
│
├── CORE
│   ├── Logger (existing, extended with module tagging)
│   └── Utils (shared helper functions)
│
├── MODULES (7 total)
│   ├── UrlCleaner (existing logic, refactored)
│   ├── HistoryApiPatch (new - SPA support)
│   ├── CanvasSpoofing (new - anti-fingerprint)
│   ├── AudioSpoofing (new - anti-fingerprint)
│   ├── BeaconBlocker (new - network hardening)
│   ├── StoragePoisoner (new - identity stitching prevention)
│   └── MobileSpoofing (new - sensors + HW info)
│
└── INIT
    └── ModuleRunner (launches modules based on CONFIG)
```

## Module Details

### 1. UrlCleaner (existing)

Removes tracking parameters from URLs. Already implemented with 21 token categories.

**Changes:** Refactor into module pattern for consistency.

### 2. HistoryApiPatch (new)

**Problem:** SPA applications (React, Vue, Angular) change URLs via `pushState`/`replaceState` without page reload. Current script misses these.

**Solution:** Monkey-patch History API methods to clean URLs on dynamic navigation.

```javascript
const HistoryApiPatch = {
  init() {
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (state, title, url) => {
      const cleaned = UrlCleaner.cleanUrl(url);
      return originalPushState(state, title, cleaned || url);
    };

    history.replaceState = (state, title, url) => {
      const cleaned = UrlCleaner.cleanUrl(url);
      return originalReplaceState(state, title, cleaned || url);
    };

    window.addEventListener('popstate', () => {
      const cleaned = UrlCleaner.cleanUrl(window.location.href);
      if (cleaned) originalReplaceState(history.state, document.title, cleaned);
    });
  }
};
```

### 3. CanvasSpoofing (new)

**Problem:** Canvas fingerprinting identifies devices by how GPU/OS renders graphics.

**Solution:** Inject subtle noise into Canvas data. Session-consistent to avoid detection.

```javascript
const CanvasSpoofing = {
  noise: { r: 0, g: 0, b: 0 },

  init() {
    this.noise = {
      r: Math.floor(Math.random() * 5) - 2,  // -2 to +2
      g: Math.floor(Math.random() * 5) - 2,
      b: Math.floor(Math.random() * 5) - 2
    };

    const original = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      // Inject noise before returning data
      // Skip empty or very large canvases (video players)
      return original.apply(this, args);
    };
  }
};
```

**Key points:**
- Noise ±2 is invisible to eye but changes hash
- Session-consistent = same result on repeated calls
- Skip large canvases for performance

### 4. AudioSpoofing (new)

**Problem:** Web Audio API fingerprinting measures how device processes audio signals.

**Solution:** Add microscopic noise to audio data.

```javascript
const AudioSpoofing = {
  noise: 0,

  init() {
    this.noise = (Math.random() - 0.5) * 0.0001;

    const original = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function(channel) {
      const data = original.call(this, channel);
      for (let i = 0; i < data.length; i += 100) {
        data[i] += this.noise;
      }
      return data;
    };
  }
};
```

**Coverage:**
- `getChannelData` - main fingerprinting method
- `copyFromChannel` - alternative data access
- `getFloatFrequencyData` - frequency analysis

### 5. BeaconBlocker (new)

**Problem:** `sendBeacon` and `fetch` with `keepalive` send data even when page closes.

**Solution:** Selectively block based on domain patterns.

```javascript
const BeaconBlocker = {
  blockedPatterns: [
    /facebook\.com|facebook\.net|fbcdn\.net/i,
    /google-analytics\.com|googletagmanager\.com/i,
    /tiktok\.com|byteoversea\.com/i,
    /twitter\.com|twimg\.com/i,
    /linkedin\.com|licdn\.com/i,
    /pinterest\.com|pinimg\.com/i,
    /snapchat\.com|sc-cdn\.net/i,
    /reddit\.com|redditstatic\.com/i,
  ],

  init() {
    const originalBeacon = navigator.sendBeacon;
    navigator.sendBeacon = (url, data) => {
      if (this.shouldBlock(url)) return true; // Fake success
      return originalBeacon(url, data);
    };
  },

  shouldBlock(url) {
    // Allow first-party
    if (new URL(url).hostname === location.hostname) return false;
    return this.blockedPatterns.some(p => p.test(url));
  }
};
```

### 6. StoragePoisoner (new)

**Problem:** Platforms use localStorage/cookies for identity stitching across websites.

**Solution:** Instead of deleting (triggers respawn), poison values by changing 4 random characters. Format preserved, hash invalidated.

```javascript
const StoragePoisoner = {
  targets: {
    // Facebook/Meta
    '_fbp': true, '_fbc': true, 'fr': true,
    // Instagram
    'ig_did': true, 'mid': true,
    // Twitter/X
    'personalization_id': true, 'guest_id': true, 'twid': true,
    // TikTok
    '_ttp': true, 'tt_webid': true, 'ttwid': true,
    // LinkedIn
    'li_gc': true, 'bcookie': true, 'li_sugr': true,
    // Pinterest
    '_pinterest_sess': true, '_pin_unauth': true,
    // Snapchat
    '_scid': true, 'sc_at': true,
    // Reddit
    '_rdt_uuid': true, 'loid': true,
    // YouTube
    'VISITOR_INFO1_LIVE': true, 'YSC': true,
    // And more...
  },

  poisonValue(original) {
    if (!original || original.length < 8) return original;

    const chars = 'abcdef0123456789';
    const arr = original.split('');

    // Change 4 random positions (not first/last)
    for (let i = 0; i < 4; i++) {
      const pos = 2 + Math.floor(Math.random() * (arr.length - 4));
      if (/[a-f0-9]/i.test(arr[pos])) {
        arr[pos] = chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return arr.join('');
  }
};
```

**Strategy:**
- Once per session (not every pageload)
- Preserves format, invalidates hash
- Platforms can't perform identity stitching

### 7. MobileSpoofing (new)

**Problem:** Mobile devices have additional fingerprinting vectors via sensors and hardware APIs.

**Solution:** Spoof sensor data and standardize hardware values.

```javascript
const MobileSpoofing = {
  init() {
    this.spoofDeviceMotion();    // Accelerometer/gyroscope noise
    this.spoofTouchPoints();      // Standardize to 5
    this.spoofNetworkInfo();      // Fake 4G/10Mbps
    this.spoofHardwareInfo();     // Fake 4 cores / 4GB RAM
  },

  spoofDeviceMotion() {
    // Add noise to accelerometer/gyroscope events
    // Each sensor has unique calibration errors = fingerprint
  },

  spoofTouchPoints() {
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
  },

  spoofNetworkInfo() {
    Object.defineProperty(navigator, 'connection', {
      get: () => ({ effectiveType: '4g', downlink: 10, rtt: 50 })
    });
  },

  spoofHardwareInfo() {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 4 });
  }
};
```

**Coverage:**
| API | Fingerprint Vector | Solution |
|-----|-------------------|----------|
| DeviceMotion/Orientation | Sensor calibration errors | Add noise |
| Touch Events | Touch point count (5 vs 10) | Standardize to 5 |
| Network Information | Connection type, speed | Fake 4G |
| Hardware Concurrency | CPU core count | Fake 4 cores |
| Device Memory | RAM amount | Fake 4GB |

## Configuration

```javascript
const CONFIG = {
  debugMode: false,
  performanceMonitoring: false,

  modules: {
    urlCleaner: true,
    historyApiPatch: true,
    canvasSpoofing: true,
    audioSpoofing: true,
    beaconBlocker: true,
    storagePoisoner: false,    // Aggressive - disabled by default
    mobileSpoofing: true,
  },

  fingerprint: {
    noiseAmplitude: 2,
    consistentPerSession: true,
  },

  beaconBlocker: {
    blockAll: false,
    allowFirstParty: true,
  },

  storagePoisoner: {
    frequency: 'session',
    // Full target list in implementation
  },

  mobileSpoofing: {
    deviceMotion: true,
    touchPoints: true,
    networkInfo: true,
    hardwareInfo: true,
    fakeValues: {
      maxTouchPoints: 5,
      hardwareConcurrency: 4,
      deviceMemory: 4,
      connectionType: '4g',
      downlink: 10,
    }
  }
};
```

## Module Runner

```javascript
const ModuleRunner = {
  modules: {
    urlCleaner: UrlCleaner,
    historyApiPatch: HistoryApiPatch,
    canvasSpoofing: CanvasSpoofing,
    audioSpoofing: AudioSpoofing,
    beaconBlocker: BeaconBlocker,
    storagePoisoner: StoragePoisoner,
    mobileSpoofing: MobileSpoofing,
  },

  run() {
    for (const [name, module] of Object.entries(this.modules)) {
      if (!CONFIG.modules[name]) continue;

      try {
        module.init();
      } catch (error) {
        Logger.error('Init', `${name} failed: ${error.message}`);
        // Continue with other modules
      }
    }
  }
};
```

## Social Media Platform Coverage

### Storage Keys by Platform

| Platform | Keys |
|----------|------|
| Facebook/Meta | `_fbp`, `_fbc`, `fr`, `datr`, `sb`, `wd` |
| Instagram | `ig_did`, `ig_nrcb`, `mid` |
| Twitter/X | `personalization_id`, `guest_id`, `guest_id_ads`, `twid`, `muc_ads` |
| TikTok | `_ttp`, `tt_webid`, `tt_webid_v2`, `ttwid`, `tt_chain_token` |
| LinkedIn | `li_gc`, `li_mc`, `bcookie`, `bscookie`, `lidc`, `li_sugr`, `li_fat_id` |
| Pinterest | `_pinterest_sess`, `_pinterest_ct`, `_pin_unauth`, `_epik` |
| Snapchat | `_scid`, `_scid_r`, `sc_at`, `_sctr` |
| Reddit | `_rdt_uuid`, `rdt_uid`, `session_tracker`, `loid` |
| YouTube | `VISITOR_INFO1_LIVE`, `YSC`, `GPS`, `PREF` |
| Twitch | `unique_id` |
| Discord | `_dc_gtm_*`, `_gcl_au` |
| Tumblr | `tmblr_bid` |
| VKontakte | `remixstid`, `remixua` |
| Weibo | `wb_view_log`, `wvr` |

## What This Solution Cannot Address

These require browser-level or network-level solutions:

- **CNAME Cloaking** - DNS-level tracking disguised as first-party
- **HSTS Supercookies** - Binary encoding in HSTS cache
- **Server-Side Tracking** - Backend forwarding (GTM Server-Side, Facebook CAPI)
- **TLS Fingerprinting** - Handshake characteristics
- **IP-based tracking** - Requires VPN/Tor

## Implementation Plan

1. Refactor existing UrlCleaner into module pattern
2. Implement HistoryApiPatch
3. Implement CanvasSpoofing
4. Implement AudioSpoofing
5. Implement BeaconBlocker
6. Implement StoragePoisoner
7. Implement MobileSpoofing
8. Implement ModuleRunner
9. Update CONFIG structure
10. Testing on major social media platforms
11. Update README and version

## Success Criteria

- All modules initialize without errors
- URL cleaning works on SPA sites (Facebook, Instagram)
- Canvas fingerprint hash changes between sessions
- Audio fingerprint hash changes between sessions
- Beacon requests to social platforms blocked
- Storage IDs poisoned (identity stitching fails)
- Mobile sensor data contains noise
- No breaking of normal website functionality

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking website functionality | Modules disabled by default if aggressive |
| Detection by anti-bot systems | Session-consistent spoofing, realistic fake values |
| Performance impact | Skip large canvases, sample every Nth data point |
| Future API changes | Modular design allows easy updates |

## References

- Analysis document: `analyza.txt`
- Current implementation: `TrackingTokenStripper-pro.user.js`
- Evercookie research
- Canvas fingerprinting papers
- Web Audio fingerprinting research
