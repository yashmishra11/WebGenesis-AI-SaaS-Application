import * as React$1 from "react";
import * as React from "react";
import { TRPCUntypedClient, getUntypedClient } from "@trpc/client";
import { callTRPCProcedure, createTRPCRecursiveProxy } from "@trpc/server";
import { hashKey, infiniteQueryOptions, queryOptions, skipToken } from "@tanstack/react-query";
import { isAsyncIterable, isFunction, isObject } from "@trpc/server/unstable-core-do-not-import";
import { jsx } from "react/jsx-runtime";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/typeof.js
var require_typeof = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/typeof.js"(exports, module) {
	function _typeof$2(o) {
		"@babel/helpers - typeof";
		return module.exports = _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
			return typeof o$1;
		} : function(o$1) {
			return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
		}, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof$2(o);
	}
	module.exports = _typeof$2, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/toPrimitive.js
var require_toPrimitive = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/toPrimitive.js"(exports, module) {
	var _typeof$1 = require_typeof()["default"];
	function toPrimitive$1(t, r) {
		if ("object" != _typeof$1(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof$1(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	module.exports = toPrimitive$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/toPropertyKey.js
var require_toPropertyKey = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/toPropertyKey.js"(exports, module) {
	var _typeof = require_typeof()["default"];
	var toPrimitive = require_toPrimitive();
	function toPropertyKey$1(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	module.exports = toPropertyKey$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/defineProperty.js
var require_defineProperty = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/defineProperty.js"(exports, module) {
	var toPropertyKey = require_toPropertyKey();
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectSpread2.js
var require_objectSpread2 = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectSpread2.js"(exports, module) {
	var defineProperty = require_defineProperty();
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r$1) {
				return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread2(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r$1) {
				defineProperty(e, r$1, t[r$1]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r$1) {
				Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
			});
		}
		return e;
	}
	module.exports = _objectSpread2, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/asyncIterator.js
var require_asyncIterator = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/asyncIterator.js"(exports, module) {
	function _asyncIterator$1(r) {
		var n, t, o, e = 2;
		for ("undefined" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--;) {
			if (t && null != (n = r[t])) return n.call(r);
			if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r));
			t = "@@asyncIterator", o = "@@iterator";
		}
		throw new TypeError("Object is not async iterable");
	}
	function AsyncFromSyncIterator(r) {
		function AsyncFromSyncIteratorContinuation(r$1) {
			if (Object(r$1) !== r$1) return Promise.reject(new TypeError(r$1 + " is not an object."));
			var n = r$1.done;
			return Promise.resolve(r$1.value).then(function(r$2) {
				return {
					value: r$2,
					done: n
				};
			});
		}
		return AsyncFromSyncIterator = function AsyncFromSyncIterator$1(r$1) {
			this.s = r$1, this.n = r$1.next;
		}, AsyncFromSyncIterator.prototype = {
			s: null,
			n: null,
			next: function next() {
				return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
			},
			"return": function _return(r$1) {
				var n = this.s["return"];
				return void 0 === n ? Promise.resolve({
					value: r$1,
					done: !0
				}) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
			},
			"throw": function _throw(r$1) {
				var n = this.s["return"];
				return void 0 === n ? Promise.reject(r$1) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments));
			}
		}, new AsyncFromSyncIterator(r);
	}
	module.exports = _asyncIterator$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectWithoutPropertiesLoose.js
var require_objectWithoutPropertiesLoose = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectWithoutPropertiesLoose.js"(exports, module) {
	function _objectWithoutPropertiesLoose(r, e) {
		if (null == r) return {};
		var t = {};
		for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
			if (e.includes(n)) continue;
			t[n] = r[n];
		}
		return t;
	}
	module.exports = _objectWithoutPropertiesLoose, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectWithoutProperties.js
var require_objectWithoutProperties = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/objectWithoutProperties.js"(exports, module) {
	var objectWithoutPropertiesLoose = require_objectWithoutPropertiesLoose();
	function _objectWithoutProperties$1(e, t) {
		if (null == e) return {};
		var o, r, i = objectWithoutPropertiesLoose(e, t);
		if (Object.getOwnPropertySymbols) {
			var s = Object.getOwnPropertySymbols(e);
			for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
		}
		return i;
	}
	module.exports = _objectWithoutProperties$1, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region src/internals/utils.ts
var import_objectSpread2$5 = __toESM(require_objectSpread2(), 1);
var import_asyncIterator = __toESM(require_asyncIterator(), 1);
var import_objectWithoutProperties = __toESM(require_objectWithoutProperties(), 1);
const _excluded = ["cursor", "direction"];
/**
* @internal
*/
function createTRPCOptionsResult(value) {
	const path = value.path.join(".");
	return { path };
}
/**
* @internal
*/
function getClientArgs(queryKey, opts, infiniteParams) {
	var _queryKey$;
	const path = queryKey[0];
	let input = (_queryKey$ = queryKey[1]) === null || _queryKey$ === void 0 ? void 0 : _queryKey$.input;
	if (infiniteParams) {
		var _input;
		input = (0, import_objectSpread2$5.default)((0, import_objectSpread2$5.default)((0, import_objectSpread2$5.default)({}, (_input = input) !== null && _input !== void 0 ? _input : {}), infiniteParams.pageParam !== void 0 ? { cursor: infiniteParams.pageParam } : {}), {}, { direction: infiniteParams.direction });
	}
	return [
		path.join("."),
		input,
		opts === null || opts === void 0 ? void 0 : opts.trpc
	];
}
/**
* @internal
*/
async function buildQueryFromAsyncIterable(asyncIterable, queryClient, queryKey) {
	const queryCache = queryClient.getQueryCache();
	const query = queryCache.build(queryClient, { queryKey });
	query.setState({
		data: [],
		status: "success"
	});
	const aggregate = [];
	var _iteratorAbruptCompletion = false;
	var _didIteratorError = false;
	var _iteratorError;
	try {
		for (var _iterator = (0, import_asyncIterator.default)(asyncIterable), _step; _iteratorAbruptCompletion = !(_step = await _iterator.next()).done; _iteratorAbruptCompletion = false) {
			const value = _step.value;
			{
				aggregate.push(value);
				query.setState({ data: [...aggregate] });
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (_iteratorAbruptCompletion && _iterator.return != null) await _iterator.return();
		} finally {
			if (_didIteratorError) throw _iteratorError;
		}
	}
	return aggregate;
}
/**
* To allow easy interactions with groups of related queries, such as
* invalidating all queries of a router, we use an array as the path when
* storing in tanstack query.
*
* @internal
*/
function getQueryKeyInternal(path, input, type) {
	const splitPath = path.flatMap((part) => part.split("."));
	if (!input && (!type || type === "any")) return splitPath.length ? [splitPath] : [];
	if (type === "infinite" && isObject(input) && ("direction" in input || "cursor" in input)) {
		const { cursor: _, direction: __ } = input, inputWithoutCursorAndDirection = (0, import_objectWithoutProperties.default)(input, _excluded);
		return [splitPath, {
			input: inputWithoutCursorAndDirection,
			type: "infinite"
		}];
	}
	return [splitPath, (0, import_objectSpread2$5.default)((0, import_objectSpread2$5.default)({}, typeof input !== "undefined" && input !== skipToken && { input }), type && type !== "any" && { type })];
}
/**
* @internal
*/
function getMutationKeyInternal(path) {
	const splitPath = path.flatMap((part) => part.split("."));
	return splitPath.length ? [splitPath] : [];
}
/**
* @internal
*/
function unwrapLazyArg(valueOrLazy) {
	return isFunction(valueOrLazy) ? valueOrLazy() : valueOrLazy;
}

//#endregion
//#region src/internals/infiniteQueryOptions.ts
var import_objectSpread2$4 = __toESM(require_objectSpread2());
function trpcInfiniteQueryOptions(args) {
	var _opts$initialCursor;
	const { input, query, path, queryKey, opts } = args;
	const inputIsSkipToken = input === skipToken;
	const queryFn = async (queryFnContext) => {
		var _opts$trpc;
		const actualOpts = (0, import_objectSpread2$4.default)((0, import_objectSpread2$4.default)({}, opts), {}, { trpc: (0, import_objectSpread2$4.default)((0, import_objectSpread2$4.default)({}, opts === null || opts === void 0 ? void 0 : opts.trpc), (opts === null || opts === void 0 || (_opts$trpc = opts.trpc) === null || _opts$trpc === void 0 ? void 0 : _opts$trpc.abortOnUnmount) ? { signal: queryFnContext.signal } : { signal: null }) });
		const result = await query(...getClientArgs(queryKey, actualOpts, {
			direction: queryFnContext.direction,
			pageParam: queryFnContext.pageParam
		}));
		return result;
	};
	return Object.assign(infiniteQueryOptions((0, import_objectSpread2$4.default)((0, import_objectSpread2$4.default)({}, opts), {}, {
		queryKey,
		queryFn: inputIsSkipToken ? skipToken : queryFn,
		initialPageParam: (_opts$initialCursor = opts === null || opts === void 0 ? void 0 : opts.initialCursor) !== null && _opts$initialCursor !== void 0 ? _opts$initialCursor : input === null || input === void 0 ? void 0 : input.cursor
	})), { trpc: createTRPCOptionsResult({ path }) });
}

//#endregion
//#region src/internals/mutationOptions.ts
var import_objectSpread2$3 = __toESM(require_objectSpread2());
/**
* @internal
*/
function trpcMutationOptions(args) {
	var _overrides$onSuccess;
	const { mutate, path, opts, overrides } = args;
	const queryClient = unwrapLazyArg(args.queryClient);
	const mutationKey = getMutationKeyInternal(path);
	const defaultOpts = queryClient.defaultMutationOptions(queryClient.getMutationDefaults(mutationKey));
	const mutationSuccessOverride = (_overrides$onSuccess = overrides === null || overrides === void 0 ? void 0 : overrides.onSuccess) !== null && _overrides$onSuccess !== void 0 ? _overrides$onSuccess : (options) => options.originalFn();
	const mutationFn = async (input) => {
		const result = await mutate(...getClientArgs([path, { input }], opts));
		return result;
	};
	return (0, import_objectSpread2$3.default)((0, import_objectSpread2$3.default)({}, opts), {}, {
		mutationKey,
		mutationFn,
		onSuccess(...args$1) {
			var _ref, _opts$meta;
			const originalFn = () => {
				var _opts$onSuccess, _opts$onSuccess2, _defaultOpts$onSucces;
				return (_opts$onSuccess = opts === null || opts === void 0 || (_opts$onSuccess2 = opts.onSuccess) === null || _opts$onSuccess2 === void 0 ? void 0 : _opts$onSuccess2.call(opts, ...args$1)) !== null && _opts$onSuccess !== void 0 ? _opts$onSuccess : defaultOpts === null || defaultOpts === void 0 || (_defaultOpts$onSucces = defaultOpts.onSuccess) === null || _defaultOpts$onSucces === void 0 ? void 0 : _defaultOpts$onSucces.call(defaultOpts, ...args$1);
			};
			return mutationSuccessOverride({
				originalFn,
				queryClient,
				meta: (_ref = (_opts$meta = opts === null || opts === void 0 ? void 0 : opts.meta) !== null && _opts$meta !== void 0 ? _opts$meta : defaultOpts === null || defaultOpts === void 0 ? void 0 : defaultOpts.meta) !== null && _ref !== void 0 ? _ref : {}
			});
		},
		trpc: createTRPCOptionsResult({ path })
	});
}

//#endregion
//#region src/internals/queryOptions.ts
var import_objectSpread2$2 = __toESM(require_objectSpread2());
/**
* @internal
*/
function trpcQueryOptions(args) {
	const { input, query, path, queryKey, opts } = args;
	const queryClient = unwrapLazyArg(args.queryClient);
	const inputIsSkipToken = input === skipToken;
	const queryFn = async (queryFnContext) => {
		var _opts$trpc;
		const actualOpts = (0, import_objectSpread2$2.default)((0, import_objectSpread2$2.default)({}, opts), {}, { trpc: (0, import_objectSpread2$2.default)((0, import_objectSpread2$2.default)({}, opts === null || opts === void 0 ? void 0 : opts.trpc), (opts === null || opts === void 0 || (_opts$trpc = opts.trpc) === null || _opts$trpc === void 0 ? void 0 : _opts$trpc.abortOnUnmount) ? { signal: queryFnContext.signal } : { signal: null }) });
		const queryKey$1 = queryFnContext.queryKey;
		const result = await query(...getClientArgs(queryKey$1, actualOpts));
		if (isAsyncIterable(result)) return buildQueryFromAsyncIterable(result, queryClient, queryKey$1);
		return result;
	};
	return Object.assign(queryOptions((0, import_objectSpread2$2.default)((0, import_objectSpread2$2.default)({}, opts), {}, {
		queryKey,
		queryFn: inputIsSkipToken ? skipToken : queryFn
	})), { trpc: createTRPCOptionsResult({ path }) });
}

//#endregion
//#region src/internals/subscriptionOptions.ts
var import_objectSpread2$1 = __toESM(require_objectSpread2(), 1);
/**
* @internal
*/
const trpcSubscriptionOptions = (args) => {
	var _queryKey$;
	const { subscribe, path, queryKey, opts = {} } = args;
	const input = (_queryKey$ = queryKey[1]) === null || _queryKey$ === void 0 ? void 0 : _queryKey$.input;
	const enabled = "enabled" in opts ? !!opts.enabled : input !== skipToken;
	const _subscribe = (innerOpts) => {
		return subscribe(path.join("."), input !== null && input !== void 0 ? input : void 0, innerOpts);
	};
	return (0, import_objectSpread2$1.default)((0, import_objectSpread2$1.default)({}, opts), {}, {
		enabled,
		subscribe: _subscribe,
		queryKey,
		trpc: createTRPCOptionsResult({ path })
	});
};
function useSubscription(opts) {
	const optsRef = React$1.useRef(opts);
	optsRef.current = opts;
	const trackedProps = React$1.useRef(new Set([]));
	const addTrackedProp = React$1.useCallback((key) => {
		trackedProps.current.add(key);
	}, []);
	const currentSubscriptionRef = React$1.useRef(() => {});
	const reset = React$1.useCallback(() => {
		var _currentSubscriptionR;
		(_currentSubscriptionR = currentSubscriptionRef.current) === null || _currentSubscriptionR === void 0 || _currentSubscriptionR.call(currentSubscriptionRef);
		updateState(getInitialState);
		if (!opts.enabled) return;
		const subscription = opts.subscribe({
			onStarted: () => {
				var _optsRef$current$onSt, _optsRef$current;
				(_optsRef$current$onSt = (_optsRef$current = optsRef.current).onStarted) === null || _optsRef$current$onSt === void 0 || _optsRef$current$onSt.call(_optsRef$current);
				updateState((prev) => (0, import_objectSpread2$1.default)((0, import_objectSpread2$1.default)({}, prev), {}, {
					status: "pending",
					error: null
				}));
			},
			onData: (data) => {
				var _optsRef$current$onDa, _optsRef$current2;
				(_optsRef$current$onDa = (_optsRef$current2 = optsRef.current).onData) === null || _optsRef$current$onDa === void 0 || _optsRef$current$onDa.call(_optsRef$current2, data);
				updateState((prev) => (0, import_objectSpread2$1.default)((0, import_objectSpread2$1.default)({}, prev), {}, {
					status: "pending",
					data,
					error: null
				}));
			},
			onError: (error) => {
				var _optsRef$current$onEr, _optsRef$current3;
				(_optsRef$current$onEr = (_optsRef$current3 = optsRef.current).onError) === null || _optsRef$current$onEr === void 0 || _optsRef$current$onEr.call(_optsRef$current3, error);
				updateState((prev) => (0, import_objectSpread2$1.default)((0, import_objectSpread2$1.default)({}, prev), {}, {
					status: "error",
					error
				}));
			},
			onConnectionStateChange: (result) => {
				var _optsRef$current$onCo, _optsRef$current4;
				(_optsRef$current$onCo = (_optsRef$current4 = optsRef.current).onConnectionStateChange) === null || _optsRef$current$onCo === void 0 || _optsRef$current$onCo.call(_optsRef$current4, result);
				updateState((prev) => {
					switch (result.state) {
						case "connecting": return (0, import_objectSpread2$1.default)((0, import_objectSpread2$1.default)({}, prev), {}, {
							status: "connecting",
							error: result.error
						});
						case "pending": return prev;
						case "idle": return (0, import_objectSpread2$1.default)((0, import_objectSpread2$1.default)({}, prev), {}, {
							status: "idle",
							data: void 0,
							error: null
						});
					}
				});
			}
		});
		currentSubscriptionRef.current = () => {
			subscription.unsubscribe();
		};
	}, [hashKey(opts.queryKey), opts.enabled]);
	const getInitialState = React$1.useCallback(() => {
		return opts.enabled ? {
			data: void 0,
			error: null,
			status: "connecting",
			reset
		} : {
			data: void 0,
			error: null,
			status: "idle",
			reset
		};
	}, [opts.enabled, reset]);
	const resultRef = React$1.useRef(getInitialState());
	const [state, setState] = React$1.useState(trackResult(resultRef.current, addTrackedProp));
	state.reset = reset;
	const updateState = React$1.useCallback((callback) => {
		const prev = resultRef.current;
		const next = resultRef.current = callback(prev);
		let shouldUpdate = false;
		for (const key of trackedProps.current) if (prev[key] !== next[key]) {
			shouldUpdate = true;
			break;
		}
		if (shouldUpdate) setState(trackResult(next, addTrackedProp));
	}, [addTrackedProp]);
	React$1.useEffect(() => {
		if (!opts.enabled) return;
		reset();
		return () => {
			var _currentSubscriptionR2;
			(_currentSubscriptionR2 = currentSubscriptionRef.current) === null || _currentSubscriptionR2 === void 0 || _currentSubscriptionR2.call(currentSubscriptionRef);
		};
	}, [reset, opts.enabled]);
	return state;
}
function trackResult(result, onTrackResult) {
	const trackedResult = new Proxy(result, { get(target, prop) {
		onTrackResult(prop);
		return target[prop];
	} });
	return trackedResult;
}

//#endregion
//#region src/internals/createOptionsProxy.ts
var import_objectSpread2 = __toESM(require_objectSpread2(), 1);
/**
* Create a typed proxy from your router types. Can also be used on the server.
*
* @see https://trpc.io/docs/client/tanstack-react-query/setup#3b-setup-without-react-context
* @see https://trpc.io/docs/client/tanstack-react-query/server-components#5-create-a-trpc-caller-for-server-components
*/
function createTRPCOptionsProxy(opts) {
	const callIt = (type) => {
		return (path, input, trpcOpts) => {
			if ("router" in opts) return Promise.resolve(unwrapLazyArg(opts.ctx)).then((ctx) => callTRPCProcedure({
				router: opts.router,
				path,
				getRawInput: async () => input,
				ctx,
				type,
				signal: void 0
			}));
			const untypedClient = opts.client instanceof TRPCUntypedClient ? opts.client : getUntypedClient(opts.client);
			return untypedClient[type](path, input, trpcOpts);
		};
	};
	return createTRPCRecursiveProxy(({ args, path: _path }) => {
		const path = [..._path];
		const utilName = path.pop();
		const [arg1, arg2] = args;
		const contextMap = {
			"~types": void 0,
			pathKey: () => {
				return getQueryKeyInternal(path);
			},
			pathFilter: () => {
				return (0, import_objectSpread2.default)((0, import_objectSpread2.default)({}, arg1), {}, { queryKey: getQueryKeyInternal(path) });
			},
			queryOptions: () => {
				return trpcQueryOptions({
					input: arg1,
					opts: arg2,
					path,
					queryClient: opts.queryClient,
					queryKey: getQueryKeyInternal(path, arg1, "query"),
					query: callIt("query")
				});
			},
			queryKey: () => {
				return getQueryKeyInternal(path, arg1, "query");
			},
			queryFilter: () => {
				return (0, import_objectSpread2.default)((0, import_objectSpread2.default)({}, arg2), {}, { queryKey: getQueryKeyInternal(path, arg1, "query") });
			},
			infiniteQueryOptions: () => {
				return trpcInfiniteQueryOptions({
					input: arg1,
					opts: arg2,
					path,
					queryClient: opts.queryClient,
					queryKey: getQueryKeyInternal(path, arg1, "infinite"),
					query: callIt("query")
				});
			},
			infiniteQueryKey: () => {
				return getQueryKeyInternal(path, arg1, "infinite");
			},
			infiniteQueryFilter: () => {
				return (0, import_objectSpread2.default)((0, import_objectSpread2.default)({}, arg2), {}, { queryKey: getQueryKeyInternal(path, arg1, "infinite") });
			},
			mutationOptions: () => {
				var _opts$overrides;
				return trpcMutationOptions({
					opts: arg1,
					path,
					queryClient: opts.queryClient,
					mutate: callIt("mutation"),
					overrides: (_opts$overrides = opts.overrides) === null || _opts$overrides === void 0 ? void 0 : _opts$overrides.mutations
				});
			},
			mutationKey: () => {
				return getMutationKeyInternal(path);
			},
			subscriptionOptions: () => {
				return trpcSubscriptionOptions({
					opts: arg2,
					path,
					queryKey: getQueryKeyInternal(path, arg1, "any"),
					subscribe: callIt("subscription")
				});
			}
		};
		return contextMap[utilName]();
	});
}

//#endregion
//#region src/internals/Context.tsx
/**
* Create a set of type-safe provider-consumers
*
* @see https://trpc.io/docs/client/tanstack-react-query/setup#3a-setup-the-trpc-context-provider
*/
function createTRPCContext() {
	const TRPCClientContext = React.createContext(null);
	const TRPCContext = React.createContext(null);
	function TRPCProvider(props) {
		const value = React.useMemo(() => createTRPCOptionsProxy({
			client: props.trpcClient,
			queryClient: props.queryClient
		}), [props.trpcClient, props.queryClient]);
		return /* @__PURE__ */ jsx(TRPCClientContext.Provider, {
			value: props.trpcClient,
			children: /* @__PURE__ */ jsx(TRPCContext.Provider, {
				value,
				children: props.children
			})
		});
	}
	function useTRPC() {
		const utils = React.useContext(TRPCContext);
		if (!utils) throw new Error("useTRPC() can only be used inside of a <TRPCProvider>");
		return utils;
	}
	function useTRPCClient() {
		const client = React.useContext(TRPCClientContext);
		if (!client) throw new Error("useTRPCClient() can only be used inside of a <TRPCProvider>");
		return client;
	}
	return {
		TRPCProvider,
		useTRPC,
		useTRPCClient
	};
}

//#endregion
export { createTRPCContext, createTRPCOptionsProxy, useSubscription };
//# sourceMappingURL=index.mjs.map