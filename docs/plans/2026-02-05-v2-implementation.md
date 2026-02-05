# TrackingTokenStripper Pro v2 - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform single-purpose URL cleaner into modular anti-tracking suite with 7 protection modules.

**Architecture:** Modular IIFE with CONFIG-driven module loading. Each module is self-contained with init() method. ModuleRunner orchestrates initialization with fail-safe error handling.

**Tech Stack:** Vanilla JavaScript, Tampermonkey GM_* APIs, Web APIs (Canvas, Audio, History, Beacon)

---

## Task 1: Extend CONFIG with Module Settings

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js:29-257`

**Step 1: Add modules section to CONFIG**

Add after line 35 (`performanceMonitoring: false,`):

```javascript
        // Module enable/disable flags
        modules: {
            urlCleaner: true,           // URL parameter cleaning (existing)
            historyApiPatch: true,      // SPA support (pushState/replaceState)
            canvasSpoofing: true,       // Canvas fingerprint protection
            audioSpoofing: true,        // Audio fingerprint protection
            beaconBlocker: true,        // Block tracking beacons
            storagePoisoner: false,     // Identity stitching prevention (aggressive)
            mobileSpoofing: true,       // Mobile sensor spoofing
        },

        // Fingerprint spoofing settings
        fingerprint: {
            noiseAmplitude: 2,          // Noise range: -N to +N
            consistentPerSession: true, // Same noise for entire session
        },

        // Beacon blocker settings
        beaconBlocker: {
            allowFirstParty: true,      // Allow beacons to same domain
            blockedPatterns: [
                /facebook\.com|facebook\.net|fbcdn\.net/i,
                /google-analytics\.com|googletagmanager\.com/i,
                /doubleclick\.net|googlesyndication\.com/i,
                /tiktok\.com|tiktokcdn\.com|byteoversea\.com/i,
                /twitter\.com|twimg\.com|t\.co/i,
                /linkedin\.com|licdn\.com/i,
                /pinterest\.com|pinimg\.com/i,
                /snapchat\.com|snapkit\.com|sc-cdn\.net/i,
                /reddit\.com|redditstatic\.com/i,
                /analytics|tracking|pixel|collect|beacon/i,
            ],
        },

        // Storage poisoner settings
        storagePoisoner: {
            frequency: 'session',       // When to poison: 'pageload' | 'session'
            targets: {
                // Facebook/Meta
                '_fbp': true, '_fbc': true, 'fr': true, 'datr': true, 'sb': true,
                // Instagram
                'ig_did': true, 'ig_nrcb': true, 'mid': true,
                // Twitter/X
                'personalization_id': true, 'guest_id': true, 'guest_id_ads': true,
                'guest_id_marketing': true, 'twid': true, 'muc_ads': true,
                // TikTok
                '_ttp': true, 'tt_webid': true, 'tt_webid_v2': true, 'ttwid': true,
                // LinkedIn
                'li_gc': true, 'li_mc': true, 'bcookie': true, 'bscookie': true,
                'lidc': true, 'li_sugr': true, 'li_fat_id': true,
                // Pinterest
                '_pinterest_sess': true, '_pinterest_ct': true, '_pin_unauth': true, '_epik': true,
                // Snapchat
                '_scid': true, '_scid_r': true, 'sc_at': true,
                // Reddit
                '_rdt_uuid': true, 'loid': true,
                // YouTube
                'VISITOR_INFO1_LIVE': true, 'YSC': true,
                // Twitch
                'unique_id': true,
                // Others
                'tmblr_bid': true, 'remixstid': true, 'remixua': true,
            },
        },

        // Mobile spoofing settings
        mobileSpoofing: {
            deviceMotion: true,         // Accelerometer/gyroscope noise
            touchPoints: true,          // Standardize touch points
            networkInfo: true,          // Fake network info
            hardwareInfo: true,         // Fake hardware info
            fakeValues: {
                maxTouchPoints: 5,
                hardwareConcurrency: 4,
                deviceMemory: 4,
                connectionType: '4g',
                downlink: 10,
            },
        },
```

**Step 2: Verify syntax**

Open browser console on any page with Tampermonkey, check for errors.

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(config): add module settings for v2 architecture"
```

---

## Task 2: Create ModuleRunner Infrastructure

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js` (add after Logger class, ~line 340)

**Step 1: Add ModuleRunner class**

Insert after the Logger class (after line 340):

```javascript
    // ============================================================================
    // MODULE RUNNER
    // ============================================================================

    /**
     * Orchestrates module initialization with fail-safe error handling
     * Each module failure is isolated - doesn't affect other modules
     */
    const ModuleRunner = {
        modules: {},
        initialized: [],
        failed: [],
        logger: null,

        /**
         * Register a module for initialization
         * @param {string} name - Module name (must match CONFIG.modules key)
         * @param {object} module - Module object with init() method
         */
        register(name, module) {
            this.modules[name] = module;
        },

        /**
         * Run all registered modules based on CONFIG
         * @param {Logger} logger - Logger instance
         */
        run(logger) {
            this.logger = logger;
            const startTime = performance.now();

            for (const [name, module] of Object.entries(this.modules)) {
                // Skip disabled modules
                if (!CONFIG.modules[name]) {
                    this.logger.debug(`Module ${name}: disabled`);
                    continue;
                }

                try {
                    module.init(this.logger);
                    this.initialized.push(name);
                    this.logger.debug(`Module ${name}: initialized`);
                } catch (error) {
                    this.failed.push({ name, error: error.message });
                    this.logger.error(`Module ${name} failed to initialize`, error);
                    // Continue with other modules (fail-safe)
                }
            }

            const elapsed = (performance.now() - startTime).toFixed(2);
            this.logger.info(`ModuleRunner complete in ${elapsed}ms`, {
                active: this.initialized,
                failed: this.failed.map(f => f.name),
            });
        },

        /**
         * Get stats for debugging
         */
        getStats() {
            return {
                registered: Object.keys(this.modules),
                initialized: this.initialized,
                failed: this.failed,
            };
        },
    };
```

**Step 2: Verify syntax**

Check browser console for errors.

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(core): add ModuleRunner for module orchestration"
```

---

## Task 3: Refactor UrlCleaner as Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Create UrlCleanerModule wrapper**

Replace the URLSanitizer class and add module wrapper. Insert after ModuleRunner (keeping URLSanitizer and RedirectManager classes):

```javascript
    // ============================================================================
    // MODULE: URL CLEANER
    // ============================================================================

    /**
     * URL Cleaner Module - removes tracking parameters from URLs
     * This is the original functionality wrapped as a module
     */
    const UrlCleanerModule = {
        name: 'UrlCleaner',
        sanitizer: null,
        redirectManager: null,
        logger: null,

        init(logger) {
            this.logger = logger;
            this.sanitizer = new URLSanitizer(logger);
            this.redirectManager = new RedirectManager(logger);

            // Clean current URL on init
            this.cleanCurrentUrl();

            this.logger.debug('UrlCleaner module initialized');
        },

        cleanCurrentUrl() {
            const currentUrl = location.href;
            const cleanUrl = this.sanitizer.sanitize(currentUrl);

            if (cleanUrl && cleanUrl !== currentUrl) {
                this.logger.info('Tracking tokens detected, initiating cleanup');
                this.redirectManager.redirect(cleanUrl);
            }
        },

        /**
         * Public method to clean any URL (used by HistoryApiPatch)
         */
        cleanUrl(urlString) {
            return this.sanitizer.sanitize(urlString);
        },
    };

    // Register module
    ModuleRunner.register('urlCleaner', UrlCleanerModule);
```

**Step 2: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "refactor(url-cleaner): wrap existing logic as module"
```

---

## Task 4: Implement HistoryApiPatch Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Add HistoryApiPatch module**

Insert after UrlCleanerModule:

```javascript
    // ============================================================================
    // MODULE: HISTORY API PATCH
    // ============================================================================

    /**
     * History API Patch Module - enables URL cleaning for SPA applications
     * Intercepts pushState/replaceState to clean tracking parameters
     */
    const HistoryApiPatchModule = {
        name: 'HistoryApiPatch',
        logger: null,
        originalPushState: null,
        originalReplaceState: null,

        init(logger) {
            this.logger = logger;

            // Store original methods
            this.originalPushState = history.pushState.bind(history);
            this.originalReplaceState = history.replaceState.bind(history);

            // Patch methods
            this.patchPushState();
            this.patchReplaceState();
            this.addPopstateListener();

            this.logger.debug('HistoryApiPatch module initialized');
        },

        patchPushState() {
            const self = this;
            history.pushState = function(state, title, url) {
                if (url) {
                    const cleaned = self.cleanUrlIfNeeded(url);
                    if (cleaned) {
                        self.logger.debug(`pushState cleaned: ${url} → ${cleaned}`);
                        return self.originalPushState(state, title, cleaned);
                    }
                }
                return self.originalPushState(state, title, url);
            };
        },

        patchReplaceState() {
            const self = this;
            history.replaceState = function(state, title, url) {
                if (url) {
                    const cleaned = self.cleanUrlIfNeeded(url);
                    if (cleaned) {
                        self.logger.debug(`replaceState cleaned: ${url} → ${cleaned}`);
                        return self.originalReplaceState(state, title, cleaned);
                    }
                }
                return self.originalReplaceState(state, title, url);
            };
        },

        addPopstateListener() {
            const self = this;
            window.addEventListener('popstate', () => {
                const cleaned = self.cleanUrlIfNeeded(window.location.href);
                if (cleaned) {
                    self.logger.debug(`popstate cleaned: ${window.location.href}`);
                    self.originalReplaceState(history.state, document.title, cleaned);
                }
            });
        },

        cleanUrlIfNeeded(urlString) {
            try {
                const url = new URL(urlString, window.location.origin);
                const params = url.searchParams;
                let changed = false;

                for (const key of Array.from(params.keys())) {
                    if (TOKENS_TO_REMOVE.has(key)) {
                        params.delete(key);
                        changed = true;
                    }
                }

                return changed ? url.toString() : null;
            } catch (e) {
                return null;
            }
        },
    };

    // Register module
    ModuleRunner.register('historyApiPatch', HistoryApiPatchModule);
```

**Step 2: Test on SPA site**

1. Open Facebook or Instagram
2. Navigate between pages
3. Check console for "pushState cleaned" messages

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(history-api): add SPA support with pushState/replaceState patching"
```

---

## Task 5: Implement CanvasSpoofing Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Add CanvasSpoofing module**

Insert after HistoryApiPatchModule:

```javascript
    // ============================================================================
    // MODULE: CANVAS SPOOFING
    // ============================================================================

    /**
     * Canvas Spoofing Module - adds noise to canvas fingerprinting attempts
     * Injects subtle noise that changes the hash but is invisible to the eye
     */
    const CanvasSpoofingModule = {
        name: 'CanvasSpoofing',
        logger: null,
        noise: { r: 0, g: 0, b: 0 },

        init(logger) {
            this.logger = logger;

            // Generate session-consistent noise
            this.generateNoise();

            // Patch toDataURL
            this.patchToDataURL();

            // Patch getImageData
            this.patchGetImageData();

            this.logger.debug('CanvasSpoofing module initialized', {
                noise: this.noise,
            });
        },

        generateNoise() {
            const amp = CONFIG.fingerprint.noiseAmplitude;
            this.noise = {
                r: Math.floor(Math.random() * (amp * 2 + 1)) - amp,
                g: Math.floor(Math.random() * (amp * 2 + 1)) - amp,
                b: Math.floor(Math.random() * (amp * 2 + 1)) - amp,
            };

            // Avoid all zeros (no effect)
            if (this.noise.r === 0 && this.noise.g === 0 && this.noise.b === 0) {
                this.noise.r = 1;
            }
        },

        patchToDataURL() {
            const self = this;
            const original = HTMLCanvasElement.prototype.toDataURL;

            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                // Skip empty or very large canvases (video players, games)
                if (this.width === 0 || this.height === 0) {
                    return original.apply(this, args);
                }
                if (this.width * this.height > 500000) {
                    return original.apply(this, args);
                }

                try {
                    self.injectNoise(this);
                } catch (e) {
                    // CORS or other error - return original
                }

                return original.apply(this, args);
            };
        },

        patchGetImageData() {
            const self = this;
            const original = CanvasRenderingContext2D.prototype.getImageData;

            CanvasRenderingContext2D.prototype.getImageData = function(...args) {
                const imageData = original.apply(this, args);

                // Skip large data
                if (imageData.data.length > 2000000) {
                    return imageData;
                }

                try {
                    self.applyNoiseToImageData(imageData);
                } catch (e) {
                    // Return original on error
                }

                return imageData;
            };
        },

        injectNoise(canvas) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.applyNoiseToImageData(imageData);
            ctx.putImageData(imageData, 0, 0);
        },

        applyNoiseToImageData(imageData) {
            const data = imageData.data;

            // Modify every 10th pixel for performance
            for (let i = 0; i < data.length; i += 40) {
                data[i] = this.clamp(data[i] + this.noise.r);         // R
                data[i + 1] = this.clamp(data[i + 1] + this.noise.g); // G
                data[i + 2] = this.clamp(data[i + 2] + this.noise.b); // B
                // Alpha (i + 3) unchanged
            }
        },

        clamp(value) {
            return Math.max(0, Math.min(255, value));
        },
    };

    // Register module
    ModuleRunner.register('canvasSpoofing', CanvasSpoofingModule);
```

**Step 2: Test canvas fingerprinting**

1. Visit https://browserleaks.com/canvas
2. Refresh page multiple times
3. Hash should be different each session but consistent within session

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(canvas): add canvas fingerprint spoofing with session-consistent noise"
```

---

## Task 6: Implement AudioSpoofing Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Add AudioSpoofing module**

Insert after CanvasSpoofingModule:

```javascript
    // ============================================================================
    // MODULE: AUDIO SPOOFING
    // ============================================================================

    /**
     * Audio Spoofing Module - adds noise to audio fingerprinting attempts
     * Injects microscopic noise that changes the fingerprint hash
     */
    const AudioSpoofingModule = {
        name: 'AudioSpoofing',
        logger: null,
        noise: 0,

        init(logger) {
            this.logger = logger;

            // Generate session-consistent noise factor
            this.noise = (Math.random() - 0.5) * 0.0001; // ±0.00005

            // Patch audio methods
            this.patchGetChannelData();
            this.patchCopyFromChannel();
            this.patchGetFloatFrequencyData();

            this.logger.debug('AudioSpoofing module initialized', {
                noiseFactor: this.noise.toExponential(2),
            });
        },

        patchGetChannelData() {
            const self = this;
            const original = AudioBuffer.prototype.getChannelData;

            AudioBuffer.prototype.getChannelData = function(channel) {
                const data = original.call(this, channel);

                // Add noise every 100th sample for performance
                for (let i = 0; i < data.length; i += 100) {
                    data[i] += self.noise;
                }

                return data;
            };
        },

        patchCopyFromChannel() {
            const self = this;
            const original = AudioBuffer.prototype.copyFromChannel;

            if (!original) return; // May not exist in all browsers

            AudioBuffer.prototype.copyFromChannel = function(dest, channel, offset = 0) {
                original.call(this, dest, channel, offset);

                for (let i = 0; i < dest.length; i += 100) {
                    dest[i] += self.noise;
                }
            };
        },

        patchGetFloatFrequencyData() {
            const self = this;
            const original = AnalyserNode.prototype.getFloatFrequencyData;

            AnalyserNode.prototype.getFloatFrequencyData = function(array) {
                original.call(this, array);

                // Frequency data has different range, scale noise accordingly
                for (let i = 0; i < array.length; i += 50) {
                    array[i] += self.noise * 1000;
                }
            };
        },
    };

    // Register module
    ModuleRunner.register('audioSpoofing', AudioSpoofingModule);
```

**Step 2: Test audio fingerprinting**

1. Visit https://browserleaks.com/audio
2. Refresh and compare hashes between sessions

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(audio): add audio fingerprint spoofing"
```

---

## Task 7: Implement BeaconBlocker Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Add BeaconBlocker module**

Insert after AudioSpoofingModule:

```javascript
    // ============================================================================
    // MODULE: BEACON BLOCKER
    // ============================================================================

    /**
     * Beacon Blocker Module - blocks tracking beacons and pixels
     * Intercepts sendBeacon and fetch with keepalive
     */
    const BeaconBlockerModule = {
        name: 'BeaconBlocker',
        logger: null,
        stats: { blocked: 0, allowed: 0 },

        init(logger) {
            this.logger = logger;

            // Patch sendBeacon
            this.patchSendBeacon();

            // Patch fetch with keepalive
            this.patchFetch();

            this.logger.debug('BeaconBlocker module initialized');
        },

        shouldBlock(url) {
            try {
                const targetHost = new URL(url, location.origin).hostname;

                // Allow first-party if configured
                if (CONFIG.beaconBlocker.allowFirstParty && targetHost === location.hostname) {
                    return false;
                }

                // Test against blocked patterns
                return CONFIG.beaconBlocker.blockedPatterns.some(pattern => pattern.test(url));
            } catch (e) {
                // Invalid URL - block it
                return true;
            }
        },

        patchSendBeacon() {
            const self = this;
            const original = navigator.sendBeacon?.bind(navigator);

            if (!original) return;

            navigator.sendBeacon = function(url, data) {
                if (self.shouldBlock(url)) {
                    self.stats.blocked++;
                    self.logger.debug(`Beacon blocked: ${url}`);
                    return true; // Fake success
                }

                self.stats.allowed++;
                return original(url, data);
            };
        },

        patchFetch() {
            const self = this;
            const original = window.fetch;

            window.fetch = function(input, init) {
                // Only intercept keepalive requests (beacon-like)
                if (init?.keepalive) {
                    const url = typeof input === 'string' ? input : input.url;

                    if (self.shouldBlock(url)) {
                        self.stats.blocked++;
                        self.logger.debug(`Fetch keepalive blocked: ${url}`);
                        return Promise.resolve(new Response('', { status: 200 }));
                    }
                }

                return original.apply(this, arguments);
            };
        },

        getStats() {
            return this.stats;
        },
    };

    // Register module
    ModuleRunner.register('beaconBlocker', BeaconBlockerModule);
```

**Step 2: Test beacon blocking**

1. Open browser DevTools Network tab
2. Visit Facebook or a page with tracking
3. Check console for "Beacon blocked" messages

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(beacon): add beacon and keepalive fetch blocking"
```

---

## Task 8: Implement StoragePoisoner Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Add StoragePoisoner module**

Insert after BeaconBlockerModule:

```javascript
    // ============================================================================
    // MODULE: STORAGE POISONER
    // ============================================================================

    /**
     * Storage Poisoner Module - corrupts tracking IDs to prevent identity stitching
     * Instead of deleting (which triggers respawn), modifies values to break linking
     */
    const StoragePoisonerModule = {
        name: 'StoragePoisoner',
        logger: null,
        stats: { poisoned: 0 },
        sessionKey: '_tts_poisoned',

        init(logger) {
            this.logger = logger;

            // Check if already poisoned this session
            if (CONFIG.storagePoisoner.frequency === 'session') {
                if (sessionStorage.getItem(this.sessionKey)) {
                    this.logger.debug('StoragePoisoner: already poisoned this session');
                    return;
                }
            }

            // Poison localStorage
            this.poisonStorage(localStorage, 'localStorage');

            // Poison sessionStorage
            this.poisonStorage(sessionStorage, 'sessionStorage');

            // Poison cookies
            this.poisonCookies();

            // Mark as poisoned for this session
            sessionStorage.setItem(this.sessionKey, Date.now().toString());

            this.logger.debug('StoragePoisoner module initialized', {
                poisoned: this.stats.poisoned,
            });
        },

        poisonStorage(storage, storageName) {
            const targets = CONFIG.storagePoisoner.targets;

            for (const key of Object.keys(targets)) {
                if (!targets[key]) continue; // Skip disabled targets

                try {
                    const value = storage.getItem(key);
                    if (value) {
                        const poisoned = this.poisonValue(value);
                        storage.setItem(key, poisoned);
                        this.stats.poisoned++;
                        this.logger.debug(`${storageName} poisoned: ${key}`);
                    }
                } catch (e) {
                    // Ignore errors (may be blocked by browser)
                }
            }
        },

        poisonCookies() {
            const targets = CONFIG.storagePoisoner.targets;
            const cookies = document.cookie.split(';');

            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (!name || !value) continue;

                if (targets[name]) {
                    try {
                        const poisoned = this.poisonValue(decodeURIComponent(value));
                        document.cookie = `${name}=${encodeURIComponent(poisoned)}; path=/`;
                        this.stats.poisoned++;
                        this.logger.debug(`Cookie poisoned: ${name}`);
                    } catch (e) {
                        // Ignore errors
                    }
                }
            }
        },

        /**
         * Poison a value by changing 4 random characters
         * Preserves format but invalidates the hash for identity stitching
         */
        poisonValue(original) {
            if (!original || typeof original !== 'string' || original.length < 8) {
                return original;
            }

            const chars = 'abcdef0123456789';
            const arr = original.split('');

            // Safe range: not first 2 or last 2 characters (often contain metadata)
            const safeStart = Math.min(2, arr.length - 6);
            const safeEnd = Math.max(safeStart + 4, arr.length - 2);

            // Change 4 random positions
            for (let i = 0; i < 4; i++) {
                const pos = safeStart + Math.floor(Math.random() * (safeEnd - safeStart));
                if (pos < arr.length && /[a-f0-9]/i.test(arr[pos])) {
                    arr[pos] = chars[Math.floor(Math.random() * chars.length)];
                }
            }

            return arr.join('');
        },

        getStats() {
            return this.stats;
        },
    };

    // Register module
    ModuleRunner.register('storagePoisoner', StoragePoisonerModule);
```

**Step 2: Test storage poisoning**

1. Visit Facebook, check localStorage in DevTools
2. Enable storagePoisoner in CONFIG
3. Refresh, check if _fbp value changed

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(storage): add storage poisoner for identity stitching prevention"
```

---

## Task 9: Implement MobileSpoofing Module

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Add MobileSpoofing module**

Insert after StoragePoisonerModule:

```javascript
    // ============================================================================
    // MODULE: MOBILE SPOOFING
    // ============================================================================

    /**
     * Mobile Spoofing Module - spoofs mobile device sensors and hardware info
     * Adds noise to accelerometer/gyroscope and standardizes hardware values
     */
    const MobileSpoofingModule = {
        name: 'MobileSpoofing',
        logger: null,
        motionNoise: 0,

        init(logger) {
            this.logger = logger;

            // Generate session-consistent noise for motion sensors
            this.motionNoise = (Math.random() - 0.5) * 0.02; // ±0.01

            // Spoof based on config
            if (CONFIG.mobileSpoofing.deviceMotion) {
                this.spoofDeviceMotion();
            }
            if (CONFIG.mobileSpoofing.touchPoints) {
                this.spoofTouchPoints();
            }
            if (CONFIG.mobileSpoofing.networkInfo) {
                this.spoofNetworkInfo();
            }
            if (CONFIG.mobileSpoofing.hardwareInfo) {
                this.spoofHardwareInfo();
            }

            this.logger.debug('MobileSpoofing module initialized');
        },

        spoofDeviceMotion() {
            const self = this;
            const originalAddEventListener = window.addEventListener;

            window.addEventListener = function(type, listener, options) {
                if (type === 'devicemotion' || type === 'deviceorientation') {
                    const wrappedListener = (event) => {
                        const spoofedEvent = self.createSpoofedMotionEvent(event, type);
                        listener(spoofedEvent);
                    };
                    return originalAddEventListener.call(this, type, wrappedListener, options);
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
        },

        createSpoofedMotionEvent(event, type) {
            const self = this;
            const noise = () => self.motionNoise * (Math.random() + 0.5);

            return new Proxy(event, {
                get(target, prop) {
                    // DeviceMotionEvent properties
                    if (prop === 'accelerationIncludingGravity' && target[prop]) {
                        return {
                            x: target[prop].x !== null ? target[prop].x + noise() : null,
                            y: target[prop].y !== null ? target[prop].y + noise() : null,
                            z: target[prop].z !== null ? target[prop].z + noise() : null,
                        };
                    }
                    if (prop === 'acceleration' && target[prop]) {
                        return {
                            x: target[prop].x !== null ? target[prop].x + noise() : null,
                            y: target[prop].y !== null ? target[prop].y + noise() : null,
                            z: target[prop].z !== null ? target[prop].z + noise() : null,
                        };
                    }
                    if (prop === 'rotationRate' && target[prop]) {
                        return {
                            alpha: target[prop].alpha !== null ? target[prop].alpha + noise() * 10 : null,
                            beta: target[prop].beta !== null ? target[prop].beta + noise() * 10 : null,
                            gamma: target[prop].gamma !== null ? target[prop].gamma + noise() * 10 : null,
                        };
                    }

                    // DeviceOrientationEvent properties
                    if (['alpha', 'beta', 'gamma'].includes(prop)) {
                        return target[prop] !== null ? target[prop] + noise() * 10 : null;
                    }

                    return target[prop];
                }
            });
        },

        spoofTouchPoints() {
            const fakeValue = CONFIG.mobileSpoofing.fakeValues.maxTouchPoints;
            try {
                Object.defineProperty(navigator, 'maxTouchPoints', {
                    get: () => fakeValue,
                    configurable: true,
                });
            } catch (e) {
                // May fail in some browsers
            }
        },

        spoofNetworkInfo() {
            if (!navigator.connection) return;

            const fakeConnection = {
                effectiveType: CONFIG.mobileSpoofing.fakeValues.connectionType,
                downlink: CONFIG.mobileSpoofing.fakeValues.downlink,
                rtt: 50,
                saveData: false,
                type: 'wifi',
                onchange: null,
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => true,
            };

            try {
                Object.defineProperty(navigator, 'connection', {
                    get: () => fakeConnection,
                    configurable: true,
                });
            } catch (e) {
                // May fail in some browsers
            }
        },

        spoofHardwareInfo() {
            const fakeValues = CONFIG.mobileSpoofing.fakeValues;

            try {
                Object.defineProperty(navigator, 'hardwareConcurrency', {
                    get: () => fakeValues.hardwareConcurrency,
                    configurable: true,
                });
            } catch (e) {}

            try {
                Object.defineProperty(navigator, 'deviceMemory', {
                    get: () => fakeValues.deviceMemory,
                    configurable: true,
                });
            } catch (e) {}
        },
    };

    // Register module
    ModuleRunner.register('mobileSpoofing', MobileSpoofingModule);
```

**Step 2: Test hardware spoofing**

1. Open browser console
2. Type `navigator.hardwareConcurrency` - should return 4
3. Type `navigator.deviceMemory` - should return 4

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "feat(mobile): add mobile sensor and hardware spoofing"
```

---

## Task 10: Update main() and Initialization

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js`

**Step 1: Update main() function**

Replace the existing main() function and initialization (lines ~602-656):

```javascript
    // ============================================================================
    // MAIN EXECUTION
    // ============================================================================

    /**
     * Main execution function with modular architecture
     */
    function main() {
        const logger = new Logger('TTS-Pro', CONFIG.debugMode);

        try {
            logger.info('TrackingTokenStripper Pro v2 initializing', {
                url: location.href,
                timestamp: new Date().toISOString(),
            });

            // Run all registered modules
            ModuleRunner.run(logger);

            // Expose debug interface if enabled
            if (CONFIG.debugMode) {
                window.__TTS_PRO__ = {
                    version: GM_info.script.version,
                    config: CONFIG,
                    stats: () => ModuleRunner.getStats(),
                    modules: ModuleRunner.modules,
                };
                logger.info('Debug interface exposed as window.__TTS_PRO__');
            }

        } catch (error) {
            logger.error('Critical error in main execution', error);
            console.error('[TTS-Pro] CRITICAL ERROR:', error);
        }
    }

    // ============================================================================
    // SCRIPT INITIALIZATION
    // ============================================================================

    try {
        main();
    } catch (criticalError) {
        console.error('[TTS-Pro] FATAL ERROR:', criticalError);
    }
```

**Step 2: Test full initialization**

1. Enable debugMode in CONFIG
2. Refresh page
3. Check console for module initialization messages
4. Type `window.__TTS_PRO__.stats()` in console

**Step 3: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "refactor(main): update initialization for modular architecture"
```

---

## Task 11: Update Version and Metadata

**Files:**
- Modify: `TrackingTokenStripper-pro.user.js:1-15`

**Step 1: Update version and description**

```javascript
// ==UserScript==
// @name         TrackingTokenStripper Pro
// @version      20260205.01
// @description  Enterprise-grade anti-tracking suite: URL cleaning, fingerprint spoofing, beacon blocking, and more (v2)
// @homepage     https://github.com/vojtaflorian/TrackingTokenStripper-Pro
// @namespace    https://github.com/vojtaflorian/TrackingTokenStripper-Pro
// @author       Vojta Florian (Inspired by Will Huang https://github.com/doggy8088/TrackingTokenStripper)
// @updateURL    https://raw.githubusercontent.com/vojtaflorian/TrackingTokenStripper-Pro/refs/heads/master/TrackingTokenStripper-pro.user.js
// @downloadURL  https://raw.githubusercontent.com/vojtaflorian/TrackingTokenStripper-Pro/refs/heads/master/TrackingTokenStripper-pro.user.js
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        GM_info
// ==/UserScript==
```

**Step 2: Commit**

```bash
git add TrackingTokenStripper-pro.user.js
git commit -m "chore: bump version to 20260205.01 (v2 release)"
```

---

## Task 12: Update README

**Files:**
- Modify: `README.md`

**Step 1: Update README with v2 features**

Add new section after existing features:

```markdown
## v2 Features (2026-02-05)

### Modular Architecture
- **UrlCleaner** - URL parameter tracking removal (21 token categories)
- **HistoryApiPatch** - SPA support for React, Vue, Angular apps
- **CanvasSpoofing** - Canvas fingerprint protection with session-consistent noise
- **AudioSpoofing** - Audio fingerprint protection
- **BeaconBlocker** - Blocks tracking beacons and pixels
- **StoragePoisoner** - Corrupts tracking IDs to prevent identity stitching (disabled by default)
- **MobileSpoofing** - Mobile sensor and hardware fingerprint protection

### Configuration
Enable/disable modules in the CONFIG section:
```javascript
modules: {
    urlCleaner: true,
    historyApiPatch: true,
    canvasSpoofing: true,
    audioSpoofing: true,
    beaconBlocker: true,
    storagePoisoner: false,  // Aggressive - enable manually
    mobileSpoofing: true,
}
```

### Social Media Coverage
Protects against tracking from 15+ platforms:
- Facebook/Meta, Instagram, WhatsApp
- Twitter/X
- TikTok
- LinkedIn
- Pinterest
- Snapchat
- Reddit
- YouTube
- Twitch, Discord, Tumblr, VK, Weibo

### Debug Mode
Enable `debugMode: true` in CONFIG to access:
```javascript
window.__TTS_PRO__.stats()   // Module statistics
window.__TTS_PRO__.config    // Current configuration
window.__TTS_PRO__.modules   // Registered modules
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with v2 features"
```

---

## Task 13: Final Testing and Commit

**Step 1: Full test checklist**

- [ ] Script loads without errors
- [ ] URL cleaning works on direct page load
- [ ] URL cleaning works on SPA navigation (Facebook, Instagram)
- [ ] Canvas hash different between sessions (browserleaks.com/canvas)
- [ ] Audio hash different between sessions (browserleaks.com/audio)
- [ ] Beacons blocked (check console)
- [ ] Hardware values spoofed (`navigator.hardwareConcurrency === 4`)
- [ ] Debug interface works (`window.__TTS_PRO__`)

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete v2 implementation with 7 protection modules

- URL parameter cleaning (existing, refactored)
- History API patching for SPA support
- Canvas fingerprint spoofing
- Audio fingerprint spoofing
- Beacon and pixel blocking
- Storage poisoning for identity stitching prevention
- Mobile sensor and hardware spoofing

Closes #v2-implementation"
```

---

## Summary

| Task | Component | Type |
|------|-----------|------|
| 1 | CONFIG extension | Config |
| 2 | ModuleRunner | Core |
| 3 | UrlCleanerModule | Refactor |
| 4 | HistoryApiPatchModule | New |
| 5 | CanvasSpoofingModule | New |
| 6 | AudioSpoofingModule | New |
| 7 | BeaconBlockerModule | New |
| 8 | StoragePoisonerModule | New |
| 9 | MobileSpoofingModule | New |
| 10 | main() update | Refactor |
| 11 | Version bump | Chore |
| 12 | README update | Docs |
| 13 | Final testing | QA |
