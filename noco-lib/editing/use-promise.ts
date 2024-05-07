import React from "react";

export const usePromise = <T>(
  promiseOrValue?: Promise<T> | T
): (T extends Promise<infer U> ? U : T) | null => {
  const runningKey = React.useRef({});
  const isDefined = promiseOrValue !== undefined;
  const isPromise = promiseOrValue instanceof Promise;
  const isValue = !isPromise && isDefined;
  const value = React.useRef<T | null>(isValue ? (promiseOrValue as T) : null);
  const update = React.useReducer((x) => x + 1, 0)[1];
  React.useEffect(() => {
    return () => {
      runningKey.current = {};
    };
  }, []);

  React.useEffect(() => {
    const myKey = {};
    runningKey.current = myKey;

    if (promiseOrValue instanceof Promise) {
      promiseOrValue
        .then((res) => {
          if (myKey === runningKey.current) {
            value.current = res;
            update();
          }
        })
        .catch((error) => {
          if (myKey === runningKey.current) {
            console.error(error);
            value.current = null;
            update();
          }
        });
    }
  }, [promiseOrValue]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return value.current as any;
};
