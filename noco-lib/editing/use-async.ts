import React from "react";

export const useAsync = <T>(
  asyncFn: undefined | (() => Promise<T>) | (() => T)
): (T extends Promise<infer U> ? U : T) | null => {
  const runningKey = React.useRef({});
  const value = React.useRef<T | null>(null);
  const update = React.useReducer((x) => x + 1, 0)[1];
  React.useEffect(() => {
    return () => {
      runningKey.current = {};
    };
  }, []);

  React.useEffect(() => {
    const myKey = {};
    runningKey.current = myKey;
    const res = asyncFn?.();
    if (res instanceof Promise) {
      res
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
    } else {
      value.current = res || null;
      update();
    }
  }, [asyncFn, update]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return value.current as any;
};
