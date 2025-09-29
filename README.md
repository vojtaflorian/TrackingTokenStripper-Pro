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

## Usage

1. Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) Chrome extension.

2. Click [this link](https://github.com/vojtaflorian/TrackingTokenStripper-Pro/raw/master/TrackingTokenStripper-Pro.user.js) to install Userscript.

3. Hit **Install** on the Tampermonkey extension page.

    ![Tampermonkey Userscript installation](https://user-images.githubusercontent.com/88981/91120197-acc9ad00-e6c7-11ea-8f4c-2fa3526a72b7.jpg)

## Links

- [Tampermonkey • Documentation](https://www.tampermonkey.net/documentation.php)
  - [@run-at](https://www.tampermonkey.net/documentation.php#_run_at)
- [About | TrackingTokenStripper Pro | Userscripts | OpenUserJS](https://openuserjs.org/scripts/vojtaflorian/TrackingTokenStripper-Pro)
- [TrackingTokenStripper Pro | Greasy Fork](https://greasyfork.org/en/scripts/409925-trackingtokenstripper-pro)

## Related Userscripts

- [chgc/CleanFBSapce: 不想看到 FB 贊助廣告的套件](https://github.com/chgc/CleanFBSapce)

## Changelog

### 2025-09-29

- **Pro Version Released**: New features including error handling, logging, and performance monitoring.
- **New Tokens**: Added support for new tokens, including TikTok, LinkedIn, and updated Google Analytics.
- **Enhanced Logging**: Detailed logs now include timing and category of tokens removed.

---

This script is an enterprise-grade version of the original **TrackingTokenStripper**, designed for more robust tracking token removal and additional monitoring features. It helps ensure cleaner URLs by removing tracking parameters before page load, improving privacy and security.
