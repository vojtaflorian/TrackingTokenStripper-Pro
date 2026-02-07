// ==UserScript==
// @name         TrackingTokenStripper Pro
// @version      0.8.1
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

(function () {
  "use strict";

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Configuration object for tracking token stripper
   * All tracking parameters to be removed from URLs
   * Updated for 2025 with modern tracking tokens
   */
  const CONFIG = {
    // Enable/disable debug logging
    debugMode: true, // Set to true for debugging

    // Enable/disable performance monitoring
    performanceMonitoring: false,

    // Module enable/disable flags
    modules: {
      urlCleaner: true, // URL parameter cleaning (existing)
      historyApiPatch: true, // SPA support (pushState/replaceState)
      canvasSpoofing: true, // Canvas fingerprint protection
      audioSpoofing: true, // Audio fingerprint protection
      beaconBlocker: true, // Block tracking beacons
      storagePoisoner: false, // Identity stitching prevention (aggressive)
      mobileSpoofing: true, // Mobile sensor spoofing
    },

    // Fingerprint spoofing settings
    fingerprint: {
      noiseAmplitude: 2, // Noise range: -N to +N
      consistentPerSession: true, // Same noise for entire session
    },

    // Beacon blocker settings
    beaconBlocker: {
      allowFirstParty: true, // Allow beacons to same domain
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
      frequency: "session", // When to poison: 'pageload' | 'session'
      targets: {
        // Facebook/Meta
        _fbp: true,
        _fbc: true,
        fr: true,
        datr: true,
        sb: true,
        // Instagram
        ig_did: true,
        ig_nrcb: true,
        mid: true,
        // Twitter/X
        personalization_id: true,
        guest_id: true,
        guest_id_ads: true,
        guest_id_marketing: true,
        twid: true,
        muc_ads: true,
        // TikTok
        _ttp: true,
        tt_webid: true,
        tt_webid_v2: true,
        ttwid: true,
        // LinkedIn
        li_gc: true,
        li_mc: true,
        bcookie: true,
        bscookie: true,
        lidc: true,
        li_sugr: true,
        li_fat_id: true,
        // Pinterest
        _pinterest_sess: true,
        _pinterest_ct: true,
        _pin_unauth: true,
        _epik: true,
        // Snapchat
        _scid: true,
        _scid_r: true,
        sc_at: true,
        // Reddit
        _rdt_uuid: true,
        loid: true,
        // YouTube
        VISITOR_INFO1_LIVE: true,
        YSC: true,
        // Twitch
        unique_id: true,
        // Others
        tmblr_bid: true,
        remixstid: true,
        remixua: true,
      },
    },

    // Mobile spoofing settings
    mobileSpoofing: {
      deviceMotion: true, // Accelerometer/gyroscope noise
      touchPoints: true, // Standardize touch points
      networkInfo: true, // Fake network info
      hardwareInfo: true, // Fake hardware info
      fakeValues: {
        maxTouchPoints: 0,
        hardwareConcurrency: 4,
        deviceMemory: 4,
        connectionType: "4g",
        downlink: 10,
      },
    },

    // Maximum redirect attempts to prevent infinite loops
    maxRedirectAttempts: 3,

    // Tracking tokens to remove (grouped by category) - 2025 EDITION
    trackingTokens: {
      // Facebook/Meta tracking
      facebook: [
        "fbclid", // Facebook Click ID (primary)
        "fb_action_ids", // Facebook action tracking
        "fb_action_types", // Facebook action types
        "fb_source", // Facebook source
        "fb_ref", // Facebook referrer
      ],

      // Google Analytics & Ads (updated for 2025)
      google: [
        "gclid", // Google Click ID (primary)
        "gclsrc", // Google Click source
        "_ga", // Google Analytics client ID
        "_gl", // Google linker parameter
        "gbraid", // 🆕 Google's privacy-preserving click ID (iOS)
        "wbraid", // 🆕 Google's web-to-app click ID
        "srsltid", // 🆕 Google Shopping click identifier
        "gad_source", // 🆕 Google Ads source
        "gad_campaignid", // 🆕 Google Ads campaign ID
        "aclk", // Google Ads click tracking
      ],

      // UTM parameters (Urchin Tracking Module)
      utm: [
        "utm_source", // Campaign source
        "utm_medium", // Campaign medium
        "utm_term", // Campaign term (keywords)
        "utm_campaign", // Campaign name
        "utm_content", // Campaign content
        "utm_cid", // Campaign ID
        "utm_reader", // Reader tracking
        "utm_referrer", // Referrer tracking
        "utm_name", // Campaign name (alternative)
        "utm_social", // Social source
        "utm_social-type", // Social type
        "utm_id", // 🆕 Campaign ID (Google Ads)
      ],

      // TikTok (critical for 2025!)
      tiktok: [
        "tt_ad_id", // TikTok ad ID
        "tt_campaign_id", // TikTok campaign ID
        "ttclid", // 🆕 TikTok Click ID (auto-added since April 2024)
        "_ttp", // 🆕 TikTok cookie identifier
      ],

      // LinkedIn (B2B marketing)
      linkedin: [
        "li_fat_id", // 🆕 LinkedIn First-Party Ads Tracking UUID
      ],

      // Pinterest
      pinterest: [
        "epik", // 🆕 Pinterest Click ID
        "pin_ads", // Pinterest ad ID
        "pin_campaign", // Pinterest campaign ID
        "_pinterest_ct", // Pinterest in-app browser cookie
        "pin_unauth", // Pinterest unauthenticated user ID
      ],

      // Snapchat
      snapchat: [
        "ScCid", // 🆕 Snapchat Click ID
        "_scid", // Snapchat cookie ID
        "sc_ad_id", // Snapchat ad ID
        "sc_campaign_id", // Snapchat campaign ID
      ],

      // Twitter/X
      twitter: [
        "twclid", // 🆕 Twitter/X Click ID
        "t", // Twitter short tracking
        "s", // Twitter source
      ],

      // Instagram
      instagram: [
        "igshid", // Instagram share ID (primary)
        "ig_rid", // Instagram request ID
      ],

      // HubSpot
      hubspot: [
        "_hsenc", // HubSpot encryption
        "_hsmi", // HubSpot message ID
        "__hstc", // HubSpot tracking cookie
        "__hssc", // HubSpot session cookie
        "__hsfp", // HubSpot fingerprint
      ],

      // MailChimp & Email marketing
      email: [
        "mc_cid", // MailChimp campaign ID
        "mc_eid", // MailChimp email ID
        "mkt_tok", // Marketo token
        "_ke", // 🆕 Klaviyo email tracking
        "_klaviyo_id", // Klaviyo customer ID
        "actid", // ActiveCampaign ID
        "act_cid", // ActiveCampaign campaign ID
        "act_campaign", // ActiveCampaign specific campaign
        "sibsource", // Sendinblue source
        "sibeid", // Sendinblue email ID
        "gr_source", // GetResponse source
        "gr_campaign_id", // GetResponse campaign ID
        "ck_campaign", // ConvertKit campaign ID
        "ck_email_id", // ConvertKit email ID
        "aweber_campaign_id", // AWeber campaign ID
        "aweber_subscriber_id", // AWeber subscriber ID
      ],

      // Yandex (Russian search engine)
      yandex: [
        "yclid", // Yandex Click ID
        "_openstat", // Yandex OpenStat
      ],

      // Microsoft/Bing
      microsoft: [
        "wt.mc_id", // Microsoft marketing cloud ID
        "cr_cc", // Microsoft creative campaign
        "msclkid", // 🆕 Microsoft Click ID (Bing Ads)
      ],

      // SendGrid
      sendgrid: [
        "mc", // SendGrid marketing campaign
        "mcd", // SendGrid marketing campaign data
        "cvosrc", // SendGrid CVO source
      ],

      // Salesforce & Marketing platforms
      marketing: [
        "sc_channel", // Salesforce channel
        "sc_campaign", // Salesforce campaign
        "sc_geo", // Salesforce geo
        "sc_publisher", // Salesforce publisher
        "sc_outcome", // Salesforce outcome
        "sc_country", // Salesforce country
        "trk", // Generic tracking
        "trkCampaign", // Campaign tracking
      ],

      // Internal tracking (ITM)
      itm: [
        "itm_source", // Internal source
        "itm_medium", // Internal medium
        "itm_campaign", // Internal campaign
      ],

      // Generic tracking & referrers
      generic: [
        "__tn__", // Generic tracking number
        "ref", // 🆕 Generic referrer
        "source", // Generic source
        "referer", // Referrer (alternative spelling)
        "referrer", // Referrer
      ],

      // Affiliate & Attribution platforms
      affiliate: [
        "afftrack", // Affiliate tracking
        "aff_id", // Affiliate ID
        "aff_sub", // Affiliate sub-ID
        "clickid", // Generic click ID
        "zanpid", // Zanox/Awin partner ID
      ],

      // Customer Data Platforms (CDPs)
      cdp: [
        "SEGMENT", // Segment CDP
        "spm_id", // Segment campaign ID
        "spm_campaign", // Segment campaign tracking
        "bcid", // BlueConic ID
        "blueconic_id", // BlueConic visitor ID
        "utag_main", // Tealium main tracking
        "utag_visitor_id", // Tealium visitor ID
        "meiro_message_id", // Meiro
      ],
      // Advertising/Tracking Platforms
      advertising: [
        "crt_id", // Criteo ID
        "crt_ref", // Criteo referrer
        "adroll_fid", // AdRoll ID
        "adroll_sid", // AdRoll session ID
        "rakuten_ad_id", // Rakuten Marketing ad ID
        "taboola_ref", // Taboola referrer
        "taboola_ad_id", // Taboola ad ID
      ],

      // A/B Testing and Personalization Platforms
      abTesting: [
        "optimizely_end_user_id", // Optimizely end user ID
        "optimizely_visitor_id", // Optimizely visitor ID
        "vwo_user_id", // VWO user ID
        "vwo_test_id", // VWO test ID
        "unbounce", // Unbounce campaign ID
        "instapage_campaign_id", // Instapage campaign ID
      ],

      // Other Marketing & Analytics Platforms
      analytics: [
        "mpid", // Mixpanel ID
        "mp_referrer", // Mixpanel referrer
        "heap_id", // Heap Analytics ID
        "pardot_visitor_id", // Pardot visitor ID
        "pardot_campaign_id", // Pardot campaign ID
      ],
    },

    // Storage keys for persistent data
    storageKeys: {
      redirectCount: "tts_redirect_count",
      lastRedirect: "tts_last_redirect",
      errorLog: "tts_error_log",
    },
  };

  // Pre-compute flattened tokens Set for O(1) lookup (singleton, created once)
  const TOKENS_TO_REMOVE = new Set(Object.values(CONFIG.trackingTokens).flat());

  // ============================================================================
  // LOGGER UTILITY
  // ============================================================================

  /**
   * Centralized logging utility with multiple log levels
   * Provides structured logging for debugging and monitoring
   */
  class Logger {
    constructor(moduleName, debugMode = false) {
      this.moduleName = moduleName;
      this.debugMode = debugMode;
      this.startTime = debugMode ? performance.now() : 0;
    }

    /**
     * Format log message with timestamp and module name
     * @private
     */
    _formatMessage(level, message, data = null) {
      const timestamp = new Date().toISOString();
      const elapsed = (performance.now() - this.startTime).toFixed(2);
      let formatted = `[${timestamp}] [${level}] [${this.moduleName}] [+${elapsed}ms] ${message}`;

      if (data !== null) {
        formatted += "\n" + JSON.stringify(data, null, 2);
      }

      return formatted;
    }

    /**
     * Log debug message (only in debug mode)
     */
    debug(message, data = null) {
      if (this.debugMode) {
        console.debug(this._formatMessage("DEBUG", message, data));
      }
    }

    /**
     * Log info message
     */
    info(message, data = null) {
      if (this.debugMode) {
        console.info(this._formatMessage("INFO", message, data));
      }
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
      console.warn(this._formatMessage("WARN", message, data));
    }

    /**
     * Log error message
     */
    error(message, error = null) {
      const errorData = error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : null;
      console.error(this._formatMessage("ERROR", message, errorData));
    }

    /**
     * Log performance metrics
     */
    performance(operation, duration) {
      if (CONFIG.performanceMonitoring && this.debugMode) {
        console.log(
          this._formatMessage(
            "PERF",
            `${operation} completed in ${duration.toFixed(2)}ms`,
          ),
        );
      }
    }
  }

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
        failed: this.failed.map((f) => f.name),
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

  // ============================================================================
  // URL SANITIZER
  // ============================================================================

  /**
   * Robust URL sanitizer with comprehensive error handling
   * Removes tracking tokens while preserving URL integrity
   */
  class URLSanitizer {
    constructor(logger) {
      this.logger = logger;
      this.tokensToRemove = TOKENS_TO_REMOVE;
      this.logger.debug(`Using ${this.tokensToRemove.size} tracking tokens`, {
        tokenCount: this.tokensToRemove.size,
        categories: Object.keys(CONFIG.trackingTokens),
      });
    }

    /**
     * Validate if URL is processable
     * @private
     */
    _isValidURL(urlString) {
      try {
        // Check if URL is not empty
        if (!urlString || typeof urlString !== "string") {
          return false;
        }

        // Try to construct URL object
        new URL(urlString);

        // Check protocol (only http/https)
        if (
          !urlString.startsWith("http://") &&
          !urlString.startsWith("https://")
        ) {
          this.logger.debug("URL protocol not supported", { url: urlString });
          return false;
        }

        return true;
      } catch (error) {
        this.logger.error("URL validation failed", error);
        return false;
      }
    }

    /**
     * Remove tracking tokens from URL
     * @param {string} urlString - Original URL to sanitize
     * @returns {string|null} Sanitized URL or null if failed
     */
    sanitize(urlString) {
      const operationStart = performance.now();

      try {
        this.logger.debug("Starting URL sanitization", {
          originalUrl: urlString,
        });

        // Validate input URL
        if (!this._isValidURL(urlString)) {
          this.logger.warn("Invalid URL provided, skipping sanitization");
          return null;
        }

        // Parse URL using native URL API (much safer than string manipulation)
        const url = new URL(urlString);

        // Track which parameters were removed for logging
        const removedParams = [];

        // Iterate through all search parameters
        for (const [key] of Array.from(url.searchParams.entries())) {
          if (this.tokensToRemove.has(key)) {
            url.searchParams.delete(key);
            removedParams.push(key);
            this.logger.debug(`Removed tracking parameter: ${key}`);
          }
        }

        // Reconstruct clean URL
        const sanitizedUrl = url.toString();

        // Calculate performance metrics
        const duration = performance.now() - operationStart;
        this.logger.performance("URL sanitization", duration);

        // Log results
        if (removedParams.length > 0) {
          this.logger.info(
            `Sanitization complete: removed ${removedParams.length} tracking tokens`,
            {
              removedTokens: removedParams,
              originalLength: urlString.length,
              sanitizedLength: sanitizedUrl.length,
              bytesRemoved: urlString.length - sanitizedUrl.length,
            },
          );
        } else {
          this.logger.debug("No tracking tokens found in URL");
        }

        // Return sanitized URL only if it differs from original
        return sanitizedUrl !== urlString ? sanitizedUrl : null;
      } catch (error) {
        this.logger.error("URL sanitization failed", error);
        this._logErrorToStorage(error, urlString);
        return null;
      }
    }

    /**
     * Persist error information to storage for analysis
     * @private
     */
    _logErrorToStorage(error, url) {
      try {
        const errorEntry = {
          timestamp: new Date().toISOString(),
          error: error.message,
          url: url,
        };

        // Get existing error log or create new array
        const errorLog = JSON.parse(
          GM_getValue(CONFIG.storageKeys.errorLog, "[]"),
        );

        // Keep only last 50 errors
        errorLog.push(errorEntry);
        if (errorLog.length > 50) {
          errorLog.shift();
        }

        GM_setValue(CONFIG.storageKeys.errorLog, JSON.stringify(errorLog));
      } catch (storageError) {
        this.logger.error("Failed to log error to storage", storageError);
      }
    }
  }

  // ============================================================================
  // REDIRECT MANAGER
  // ============================================================================

  /**
   * Manages URL redirects with safety mechanisms
   * Prevents infinite redirect loops and handles redirect failures
   */
  class RedirectManager {
    constructor(logger) {
      this.logger = logger;
    }

    /**
     * Check if redirect is safe to perform
     * Prevents infinite loops by tracking redirect count and timing
     * @private
     */
    _canRedirect() {
      try {
        const now = Date.now();
        const lastRedirect = parseInt(
          GM_getValue(CONFIG.storageKeys.lastRedirect, "0"),
          10,
        );
        const redirectCount = parseInt(
          GM_getValue(CONFIG.storageKeys.redirectCount, "0"),
          10,
        );

        // Reset counter if last redirect was more than 5 seconds ago
        if (now - lastRedirect > 5000) {
          GM_setValue(CONFIG.storageKeys.redirectCount, "0");
          this.logger.debug("Redirect counter reset (timeout)");
          return true;
        }

        // Check if we exceeded max redirect attempts
        if (redirectCount >= CONFIG.maxRedirectAttempts) {
          this.logger.warn("Maximum redirect attempts reached, aborting", {
            count: redirectCount,
            maxAttempts: CONFIG.maxRedirectAttempts,
          });
          return false;
        }

        return true;
      } catch (error) {
        this.logger.error("Failed to check redirect safety", error);
        // On error, block redirect (fail-safe approach to prevent loops)
        return false;
      }
    }

    /**
     * Update redirect tracking metrics
     * @private
     */
    _updateRedirectTracking() {
      try {
        const now = Date.now();
        const currentCount = parseInt(
          GM_getValue(CONFIG.storageKeys.redirectCount, "0"),
          10,
        );

        GM_setValue(CONFIG.storageKeys.lastRedirect, now.toString());
        GM_setValue(
          CONFIG.storageKeys.redirectCount,
          (currentCount + 1).toString(),
        );

        this.logger.debug("Redirect tracking updated", {
          timestamp: now,
          count: currentCount + 1,
        });
      } catch (error) {
        this.logger.error("Failed to update redirect tracking", error);
      }
    }

    /**
     * Perform safe redirect to cleaned URL
     * @param {string} cleanUrl - The sanitized URL to redirect to
     * @returns {boolean} Success status
     */
    redirect(cleanUrl) {
      try {
        this.logger.info("Initiating redirect", {
          from: location.href,
          to: cleanUrl,
        });

        // Safety check: prevent redirect loops
        if (!this._canRedirect()) {
          this.logger.error("Redirect aborted due to safety check failure");
          return false;
        }

        // Validate the clean URL before redirecting
        try {
          new URL(cleanUrl);
        } catch (urlError) {
          this.logger.error("Invalid clean URL, aborting redirect", urlError);
          return false;
        }

        // Update tracking before redirect
        this._updateRedirectTracking();

        // Perform redirect using replaceState to avoid creating history entry
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", cleanUrl);
          this.logger.info("Redirect completed using replaceState");
        } else {
          // Fallback to location.replace for older browsers
          location.replace(cleanUrl);
          this.logger.info("Redirect completed using location.replace");
        }

        return true;
      } catch (error) {
        this.logger.error("Redirect failed", error);
        return false;
      }
    }
  }

  // ============================================================================
  // MODULE: URL CLEANER
  // ============================================================================

  /**
   * URL Cleaner Module - removes tracking parameters from URLs
   * This is the original functionality wrapped as a module
   */
  const UrlCleanerModule = {
    name: "UrlCleaner",
    sanitizer: null,
    redirectManager: null,
    logger: null,

    init(logger) {
      this.logger = logger;
      this.sanitizer = new URLSanitizer(logger);
      this.redirectManager = new RedirectManager(logger);

      // Clean current URL on init
      this.cleanCurrentUrl();

      this.logger.debug("UrlCleaner module initialized");
    },

    cleanCurrentUrl() {
      const currentUrl = location.href;
      const cleanUrl = this.sanitizer.sanitize(currentUrl);

      if (cleanUrl && cleanUrl !== currentUrl) {
        this.logger.info("Tracking tokens detected, initiating cleanup");
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
  ModuleRunner.register("urlCleaner", UrlCleanerModule);

  // ============================================================================
  // MODULE: HISTORY API PATCH
  // ============================================================================

  /**
   * History API Patch Module - enables URL cleaning for SPA applications
   * Intercepts pushState/replaceState to clean tracking parameters
   */
  const HistoryApiPatchModule = {
    name: "HistoryApiPatch",
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

      this.logger.debug("HistoryApiPatch module initialized");
    },

    patchPushState() {
      const self = this;
      history.pushState = function (state, title, url) {
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
      history.replaceState = function (state, title, url) {
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
      window.addEventListener("popstate", () => {
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
  ModuleRunner.register("historyApiPatch", HistoryApiPatchModule);

  // ============================================================================
  // MODULE: CANVAS SPOOFING
  // ============================================================================

  /**
   * Canvas Spoofing Module - adds noise to canvas fingerprinting attempts
   * Injects subtle noise that changes the hash but is invisible to the eye
   */
  const CanvasSpoofingModule = {
    name: "CanvasSpoofing",
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

      this.logger.debug("CanvasSpoofing module initialized", {
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

      HTMLCanvasElement.prototype.toDataURL = function (...args) {
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

      CanvasRenderingContext2D.prototype.getImageData = function (...args) {
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
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.applyNoiseToImageData(imageData);
      ctx.putImageData(imageData, 0, 0);
    },

    applyNoiseToImageData(imageData) {
      const data = imageData.data;

      // Modify every 10th pixel for performance
      for (let i = 0; i < data.length; i += 40) {
        data[i] = this.clamp(data[i] + this.noise.r); // R
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
  ModuleRunner.register("canvasSpoofing", CanvasSpoofingModule);

  // ============================================================================
  // MODULE: AUDIO SPOOFING
  // ============================================================================

  /**
   * Audio Spoofing Module - adds noise to audio fingerprinting attempts
   * Injects microscopic noise that changes the fingerprint hash
   */
  const AudioSpoofingModule = {
    name: "AudioSpoofing",
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

      this.logger.debug("AudioSpoofing module initialized", {
        noiseFactor: this.noise.toExponential(2),
      });
    },

    patchGetChannelData() {
      const self = this;
      const original = AudioBuffer.prototype.getChannelData;

      AudioBuffer.prototype.getChannelData = function (channel) {
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

      AudioBuffer.prototype.copyFromChannel = function (
        dest,
        channel,
        offset = 0,
      ) {
        original.call(this, dest, channel, offset);

        for (let i = 0; i < dest.length; i += 100) {
          dest[i] += self.noise;
        }
      };
    },

    patchGetFloatFrequencyData() {
      const self = this;
      const original = AnalyserNode.prototype.getFloatFrequencyData;

      AnalyserNode.prototype.getFloatFrequencyData = function (array) {
        original.call(this, array);

        // Frequency data has different range, scale noise accordingly
        for (let i = 0; i < array.length; i += 50) {
          array[i] += self.noise * 1000;
        }
      };
    },
  };

  // Register module
  ModuleRunner.register("audioSpoofing", AudioSpoofingModule);

  // ============================================================================
  // MODULE: BEACON BLOCKER
  // ============================================================================

  /**
   * Beacon Blocker Module - blocks tracking beacons and pixels
   * Intercepts sendBeacon and fetch with keepalive
   */
  const BeaconBlockerModule = {
    name: "BeaconBlocker",
    logger: null,
    stats: { blocked: 0, allowed: 0 },

    init(logger) {
      this.logger = logger;

      // Patch sendBeacon
      this.patchSendBeacon();

      // Patch fetch with keepalive
      this.patchFetch();

      this.logger.debug("BeaconBlocker module initialized");
    },

    shouldBlock(url) {
      try {
        const targetHost = new URL(url, location.origin).hostname;

        // Allow first-party if configured
        if (
          CONFIG.beaconBlocker.allowFirstParty &&
          targetHost === location.hostname
        ) {
          return false;
        }

        // Test against blocked patterns
        return CONFIG.beaconBlocker.blockedPatterns.some((pattern) =>
          pattern.test(url),
        );
      } catch (e) {
        // Invalid URL - block it
        return true;
      }
    },

    patchSendBeacon() {
      const self = this;
      const original = navigator.sendBeacon?.bind(navigator);

      if (!original) return;

      navigator.sendBeacon = function (url, data) {
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

      window.fetch = function (input, init) {
        // Only intercept keepalive requests (beacon-like)
        if (init?.keepalive) {
          const url = typeof input === "string" ? input : input.url;

          if (self.shouldBlock(url)) {
            self.stats.blocked++;
            self.logger.debug(`Fetch keepalive blocked: ${url}`);
            return Promise.resolve(new Response("", { status: 200 }));
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
  ModuleRunner.register("beaconBlocker", BeaconBlockerModule);

  // ============================================================================
  // MODULE: STORAGE POISONER
  // ============================================================================

  /**
   * Storage Poisoner Module - corrupts tracking IDs to prevent identity stitching
   * Instead of deleting (which triggers respawn), modifies values to break linking
   */
  const StoragePoisonerModule = {
    name: "StoragePoisoner",
    logger: null,
    stats: { poisoned: 0 },
    sessionKey: "_tts_poisoned",

    init(logger) {
      this.logger = logger;

      // Check if already poisoned this session
      if (CONFIG.storagePoisoner.frequency === "session") {
        if (sessionStorage.getItem(this.sessionKey)) {
          this.logger.debug("StoragePoisoner: already poisoned this session");
          return;
        }
      }

      // Poison localStorage
      this.poisonStorage(localStorage, "localStorage");

      // Poison sessionStorage
      this.poisonStorage(sessionStorage, "sessionStorage");

      // Poison cookies
      this.poisonCookies();

      // Mark as poisoned for this session
      sessionStorage.setItem(this.sessionKey, Date.now().toString());

      this.logger.debug("StoragePoisoner module initialized", {
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
      const cookies = document.cookie.split(";");

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
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
      if (!original || typeof original !== "string" || original.length < 8) {
        return original;
      }

      const chars = "abcdef0123456789";
      const arr = original.split("");

      // Safe range: not first 2 or last 2 characters (often contain metadata)
      const safeStart = Math.min(2, arr.length - 6);
      const safeEnd = Math.max(safeStart + 4, arr.length - 2);

      // Change 4 random positions
      for (let i = 0; i < 4; i++) {
        const pos =
          safeStart + Math.floor(Math.random() * (safeEnd - safeStart));
        if (pos < arr.length && /[a-f0-9]/i.test(arr[pos])) {
          arr[pos] = chars[Math.floor(Math.random() * chars.length)];
        }
      }

      return arr.join("");
    },

    getStats() {
      return this.stats;
    },
  };

  // Register module
  ModuleRunner.register("storagePoisoner", StoragePoisonerModule);

  // ============================================================================
  // MODULE: MOBILE SPOOFING
  // ============================================================================

  /**
   * Mobile Spoofing Module - spoofs mobile device sensors and hardware info
   * Adds noise to accelerometer/gyroscope and standardizes hardware values
   */
  const MobileSpoofingModule = {
    name: "MobileSpoofing",
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

      this.logger.debug("MobileSpoofing module initialized");
    },

    spoofDeviceMotion() {
      const self = this;
      const originalAddEventListener = window.addEventListener;

      window.addEventListener = function (type, listener, options) {
        if (type === "devicemotion" || type === "deviceorientation") {
          const wrappedListener = (event) => {
            const spoofedEvent = self.createSpoofedMotionEvent(event, type);
            listener(spoofedEvent);
          };
          return originalAddEventListener.call(
            this,
            type,
            wrappedListener,
            options,
          );
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
          if (prop === "accelerationIncludingGravity" && target[prop]) {
            return {
              x: target[prop].x !== null ? target[prop].x + noise() : null,
              y: target[prop].y !== null ? target[prop].y + noise() : null,
              z: target[prop].z !== null ? target[prop].z + noise() : null,
            };
          }
          if (prop === "acceleration" && target[prop]) {
            return {
              x: target[prop].x !== null ? target[prop].x + noise() : null,
              y: target[prop].y !== null ? target[prop].y + noise() : null,
              z: target[prop].z !== null ? target[prop].z + noise() : null,
            };
          }
          if (prop === "rotationRate" && target[prop]) {
            return {
              alpha:
                target[prop].alpha !== null
                  ? target[prop].alpha + noise() * 10
                  : null,
              beta:
                target[prop].beta !== null
                  ? target[prop].beta + noise() * 10
                  : null,
              gamma:
                target[prop].gamma !== null
                  ? target[prop].gamma + noise() * 10
                  : null,
            };
          }

          // DeviceOrientationEvent properties
          if (["alpha", "beta", "gamma"].includes(prop)) {
            return target[prop] !== null ? target[prop] + noise() * 10 : null;
          }

          return target[prop];
        },
      });
    },

    spoofTouchPoints() {
      const fakeValue = CONFIG.mobileSpoofing.fakeValues.maxTouchPoints;
      try {
        Object.defineProperty(navigator, "maxTouchPoints", {
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
        type: "wifi",
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      };

      try {
        Object.defineProperty(navigator, "connection", {
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
        Object.defineProperty(navigator, "hardwareConcurrency", {
          get: () => fakeValues.hardwareConcurrency,
          configurable: true,
        });
      } catch (e) {}

      try {
        Object.defineProperty(navigator, "deviceMemory", {
          get: () => fakeValues.deviceMemory,
          configurable: true,
        });
      } catch (e) {}
    },
  };

  // Register module
  ModuleRunner.register("mobileSpoofing", MobileSpoofingModule);

  // ============================================================================
  // MAIN EXECUTION
  // ============================================================================

  /**
   * Main execution function with modular architecture
   */
  function main() {
    const logger = new Logger("TTS-Pro", CONFIG.debugMode);

    try {
      logger.info("TrackingTokenStripper Pro v2 initializing", {
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
        logger.info("Debug interface exposed as window.__TTS_PRO__");
      }
    } catch (error) {
      logger.error("Critical error in main execution", error);
      console.error("[TTS-Pro] CRITICAL ERROR:", error);
    }
  }

  // ============================================================================
  // SCRIPT INITIALIZATION
  // ============================================================================

  try {
    main();
  } catch (criticalError) {
    console.error("[TTS-Pro] FATAL ERROR:", criticalError);
  }
})();
