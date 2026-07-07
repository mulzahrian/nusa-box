import BASE_SUMATRA_LEVELS from '../../levels/sumatra.js';
const SUMATRA_LEVELS = BASE_SUMATRA_LEVELS.map(level => ({
  ...level,
  cutscene: level.cutscene || { character: 'the_president', lines: level.president || [] },
  president: level.president || level.cutscene?.lines || [],
}));
export default SUMATRA_LEVELS;
