!function(e){var t={};function o(n){if(t[n])return t[n].exports;var r=t[n]={i:n,l:!1,exports:{}};return e[n].call(r.exports,r,r.exports,o),r.l=!0,r.exports}o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)o.d(n,r,function(t){return e[t]}.bind(null,r));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=10)}({1:function(e,t,o){"use strict";o.d(t,"b",function(){return i}),o.d(t,"c",function(){return a});var n,r=((n=function(){this.requestAttempts=0}).prototype.hasValue=function(e){return"null"!==String(e)&&""!==String(e)&&"undefined"!==String(e)},n.prototype.showMain=function(){$("#mainHolder").css({visibility:"visible","-ms-filter":"progid:DXImageTransform.Microsoft.Alpha(Opacity=100)",filter:"alpha(opacity=100)","-moz-opacity":1,"-khtml-opacity":1,opacity:1})},n.prototype.hideLoader=function(e,t){e?$("#loadingIndicator").hide():setTimeout(function(){$("#loadingIndicator").fadeOut()},t||200)},n.prototype.loader=function(e){if(document.getElementById("fullSizeContainer"))return this.hideLoader(),this.showMain(),!1;if(e)$("#loadingIndicator").show();else if(!this.isDelayLoading()){var t=this;setTimeout(function(){t.showMain()},100),this.hideLoader(!0,350)}},n.prototype.isDelayLoading=function(){return"undefined"!=typeof DELAY_LOADING&&DELAY_LOADING},n.prototype.isTouchDevice=function(){return!0===("ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch)},n.prototype.getIEVersion=function(){var e=navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);return!!e&&parseInt(e[1])},n.prototype.newHttpRequest=function(e,t,o){this.requestAttempts++;var n,r=this;for(var i in o=o||function(){},window.XDomainRequest?(n=new XDomainRequest).onload=function(){o(n.responseText)}:n=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),n.onreadystatechange=function(){if(4===n.readyState){if(200===n.status)return o(n.responseText),void(r.requestAttempts=0);r.requestAttempts<3?setTimeout(function(){r.newHttpRequest(e,t,o)},3e3):(o({error:n.responseText}),r.loader(),r.requestAttempts=0)}},t=t||{},n.open("GET",e,!0),t)t.hasOwnProperty(i)&&n.setRequestHeader(i,t[i]);t.cache||(n.setRequestHeader("cache-control","no-cache"),n.setRequestHeader("expires","-1"),n.setRequestHeader("pragma","no-cache")),n.send()},n.prototype.ajaxRequest=function(e,t,o){if(o=o||function(){},!e)return o({error:i18next.t("Url is required.")}),!1;var n={url:e,type:"GET",contentType:"text/plain",timeout:5e3,cache:!1};t=t||n,t=$.extend({},n,t),this.requestAttempts++;var r=this;$.ajax(t).done(function(e){o(e),r.requestAttempts=0}).fail(function(){r.requestAttempts<=3?setTimeout(function(){r.ajaxRequest(e,t,o)},3e3):(o({error:i18next.t("Error occurred processing request")}),r.requestAttempts=0,r.loader())}).always(function(){r.loader()})},n.prototype.initWorker=function(e,t,o){var n=new Worker("/static/js/ajaxWorker.js"),r=this;n.postMessage({url:e,params:t}),n.addEventListener("message",function(e){o.call(r,e.data),n.terminate()},!1),n.addEventListener("error",function(e){console.log("Worker runtime error: Line ",e.lineno," in ",e.filename,": ",e.message),n.terminate()},!1)},n.prototype.workerAllowed=function(){return window.Worker&&!this.isTouchDevice()},n.prototype.getRequestMethod=function(){return this.getIEVersion()?this.newHttpRequest:this.ajaxRequest},n.prototype.sendRequest=function(e,t,o){if((t=t||{}).useWorker&&this.workerAllowed())return this.initWorker(e,t,o),!0;this.getRequestMethod().call(this,e,t,function(e){o.call(this,e)})},n.prototype.LRKeyEvent=function(){$(".button--LR").length>0&&$("html").on("keydown",function(e){parseInt(e.keyCode)===parseInt(187)&&$(".button--LR").toggleClass("data-show")})},n.prototype.getLoaderHTML=function(e){return'<div class="loading-message-indicator"><i class="fa fa-spinner fa-spin fa-2x"></i>'.concat(e?"&nbsp;"+e:"","</div>")},n.prototype.convertToNumericField=function(e){e&&this.isTouchDevice()&&e.each(function(){$(this).prop("type","tel")})},n.prototype.isString=function(e){return"[object String]"===Object.prototype.toString.call(e)},n.prototype.disableHeaderFooterLinks=function(){var e=$("#tnthNavWrapper a, #homeFooter a").not("a[href*='logout']").not("a.required-link").not("a.home-link");e.addClass("disabled"),e.prop("onclick",null).off("click"),e.on("click",function(e){return e.preventDefault(),!1})},n.prototype.pad=function(e){return e=parseInt(e),!isNaN(e)&&e<10?"0"+e:e},n.prototype.escapeHtml=function(e){return null===e||"undefined"!==e||0===String(e).length?e:e.replace(/[\"&'\/<>]/g,function(e){return{'"':"&quot;","&":"&amp;","'":"&#39;","/":"&#47;","<":"&lt;",">":"&gt;"}[e]})},n.prototype.containHtmlTags=function(e){return!!e&&/[<>]/.test(e)},n.prototype.getExportFileName=function(e){var t=new Date;return(e||"ExportList_")+("00"+t.getDate()).slice(-2)+("00"+(t.getMonth()+1)).slice(-2)+t.getFullYear()},n.prototype.capitalize=function(e){return e.replace(/\w\S*/g,function(e){return e.charAt(0).toUpperCase()+e.substr(1).toLowerCase()})},n.prototype.restoreVis=function(){var e=document.getElementById("loadingIndicator"),t=document.getElementById("mainHolder");e&&e.setAttribute("style","display:none; visibility:hidden;"),t&&t.setAttribute("style","visibility:visible;-ms-filter:'progid:DXImageTransform.Microsoft.Alpha(Opacity=100)';filter:alpha(opacity=100); -moz-opacity:1; -khtml-opacity:1; opacity:1")},n.prototype.VueErrorHandling=function(){if("undefined"==typeof Vue)return!1;var e=this;Vue.config.errorHandler=function(t,o,n){var r,i=o;if(o.$options.errorHandler)r=o.$options.errorHandler;else for(;!r&&i.$parent;)r=(i=i.$parent).$options.errorHandler;e.restoreVis(),r?r.call(i,t,o,n):console.log(t)}},n.prototype.extend=function(e,t){for(var o in t)t.hasOwnProperty(o)&&(e[o]=t[o]);return e},n.prototype.getUrlParameter=function(e){e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var t=new RegExp("[\\?&]"+e+"=([^&#]*)").exec(location.search);return null===t?"":decodeURIComponent(t[1])},n.prototype.resetBrowserBackHistory=function(e,t,o){var n="undefined"!=typeof history&&history.pushState;e=e||location.href,n&&history.pushState(t,o,e),window.addEventListener("popstate",function(){n?history.pushState(t,o,e):window.history.forward(1)})},n.prototype.handlePostLogout=function(){if("undefined"==typeof sessionStorage)return!1;sessionStorage.getItem("logout")&&(this.resetBrowserBackHistory(location.orgin,"logout"),sessionStorage.removeItem("logout"))},n.prototype.displaySystemOutageMessage=function(e){if(e=(e=e||"en-us").replace("_","-"),document.getElementById("systemMaintenanceContainer")){var t=this;this.ajaxRequest("api/settings",{contentType:"application/json; charset=utf-8"},function(o){if(!o||!o.MAINTENANCE_MESSAGE&&!o.MAINTENANCE_WINDOW)return!1;var n=document.querySelector(".message-container");if(n||((n=document.createElement("div")).classList.add("message-container"),document.getElementById("systemMaintenanceContainer").appendChild(n)),o.MAINTENANCE_MESSAGE)n.innerHTML=t.escapeHtml(o.MAINTENANCE_MESSAGE);else if(o.MAINTENANCE_WINDOW&&o.MAINTENANCE_WINDOW.length){var r,i,a=new Date(o.MAINTENANCE_WINDOW[0]),s=new Date(o.MAINTENANCE_WINDOW[1]),c=(r=new Date,i=a,r&&i?Math.floor((i.getTime()-r.getTime())/36e5%24):0);if(c<0||isNaN(c))document.getElementById("systemMaintenanceContainer").classList.add("tnth-hide");else try{var d={year:"numeric",month:"long",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hour12:!0,timeZoneName:"short"},u=a.toLocaleString(e,d).replace(/[,]/g," "),l=s.toLocaleString(e,d).replace(/[,]/g," "),p=["<div>"+i18next.t("Hi there.")+"</div>","<div>"+i18next.t("TrueNTH will be down for website maintenance starting <b>{startdate}</b>. This should last until <b>{enddate}</b>.".replace("{startdate}",u).replace("{enddate}",l))+"</div>","<div>"+i18next.t("Thanks for your patience while we upgrade our site.")+"</div>"].join("");n.innerHTML=t.escapeHtml(p)}catch(e){console.log("Error occurred converting system outage date/time ",e),document.getElementById("systemMaintenanceContainer").classList.add("tnth-hide")}}})}},new n);t.a=r;var i=r.getExportFileName,a=r.getUrlParameter},10:function(e,t,o){"use strict";o.r(t);var n,r=o(1);(n=window.CookieMonster=function(){this.modalElementId="modalCookieEnableWarning",this.testCookieName="testCookieMonster",this.resizeTimer=0}).prototype.getSelectorsToDisable=function(){return this.selectorsToDisable||this.defaultSelectorsToDisable},n.prototype.deleteTestCookie=function(){var e=new Date;e.setTime(e.getTime()-864e5);var t="expires="+e.toGMTString();window.document.cookie=this.testCookieName+"=; "+t},n.prototype.isCookieEnabled=function(){var e=navigator.cookieEnabled;return e||(document.cookie=this.testCookieName,e=-1!==document.cookie.indexOf(this.testCookieName)),this.storageSecurityAccessErrorCheck()&&(e=!1),e},n.prototype.storageSecurityAccessErrorCheck=function(){var e=!1;try{sessionStorage.setItem("__cookiemonstertest__","just a storage access test"),sessionStorage.removeItem("__cookiemonstertest__")}catch(t){t.name&&"securityerror"===String(t.name).toLowerCase()&&(e=!0)}return e},n.prototype.restoreVis=function(){var e=document.querySelectorAll("#loadingIndicator, .loading-indicator, .loading-indicator-placeholder"),t=document.getElementById("mainHolder");if(t&&t.setAttribute("style","visibility:visible;-ms-filter:'progid:DXImageTransform.Microsoft.Alpha(Opacity=100)';filter:alpha(opacity=100); -moz-opacity:1; -khtml-opacity:1; opacity:1"),e)for(var o=0;o<e.length;o++)e[o].setAttribute("style","display:none; visibility:hidden;")},n.prototype.clearModal=function(){var e=document.getElementById(this.modalElementId);e&&(e.style.display="none",this.removeModalBackdrops())},n.prototype.removeModalBackdrops=function(){var e=document.querySelector(".cookie-monster-backdrop");e&&e.parentNode.remove();var t=document.querySelector(".cookie-monster-modal-backdrop-cover");t&&t.parentNode.remove()},n.prototype.addModalBackdrops=function(){if(!document.querySelector(".cookie-monster-backdrop")){var e=document.createElement("div");e.classList.add("modal-backdrop","fade","in","cookie-monster-backdrop"),document.querySelector("body").appendChild(e)}if(!document.querySelector(".cookie-monster-modal-backdrop-cover")){var t=document.createElement("div");t.classList.add("cookie-monster-modal-backdrop-cover"),document.querySelector("body").appendChild(t)}},n.prototype.initModalElementEvents=function(){var e=document.getElementById("btnCookieTryAgain");e&&e.addEventListener("click",function(){window.location.reload()})},n.prototype.getBoundedRectForElement=function(e){var t=e.getBoundingClientRect();return!!(t&&t.width&&t.height)&&t},n.prototype.positionModal=function(){var e=document.querySelector("#"+this.modalElementId+" .modal-dialog");if(e){var t=this.getBoundedRectForElement(e);t&&(e.style.position="absolute",e.style.left=(window.innerWidth-t.width)/2+"px",e.style.top=(window.innerHeight-t.height)/3+"px")}},n.prototype.initModal=function(){if(Object(r.c)("redirect"))return!1;var e=document.getElementById(this.modalElementId);if(e){this.addModalBackdrops(),this.initModalElementEvents(),e.classList.add("in"),document.querySelector("body").classList.add("modal-open"),e.style.display="block",this.positionModal();var t=this;window.addEventListener("resize",function(){this.clearTimeout(t.resizeTimer),setTimeout(function(){t.positionModal()},50)})}},n.prototype.checkSuccessTargetRedirect=function(){var e=document.getElementById("cookieCheckTargetUrl");return!(!e||!e.value||(window.location.replace(e.value),0))},n.prototype.onSuccessCheck=function(){if(this.deleteTestCookie(),!this.checkSuccessTargetRedirect()){this.restoreVis(),this.clearModal();var e=document.querySelector(".default-content");e&&e.classList.remove("tnth-hide")}},n.prototype.onFailCheck=function(){var e=document.querySelector("body");e&&e.classList.add("browser-cookie-disabled"),this.initModal();var t=this;setTimeout(function(){t.restoreVis()},150)},n.prototype.initCheckAndPostProcesses=function(){return!document.getElementById("manualCheckCookieSetting")&&(this.isCookieEnabled()?(this.onSuccessCheck(),!0):void this.onFailCheck())},window.onload=function(){(new n).initCheckAndPostProcesses()}}});
//# sourceMappingURL=../../maps/CookieMonster.bundle.js.map