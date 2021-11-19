export type RestRequestConfig<A = unknown> = ConfigWithoutData | ConfigWithData<A>;

type ConfigWithoutData = ConfigBase & {
  readonly method: MethodWithoutData;
};

type ConfigWithData<A> = ConfigBase & {
  readonly method: MethodWithData;
  readonly data: A;
};

type ConfigBase = {
  readonly url: string;
  readonly headers?: Headers;
};

export type RestRequestMethod = MethodWithoutData | MethodWithData;

type MethodWithoutData = 'DELETE' | 'GET' | 'HEAD' | 'LINK' | 'OPTIONS' | 'PURGE' | 'UNLINK';

type MethodWithData = 'PATCH' | 'POST' | 'PUT';

type Headers = Readonly<Record<string, string>>;

export type RestResponse<A> = {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly data: A;
};
