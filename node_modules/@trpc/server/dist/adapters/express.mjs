import { __toESM, require_objectSpread2 } from "../getErrorShape-Uhlrl4Bk.mjs";
import "../tracked-Bp72jHif.mjs";
import { run } from "../utils-DdbbrDku.mjs";
import "../parseTRPCMessage-ByIHyFRz.mjs";
import "../resolveResponse-Hga1xOO1.mjs";
import "../contentTypeParsers-SN4WL9ze.mjs";
import "../unstable-core-do-not-import-D89CaGtL.mjs";
import "../observable-UMO3vUa_.mjs";
import "../initTRPC-XuvQcOiC.mjs";
import { internal_exceptionHandler, nodeHTTPRequestHandler } from "../node-http-DFjTw_ge.mjs";

//#region src/adapters/express.ts
var import_objectSpread2 = __toESM(require_objectSpread2(), 1);
function createExpressMiddleware(opts) {
	return (req, res) => {
		let path = "";
		run(async () => {
			path = req.path.slice(req.path.lastIndexOf("/") + 1);
			await nodeHTTPRequestHandler((0, import_objectSpread2.default)((0, import_objectSpread2.default)({}, opts), {}, {
				req,
				res,
				path
			}));
		}).catch(internal_exceptionHandler((0, import_objectSpread2.default)({
			req,
			res,
			path
		}, opts)));
	};
}

//#endregion
export { createExpressMiddleware };
//# sourceMappingURL=express.mjs.map