const ALLOWED_UPDATE_FIELDS = [
  'firstName',
  'lastName',
  'dob',
  'gender',
  'mobile',
  'monthlyIncome',
  'currency',
  'country',
  'profilePicture',
];

function pickAllowedUserUpdates(body = {}) {
  const updates = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }
  return updates;
}

module.exports = { pickAllowedUserUpdates, ALLOWED_UPDATE_FIELDS };
