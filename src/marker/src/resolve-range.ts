interface SerializedRange {
  textBefore: string;
  text: string;
  textAfter: string;
}

const resolveSerializedRangeOffsetInTextStrategies = [
  {
    textBefore: true,
    textAfter: true,
  },
  {
    textBefore: false,
    textAfter: true,
  },
  {
    textBefore: true,
    textAfter: false,
  },
  {
    textBefore: false,
    textAfter: false,
  },
];

/**
 *
 * TODO: optimize algorithm, maybe use https://github.com/google/diff-match-patch
 * @param content
 * @param serializedRange
 * @returns
 */
export function resolveSerializedRangeOffsetInText(
  content: string,
  serializedRange: SerializedRange
): [number, number] | null {
  const { text, textAfter, textBefore } = serializedRange;

  for (let strategy of resolveSerializedRangeOffsetInTextStrategies) {
    const textToSearch =
      (strategy.textBefore ? textBefore : "") +
      text +
      (strategy.textAfter ? textAfter : "");

    const index = content.indexOf(textToSearch);
    if (index >= 0) {
      const start = index + (strategy.textBefore ? textBefore.length : 0);
      const end = start + text.length;
      return [start, end];
    }
  }
  return null;
}
