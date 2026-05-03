const intMaxTextLength = 1200;

const cleanText = (strValue) => String(strValue || '').trim();

const toInteger = (value) => {
  const intValue = Number.parseInt(value, 10);
  return Number.isInteger(intValue) && intValue > 0 ? intValue : 0;
};

const validateRequired = (objBody, arrFields) => {
  const arrMissingFields = arrFields.filter((strField) => !cleanText(objBody[strField]));

  if (arrMissingFields.length > 0) {
    return `Missing required field(s): ${arrMissingFields.join(', ')}.`;
  }

  return '';
};

const validateLength = (objBody, arrFields) => {
  const strInvalidField = arrFields.find((strField) => cleanText(objBody[strField]).length > intMaxTextLength);

  if (strInvalidField) {
    return `${strInvalidField} must be ${intMaxTextLength} characters or fewer.`;
  }

  return '';
};

const sendDatabaseError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'A database error occurred. Please try again.' });
};

module.exports = {
  cleanText,
  sendDatabaseError,
  toInteger,
  validateLength,
  validateRequired
};
