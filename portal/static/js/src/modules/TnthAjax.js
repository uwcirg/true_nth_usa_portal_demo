import Utility from "./Utility.js";
import tnthDates from "./TnthDate.js";
import SYSTEM_IDENTIFIER_ENUM from "./SYSTEM_IDENTIFIER_ENUM.js";
import CLINICAL_CODE_ENUM from "./CLINICAL_CODE_ENUM.js";
export default {
    "beforeSend": function() {
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", $("#__CRSF_TOKEN").val());
                }
            }
        });
    },
    "sendRequest": function(url, method, userId, params, callback) {
        if (!url) { return false; }
        var defaultParams = {type: method ? method : "GET", url: url, attempts: 0, max_attempts: 3, contentType: "application/json; charset=utf-8", dataType: "json", sync: false, timeout: 5000, data: null, useWorker: false, async: true};
        params = params || defaultParams;
        params = $.extend({}, defaultParams, params);
        params.async = params.sync ? false: params.async;
        var self = this;
        var fieldHelper = this.FieldLoaderHelper, targetField = params.targetField || null;
        callback = callback || function() {};
        params.attempts++;
        fieldHelper.showLoader(targetField);
        if (params.useWorker && window.Worker && !Utility.isTouchDevice()) { /*global isTouchDevice()*/
            Utility.initWorker(url, params, function(result) { /*global initWorker*/
                var data;
                try {
                    data = JSON.parse(result);
                } catch(e) {
                    callback({error: "Error occurred parsing data for " + url});
                    return false;
                }
                if (!data) {
                    callback({"error": true, "data": "no data returned"});
                    fieldHelper.showError(targetField);
                } else if (data.error) {
                    callback({"error": true, "data": data});
                    self.sendError(data, url, userId, params);
                    fieldHelper.showError(targetField);
                } else {
                    callback(data);
                    fieldHelper.showUpdate(targetField);
                }
            });
            return true;
        }
        if (!params.cache) {
            params.headers = {
                "cache-control": "no-cache",
                "expires": "-1",
                "pragma": "no-cache"
            };
        }
        $.ajax(params).done(function(data) {
            params.attempts = 0;
            if (data) {
                fieldHelper.showUpdate(targetField);
                callback(data);
            } else {
                fieldHelper.showError(targetField);
                callback({"error": true, "data": "no data returned"});
            }
        }).fail(function(xhr) {
            if (params.attempts < params.max_attempts) {
                (function(self, url, method, userId, params, callback) {
                    setTimeout(function() {
                        self.sendRequest(url, method, userId, params, callback);
                    }, 3000); //retry after 3 seconds
                })(self, url, method, userId, params, callback);
            } else {
                params.attempts = 0;
                fieldHelper.showError(targetField);
                callback({"error": true, "data": xhr});
                self.sendError(xhr, url, userId, params);
            }
        });
    },
    "sendError": function(xhr, url, userId, params) {
        if (!xhr) { return false; }
        var errorMessage = "[Error occurred processing request]  status - " + (parseInt(xhr.status) === 0 ? "request timed out/network error" : xhr.status) + ", response text - " + (xhr.responseText ? xhr.responseText : "no response text returned from server");
        if (params) {
            try {
                errorMessage += " [data sent]: " + JSON.stringify(params); //error can happen if for some reason the params are malformed
            } catch(e) {
                errorMessage += " Error occurred transforming sent data: " + e.message;
            }
        }
        this.reportError(userId ? userId : "Not available", url, errorMessage, true);
    },
    "reportError": function(userId, page_url, message, sync) {
        //params need to contain the following: subject_id: User on which action is being attempted message: Details of the error event page_url: The page requested resulting in the error
        var params = {};
        params.subject_id = userId ? userId : 0;
        params.page_url = page_url ? page_url : window.location.href;
        params.message = "Error generated in JS - " + (message ? message.replace(/["']/g, "") : "no detail available"); //don't think we want to translate message sent back to the server here
        if (window.console) {
            console.log("Errors occurred.....");
            console.log(params); /*global console*/
        }
        $.ajax({
            type: "GET",
            url: "/report-error",
            contentType: "application/json; charset=utf-8",
            cache: false,
            async: (sync ? false : true),
            data: params
        }).done(function() {}).fail(function() {});
    },
    "FieldLoaderHelper": {
        delayDuration: 300,
        showLoader: function(targetField) {
            if (!targetField || targetField.length === 0) { return false; }
            var el = $("#" + (targetField.attr("data-save-container-id") || targetField.attr("id")) + "_load");
            el.css("opacity", 1);
            el.addClass("loading");
        },
        showUpdate: function(targetField) {
            var __timeout = this.delayDuration;
            if (!targetField || targetField.length === 0) { return false; }
            setTimeout(function() {
                (function(targetField) {
                    var containerId = targetField.attr("data-save-container-id") || targetField.attr("id");
                    var errorField = $("#" + containerId + "_error");
                    var successField = $("#" + containerId + "_success");
                    var loadingField = $("#" + containerId + "_load");
                    loadingField.removeClass("loading");
                    errorField.text("").css("opacity", 0);
                    successField.text(i18next.t("success"));
                    loadingField.animate({"opacity": 0}, __timeout, function() {
                        successField.animate({"opacity": 1}, __timeout, function() {
                            setTimeout(function() {
                                successField.animate({"opacity": 0}, __timeout * 2);
                            }, __timeout * 2);
                        });
                    });
                })(targetField);
            }, __timeout);
        },
        showError: function(targetField) {
            targetField = targetField || $(targetField);
            var __timeout = this.delayDuration;
            if (!targetField || targetField.length === 0) { return false; }
            setTimeout(function() {
                (function(targetField) {
                    var containerId = targetField.attr("data-save-container-id") || targetField.attr("id");
                    var errorField = $("#" + containerId + "_error");
                    var successField = $("#" + containerId + "_success");
                    var loadingField = $("#" + containerId + "_load");
                    loadingField.removeClass("loading");
                    errorField.text(i18next.t("Unable to update. System/Server Error."));
                    successField.text("").css("opacity", 0);
                    loadingField.animate({"opacity": 0}, __timeout, function() {
                        errorField.animate({"opacity": 1}, __timeout, function() {
                            setTimeout(function() {
                                errorField.animate({"opacity": 0}, __timeout * 2);
                            }, __timeout * 2);
                        });
                    });
                })(targetField);
            }, __timeout);
        }
    },
    "getCurrentUser": function(callback, params) {
        callback = callback||function() {};
        if (sessionStorage.currentUser) {
            callback(JSON.parse(sessionStorage.currentUser));
        } else {
            this.sendRequest("/api/me", "GET", "", params, function(data) {
                if (data && data.id) { //make sure the necessary data is there before setting session
                    sessionStorage.setItem("currentUser", JSON.stringify(data));
                }
                callback(data);
            });
        }
    },
    "getStillNeededCoreData": function(userId, sync, callback, entry_method) {
        callback = callback || function() {};
        if (!userId) {
            callback({"error": i18next.t("User Id is required")});
            return false;
        }
        var __url = "/api/coredata/user/" + userId + "/still_needed" + (entry_method ? "?entry_method=" + (entry_method).replace(/\_/g, " ") : "");
        this.sendRequest(__url, "GET", userId, {sync: sync,cache: true}, function(data) {
            if (!data) {
                callback({"error": i18next.t("no data returned")});
                return false;
            }
            if (data.error) {
                callback({"error": i18next.t("unable to get needed core data")});
                return false;
            }
            callback(data);
        });
    },
    "getRequiredCoreData": function(userId, sync, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({"error": i18next.t("User Id is required")});
            return false;
        }
        this.sendRequest("/api/coredata/user/" + userId + "/required", "GET", userId, {sync: sync,cache: true}, function(data) {
            if (data) {
                if (!data.error) {
                    if (data.required) {
                        callback(data.required);
                    } else {
                        callback({"error": i18next.t("no data returned")});
                    }
                } else {
                    callback({"error": i18next.t("unable to get required core data")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "getOptionalCoreData": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({"error": i18next.t("User Id is required")});
            return false;
        }
        var __url = "/api/coredata/user/" + userId + "/optional", sessionStorageKey = "optionalCoreData_" + userId;
        if (sessionStorage.getItem(sessionStorageKey)) {
            callback(JSON.parse(sessionStorage.getItem(sessionStorageKey)));
        } else {
            this.sendRequest(__url, "GET", userId, params, function(data) {
                if (data) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("no data found")});
                }
            });
        }
    },
    "getPortalFooter": function(userId, sync, containerId, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback("<div class='error-message'>" + i18next.t("User Id is required") + "</div>");
            return false;
        }
        this.sendRequest("/api/portal-footer-html/", "GET", userId, {sync: sync,cache: true,"dataType": "html"}, function(data) {
            if (data) {
                if (!data.error) {
                    if (containerId) {
                        $("#" + containerId).html(data);
                    }
                    callback(data);
                } else {
                    callback("<div class='error-message'>" + i18next.t("Unable to retrieve portal footer html") + "</div>");
                }
            } else {
                callback("<div class='error-message'>" + i18next.t("No data found") + "</div>");
            }
        });
    },
    "getOrgs": function(userId, params, callback) {
        callback = callback || function() {};
        this.sendRequest("/api/organization", "GET", userId, params, function(data) {
            if (sessionStorage.demoOrgsData) {
                callback(JSON.parse(sessionStorage.demoOrgsData));
                return true;
            }
            if (!data.error) {
                $(".get-orgs-error").html("");
                sessionStorage.setItem("demoOrgsData", JSON.stringify(data));
                callback(data);
            } else {
                var errorMessage = i18next.t("Server error occurred retrieving organization/clinic information.");
                $(".get-orgs-error").html(errorMessage);
                callback({"error": errorMessage});
            }
        });
    },
    "getConsent": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/consent", "GET", userId, params, function(data) {
            if (data) {
                if (!data.error) {
                    $(".get-consent-error").html("");
                    callback(data);
                    return true;
                } else {
                    var errorMessage = i18next.t("Server error occurred retrieving consent information.");
                    callback({"error": errorMessage});
                    $(".get-consent-error").html(errorMessage);
                    return false;
                }
            }
        });
    },
    "setConsent": function(userId, params, status, sync, callback) {
        callback = callback || function() {};
        if (!userId && !params) {
            callback({"error": i18next.t("User id and parameters are required")});
            return false;
        }
        var consented = this.hasConsent(userId, params.org, status);
        var __url = "/api/user/" + userId + "/consent";
        if (consented && !params.testPatient) {
        	callback({"error": false});
        	return;
        }
        var data = {};
        data.user_id = userId;
        data.organization_id = params.org;
        data.agreement_url = params.agreementUrl;
        data.staff_editable = (String(params.staff_editable) !== "null"  && String(params.staff_editable) !== "undefined" ? params.staff_editable : false);
        data.include_in_reports = (String(params.include_in_reports) !== "null" && String(params.include_in_reports) !== "undefined" ? params.include_in_reports : false);
        data.send_reminders = (String(params.send_reminders) !== "null" &&  String(params.send_reminders) !== "undefined"? params.send_reminders : false);
        if (params.acceptance_date) {
            data.acceptance_date = params.acceptance_date;
        }
        this.sendRequest(__url, "POST", userId, {sync: sync, data: JSON.stringify(data)}, function(data) {
            if (!data.error) {
                $(".set-consent-error").html("");
                callback(data);
            } else {
                var errorMessage = i18next.t("Server error occurred setting consent status.");
                callback({"error": errorMessage});
                $(".set-consent-error").html(errorMessage);
            }
        });
    },
    deleteConsent: function(userId, params) {
        if (!userId || !params) {
            return false;
        }
        var consented = this.getAllValidConsent(userId, params.org);
        if (!consented) {
            return false;
        }
        var arrExcludedOrgIds = params.exclude ? params.exclude.split(","): [];
        var arrConsents = $.grep(consented, function(orgId) {
            var inArray = $.grep(arrExcludedOrgIds, function(eOrg) {
                return String(eOrg) === String(orgId);
            });
           return !(inArray.length); //filter out org Id(s) that are in the array of org Ids to be excluded;
        });
        var self = this;
        arrConsents.forEach(function(orgId) { //delete all consents for the org
            self.sendRequest("/api/user/" + userId + "/consent", "DELETE", userId, {data: JSON.stringify({"organization_id": parseInt(orgId)})}, function(data) {
                if (!data) {
                    return false;
                }
                if (!data.error) {
                    $(".delete-consent-error").html("");
                } else {
                    $(".delete-consent-error").html(i18next.t("Server error occurred removing consent."));
                }
            });
        });
    },
    withdrawConsent: function(userId, orgId, params, callback) {
        callback = callback || function() {};
        if (!userId || !orgId) {
            callback({"error": i18next.t("User id and organization id are required.")});
            return false;
        }
        params = params || {};
        var self = this, arrConsent = [];
        this.sendRequest("/api/user/" + userId + "/consent", "GET", userId, params, function(data) {
            if (data && data.consent_agreements && data.consent_agreements.length > 0) {
                arrConsent = $.grep(data.consent_agreements, function(item) {
                    var expired = item.expires ? tnthDates.getDateDiff(String(item.expires)) : 0; /*global tnthDates */
                    return (String(orgId) === String(item.organization_id)) && !item.deleted && !(expired > 0) && String(item.status) === "suspended";
                });
            }
            if (arrConsent.length > 0) { //don't send request if suspended consent already existed
                callback({"data": "success"});
                return false;
            }
            self.sendRequest("/api/user/" + userId + "/consent/withdraw",
            "POST",
            userId, {sync: params.sync,data: JSON.stringify({organization_id: orgId})},
            function(data) {
                if (data.error) {
                    callback({"error": i18next.t("Error occurred setting suspended consent status.")});
                    return false;
                }
                callback(data);
            });
        });
    },
    getAllValidConsent: function(userId, orgId) {
        if (!userId || !orgId) { return false; }
        var consentedOrgIds = [];
        this.sendRequest("/api/user/" + userId + "/consent", "GET", userId, {sync: true}, function(data) {
            if (!data || data.error || !data.consent_agreements || data.consent_agreements.length === 0) {
                return consentedOrgIds;
            }
            consentedOrgIds = $.grep(data.consent_agreements, function(item) {
                var expired = item.expires ? tnthDates.getDateDiff(String(item.expires)) : 0;
                return !item.deleted && !(expired > 0) && (String(orgId).toLowerCase() === "all" || String(orgId) === String(item.organization_id));
            });
            consentedOrgIds = (consentedOrgIds).map(function(item) {
                return item.organization_id;
            });
            return consentedOrgIds;
        });
        return consentedOrgIds;
    },
    hasConsent: function(userId, orgId, filterStatus) {  /****** NOTE - this will return the latest updated consent entry *******/
        if (!userId || !orgId || String(filterStatus) === "default") { return false; }
        var consentedOrgIds = [], expired = 0, found = false, suspended = false, item = null;
        var __url = "/api/user/" + userId + "/consent", self = this;
        self.sendRequest(__url, "GET", userId, {sync: true}, function(data) {
            if (!data || data.error || (data.consent_agreements && data.consent_agreements.length === 0)) {
                return false;
            }
            consentedOrgIds = $.grep(data.consent_agreements, function(item) {
                var expired = item.expires ? tnthDates.getDateDiff(String(item.expires)) : 0; /*global tnthDates */
                return (String(orgId) === String(item.organization_id)) && !item.deleted && !(expired > 0) && item.staff_editable && item.send_reminders && item.include_in_reports;
            });
        });
        return consentedOrgIds.length;
    },
    "getDemo": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({"error": i18next.t("User id is required.")});
            return false;
        }
        params = params || {};
        var demoDataKey = "demoData_"+userId;
        if (sessionStorage.getItem(demoDataKey)) {
            callback(JSON.parse(sessionStorage.getItem(demoDataKey)));
            return;
        }
        this.sendRequest("/api/demographics/" + userId, "GET", userId, params, function(data) {
            var errorMessage = "";
            if (data.error) {
                errorMessage = i18next.t("Server error occurred retrieving demographics information.");
                $(".get-demo-error").html(errorMessage);
                callback({"error": errorMessage});
                return false;
            }
            $(".get-demo-error").html(errorMessage);
            sessionStorage.setItem(demoDataKey, JSON.stringify(data));
            callback(data);
        });
    },
    "clearDemoSessionData": function(userId) {
        sessionStorage.removeItem("demoData_"+userId);
    },
    "putDemo": function(userId, toSend, targetField, sync, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({"error": i18next.t("User Id is required")});
            return false;
        }
        this.clearDemoSessionData(userId);
        this.sendRequest("/api/demographics/" + userId, "PUT", userId, {sync: sync, data: JSON.stringify(toSend),targetField: targetField}, function(data) {
            if (!data.error) {
                $(".put-demo-error").html("");
            } else {
                $(".put-demo-error").html(i18next.t("Server error occurred setting demographics information."));
            }
            callback(data);
        });
    },
    "getLocale": function(userId) {
        this.sendRequest("/api/demographics/" + userId, "GET", userId, null, function(data) {
            if (data) {
                if (!data.error) {
                    if (data.communication) {
                        $("#profileLocaleTimezoneContainer .get-locale-error").html("");
                    }
                } else {
                    $("#profileLocaleTimezoneContainer .get-locale-error").html(i18next.t("Server error occurred retrieving locale information."));
                }
            }
        });
    },
    "hasTreatment": function(data) {
        if (!data || !data.entry || data.entry.length === 0) {
            return false;
        }
        var sortedArray = data.entry.sort(function(a, b) { // sort from newest to oldest based on lsat updated date
            return new Date(b.resource.meta.lastUpdated) - new Date(a.resource.meta.lastUpdated);
        });
        var found = false;
        sortedArray.forEach(function(item) {
            if (found) { return true; }
            var resourceItemCode = String(item.resource.code.coding[0].code);
            var system = String(item.resource.code.coding[0].system);
            var procId = item.resource.id;
            if ((resourceItemCode === SYSTEM_IDENTIFIER_ENUM.CANCER_TREATMENT_CODE && (system === SYSTEM_IDENTIFIER_ENUM.SNOMED_SYS_URL)) || (resourceItemCode === SYSTEM_IDENTIFIER_ENUM.NONE_TREATMENT_CODE && (system === SYSTEM_IDENTIFIER_ENUM.CLINICAL_SYS_URL))) {
                found = {"code": resourceItemCode,"id": procId};
            }
        });
        return found;
    },
    "getTreatment": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required")});
            return false;
        }
        this.sendRequest("/api/patient/" + userId + "/procedure", "GET", userId, params, function(data) {
            if (data.error) {
                $("#userProcedures").html("<span class='error-message'>" + i18next.t("Error retrieving data from server") + "</span>");
            }
            callback(data);
        });
    },
    "postTreatment": function(userId, started, treatmentDate, targetField) {
        if (!userId) { return false;}
        this.deleteTreatment(userId, targetField);
        var code = SYSTEM_IDENTIFIER_ENUM.NONE_TREATMENT_CODE, display = "None", system = SYSTEM_IDENTIFIER_ENUM.CLINICAL_SYS_URL;
        if (started) {
            code = SYSTEM_IDENTIFIER_ENUM.CANCER_TREATMENT_CODE;
            display = "Procedure on prostate";
            system = SYSTEM_IDENTIFIER_ENUM.SNOMED_SYS_URL;
        }
        if (!treatmentDate) {
            var date = new Date();
            treatmentDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();  //in yyyy-mm-dd format
        }
        var procID = [{"code": code,"display": display,"system": system}];
        var procArray = {};
        procArray.resourceType = "Procedure";
        procArray.subject = {"reference": "Patient/" + userId};
        procArray.code = {"coding": procID};
        procArray.performedDateTime = treatmentDate ? treatmentDate : "";
        this.postProc(userId, procArray, targetField);
    },
    deleteTreatment: function(userId, targetField) {
        var self = this;
        this.sendRequest("/api/patient/" + userId + "/procedure", "GET", userId, {sync: true}, function(data) {
            if (!data || data.error) { return false; }
            var treatmentData = self.hasTreatment(data);
            if (!treatmentData) { return false; }
            if (String(treatmentData.code) === String(SYSTEM_IDENTIFIER_ENUM.CANCER_TREATMENT_CODE)){
                self.deleteProc(treatmentData.id, targetField, true);
                return true;
            }
            self.deleteProc(treatmentData.id, targetField, true);
        });
    },
    "getProc": function(userId, newEntry, callback) {
        callback = callback || function() {};
        this.sendRequest("/api/patient/" + userId + "/procedure", "GET", userId, null, function(data) {
            callback(data);
        });
    },
    "postProc": function(userId, toSend, targetField, callback) {
        callback = callback || function() {};
        this.sendRequest("/api/procedure", "POST", userId, {data: JSON.stringify(toSend),targetField: targetField}, function(data) {
            if (!data) {
                callback({"error": i18next.t("no data returned")});
                return false;
            }
            if (data.error) {
                var errorMessage = i18next.t("Server error occurred saving procedure/treatment information.");
                $("#userProcuedures .get-procs-error").html(errorMessage);
                callback({error: errorMessage});
                return false;
            }
            $(".get-procs-error").html("");
            callback(data);
        });
    },
    "deleteProc": function(procedureId, targetField, sync) {
        this.sendRequest("/api/procedure/" + procedureId, "DELETE", null, {sync: sync,targetField: targetField}, function(data) {
            if (!data.error) {
                $(".del-procs-error").html("");
            } else {
                $(".del-procs-error").html(i18next.t("Server error occurred removing procedure/treatment information."));
            }
        });
    },
    "getRoleList": function(params, callback) {
        this.sendRequest("/api/roles", "GET", null, params, function(data) {
            callback = callback || function() {};
            if (!data.error) {
                callback(data);
            } else {
                var errorMessage = i18next.t("Server error occurred retrieving roles information.");
                $(".get-roles-error").html(errorMessage);
                callback({"error": errorMessage});
            }
        });
    },
    "getRoles": function(userId, callback, params) {
        callback = callback || function() {};
        var sessionStorageKey = "userRole_" + userId;
        if (sessionStorage.getItem(sessionStorageKey)) {
            var data = JSON.parse(sessionStorage.getItem(sessionStorageKey));
            callback(data);
        } else {
            this.sendRequest("/api/user/" + userId + "/roles", "GET", userId, params, function(data) {
                if (data) {
                    if (!data.error) {
                        $(".get-roles-error").html("");
                        sessionStorage.setItem(sessionStorageKey, JSON.stringify(data));
                        callback(data);
                    } else {
                        var errorMessage = i18next.t("Server error occurred retrieving user role information.");
                        $(".get-roles-error").html(errorMessage);
                        callback({"error": errorMessage});
                    }
                }
            });
        }
    },
    "removeCachedRoles": function(userId) {
        sessionStorage.removeItem("userRole_"+userId);
    },
    "putRoles": function(userId, toSend, targetField, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User Id is required.")});
            return false;
        }
        this.removeCachedRoles(userId);
        this.sendRequest("/api/user/" + userId + "/roles", "PUT", userId, {data: JSON.stringify(toSend),targetField: targetField}, function(data) {
            if (!data || data.error) {
                var errorMessage = i18next.t("Server error occurred setting user role information.");
                $(".put-roles-error").html(errorMessage);
                callback({error: errorMessage});
                return;
            }
            $(".put-roles-error").html("");
            sessionStorage.setItem("userRole_" + userId, "");
            callback(data);
        });
    },
    "deleteRoles": function(userId, toSend) {
        if (!userId) {
            return false;
        }
        this.removeCachedRoles(userId);
        this.sendRequest("/api/user/" + userId, "GET", userId, {data: JSON.stringify(toSend)}, function(data) {
            if (data) {
                if (!data.error) {
                    $(".delete-roles-error").html("");
                } else {
                    $(".delete-roles-error").html(i18next.t("Server error occurred deleting user role."));
                }
            }
        });
    },
    "getClinical": function(userId, params, callback) {
        callback = callback || function() {};
        this.sendRequest("/api/patient/" + userId + "/clinical", "GET", userId, params, function(data) {
            if (data) {
                if (!data.error) {
                    $(".get-clinical-error").html("");
                    callback(data);
                } else {
                    var errorMessage = i18next.t("Server error occurred retrieving clinical data.");
                    $(".get-clinical-error").html(errorMessage);
                    callback({"error": errorMessage});
                }
            }
        });
    },
    "getObservationId": function(userId, code) {
        if (!userId) { return false; }
        var obId = "",_code = "";
        this.sendRequest("/api/patient/" + userId + "/clinical", "GET", userId, {sync: true}, function(data) {
            if (data) {
                if (!data.error) {
                    if (data.entry) {
                        (data.entry).forEach(function(item) {
                            if (!obId) {
                                _code = item.content.code.coding[0].code;
                                if (String(_code) === String(code)) {
                                    obId = item.content.id;
                                }
                            }
                        });
                    }
                }
            }
        });
        return obId;
    },
    "postClinical": function(userId, toCall, toSend, status, targetField, params, callback) {
        if (!userId) { return false; }
        params = params || {};
        var code = "", display = "";
        if (CLINICAL_CODE_ENUM.hasOwnProperty(String(toCall).toLowerCase())) {
            var match = CLINICAL_CODE_ENUM[toCall];
            code = match.code;
            display = match.display;
        }
        if (!code) {
            return false;
        }
        var self = this;
        var system = SYSTEM_IDENTIFIER_ENUM.CLINICAL_SYS_URL;
        var method = "POST";
        var url = "/api/patient/" + userId + "/clinical";
        var obsCode = [{"code": code,"display": display,"system": system}];
        var obsArray = {};
        obsArray.resourceType = "Observation";
        obsArray.code = {"coding": obsCode};
        obsArray.issued = params.issuedDate ? params.issuedDate : "";
        obsArray.status = status ? status : "";
        obsArray.valueQuantity = {"units": "boolean","value": toSend};
        if (params.performer) {
            obsArray.performer = params.performer;
        }
        var obsId = self.getObservationId(userId, code);
        if (obsId) {
            method = "PUT";
            url = url + "/" + obsId;
        }
        callback = callback || function() {};
        this.sendRequest(url, method, userId, {data: JSON.stringify(obsArray),targetField: targetField}, function(data) {
            if (!data || data.error) {
                var errorMessage = i18next.t("Server error occurred updating clinical data.");
                $(".post-clinical-error").html(errorMessage).show();
                callback({error: errorMessage});
                return;
            }
            $(".post-clinical-error").html("").hide();
            callback(data);
        });
    },
    "getTermsUrl": function(sync, callback) { /*global i18next */
        callback = callback || function() {};
        this.sendRequest("/api/tou", "GET", null, {sync: sync}, function(data) {
            if (data) {
                if (!data.error) {
                    $(".get-tou-error").html("");
                    if (data.url) {
                        $("#termsURL").attr("data-url", data.url);
                        $("#termsCheckbox_default .terms-url").attr("href", data.url);
                        callback({"url": data.url});
                    } else {
                        callback({"error": i18next.t("no url returned")});
                    }
                } else {
                    $(".get-tou-error").html(i18next.t("Server error occurred retrieving tou url."));
                    callback({"error": i18next.t("Server error")});
                }
            }
        });
    },
    "getInstrumentsList": function(sync, callback) { //return instruments list by organization(s)
        callback = callback || function() {};
        this.sendRequest("api/questionnaire_bank", "GET", null, {
            sync: sync
        }, function(data) {
            if (data) {
                if (!data.error) {
                    if (data.entry) {
                        if ((data.entry).length === 0) {
                            callback({"error": i18next.t("no data returned")});
                        } else {
                            var qList = {};
                            (data.entry).forEach(function(item) {
                                if (item.organization) {
                                    var orgID = (item.organization.reference).split("/")[2];
                                    if (!qList[orgID]) {
                                        qList[orgID] = []; //don't assign orgID to object if it was already present
                                    }
                                    if (item.questionnaires) {
                                        (item.questionnaires).forEach(function(q) {
                                            /*
                                             * add instrument name to instruments array for the org - will not add if it is already in the array
                                             * NOTE: inArray returns -1 if the item is NOT in the array
                                             */
                                            if ($.inArray(q.questionnaire.display, qList[orgID]) === -1) {
                                                qList[orgID].push(q.questionnaire.display);
                                            }
                                        });
                                    }
                                }
                            });
                            callback(qList);
                        }
                    } else {
                        callback({"error": i18next.t("no data returned")});
                    }
                } else {
                    callback({"error": i18next.t("error retrieving instruments list")});
                }
            }
        });
    },
    "getTerms": function(userId, type, sync, callback, params) {
        callback = callback || function() {};
        params = params || {};
        var url = "/api/user/{userId}/tou{type}{all}".replace("{userId}", userId)
            .replace("{type}", type ? ("/" + type) : "")
            .replace("{all}", (params.hasOwnProperty("all") ? "?all=true" : ""));
        this.sendRequest(url, "GET", userId, {sync: sync}, function(data) {
            if (data) {
                if (!data.error) {
                    $(".get-tou-error").html("");
                    callback(data);
                } else {
                    var errorMessage = i18next.t("Server error occurred retrieving tou data.");
                    $(".get-tou-error").html(errorMessage);
                    callback({"error": errorMessage});
                }
            }
        });
    },
    "postTermsByUser": function(userId, toSend, callback) {
        callback = callback || function() {};
        this.sendRequest("/api/user/" + userId + "/tou/accepted", "POST", userId, {data: JSON.stringify(toSend)}, function(data) {
            if (!data || data.error) {
                $(".post-tou-error").html(i18next.t("Server error occurred saving terms of use information."));
                callback(data);
                return
            }
            $(".post-tou-error").html("");
            callback(data);
        });
    },
    "postTerms": function(toSend, targetField, callback) {
        callback = callback || function() {};
        this.sendRequest("/api/tou/accepted", "POST", null, {data: JSON.stringify(toSend), targetField: targetField}, function(data) {
            if (!data || data.error) {
                var errorMessage = i18next.t("Server error occurred saving terms of use information.");
                $(".post-tou-error").html(errorMessage);
                callback({error: errorMessage});
                return;
            }
            $(".post-tou-error").html("");
            callback(data);
        });
    },
    "accessUrl": function(userId, sync, callback) {
        callback = callback || function() {};
        if (!userId) { callback({"error": i18next.t("User id is required.")}); return false; }
        this.sendRequest("/api/user/" + userId + "/access_url", "GET", userId, {sync: sync}, function(data) {
            if (data) {
                if (!data.error) {
                    callback({url: data.access_url});
                } else {
                    callback({"error": i18next.t("Error occurred retrieving access url.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "invite": function(userId, data, callback) {
        callback = callback || function() {};
        if (!data) { callback({"error": i18next.t("Invite data are required.")}); return false; }
        this.sendRequest("/invite", "POST", userId, {
            "contentType": "application/x-www-form-urlencoded; charset=UTF-8",
            "data": data,
            "dataType": "html"
        }, function(data) {
            if (data) {
                callback(data);
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "passwordReset": function(userId, callback) {
        callback = callback || function() {};
        if (!userId) { callback({"error": i18next.t("User id is required.")}); return false; }
        this.sendRequest("/api/user/" + userId + "/password_reset", "POST", userId, {"contentType": "application/x-www-form-urlencoded; charset=UTF-8"}, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred sending password reset request.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "assessmentStatus": function(userId, callback) {
        callback = callback || function() {};
        if (!userId) { callback({"error": i18next.t("User id is required.")}); return false; }
        this.sendRequest("/api/patient/" + userId + "/assessment-status", "GET", userId, null, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving assessment status.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "updateAssessment": function(userId, data, callback) {
        callback = callback || function() {};
        if (!userId) { callback({"error": i18next.t("User id is required.")}); return false; }
        if (!data) { callback({"error": i18next.t("Questionnaire response data is required.")}); return false;}
        this.sendRequest("/api/patient/" + userId + "/assessment", "PUT", userId, {data: JSON.stringify(data)}, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving assessment list.")});
                }

            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "assessmentList": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        this.sendRequest("/api/patient/" + userId + "/assessment", "GET", userId, params, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving assessment list.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "assessmentReport": function(userId, instrumentId, callback) {
        callback = callback || function() {};
        if (!userId || !instrumentId) {
            callback({error: i18next.t("User id and instrument Id are required.")});
            return false;
        }
        this.sendRequest("/api/patient/" + userId + "/assessment/" + instrumentId, "GET", userId, null, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving assessment report.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "getCurrentQB": function(userId, completionDate, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        params = params || {};
        this.sendRequest("/api/user/" + userId + "/questionnaire_bank", "GET", userId, {data: {as_of_date: completionDate}, sync: params.sync ? true : false}, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving current questionnaire bank for user.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "patientReport": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/user_documents?document_type=PatientReport", "GET", userId, params, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving patient report.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "setTablePreference": function(userId, tableName, params, callback) {
        callback = callback || function() {};
        if (!userId || !tableName) {
            callback({error: "User Id and table name is required for setting preference."});
            return false;
        }
        params = params || {};
        this.sendRequest("/api/user/" + userId + "/table_preferences/" + tableName, "PUT", userId, {"data": params.data,"sync": params.sync}, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred setting table preference.")});
                }
            }
        });
    },
    "getTablePreference": function(userId, tableName, params={}, callback=(function(){})) {
        if (!userId || !tableName) {
            callback({error: "User Id and table name is required for setting preference."});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/table_preferences/" + tableName, "GET", userId, {"sync": params.sync}, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred setting table preference.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "emailLog": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/messages", "GET", userId, params, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving email audit entries.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "auditLog": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/audit", "GET", userId, params, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving audit log.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "setting": function(key, userId, params, callback) {
        callback = callback || function() {};
        if (!key) {
            callback({"error": i18next.t("configuration key is required.")});
            return false;
        }
        params = params || {};
        this.sendRequest("/api/settings/" + key, "GET", userId, {
            "sync": params.sync
        }, function(data) {
            if (data) {
                if (!data.error) {
                    callback(data);
                } else {
                    callback({"error": i18next.t("Error occurred retrieving content for configuration key.")});
                }
            } else {
                callback({"error": i18next.t("no data returned")});
            }
        });
    },
    "deactivateUser": function(userId, params, callback) {
        callback = callback||function() {};
        if (!userId) {
            callback({"error": i18next.t("User id is required")});
            return false;
        }
        this.sendRequest("/api/user/" + userId, "DELETE", userId, (params || {}), function(data) {
            callback = callback||function() {};
            if (!data || data.error) {
                callback({"error": i18next.t("Error occurred deactivating user.")});
                return;
            }
            callback(data);
        });
    },
    "reactivateUser": function(userId, params, callback) {
        callback = callback||function() {};
        if (!userId) {
            callback({"error": i18next.t("User id is required")});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/reactivate", "POST", userId, (params || {}), function(data) {
            if (!data || data.error) {
                callback({"error": i18next.t("Error occurred reactivating user.")});
                return;
            }
            callback(data);
        });
    },
    "getConfigurationByKey": function(configVar, params, callback) {
        callback = callback || function() {};
        var self = this;
        if (!configVar) {
            callback({"error": i18next.t("configuration variable name is required.")});
            return false;
        }
        var sessionConfigKey = "config_" + configVar;
        if (sessionStorage.getItem(sessionConfigKey)) {
            var data = JSON.parse(sessionStorage.getItem(sessionConfigKey));
            callback(data);
        } else {
            this.sendRequest("/api/settings/" + configVar, "GET", null, (params || {}), function(data) {
                if (data) {
                    callback(data);
                    if (data.hasOwnProperty(configVar)) {
                        sessionStorage.setItem(sessionConfigKey, JSON.stringify(data));
                    }
                } else {
                    callback({"error": i18next.t("no data returned")});
                }
            });
        }
    },
    "getConfiguration": function(userId, params, callback) {
        callback = callback || function() {};
        var sessionConfigKey = "settings_" + userId;
        if (sessionStorage.getItem(sessionConfigKey)) {
            var data = JSON.parse(sessionStorage.getItem(sessionConfigKey));
            callback(data);
        } else {
            this.sendRequest("/api/settings", "GET", userId, (params || {}), function(data) {
                if (data) {
                    callback(data);
                    sessionStorage.setItem(sessionConfigKey, JSON.stringify(data));
                } else {
                    callback({
                        "error": i18next.t("no data returned")
                    });
                }
            });

        }
    },
    "getEmailReady": function(userId, params, callback) {
        callback = callback || function() {};
        if (!userId) {
            callback({error: i18next.t("User id is required.")});
            return false;
        }
        this.sendRequest("/api/user/" + userId + "/email_ready", "GET", userId, params, function(data) {
            callback(data);
        });
    }
};
