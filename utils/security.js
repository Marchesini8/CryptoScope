function escapeHtml(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function cleanText(value = '', max = 255) { return escapeHtml(String(value).trim().slice(0, max)); }
module.exports = { escapeHtml, cleanText };