export function idGen(prefix: string, postfix: string = "", start: number = 0) {
  return () => {
    return `${prefix}${start++}${postfix}`;
  };
}
