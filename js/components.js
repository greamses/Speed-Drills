export function generateDynamicHtml(config) {
  const generateSelectMenu = () => {
    return Object.entries(config.percentages)
      .map(([level, percent]) => {
        const timeLimit = config.timeLimits[level] || 15; 
        return `<option value="${level}">Level ${level}: ${percent}% (${timeLimit} sec)</option>`;
      })
      .join('');
  };
  

  const generateCustomDropdown = () => {
    return Object.entries(config.percentages)
      .map(([level, percent]) => {
        const timeLimit = config.timeLimits[level] || 15; 
        return `<li role="option" data-value="${level}" class="select-option">${percent}% (${timeLimit} sec)</li>`;
      })
      .join('');
  };
  
  const generateLevelToggles = () => {
    return Object.keys(config.percentages)
      .map(level => `<button class="level-toggle-btn" data-level="${level}">L${level}</button>`)
      .join('');
  };
  
  return {
    generateSelectMenu,
    generateCustomDropdown,
    generateLevelToggles
  };
}