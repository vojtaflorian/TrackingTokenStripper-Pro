// ==UserScript==
// @name         TrackingTokenStripper Pro
// @version      20260205.01
// @description  Enterprise-grade tracking token removal with comprehensive error handling and logging (2025 Edition)
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
// ==/UserScript==

(function () {
    'use strict';

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
        debugMode: false,  // Set to true for debugging

        // Enable/disable performance monitoring
        performanceMonitoring: false,

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

        // Maximum redirect attempts to prevent infinite loops
        maxRedirectAttempts: 3,

        // Tracking tokens to remove (grouped by category) - 2025 EDITION
        trackingTokens: {
            // Facebook/Meta tracking
            facebook: [
                'fbclid',           // Facebook Click ID (primary)
                'fb_action_ids',    // Facebook action tracking
                'fb_action_types',  // Facebook action types
                'fb_source',        // Facebook source
                'fb_ref'            // Facebook referrer
            ],

            // Google Analytics & Ads (updated for 2025)
            google: [
                'gclid',            // Google Click ID (primary)
                'gclsrc',           // Google Click source
                '_ga',              // Google Analytics client ID
                '_gl',              // Google linker parameter
                'gbraid',           // 🆕 Google's privacy-preserving click ID (iOS)
                'wbraid',           // 🆕 Google's web-to-app click ID
                'srsltid',          // 🆕 Google Shopping click identifier
                'gad_source',       // 🆕 Google Ads source
                'gad_campaignid',   // 🆕 Google Ads campaign ID 
                'aclk'              // Google Ads click tracking
            ],

            // UTM parameters (Urchin Tracking Module)
            utm: [
                'utm_source',       // Campaign source
                'utm_medium',       // Campaign medium
                'utm_term',         // Campaign term (keywords)
                'utm_campaign',     // Campaign name
                'utm_content',      // Campaign content
                'utm_cid',          // Campaign ID
                'utm_reader',       // Reader tracking
                'utm_referrer',     // Referrer tracking
                'utm_name',         // Campaign name (alternative)
                'utm_social',       // Social source
                'utm_social-type',  // Social type
                'utm_id'            // 🆕 Campaign ID (Google Ads)
            ],

            // TikTok (critical for 2025!)
            tiktok: [
                'tt_ad_id',             // TikTok ad ID
                'tt_campaign_id',       // TikTok campaign ID
                'ttclid',           // 🆕 TikTok Click ID (auto-added since April 2024)
                '_ttp'              // 🆕 TikTok cookie identifier
            ],

            // LinkedIn (B2B marketing)
            linkedin: [
                'li_fat_id'         // 🆕 LinkedIn First-Party Ads Tracking UUID
            ],

            // Pinterest
            pinterest: [
                'epik',             // 🆕 Pinterest Click ID
                'pin_ads',              // Pinterest ad ID
                'pin_campaign',         // Pinterest campaign ID
                '_pinterest_ct',    // Pinterest in-app browser cookie
                'pin_unauth'        // Pinterest unauthenticated user ID
            ],

            // Snapchat
            snapchat: [
                'ScCid',            // 🆕 Snapchat Click ID
                '_scid',             // Snapchat cookie ID
                'sc_ad_id',             // Snapchat ad ID
                'sc_campaign_id'        // Snapchat campaign ID
            ],

            // Twitter/X
            twitter: [
                'twclid',           // 🆕 Twitter/X Click ID
                't',                // Twitter short tracking
                's'                 // Twitter source
            ],

            // Instagram
            instagram: [
                'igshid',           // Instagram share ID (primary)
                'ig_rid'            // Instagram request ID
            ],

            // HubSpot
            hubspot: [
                '_hsenc',           // HubSpot encryption
                '_hsmi',            // HubSpot message ID
                '__hstc',           // HubSpot tracking cookie
                '__hssc',           // HubSpot session cookie
                '__hsfp'            // HubSpot fingerprint
            ],

            // MailChimp & Email marketing
            email: [
                'mc_cid',           // MailChimp campaign ID
                'mc_eid',           // MailChimp email ID
                'mkt_tok',          // Marketo token
                '_ke',               // 🆕 Klaviyo email tracking
                '_klaviyo_id',      // Klaviyo customer ID
                'actid',            // ActiveCampaign ID
                'act_cid',          // ActiveCampaign campaign ID
                'act_campaign',     // ActiveCampaign specific campaign
                'sibsource',        // Sendinblue source
                'sibeid',           // Sendinblue email ID
                'gr_source',        // GetResponse source
                'gr_campaign_id',   // GetResponse campaign ID
                'ck_campaign',      // ConvertKit campaign ID
                'ck_email_id',      // ConvertKit email ID
                'aweber_campaign_id', // AWeber campaign ID
                'aweber_subscriber_id' // AWeber subscriber ID
            ],

            // Yandex (Russian search engine)
            yandex: [
                'yclid',            // Yandex Click ID
                '_openstat'         // Yandex OpenStat
            ],

            // Microsoft/Bing
            microsoft: [
                'wt.mc_id',         // Microsoft marketing cloud ID
                'cr_cc',            // Microsoft creative campaign
                'msclkid'           // 🆕 Microsoft Click ID (Bing Ads)
            ],

            // SendGrid
            sendgrid: [
                'mc',               // SendGrid marketing campaign
                'mcd',              // SendGrid marketing campaign data
                'cvosrc'            // SendGrid CVO source
            ],

            // Salesforce & Marketing platforms
            marketing: [
                'sc_channel',       // Salesforce channel
                'sc_campaign',      // Salesforce campaign
                'sc_geo',           // Salesforce geo
                'sc_publisher',     // Salesforce publisher
                'sc_outcome',       // Salesforce outcome
                'sc_country',       // Salesforce country
                'trk',              // Generic tracking
                'trkCampaign'       // Campaign tracking
            ],

            // Internal tracking (ITM)
            itm: [
                'itm_source',       // Internal source
                'itm_medium',       // Internal medium
                'itm_campaign'      // Internal campaign
            ],

            // Generic tracking & referrers
            generic: [
                '__tn__',           // Generic tracking number
                'ref',              // 🆕 Generic referrer
                'source',           // Generic source
                'referer',          // Referrer (alternative spelling)
                'referrer'          // Referrer
            ],

            // Affiliate & Attribution platforms
            affiliate: [
                'afftrack',         // Affiliate tracking
                'aff_id',           // Affiliate ID
                'aff_sub',          // Affiliate sub-ID
                'clickid',          // Generic click ID
                'zanpid'            // Zanox/Awin partner ID
            ],

            // Customer Data Platforms (CDPs)
            cdp: [
                'SEGMENT',          // Segment CDP
                'spm_id',           // Segment campaign ID
                'spm_campaign',     // Segment campaign tracking
                'bcid',             // BlueConic ID
                'blueconic_id',     // BlueConic visitor ID
                'utag_main',        // Tealium main tracking
                'utag_visitor_id',   // Tealium visitor ID
                'meiro_message_id'       // Meiro
            ],
            // Advertising/Tracking Platforms
            advertising: [
                'crt_id',           // Criteo ID
                'crt_ref',          // Criteo referrer
                'adroll_fid',       // AdRoll ID
                'adroll_sid',       // AdRoll session ID
                'rakuten_ad_id',    // Rakuten Marketing ad ID
                'taboola_ref',      // Taboola referrer
                'taboola_ad_id'     // Taboola ad ID
            ],

            // A/B Testing and Personalization Platforms
            abTesting: [
                'optimizely_end_user_id', // Optimizely end user ID
                'optimizely_visitor_id',  // Optimizely visitor ID
                'vwo_user_id',            // VWO user ID
                'vwo_test_id',            // VWO test ID
                'unbounce',               // Unbounce campaign ID
                'instapage_campaign_id'   // Instapage campaign ID
            ],

            // Other Marketing & Analytics Platforms
            analytics: [
                'mpid',                 // Mixpanel ID
                'mp_referrer',          // Mixpanel referrer
                'heap_id',              // Heap Analytics ID
                'pardot_visitor_id',    // Pardot visitor ID
                'pardot_campaign_id'    // Pardot campaign ID
            ]
        },

        // Storage keys for persistent data
        storageKeys: {
            redirectCount: 'tts_redirect_count',
            lastRedirect: 'tts_last_redirect',
            errorLog: 'tts_error_log'
        }
    };

    // Pre-compute flattened tokens Set for O(1) lookup (singleton, created once)
    const TOKENS_TO_REMOVE = new Set(
        Object.values(CONFIG.trackingTokens).flat()
    );

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
                formatted += '\n' + JSON.stringify(data, null, 2);
            }

            return formatted;
        }

        /**
         * Log debug message (only in debug mode)
         */
        debug(message, data = null) {
            if (this.debugMode) {
                console.debug(this._formatMessage('DEBUG', message, data));
            }
        }

        /**
         * Log info message
         */
        info(message, data = null) {
            if (this.debugMode) {
                console.info(this._formatMessage('INFO', message, data));
            }
        }

        /**
         * Log warning message
         */
        warn(message, data = null) {
            console.warn(this._formatMessage('WARN', message, data));
        }

        /**
         * Log error message
         */
        error(message, error = null) {
            const errorData = error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null;
            console.error(this._formatMessage('ERROR', message, errorData));
        }

        /**
         * Log performance metrics
         */
        performance(operation, duration) {
            if (CONFIG.performanceMonitoring && this.debugMode) {
                console.log(this._formatMessage('PERF', `${operation} completed in ${duration.toFixed(2)}ms`));
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
                categories: Object.keys(CONFIG.trackingTokens)
            });
        }

        /**
         * Validate if URL is processable
         * @private
         */
        _isValidURL(urlString) {
            try {
                // Check if URL is not empty
                if (!urlString || typeof urlString !== 'string') {
                    return false;
                }

                // Try to construct URL object
                new URL(urlString);

                // Check protocol (only http/https)
                if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
                    this.logger.debug('URL protocol not supported', { url: urlString });
                    return false;
                }

                return true;
            } catch (error) {
                this.logger.error('URL validation failed', error);
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
                this.logger.debug('Starting URL sanitization', { originalUrl: urlString });

                // Validate input URL
                if (!this._isValidURL(urlString)) {
                    this.logger.warn('Invalid URL provided, skipping sanitization');
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
                this.logger.performance('URL sanitization', duration);

                // Log results
                if (removedParams.length > 0) {
                    this.logger.info(`Sanitization complete: removed ${removedParams.length} tracking tokens`, {
                        removedTokens: removedParams,
                        originalLength: urlString.length,
                        sanitizedLength: sanitizedUrl.length,
                        bytesRemoved: urlString.length - sanitizedUrl.length
                    });
                } else {
                    this.logger.debug('No tracking tokens found in URL');
                }

                // Return sanitized URL only if it differs from original
                return sanitizedUrl !== urlString ? sanitizedUrl : null;

            } catch (error) {
                this.logger.error('URL sanitization failed', error);
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
                    url: url
                };

                // Get existing error log or create new array
                const errorLog = JSON.parse(GM_getValue(CONFIG.storageKeys.errorLog, '[]'));

                // Keep only last 50 errors
                errorLog.push(errorEntry);
                if (errorLog.length > 50) {
                    errorLog.shift();
                }

                GM_setValue(CONFIG.storageKeys.errorLog, JSON.stringify(errorLog));
            } catch (storageError) {
                this.logger.error('Failed to log error to storage', storageError);
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
                const lastRedirect = parseInt(GM_getValue(CONFIG.storageKeys.lastRedirect, '0'), 10);
                const redirectCount = parseInt(GM_getValue(CONFIG.storageKeys.redirectCount, '0'), 10);

                // Reset counter if last redirect was more than 5 seconds ago
                if (now - lastRedirect > 5000) {
                    GM_setValue(CONFIG.storageKeys.redirectCount, '0');
                    this.logger.debug('Redirect counter reset (timeout)');
                    return true;
                }

                // Check if we exceeded max redirect attempts
                if (redirectCount >= CONFIG.maxRedirectAttempts) {
                    this.logger.warn('Maximum redirect attempts reached, aborting', {
                        count: redirectCount,
                        maxAttempts: CONFIG.maxRedirectAttempts
                    });
                    return false;
                }

                return true;

            } catch (error) {
                this.logger.error('Failed to check redirect safety', error);
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
                const currentCount = parseInt(GM_getValue(CONFIG.storageKeys.redirectCount, '0'), 10);

                GM_setValue(CONFIG.storageKeys.lastRedirect, now.toString());
                GM_setValue(CONFIG.storageKeys.redirectCount, (currentCount + 1).toString());

                this.logger.debug('Redirect tracking updated', {
                    timestamp: now,
                    count: currentCount + 1
                });

            } catch (error) {
                this.logger.error('Failed to update redirect tracking', error);
            }
        }

        /**
         * Perform safe redirect to cleaned URL
         * @param {string} cleanUrl - The sanitized URL to redirect to
         * @returns {boolean} Success status
         */
        redirect(cleanUrl) {
            try {
                this.logger.info('Initiating redirect', {
                    from: location.href,
                    to: cleanUrl
                });

                // Safety check: prevent redirect loops
                if (!this._canRedirect()) {
                    this.logger.error('Redirect aborted due to safety check failure');
                    return false;
                }

                // Validate the clean URL before redirecting
                try {
                    new URL(cleanUrl);
                } catch (urlError) {
                    this.logger.error('Invalid clean URL, aborting redirect', urlError);
                    return false;
                }

                // Update tracking before redirect
                this._updateRedirectTracking();

                // Perform redirect using replaceState to avoid creating history entry
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', cleanUrl);
                    this.logger.info('Redirect completed using replaceState');
                } else {
                    // Fallback to location.replace for older browsers
                    location.replace(cleanUrl);
                    this.logger.info('Redirect completed using location.replace');
                }

                return true;

            } catch (error) {
                this.logger.error('Redirect failed', error);
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

    // ============================================================================
    // MAIN EXECUTION
    // ============================================================================

    /**
     * Main execution function with comprehensive error handling
     */
    function main() {
        const logger = new Logger('TrackingTokenStripper', CONFIG.debugMode);

        try {
            logger.info('Script initialization started', {
                url: location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });

            // Initialize components
            const sanitizer = new URLSanitizer(logger);
            const redirectManager = new RedirectManager(logger);

            // Get current URL
            const currentUrl = location.href;
            logger.debug('Current URL captured', { url: currentUrl });

            // Sanitize URL
            const cleanUrl = sanitizer.sanitize(currentUrl);

            // Perform redirect if URL was cleaned
            if (cleanUrl && cleanUrl !== currentUrl) {
                logger.info('Tracking tokens detected, initiating cleanup');

                const success = redirectManager.redirect(cleanUrl);

                if (success) {
                    logger.info('URL cleanup successful');
                } else {
                    logger.error('URL cleanup failed');
                }
            } else {
                logger.debug('No tracking tokens detected, no action needed');
            }

        } catch (error) {
            // Top-level error handler
            logger.error('Critical error in main execution', error);
            console.error('[TrackingTokenStripper] CRITICAL ERROR:', error);
        }
    }

    // ============================================================================
    // SCRIPT INITIALIZATION
    // ============================================================================

    // Execute main function
    try {
        main();
    } catch (criticalError) {
        console.error('[TrackingTokenStripper] FATAL ERROR - Script failed to execute:', criticalError);
    }

})();
