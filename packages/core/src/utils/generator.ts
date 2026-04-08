export async function* drainGenerator<TYield, TReturn>(
  source: AsyncGenerator<TYield, TReturn>,
): AsyncGenerator<TYield, TReturn> {
  while (true) {
    const { value, done } = await source.next();
    if (done) return value as TReturn;
    yield value;
  }
}

export async function consumeGenerator<TYield, TReturn>(
  source: AsyncGenerator<TYield, TReturn>,
  onYield?: (value: TYield) => void,
): Promise<TReturn> {
  while (true) {
    const { value, done } = await source.next();
    if (done) return value as TReturn;
    if (onYield) onYield(value);
  }
}
