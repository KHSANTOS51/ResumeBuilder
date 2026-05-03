const fs = require('fs');
const path = require('path');

const strEnvPath = path.join(__dirname, '..', '.env');

const saveEnvValue = (strKey, strValue) => {
  const strCurrentContent = fs.existsSync(strEnvPath) ? fs.readFileSync(strEnvPath, 'utf8') : '';
  const arrLines = strCurrentContent.split(/\r?\n/).filter((strLine) => strLine.trim() !== '');
  const strSafeValue = String(strValue || '').replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  const strNewLine = `${strKey}="${strSafeValue}"`;
  const intExistingIndex = arrLines.findIndex((strLine) => strLine.startsWith(`${strKey}=`));

  if (intExistingIndex >= 0) {
    arrLines[intExistingIndex] = strNewLine;
  } else {
    arrLines.push(strNewLine);
  }

  fs.writeFileSync(strEnvPath, `${arrLines.join('\n')}\n`);
  process.env[strKey] = strValue;
};

module.exports = {
  saveEnvValue
};
