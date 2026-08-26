module.exports = {

"[project]/node_modules/.pnpm/@clerk+nextjs@7.8.2_next@14.2.35_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/nextjs/dist/esm/server/keyless-node.js [app-rsc] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "keyless": ()=>keyless
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$shared$40$4$2e$30$2e$1_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$keyless$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/@clerk+shared@4.30.1_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/shared/dist/keyless/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createClerkClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/@clerk+nextjs@7.8.2_next@14.2.35_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/nextjs/dist/esm/server/createClerkClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/@clerk+nextjs@7.8.2_next@14.2.35_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/nextjs/dist/esm/server/fs/utils.js [app-rsc] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
;
;
function createFileStorage() {
    const fs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodeFsOrThrow"])();
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodePathOrThrow"])();
    const cwd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodeCwdOrThrow"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$shared$40$4$2e$30$2e$1_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$keyless$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createNodeFileStorage"])(fs, path, {
        cwd,
        frameworkPackageName: "@clerk/nextjs"
    });
}
let keylessServiceInstance = null;
function keyless() {
    if (!keylessServiceInstance) {
        const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$createClerkClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClerkClientWithOptions"])({});
        keylessServiceInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$shared$40$4$2e$30$2e$1_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$shared$2f$dist$2f$keyless$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createKeylessService"])({
            storage: createFileStorage(),
            api: {
                async createAccountlessApplication (requestHeaders, source) {
                    try {
                        return await client.__experimental_accountlessApplications.createAccountlessApplication({
                            requestHeaders,
                            source
                        });
                    } catch  {
                        return null;
                    }
                },
                async completeOnboarding (requestHeaders, source) {
                    try {
                        return await client.__experimental_accountlessApplications.completeAccountlessApplicationOnboarding({
                            requestHeaders,
                            source
                        });
                    } catch  {
                        return null;
                    }
                }
            },
            framework: "nextjs"
        });
    }
    return keylessServiceInstance;
}
;
 //# sourceMappingURL=keyless-node.js.map

})()),

};

//# sourceMappingURL=c7648_%40clerk_nextjs_dist_esm_server_keyless-node_a19b4a.js.map