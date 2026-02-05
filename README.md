# TrackingTokenStripper Pro

A [Tampermonkey](https://www.tampermonkey.net/) Userscript that removes tracking tokens from URL parameters, with enhanced logging, error handling, and performance monitoring for 2025.

## Features

- **Enterprise-grade tracking token removal** with comprehensive error handling and logging.
- Removes a wide variety of known tracking tokens **before** the page is navigated.
- The following tokens will be removed:
  - **Facebook/Meta**
    - `fbclid`
    - `fb_action_ids`
    - `fb_action_types`
    - `fb_source`
    - `fb_ref`
  - **Google Analytics & Ads**
    - `gclid`
    - `gclsrc`
    - `_ga`
    - `_gl`
    - `gbraid`
    - `wbraid`
    - `srsltid`
    - `gad_source`
    - `gad_campaignid`
    - `aclk`

  - **UTM Parameters** (Urchin Tracking Module)
    - `utm_source`
    - `utm_medium`
    - `utm_term`
    - `utm_campaign`
    - `utm_content`
    - `utm_cid`
    - `utm_reader`
    - `utm_referrer`
    - `utm_name`
    - `utm_social`
    - `utm_social-type`
    - `utm_id`
  - **TikTok**
    - `ttclid`
    - `_ttp`
  - **LinkedIn**
    - `li_fat_id`
  - **Pinterest**
    - `epik`
    - `_pinterest_ct`
    - `pin_unauth`
  - **Snapchat**
    - `ScCid`
    - `_scid`
  - **Twitter/X**
    - `twclid`
    - `t`
    - `s`
  - **Instagram**
    - `igshid`
    - `ig_rid`
  - **HubSpot**
    - `_hsenc`
    - `_hsmi`
    - `__hstc`
    - `__hssc`
    - `__hsfp`
  - **MailChimp & Email Marketing**
    - `mc_cid`
    - `mc_eid`
    - `mkt_tok`
    - `_ke`
  - **Yandex**
    - `yclid`
    - `_openstat`
  - **Microsoft/Bing**
    - `wt.mc_id`
    - `cr_cc`
    - `msclkid`
  - **SendGrid**
    - `mc`
    - `mcd`
    - `cvosrc`
  - **Salesforce & Marketing Platforms**
    - `sc_channel`
    - `sc_campaign`
    - `sc_geo`
    - `sc_publisher`
    - `sc_outcome`
    - `sc_country`
    - `trk`
    - `trkCampaign`
  - **Internal Tracking (ITM)**
    - `itm_source`
    - `itm_medium`
    - `itm_campaign`
  - **Generic Tracking & Referrers**
    - `__tn__`
    - `ref`
    - `source`
    - `referer`
    - `referrer`
  - **Affiliate & Attribution**
    - `afftrack`
    - `aff_id`
    - `aff_sub`
    - `clickid`
    - `zanpid`
  - **Meiro CDP**
    - `meiro_message_id`

  - **Customer Data Platforms (CDPs)**
    - `SEGMENT`          // Segment CDP
    - `spm_id`           // Segment campaign ID
    - `spm_campaign`     // Segment campaign tracking
    - `bcid`             // BlueConic ID
    - `blueconic_id`     // BlueConic visitor ID
    - `utag_main`        // Tealium main tracking
    - `utag_visitor_id`  // Tealium visitor ID

  - **Mailing Platforms**
    - `_ke`              // Klaviyo ID
    - `_klaviyo_id`      // Klaviyo customer ID
    - `actid`            // ActiveCampaign ID
    - `act_cid`          // ActiveCampaign campaign ID
    - `act_campaign`     // ActiveCampaign specific campaign
    - `sibsource`        // Sendinblue source
    - `sibeid`           // Sendinblue email ID
    - `gr_source`        // GetResponse source
    - `gr_campaign_id`   // GetResponse campaign ID
    - `ck_campaign`      // ConvertKit campaign ID
    - `ck_email_id`      // ConvertKit email ID
    - `aweber_campaign_id` // AWeber campaign ID
    - `aweber_subscriber_id` // AWeber subscriber ID

  - **Advertising/Tracking Platforms**
    - `crt_id`           // Criteo ID
    - `crt_ref`          // Criteo referrer
    - `adroll_fid`       // AdRoll ID
    - `adroll_sid`       // AdRoll session ID
    - `rakuten_ad_id`    // Rakuten Marketing ad ID
    - `taboola_ref`      // Taboola referrer
    - `taboola_ad_id`     // Taboola ad ID

  - **A/B Testing and Personalization Platforms**
    - `optimizely_end_user_id` // Optimizely end user ID
    - `optimizely_visitor_id`  // Optimizely visitor ID
    - `vwo_user_id`            // VWO user ID
    - `vwo_test_id`            // VWO test ID
    - `unbounce`               // Unbounce campaign ID
    - `instapage_campaign_id`   // Instapage campaign ID

  - **Other Marketing & Analytics Platforms**
    - `mpid`                 // Mixpanel ID
    - `mp_referrer`          // Mixpanel referrer
    - `heap_id`              // Heap Analytics ID
    - `pardot_visitor_id`    // Pardot visitor ID
    - `pardot_campaign_id`    // Pardot campaign ID

  - **Social Media Platforms (advanced)**
    - `tt_ad_id`             // TikTok ad ID
    - `tt_campaign_id`       // TikTok campaign ID
    - `pin_ads`              // Pinterest ad ID
    - `pin_campaign`         // Pinterest campaign ID
    - `sc_ad_id`             // Snapchat ad ID
    - `sc_campaign_id`        // Snapchat campaign ID

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
