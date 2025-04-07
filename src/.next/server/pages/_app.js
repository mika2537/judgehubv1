/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "(pages-dir-node)/./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"(pages-dir-node)/./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _src_app_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../src/app/globals.css */ \"(pages-dir-node)/./src/app/globals.css\");\n/* harmony import */ var _src_app_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_src_app_globals_css__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! next-auth/react */ \"next-auth/react\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_4__);\n// pages/_app.js\n\n\n\n // Corrected import path\n\nfunction MyApp({ Component, pageProps }) {\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    const [isAuthenticated, setIsAuthenticated] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"MyApp.useEffect\": ()=>{\n            // Check if user is logged in (e.g., by looking for a token in localStorage)\n            const userLoggedIn = localStorage.getItem(\"auth_token\");\n            setIsAuthenticated(!!userLoggedIn);\n            // Handle route changes to properly disconnect sockets\n            const handleRouteChange = {\n                \"MyApp.useEffect.handleRouteChange\": ()=>{\n                    if (window.socket && isAuthenticated) {\n                        window.socket.disconnect();\n                    }\n                }\n            }[\"MyApp.useEffect.handleRouteChange\"];\n            router.events.on(\"routeChangeStart\", handleRouteChange);\n            return ({\n                \"MyApp.useEffect\": ()=>{\n                    router.events.off(\"routeChangeStart\", handleRouteChange);\n                }\n            })[\"MyApp.useEffect\"];\n        }\n    }[\"MyApp.useEffect\"], [\n        router.events,\n        isAuthenticated\n    ]);\n    // If not authenticated and trying to access non-login pages, redirect to login page\n    if (!isAuthenticated && router.pathname !== \"/login\") {\n        router.push(\"/login\");\n    }\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_auth_react__WEBPACK_IMPORTED_MODULE_4__.SessionProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/Users/mika/Desktop/AIrookies/competition-scoring-system/pages/_app.js\",\n            lineNumber: 37,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/mika/Desktop/AIrookies/competition-scoring-system/pages/_app.js\",\n        lineNumber: 36,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3BhZ2VzL19hcHAuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnQkFBZ0I7O0FBQzRCO0FBQ0o7QUFDUixDQUFDLHdCQUF3QjtBQUNQO0FBRWxELFNBQVNJLE1BQU0sRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQUU7SUFDckMsTUFBTUMsU0FBU0wsc0RBQVNBO0lBQ3hCLE1BQU0sQ0FBQ00saUJBQWlCQyxtQkFBbUIsR0FBR1IsK0NBQVFBLENBQUM7SUFFdkRELGdEQUFTQTsyQkFBQztZQUNSLDRFQUE0RTtZQUM1RSxNQUFNVSxlQUFlQyxhQUFhQyxPQUFPLENBQUM7WUFDMUNILG1CQUFtQixDQUFDLENBQUNDO1lBRXJCLHNEQUFzRDtZQUN0RCxNQUFNRztxREFBb0I7b0JBQ3hCLElBQUlDLE9BQU9DLE1BQU0sSUFBSVAsaUJBQWlCO3dCQUNwQ00sT0FBT0MsTUFBTSxDQUFDQyxVQUFVO29CQUMxQjtnQkFDRjs7WUFFQVQsT0FBT1UsTUFBTSxDQUFDQyxFQUFFLENBQUMsb0JBQW9CTDtZQUVyQzttQ0FBTztvQkFDTE4sT0FBT1UsTUFBTSxDQUFDRSxHQUFHLENBQUMsb0JBQW9CTjtnQkFDeEM7O1FBQ0Y7MEJBQUc7UUFBQ04sT0FBT1UsTUFBTTtRQUFFVDtLQUFnQjtJQUVuQyxvRkFBb0Y7SUFDcEYsSUFBSSxDQUFDQSxtQkFBbUJELE9BQU9hLFFBQVEsS0FBSyxVQUFVO1FBQ3BEYixPQUFPYyxJQUFJLENBQUM7SUFDZDtJQUVBLHFCQUNFLDhEQUFDbEIsNERBQWVBO2tCQUNkLDRFQUFDRTtZQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7O0FBRzlCO0FBRUEsaUVBQWVGLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9taWthL0Rlc2t0b3AvQUlyb29raWVzL2NvbXBldGl0aW9uLXNjb3Jpbmctc3lzdGVtL3BhZ2VzL19hcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gcGFnZXMvX2FwcC5qc1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgdXNlUm91dGVyIH0gZnJvbSBcIm5leHQvcm91dGVyXCI7XG5pbXBvcnQgXCIuLi9zcmMvYXBwL2dsb2JhbHMuY3NzXCI7IC8vIENvcnJlY3RlZCBpbXBvcnQgcGF0aFxuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyIH0gZnJvbSBcIm5leHQtYXV0aC9yZWFjdFwiO1xuXG5mdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH0pIHtcbiAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7XG4gIGNvbnN0IFtpc0F1dGhlbnRpY2F0ZWQsIHNldElzQXV0aGVudGljYXRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyBDaGVjayBpZiB1c2VyIGlzIGxvZ2dlZCBpbiAoZS5nLiwgYnkgbG9va2luZyBmb3IgYSB0b2tlbiBpbiBsb2NhbFN0b3JhZ2UpXG4gICAgY29uc3QgdXNlckxvZ2dlZEluID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJhdXRoX3Rva2VuXCIpO1xuICAgIHNldElzQXV0aGVudGljYXRlZCghIXVzZXJMb2dnZWRJbik7XG5cbiAgICAvLyBIYW5kbGUgcm91dGUgY2hhbmdlcyB0byBwcm9wZXJseSBkaXNjb25uZWN0IHNvY2tldHNcbiAgICBjb25zdCBoYW5kbGVSb3V0ZUNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGlmICh3aW5kb3cuc29ja2V0ICYmIGlzQXV0aGVudGljYXRlZCkge1xuICAgICAgICB3aW5kb3cuc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcm91dGVyLmV2ZW50cy5vbihcInJvdXRlQ2hhbmdlU3RhcnRcIiwgaGFuZGxlUm91dGVDaGFuZ2UpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHJvdXRlci5ldmVudHMub2ZmKFwicm91dGVDaGFuZ2VTdGFydFwiLCBoYW5kbGVSb3V0ZUNoYW5nZSk7XG4gICAgfTtcbiAgfSwgW3JvdXRlci5ldmVudHMsIGlzQXV0aGVudGljYXRlZF0pO1xuXG4gIC8vIElmIG5vdCBhdXRoZW50aWNhdGVkIGFuZCB0cnlpbmcgdG8gYWNjZXNzIG5vbi1sb2dpbiBwYWdlcywgcmVkaXJlY3QgdG8gbG9naW4gcGFnZVxuICBpZiAoIWlzQXV0aGVudGljYXRlZCAmJiByb3V0ZXIucGF0aG5hbWUgIT09IFwiL2xvZ2luXCIpIHtcbiAgICByb3V0ZXIucHVzaChcIi9sb2dpblwiKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFNlc3Npb25Qcm92aWRlcj5cbiAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICA8L1Nlc3Npb25Qcm92aWRlcj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlBcHA7XG4iXSwibmFtZXMiOlsidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJ1c2VSb3V0ZXIiLCJTZXNzaW9uUHJvdmlkZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsInJvdXRlciIsImlzQXV0aGVudGljYXRlZCIsInNldElzQXV0aGVudGljYXRlZCIsInVzZXJMb2dnZWRJbiIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJoYW5kbGVSb3V0ZUNoYW5nZSIsIndpbmRvdyIsInNvY2tldCIsImRpc2Nvbm5lY3QiLCJldmVudHMiLCJvbiIsIm9mZiIsInBhdGhuYW1lIiwicHVzaCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./pages/_app.js\n");

/***/ }),

/***/ "(pages-dir-node)/./src/app/globals.css":
/*!*****************************!*\
  !*** ./src/app/globals.css ***!
  \*****************************/
/***/ (() => {



/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "next-auth/react":
/*!**********************************!*\
  !*** external "next-auth/react" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("next-auth/react");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("(pages-dir-node)/./pages/_app.js")));
module.exports = __webpack_exports__;

})();