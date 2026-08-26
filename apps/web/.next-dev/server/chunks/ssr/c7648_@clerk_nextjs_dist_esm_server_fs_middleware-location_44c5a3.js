module.exports = {

"[project]/node_modules/.pnpm/@clerk+nextjs@7.8.2_next@14.2.35_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/nextjs/dist/esm/server/fs/middleware-location.js [app-rsc] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "hasSrcAppDir": ()=>hasSrcAppDir,
    "suggestMiddlewareLocation": ()=>suggestMiddlewareLocation
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$utils$2f$sdk$2d$versions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/@clerk+nextjs@7.8.2_next@14.2.35_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/nextjs/dist/esm/utils/sdk-versions.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/@clerk+nextjs@7.8.2_next@14.2.35_react-dom@18.3.1_react@18.3.1/node_modules/@clerk/nextjs/dist/esm/server/fs/utils.js [app-rsc] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
;
function hasSrcAppDir() {
    const { existsSync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodeFsOrThrow"])();
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodePathOrThrow"])();
    const cwd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodeCwdOrThrow"])();
    const projectWithAppSrc = path.join(cwd(), "src", "app");
    return !!existsSync(projectWithAppSrc);
}
function suggestMiddlewareLocation() {
    const fileExtensions = [
        "ts",
        "js"
    ];
    const fileNames = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$utils$2f$sdk$2d$versions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isNext16OrHigher"] ? [
        "middleware",
        "proxy"
    ] : [
        "middleware"
    ];
    const suggestionMessage = (fileName, extension, to, from)=>`Clerk: clerkMiddleware() was not run, your ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$utils$2f$sdk$2d$versions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["middlewareFileReference"]} file might be misplaced. Move your ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$utils$2f$sdk$2d$versions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["middlewareFileReference"]} file to ./${to}${fileName}.${extension}. Currently located at ./${from}${fileName}.${extension}`;
    const { existsSync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodeFsOrThrow"])();
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodePathOrThrow"])();
    const cwd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$clerk$2b$nextjs$40$7$2e$8$2e$2_next$40$14$2e$2$2e$35_react$2d$dom$40$18$2e$3$2e$1_react$40$18$2e$3$2e$1$2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$server$2f$fs$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nodeCwdOrThrow"])();
    const projectWithAppSrcPath = path.join(cwd(), "src", "app");
    const projectWithAppPath = path.join(cwd(), "app");
    const checkMiddlewareLocation = (basePath, to, from)=>{
        for (const fileName of fileNames){
            for (const fileExtension of fileExtensions){
                if (existsSync(path.join(basePath, `${fileName}.${fileExtension}`))) {
                    return suggestionMessage(fileName, fileExtension, to, from);
                }
            }
        }
        return void 0;
    };
    if (existsSync(projectWithAppSrcPath)) {
        return checkMiddlewareLocation(projectWithAppSrcPath, "src/", "src/app/") || checkMiddlewareLocation(cwd(), "src/", "");
    }
    if (existsSync(projectWithAppPath)) {
        return checkMiddlewareLocation(projectWithAppPath, "", "app/");
    }
    return void 0;
}
;
 //# sourceMappingURL=middleware-location.js.map

})()),

};

//# sourceMappingURL=c7648_%40clerk_nextjs_dist_esm_server_fs_middleware-location_44c5a3.js.map