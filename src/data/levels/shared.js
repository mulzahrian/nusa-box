export function makeLevel(num, name, reward, objectives, character, lines) {
  return {
    num,
    name,
    reward,
    objectives,
    cutscene: { character, lines },
    president: lines,
  };
}
