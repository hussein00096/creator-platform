// Arabic letters that never connect to the following letter.
const NON_JOINING = new Set('اأإآءدذرزوؤةى'.split(''));
const ARABIC = /[؀-ۿ]/;
const ZWJ = '‍';

/**
 * Splits a word into letters that can animate one by one.
 * Arabic letters keep their joined shapes through zero-width joiners.
 */
export function letters(word: string) {
  const chars = Array.from(word);
  return chars.map((char, index) => {
    if (!ARABIC.test(char)) return char;
    const prev = chars[index - 1];
    const next = chars[index + 1];
    const joinsPrev = prev && ARABIC.test(prev) && !NON_JOINING.has(prev);
    const joinsNext = next && ARABIC.test(next) && !NON_JOINING.has(char);
    return `${joinsPrev ? ZWJ : ''}${char}${joinsNext ? ZWJ : ''}`;
  });
}

/**
 * Home-only preloader: accent panel, letters rise (80ms stagger), dark bar fills in 1.3s,
 * then the panel slides up. Shown only when the boot script sets `html[data-pre]`
 * (first home visit per session, motion allowed).
 */
export function Preloader({ word }: { word: string }) {
  return (
    <div className="pre" aria-hidden="true">
      <div className="pw">
        {letters(word).map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ animationDelay: `${0.1 + index * 0.08}s` }}>{letter}</span>
        ))}
      </div>
      <span className="pbar" />
    </div>
  );
}
