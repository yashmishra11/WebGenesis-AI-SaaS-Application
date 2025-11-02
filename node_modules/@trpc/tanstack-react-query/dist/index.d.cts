import { DataTag, DefinedInitialDataInfiniteOptions, DefinedInitialDataOptions, InfiniteData, QueryClient, QueryFilters, SkipToken, UndefinedInitialDataInfiniteOptions, UndefinedInitialDataOptions, UnusedSkipTokenInfiniteOptions, UnusedSkipTokenOptions, UseMutationOptions } from "@tanstack/react-query";
import { TRPCClient, TRPCClientErrorLike, TRPCRequestOptions, TRPCUntypedClient } from "@trpc/client";
import { AnyTRPCProcedure, AnyTRPCRootTypes, AnyTRPCRouter, TRPCProcedureType, TRPCRouterRecord, inferProcedureInput, inferRouterContext, inferTransformedProcedureOutput } from "@trpc/server";
import * as React from "react";
import { DistributiveOmit, MaybePromise, coerceAsyncIterableToArray, inferAsyncIterableYield } from "@trpc/server/unstable-core-do-not-import";
import { TRPCConnectionState } from "@trpc/client/unstable-internals";
import { Unsubscribable } from "@trpc/server/observable";

//#region src/internals/types.d.ts
/**
 * Turn a set of optional properties into required
 * @internal
 */
type WithRequired<TObj, TKey extends keyof TObj> = TObj & { [P in TKey]-?: TObj[P] };
/**
 * @internal
 */
type ResolverDef = {
  input: any;
  output: any;
  transformer: boolean;
  errorShape: any;
};
/**
 * @remark `void` is here due to https://github.com/trpc/trpc/pull/4374
 */
type CursorInput = {
  cursor?: any;
};
type OptionalCursorInput = CursorInput | void;
/**
 * @internal
 */
type ExtractCursorType<TInput> = TInput extends CursorInput ? TInput['cursor'] : unknown;
/**
 * @internal
 */
type TRPCInfiniteData<TInput, TOutput> = InfiniteData<TOutput, NonNullable<ExtractCursorType<TInput>> | null>;
/**
 * @public
 */
interface TRPCReactRequestOptions extends Omit<TRPCRequestOptions, 'signal'> {
  /**
   * Opt out of SSR for this query by passing `ssr: false`
   */
  ssr?: boolean;
  /**
   * Opt out or into aborting request on unmount
   */
  abortOnUnmount?: boolean;
}
/**
 * @public
 */
interface TRPCQueryBaseOptions {
  /**
   * tRPC-related options
   */
  trpc?: TRPCReactRequestOptions;
}
/**
 * @public
 */
interface TRPCQueryOptionsResult {
  trpc: {
    path: string;
  };
}
/**
 * @public
 */
type QueryType = 'any' | 'infinite' | 'query';
/**
 * @public
 */
type TRPCQueryKey = [readonly string[], {
  input?: unknown;
  type?: Exclude<QueryType, 'any'>;
}?];
/**
 * @public
 */
type TRPCMutationKey = [readonly string[]];
//#endregion
//#region src/internals/infiniteQueryOptions.d.ts
type ReservedOptions$2 = 'queryKey' | 'queryFn' | 'queryHashFn' | 'queryHash' | 'initialPageParam';
interface UndefinedTRPCInfiniteQueryOptionsIn<TInput, TQueryFnData, TData, TError> extends DistributiveOmit<UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TRPCInfiniteData<TInput, TData>, TRPCQueryKey, NonNullable<ExtractCursorType<TInput>> | null>, ReservedOptions$2>, TRPCQueryBaseOptions {
  initialCursor?: NonNullable<ExtractCursorType<TInput>> | null;
}
interface UndefinedTRPCInfiniteQueryOptionsOut<TInput, TQueryFnData, TData, TError> extends DistributiveOmit<UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TRPCInfiniteData<TInput, TData>, TRPCQueryKey, NonNullable<ExtractCursorType<TInput>> | null>, 'initialPageParam'>, TRPCQueryOptionsResult {
  queryKey: DataTag<TRPCQueryKey, TRPCInfiniteData<TInput, TData>, TError>;
  initialPageParam: NonNullable<ExtractCursorType<TInput>> | null;
}
interface DefinedTRPCInfiniteQueryOptionsIn<TInput, TQueryFnData, TData, TError> extends DistributiveOmit<DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TRPCInfiniteData<TInput, TData>, TRPCQueryKey, NonNullable<ExtractCursorType<TInput>> | null>, ReservedOptions$2>, TRPCQueryBaseOptions {
  initialCursor?: NonNullable<ExtractCursorType<TInput>> | null;
}
interface DefinedTRPCInfiniteQueryOptionsOut<TInput, TQueryFnData, TData, TError> extends DistributiveOmit<DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TRPCInfiniteData<TInput, TData>, TRPCQueryKey, NonNullable<ExtractCursorType<TInput>> | null>, 'initialPageParam'>, TRPCQueryOptionsResult {
  queryKey: DataTag<TRPCQueryKey, TRPCInfiniteData<TInput, TData>, TError>;
  initialPageParam: NonNullable<ExtractCursorType<TInput>> | null;
}
interface UnusedSkipTokenTRPCInfiniteQueryOptionsIn<TInput, TQueryFnData, TData, TError> extends DistributiveOmit<UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TRPCInfiniteData<TInput, TData>, TRPCQueryKey, NonNullable<ExtractCursorType<TInput>> | null>, ReservedOptions$2>, TRPCQueryBaseOptions {
  initialCursor?: NonNullable<ExtractCursorType<TInput>> | null;
}
interface UnusedSkipTokenTRPCInfiniteQueryOptionsOut<TInput, TQueryFnData, TData, TError> extends DistributiveOmit<UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TRPCInfiniteData<TInput, TData>, TRPCQueryKey, NonNullable<ExtractCursorType<TInput>> | null>, 'initialPageParam'>, TRPCQueryOptionsResult {
  queryKey: DataTag<TRPCQueryKey, TRPCInfiniteData<TInput, TData>, TError>;
  initialPageParam: NonNullable<ExtractCursorType<TInput>> | null;
}
interface TRPCInfiniteQueryOptions<TDef extends ResolverDef> {
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(input: TDef['input'] | SkipToken, opts: DefinedTRPCInfiniteQueryOptionsIn<TDef['input'], TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>): DefinedTRPCInfiniteQueryOptionsOut<TDef['input'], TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(input: TDef['input'], opts: UnusedSkipTokenTRPCInfiniteQueryOptionsIn<TDef['input'], TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>): UnusedSkipTokenTRPCInfiniteQueryOptionsOut<TDef['input'], TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(input: TDef['input'] | SkipToken, opts?: UndefinedTRPCInfiniteQueryOptionsIn<TDef['input'], TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>): UndefinedTRPCInfiniteQueryOptionsOut<TDef['input'], TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
}
//#endregion
//#region src/internals/mutationOptions.d.ts
type ReservedOptions$1 = 'mutationKey' | 'mutationFn';
interface TRPCMutationOptionsIn<TInput, TError, TOutput, TContext> extends DistributiveOmit<UseMutationOptions<TOutput, TError, TInput, TContext>, ReservedOptions$1>, TRPCQueryBaseOptions {}
interface TRPCMutationOptionsOut<TInput, TError, TOutput, TContext> extends UseMutationOptions<TOutput, TError, TInput, TContext>, TRPCQueryOptionsResult {
  mutationKey: TRPCMutationKey;
}
interface TRPCMutationOptions<TDef extends ResolverDef> {
  <TContext = unknown>(opts?: TRPCMutationOptionsIn<TDef['input'], TRPCClientErrorLike<TDef>, TDef['output'], TContext>): TRPCMutationOptionsOut<TDef['input'], TRPCClientErrorLike<TDef>, TDef['output'], TContext>;
}
/**
 * @internal
 */
interface MutationOptionsOverride {
  onSuccess: (opts: {
    /**
     * Calls the original function that was defined in the query's `onSuccess` option
     */
    originalFn: () => MaybePromise<void>;
    queryClient: QueryClient;
    /**
     * Meta data passed in from the `useMutation()` hook
     */
    meta: Record<string, unknown>;
  }) => MaybePromise<void>;
}
//#endregion
//#region src/internals/queryOptions.d.ts
type ReservedOptions = 'queryKey' | 'queryFn' | 'queryHashFn' | 'queryHash';
interface UndefinedTRPCQueryOptionsIn<TQueryFnData, TData, TError> extends DistributiveOmit<UndefinedInitialDataOptions<coerceAsyncIterableToArray<TQueryFnData>, TError, coerceAsyncIterableToArray<TData>, TRPCQueryKey>, ReservedOptions>, TRPCQueryBaseOptions {}
interface UndefinedTRPCQueryOptionsOut<TQueryFnData, TOutput, TError> extends UndefinedInitialDataOptions<coerceAsyncIterableToArray<TQueryFnData>, TError, coerceAsyncIterableToArray<TOutput>, TRPCQueryKey>, TRPCQueryOptionsResult {
  queryKey: DataTag<TRPCQueryKey, coerceAsyncIterableToArray<TOutput>, TError>;
}
interface DefinedTRPCQueryOptionsIn<TQueryFnData, TData, TError> extends DistributiveOmit<DefinedInitialDataOptions<coerceAsyncIterableToArray<NoInfer<TQueryFnData>>, TError, coerceAsyncIterableToArray<TData>, TRPCQueryKey>, ReservedOptions>, TRPCQueryBaseOptions {}
interface DefinedTRPCQueryOptionsOut<TQueryFnData, TData, TError> extends DefinedInitialDataOptions<coerceAsyncIterableToArray<TQueryFnData>, TError, coerceAsyncIterableToArray<TData>, TRPCQueryKey>, TRPCQueryOptionsResult {
  queryKey: DataTag<TRPCQueryKey, coerceAsyncIterableToArray<TData>, TError>;
}
interface UnusedSkipTokenTRPCQueryOptionsIn<TQueryFnData, TData, TError> extends DistributiveOmit<UnusedSkipTokenOptions<coerceAsyncIterableToArray<TQueryFnData>, TError, coerceAsyncIterableToArray<TData>, TRPCQueryKey>, ReservedOptions>, TRPCQueryBaseOptions {}
interface UnusedSkipTokenTRPCQueryOptionsOut<TQueryFnData, TOutput, TError> extends UnusedSkipTokenOptions<coerceAsyncIterableToArray<TQueryFnData>, TError, coerceAsyncIterableToArray<TOutput>, TRPCQueryKey>, TRPCQueryOptionsResult {
  queryKey: DataTag<TRPCQueryKey, coerceAsyncIterableToArray<TOutput>, TError>;
}
interface TRPCQueryOptions<TDef extends ResolverDef> {
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(input: TDef['input'] | SkipToken, opts: DefinedTRPCQueryOptionsIn<TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>): DefinedTRPCQueryOptionsOut<TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(input: TDef['input'], opts?: UnusedSkipTokenTRPCQueryOptionsIn<TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>): UnusedSkipTokenTRPCQueryOptionsOut<TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
  <TQueryFnData extends TDef['output'], TData = TQueryFnData>(input: TDef['input'] | SkipToken, opts?: UndefinedTRPCQueryOptionsIn<TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>): UndefinedTRPCQueryOptionsOut<TQueryFnData, TData, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
}
//#endregion
//#region src/internals/subscriptionOptions.d.ts
interface BaseTRPCSubscriptionOptionsIn<TOutput, TError> {
  enabled?: boolean;
  onStarted?: () => void;
  onData?: (data: inferAsyncIterableYield<TOutput>) => void;
  onError?: (err: TError) => void;
  onConnectionStateChange?: (state: TRPCConnectionState<TError>) => void;
}
interface UnusedSkipTokenTRPCSubscriptionOptionsIn<TOutput, TError> {
  onStarted?: () => void;
  onData?: (data: inferAsyncIterableYield<TOutput>) => void;
  onError?: (err: TError) => void;
  onConnectionStateChange?: (state: TRPCConnectionState<TError>) => void;
}
interface TRPCSubscriptionOptionsOut<TOutput, TError> extends UnusedSkipTokenTRPCSubscriptionOptionsIn<TOutput, TError>, TRPCQueryOptionsResult {
  enabled: boolean;
  queryKey: TRPCQueryKey;
  subscribe: (innerOpts: UnusedSkipTokenTRPCSubscriptionOptionsIn<TOutput, TError>) => Unsubscribable;
}
interface TRPCSubscriptionOptions<TDef extends ResolverDef> {
  (input: TDef['input'], opts?: UnusedSkipTokenTRPCSubscriptionOptionsIn<inferAsyncIterableYield<TDef['output']>, TRPCClientErrorLike<TDef>>): TRPCSubscriptionOptionsOut<inferAsyncIterableYield<TDef['output']>, TRPCClientErrorLike<TDef>>;
  (input: TDef['input'] | SkipToken, opts?: BaseTRPCSubscriptionOptionsIn<inferAsyncIterableYield<TDef['output']>, TRPCClientErrorLike<TDef>>): TRPCSubscriptionOptionsOut<inferAsyncIterableYield<TDef['output']>, TRPCClientErrorLike<TDef>>;
}
type TRPCSubscriptionStatus = 'idle' | 'connecting' | 'pending' | 'error';
interface TRPCSubscriptionBaseResult<TOutput, TError> {
  status: TRPCSubscriptionStatus;
  data: undefined | TOutput;
  error: null | TError;
  /**
   * Reset the subscription
   */
  reset: () => void;
}
interface TRPCSubscriptionIdleResult<TOutput> extends TRPCSubscriptionBaseResult<TOutput, null> {
  status: 'idle';
  data: undefined;
  error: null;
}
interface TRPCSubscriptionConnectingResult<TOutput, TError> extends TRPCSubscriptionBaseResult<TOutput, TError> {
  status: 'connecting';
  data: undefined | TOutput;
  error: TError | null;
}
interface TRPCSubscriptionPendingResult<TOutput> extends TRPCSubscriptionBaseResult<TOutput, undefined> {
  status: 'pending';
  data: TOutput | undefined;
  error: null;
}
interface TRPCSubscriptionErrorResult<TOutput, TError> extends TRPCSubscriptionBaseResult<TOutput, TError> {
  status: 'error';
  data: TOutput | undefined;
  error: TError;
}
type TRPCSubscriptionResult<TOutput, TError> = TRPCSubscriptionIdleResult<TOutput> | TRPCSubscriptionConnectingResult<TOutput, TError> | TRPCSubscriptionErrorResult<TOutput, TError> | TRPCSubscriptionPendingResult<TOutput>;
declare function useSubscription<TOutput, TError>(opts: TRPCSubscriptionOptionsOut<TOutput, TError>): TRPCSubscriptionResult<TOutput, TError>;
//#endregion
//#region src/internals/createOptionsProxy.d.ts
interface DecorateRouterKeyable {
  /**
   * Calculate the TanStack Query Key for any path, could be used to invalidate every procedure beneath this path
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryKey
   */
  pathKey: () => TRPCQueryKey;
  /**
   * Calculate a TanStack Query Filter for any path, could be used to manipulate every procedure beneath this path
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/filters
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryFilter
   */
  pathFilter: (filters?: QueryFilters<TRPCQueryKey>) => WithRequired<QueryFilters<TRPCQueryKey>, 'queryKey'>;
}
interface TypeHelper<TDef extends ResolverDef> {
  /**
   * @internal prefer using inferInput and inferOutput to access types
   */
  '~types': {
    input: TDef['input'];
    output: TDef['output'];
    errorShape: TDef['errorShape'];
  };
}
type inferInput<TProcedure extends DecorateInfiniteQueryProcedure<any> | DecorateQueryProcedure<any> | DecorateMutationProcedure<any>> = TProcedure['~types']['input'];
type inferOutput<TProcedure extends DecorateInfiniteQueryProcedure<any> | DecorateQueryProcedure<any> | DecorateMutationProcedure<any>> = TProcedure['~types']['output'];
interface DecorateInfiniteQueryProcedure<TDef extends ResolverDef> extends TypeHelper<TDef> {
  /**
   * Create a set of type-safe infinite query options that can be passed to `useInfiniteQuery`, `prefetchInfiniteQuery` etc.
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/reference/infiniteQueryOptions#infinitequeryoptions
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#infiniteQueryOptions
   */
  infiniteQueryOptions: TRPCInfiniteQueryOptions<TDef>;
  /**
   * Calculate the TanStack Query Key for a Infinite Query Procedure
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryKey
   */
  infiniteQueryKey: (input?: Partial<TDef['input']>) => DataTag<TRPCQueryKey, TRPCInfiniteData<TDef['input'], TDef['output']>, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
  /**
   * Calculate a TanStack Query Filter for a Infinite Query Procedure
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/filters
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryFilter
   */
  infiniteQueryFilter: (input?: Partial<TDef['input']>, filters?: QueryFilters<DataTag<TRPCQueryKey, TRPCInfiniteData<TDef['input'], TDef['output']>, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>>) => WithRequired<QueryFilters<DataTag<TRPCQueryKey, TRPCInfiniteData<TDef['input'], TDef['output']>, TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>>, 'queryKey'>;
}
interface DecorateQueryProcedure<TDef extends ResolverDef> extends TypeHelper<TDef>, DecorateRouterKeyable {
  /**
   * Create a set of type-safe query options that can be passed to `useQuery`, `prefetchQuery` etc.
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/reference/queryOptions#queryoptions
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryOptions
   */
  queryOptions: TRPCQueryOptions<TDef>;
  /**
   * Calculate the TanStack Query Key for a Query Procedure
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryKey
   */
  queryKey: (input?: Partial<TDef['input']>) => DataTag<TRPCQueryKey, TDef['output'], TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>;
  /**
   * Calculate a TanStack Query Filter for a Query Procedure
   *
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/filters
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#queryFilter
   */
  queryFilter: (input?: Partial<TDef['input']>, filters?: QueryFilters<DataTag<TRPCQueryKey, TDef['output'], TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>>) => WithRequired<QueryFilters<DataTag<TRPCQueryKey, TDef['output'], TRPCClientErrorLike<{
    transformer: TDef['transformer'];
    errorShape: TDef['errorShape'];
  }>>>, 'queryKey'>;
}
interface DecorateMutationProcedure<TDef extends ResolverDef> extends TypeHelper<TDef> {
  /**
   * Create a set of type-safe mutation options that can be passed to `useMutation`
   *
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#mutationOptions
   */
  mutationOptions: TRPCMutationOptions<TDef>;
  /**
   * Calculate the TanStack Mutation Key for a Mutation Procedure
   *
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#mutationKey
   */
  mutationKey: () => TRPCMutationKey;
}
interface DecorateSubscriptionProcedure<TDef extends ResolverDef> {
  /**
   * Create a set of type-safe subscription options that can be passed to `useSubscription`
   *
   * @see https://trpc.io/docs/client/tanstack-react-query/usage#subscriptionOptions
   */
  subscriptionOptions: TRPCSubscriptionOptions<TDef>;
}
type DecorateProcedure<TType extends TRPCProcedureType, TDef extends ResolverDef> = TType extends 'query' ? DecorateQueryProcedure<TDef> & (TDef['input'] extends OptionalCursorInput ? DecorateInfiniteQueryProcedure<TDef> : Record<string, never>) : TType extends 'mutation' ? DecorateMutationProcedure<TDef> : TType extends 'subscription' ? DecorateSubscriptionProcedure<TDef> : never;
/**
 * @internal
 */
type DecoratedRouterRecord<TRoot extends AnyTRPCRootTypes, TRecord extends TRPCRouterRecord> = { [TKey in keyof TRecord]: TRecord[TKey] extends infer $Value ? $Value extends TRPCRouterRecord ? DecoratedRouterRecord<TRoot, $Value> & DecorateRouterKeyable : $Value extends AnyTRPCProcedure ? DecorateProcedure<$Value['_def']['type'], {
  input: inferProcedureInput<$Value>;
  output: inferTransformedProcedureOutput<TRoot, $Value>;
  transformer: TRoot['transformer'];
  errorShape: TRoot['errorShape'];
}> : never : never };
type TRPCOptionsProxy<TRouter extends AnyTRPCRouter> = DecoratedRouterRecord<TRouter['_def']['_config']['$types'], TRouter['_def']['record']> & DecorateRouterKeyable;
interface TRPCOptionsProxyOptionsBase {
  queryClient: QueryClient | (() => QueryClient);
  overrides?: {
    mutations?: MutationOptionsOverride;
  };
}
interface TRPCOptionsProxyOptionsInternal<TRouter extends AnyTRPCRouter> {
  router: TRouter;
  ctx: inferRouterContext<TRouter> | (() => MaybePromise<inferRouterContext<TRouter>>);
}
interface TRPCOptionsProxyOptionsExternal<TRouter extends AnyTRPCRouter> {
  client: TRPCUntypedClient<TRouter> | TRPCClient<TRouter>;
}
type TRPCOptionsProxyOptions<TRouter extends AnyTRPCRouter> = TRPCOptionsProxyOptionsBase & (TRPCOptionsProxyOptionsInternal<TRouter> | TRPCOptionsProxyOptionsExternal<TRouter>);
/**
 * Create a typed proxy from your router types. Can also be used on the server.
 *
 * @see https://trpc.io/docs/client/tanstack-react-query/setup#3b-setup-without-react-context
 * @see https://trpc.io/docs/client/tanstack-react-query/server-components#5-create-a-trpc-caller-for-server-components
 */
declare function createTRPCOptionsProxy<TRouter extends AnyTRPCRouter>(opts: TRPCOptionsProxyOptions<TRouter>): TRPCOptionsProxy<TRouter>;
//#endregion
//#region src/internals/Context.d.ts
interface CreateTRPCContextResult<TRouter extends AnyTRPCRouter> {
  TRPCProvider: React.FC<{
    children: React.ReactNode;
    queryClient: QueryClient;
    trpcClient: TRPCClient<TRouter>;
  }>;
  useTRPC: () => TRPCOptionsProxy<TRouter>;
  useTRPCClient: () => TRPCClient<TRouter>;
}
/**
 * Create a set of type-safe provider-consumers
 *
 * @see https://trpc.io/docs/client/tanstack-react-query/setup#3a-setup-the-trpc-context-provider
 */
declare function createTRPCContext<TRouter extends AnyTRPCRouter>(): CreateTRPCContextResult<TRouter>;
//# sourceMappingURL=Context.d.ts.map

//#endregion
export { DecorateMutationProcedure, DecorateProcedure, DecorateQueryProcedure, DecorateRouterKeyable, DecorateSubscriptionProcedure, ExtractCursorType, OptionalCursorInput, QueryType, ResolverDef, TRPCInfiniteData, TRPCInfiniteQueryOptions, TRPCMutationKey, TRPCMutationOptions, TRPCOptionsProxy, TRPCQueryBaseOptions, TRPCQueryKey, TRPCQueryOptions, TRPCQueryOptionsResult, TRPCReactRequestOptions, TRPCSubscriptionConnectingResult, TRPCSubscriptionErrorResult, TRPCSubscriptionIdleResult, TRPCSubscriptionOptions, TRPCSubscriptionPendingResult, TRPCSubscriptionResult, TRPCSubscriptionStatus, WithRequired, createTRPCContext, createTRPCOptionsProxy, inferInput, inferOutput, useSubscription };
//# sourceMappingURL=index.d.cts.map