!function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=14)}({1:function(e,t,n){"use strict";n.d(t,"b",function(){return i}),n.d(t,"c",function(){return a});var o,r=((o=function(){this.requestAttempts=0}).prototype.hasValue=function(e){return"null"!==String(e)&&""!==String(e)&&"undefined"!==String(e)},o.prototype.showMain=function(){$("#mainHolder").css({visibility:"visible","-ms-filter":"progid:DXImageTransform.Microsoft.Alpha(Opacity=100)",filter:"alpha(opacity=100)","-moz-opacity":1,"-khtml-opacity":1,opacity:1})},o.prototype.hideLoader=function(e,t){e?$("#loadingIndicator").hide():setTimeout(function(){$("#loadingIndicator").fadeOut()},t||200)},o.prototype.loader=function(e){if(document.getElementById("fullSizeContainer"))return this.hideLoader(),this.showMain(),!1;if(e)$("#loadingIndicator").show();else if(!this.isDelayLoading()){var t=this;setTimeout(function(){t.showMain()},100),this.hideLoader(!0,350)}},o.prototype.isDelayLoading=function(){return"undefined"!=typeof DELAY_LOADING&&DELAY_LOADING},o.prototype.isTouchDevice=function(){return!0===("ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch)},o.prototype.getIEVersion=function(){var e=navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);return!!e&&parseInt(e[1])},o.prototype.newHttpRequest=function(e,t,n){this.requestAttempts++;var o,r=this;for(var i in n=n||function(){},window.XDomainRequest?(o=new XDomainRequest).onload=function(){n(o.responseText)}:o=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP"),o.onreadystatechange=function(){if(4===o.readyState){if(200===o.status)return n(o.responseText),void(r.requestAttempts=0);r.requestAttempts<3?setTimeout(function(){r.newHttpRequest(e,t,n)},3e3):(n({error:o.responseText}),r.loader(),r.requestAttempts=0)}},t=t||{},o.open("GET",e,!0),t)t.hasOwnProperty(i)&&o.setRequestHeader(i,t[i]);t.cache||(o.setRequestHeader("cache-control","no-cache"),o.setRequestHeader("expires","-1"),o.setRequestHeader("pragma","no-cache")),o.send()},o.prototype.ajaxRequest=function(e,t,n){if(n=n||function(){},!e)return n({error:i18next.t("Url is required.")}),!1;var o={url:e,type:"GET",contentType:"text/plain",timeout:5e3,cache:!1};t=t||o,t=$.extend({},o,t),this.requestAttempts++;var r=this;$.ajax(t).done(function(e){n(e),r.requestAttempts=0}).fail(function(){r.requestAttempts<=3?setTimeout(function(){r.ajaxRequest(e,t,n)},3e3):(n({error:i18next.t("Error occurred processing request")}),r.requestAttempts=0,r.loader())}).always(function(){r.loader()})},o.prototype.initWorker=function(e,t,n){var o=new Worker("/static/js/ajaxWorker.js"),r=this;o.postMessage({url:e,params:t}),o.addEventListener("message",function(e){n.call(r,e.data),o.terminate()},!1),o.addEventListener("error",function(e){console.log("Worker runtime error: Line ",e.lineno," in ",e.filename,": ",e.message),o.terminate()},!1)},o.prototype.workerAllowed=function(){return window.Worker&&!this.isTouchDevice()},o.prototype.getRequestMethod=function(){return this.getIEVersion()?this.newHttpRequest:this.ajaxRequest},o.prototype.sendRequest=function(e,t,n){if((t=t||{}).useWorker&&this.workerAllowed())return this.initWorker(e,t,n),!0;this.getRequestMethod().call(this,e,t,function(e){n.call(this,e)})},o.prototype.LRKeyEvent=function(){$(".button--LR").length>0&&$("html").on("keydown",function(e){parseInt(e.keyCode)===parseInt(187)&&$(".button--LR").toggleClass("data-show")})},o.prototype.getLoaderHTML=function(e){return'<div class="loading-message-indicator"><i class="fa fa-spinner fa-spin fa-2x"></i>'.concat(e?"&nbsp;"+e:"","</div>")},o.prototype.convertToNumericField=function(e){e&&this.isTouchDevice()&&e.each(function(){$(this).prop("type","tel")})},o.prototype.isString=function(e){return"[object String]"===Object.prototype.toString.call(e)},o.prototype.disableHeaderFooterLinks=function(){var e=$("#tnthNavWrapper a, #homeFooter a").not("a[href*='logout']").not("a.required-link").not("a.home-link");e.addClass("disabled"),e.prop("onclick",null).off("click"),e.on("click",function(e){return e.preventDefault(),!1})},o.prototype.pad=function(e){return e=parseInt(e),!isNaN(e)&&e<10?"0"+e:e},o.prototype.escapeHtml=function(e){return null===e||"undefined"!==e||0===String(e).length?e:e.replace(/[\"&'\/<>]/g,function(e){return{'"':"&quot;","&":"&amp;","'":"&#39;","/":"&#47;","<":"&lt;",">":"&gt;"}[e]})},o.prototype.containHtmlTags=function(e){return!!e&&/[<>]/.test(e)},o.prototype.getExportFileName=function(e){var t=new Date;return(e||"ExportList_")+("00"+t.getDate()).slice(-2)+("00"+(t.getMonth()+1)).slice(-2)+t.getFullYear()},o.prototype.capitalize=function(e){return e.replace(/\w\S*/g,function(e){return e.charAt(0).toUpperCase()+e.substr(1).toLowerCase()})},o.prototype.restoreVis=function(){var e=document.getElementById("loadingIndicator"),t=document.getElementById("mainHolder");e&&e.setAttribute("style","display:none; visibility:hidden;"),t&&t.setAttribute("style","visibility:visible;-ms-filter:'progid:DXImageTransform.Microsoft.Alpha(Opacity=100)';filter:alpha(opacity=100); -moz-opacity:1; -khtml-opacity:1; opacity:1")},o.prototype.VueErrorHandling=function(){if("undefined"==typeof Vue)return!1;var e=this;Vue.config.errorHandler=function(t,n,o){var r,i=n;if(n.$options.errorHandler)r=n.$options.errorHandler;else for(;!r&&i.$parent;)r=(i=i.$parent).$options.errorHandler;e.restoreVis(),r?r.call(i,t,n,o):console.log(t)}},o.prototype.extend=function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e},o.prototype.getUrlParameter=function(e){e=e.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var t=new RegExp("[\\?&]"+e+"=([^&#]*)").exec(location.search);return null===t?"":decodeURIComponent(t[1])},o.prototype.resetBrowserBackHistory=function(e,t,n){var o="undefined"!=typeof history&&history.pushState;e=e||location.href,o&&history.pushState(t,n,e),window.addEventListener("popstate",function(){o?history.pushState(t,n,e):window.history.forward(1)})},o.prototype.handlePostLogout=function(){if("undefined"==typeof sessionStorage)return!1;sessionStorage.getItem("logout")&&(this.resetBrowserBackHistory(location.orgin,"logout"),sessionStorage.removeItem("logout"))},o.prototype.displaySystemOutageMessage=function(e){if(e=(e=e||"en-us").replace("_","-"),document.getElementById("systemMaintenanceContainer")){var t=this;this.ajaxRequest("api/settings",{contentType:"application/json; charset=utf-8"},function(n){if(!n||!n.MAINTENANCE_MESSAGE&&!n.MAINTENANCE_WINDOW)return!1;var o=document.querySelector(".message-container");if(o||((o=document.createElement("div")).classList.add("message-container"),document.getElementById("systemMaintenanceContainer").appendChild(o)),n.MAINTENANCE_MESSAGE)o.innerHTML=t.escapeHtml(n.MAINTENANCE_MESSAGE);else if(n.MAINTENANCE_WINDOW&&n.MAINTENANCE_WINDOW.length){var r,i,a=new Date(n.MAINTENANCE_WINDOW[0]),s=new Date(n.MAINTENANCE_WINDOW[1]),u=(r=new Date,i=a,r&&i?Math.floor((i.getTime()-r.getTime())/36e5%24):0);if(u<0||isNaN(u))document.getElementById("systemMaintenanceContainer").classList.add("tnth-hide");else try{var c={year:"numeric",month:"long",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hour12:!0,timeZoneName:"short"},l=a.toLocaleString(e,c).replace(/[,]/g," "),p=s.toLocaleString(e,c).replace(/[,]/g," "),d=["<div>"+i18next.t("Hi there.")+"</div>","<div>"+i18next.t("TrueNTH will be down for website maintenance starting <b>{startdate}</b>. This should last until <b>{enddate}</b>.".replace("{startdate}",l).replace("{enddate}",p))+"</div>","<div>"+i18next.t("Thanks for your patience while we upgrade our site.")+"</div>"].join("");o.innerHTML=t.escapeHtml(d)}catch(e){console.log("Error occurred converting system outage date/time ",e),document.getElementById("systemMaintenanceContainer").classList.add("tnth-hide")}}})}},new o);t.a=r;var i=r.getExportFileName,a=r.getUrlParameter},14:function(e,t,n){"use strict";n.r(t);var o=n(1);$(document).ready(function(){$("body").attr("class","page-home"),o.a.handlePostLogout(),"true"===$("#initLoginModal").val()&&$("#modal-login-register").modal("show"),"undefined"!=typeof sessionStorage&&sessionStorage.clear(),/applewebkit/i.test(String(navigator.userAgent))&&/ipad/i.test(String(navigator.userAgent))&&window.kp_Browser_clearCookies()})}});
//# sourceMappingURL=../../maps/gilIndex.bundle.js.map