/*
 * properties used by application to persist state
 */
export default {
    userId: false,
    locale: "en-us",
    defaultCountryCode: "US",
    countryCode: "US",
    errorMessage: "",
    currentView: "domain",
    portalWrapperURL: "/api/portal-wrapper-html/",
    portalFooterURL: "/api/portal-footer-html/",
    settingsURL: "/api/settings",
    meURL: "/api/me",
    settings: {},
    userInfo: {},
    LifeRayBaseURL: "",
    domainMappings: {},
    defaultDomain: "default_domain",
    domains: ["mood_changes", "insomnia", "hot_flashes", "sex_and_intimacy", "pain", "fatigue"],
    userDomains: [],
    eligibleCountryCodes: [{
        name: "United Kingdom",
        code: "GB"
    },
    {
        name: "Canada",
        code: "CA"
    },
    {
        name: "United States",
        code: "US"
    }
    ],
    //chosen domain
    activeDomain: "",
    domainContent: "",
    getContentAttempt: 0
};

