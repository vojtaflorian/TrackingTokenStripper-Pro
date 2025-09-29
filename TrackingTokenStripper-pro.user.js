// ==UserScript==
// @name         TrackingTokenStripper Pro
// @version      2025-09-29
// @description  Enterprise-grade tracking token removal with comprehensive error handling and logging (2025 Edition)
// @homepage     https://github.com/vojtaflorian/TrackingTokenStripper-Pro
// @namespace    https://github.com/vojtaflorian/TrackingTokenStripper-Pro
// @author       Vojta Florian (Inspired by Will Huang https://github.com/doggy8088/TrackingTokenStripper)
// @updateURL    https://github.com/vojtaflorian/TrackingTokenStripper-Pro/refs/heads/main/TrackingTokenStripper-pro.user.js
// @downloadURL  https://github.com/vojtaflorian/TrackingTokenStripper-Pro/refs/heads/main/TrackingTokenStripper-pro.user.js
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// ==/UserScript==

(function() {
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
        debugMode: true,  // Set to true for debugging

        // Enable/disable performance monitoring
        performanceMonitoring: true,

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
                'srsltid'           // 🆕 Google Shopping click identifier
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
                '_pinterest_ct',    // Pinterest in-app browser cookie
                'pin_unauth'        // Pinterest unauthenticated user ID
            ],

            // Snapchat
            snapchat: [
                'ScCid',            // 🆕 Snapchat Click ID
                '_scid'             // Snapchat cookie ID
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
                '_ke'               // 🆕 Klaviyo email tracking
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
            // Meiro CDP
            meiro: [
                'meiro_message_id'       // Internal source
            ]
        },

        // Storage keys for persistent data
        storageKeys: {
            redirectCount: 'tts_redirect_count',
            lastRedirect: 'tts_last_redirect',
            errorLog: 'tts_error_log'
        }
    };

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
            this.startTime = performance.now();
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
    // URL SANITIZER
    // ============================================================================

    /**
     * Robust URL sanitizer with comprehensive error handling
     * Removes tracking tokens while preserving URL integrity
     */
    class URLSanitizer {
        constructor(logger) {
            this.logger = logger;
            this.tokensToRemove = this._flattenTokens();
        }

        /**
         * Flatten nested tracking tokens configuration into single array
         * @private
         */
        _flattenTokens() {
            const tokens = [];
            for (const category in CONFIG.trackingTokens) {
                tokens.push(...CONFIG.trackingTokens[category]);
            }
            this.logger.debug(`Loaded ${tokens.length} tracking tokens to remove`, {
                tokenCount: tokens.length,
                categories: Object.keys(CONFIG.trackingTokens)
            });
            return new Set(tokens);
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
                const originalParamCount = url.searchParams.toString().length;

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
                    url: url,
                    userAgent: navigator.userAgent
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
                const lastRedirect = parseInt(GM_getValue(CONFIG.storageKeys.lastRedirect, '0'));
                const redirectCount = parseInt(GM_getValue(CONFIG.storageKeys.redirectCount, '0'));

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
                // On error, allow redirect (fail-open approach)
                return true;
            }
        }

        /**
         * Update redirect tracking metrics
         * @private
         */
        _updateRedirectTracking() {
            try {
                const now = Date.now();
                const currentCount = parseInt(GM_getValue(CONFIG.storageKeys.redirectCount, '0'));

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
