interface Deferred<T> {
  promise: Promise<T>;
  resolve: (args: T) => unknown;
  reject: (e?: unknown) => unknown;
}

export default function getDeferred<T>(): Deferred<T> {
  let resolve: (args: T) => unknown;
  let reject: (e?: unknown) => unknown;

  const promise = new Promise<T>((r, j) => {
    resolve = r;
    reject = j;
  });

  return {
    promise,
    //@ts-ignore
    resolve,
    //@ts-ignore
    reject,
  };
}

export const resolve = <T>(data: any) => {
  const defer = getDeferred<T>();

  defer.resolve(data);

  return defer.promise;
};

export const reject = <T>(data: any) => {
  const defer = getDeferred<T>();

  defer.reject(data);

  return defer.promise;
};
