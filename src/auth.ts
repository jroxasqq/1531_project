import { getData, setData } from './dataStore';
import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';
import HTTPError from 'http-errors';
import { User, PasswordReset, UserStats, DefaultProfilePhotoFile } from './types';
import { emailResetCode } from './email';
import { removeToken } from './valid';

/**
  * Given a registered user's email and password, returns their authUserId value.
  *
  * @param {string} email - user email
  * @param {string} password - user's password
  * ...
  *
  * @returns {{ token: string, authUserId: Integer }} - Unique userID
*/
const authLoginV3 = (email: string, password: string) => {
  const data = getData();
  const userArr = data.users;
  const userToken = data.tokens;
  const token = uuidv4(); // generate token
  const hasha = require('hasha');
  const passwordHash = hasha(password);
  for (const user of userArr) {
    if (email === user.email) {
      if (passwordHash !== user.password) {
        throw HTTPError(400, 'Incorrect Password');
      }

      // Add token to data.tokens
      const tokenObj = {
        token: hasha('sponge' + token + 'bob'),
        uId: user.authUserId
      };
      userToken.push(tokenObj);
      setData(data);
      return {
        token: token, // hashed token
        authUserId: user.authUserId
      };
    }
  }
  throw HTTPError(400, 'User does not exist');
};

/**
  * Generate a unique handle based off the first and last name of a user.
  *
  * @param {string} nameFirst - user first name
  * @param {string} nameLast - users last name
  * ...
  *
  * @returns { string } - Unique handle
*/
const handleGenerator = (nameFirst: string, nameLast: string): string => {
  let handle = nameFirst + nameLast;
  handle = handle.toLowerCase();
  handle = handle.replace(/[^0-9a-z]/gi, ''); // removes non-alphanumeric characters

  if (handle.length > 20) { // slice handles longer than 20 characters
    handle = handle.slice(0, 20);
  }
  return handle;
};

/**
  * Given a user's first and last name, email address, and password, creates a new
  * account for them and returns a new authUserId
  *
  * @param {string} email - user email
  * @param {string} password - user password
  * @param {string} nameFirst - user first name
  * @param {string} nameLast - user last name
  * ...
  *
  * @returns {{ token: string, authUserId: Integer }} - Assigns a unique userID
*/
const authRegisterV3 = (email: string, password: string, nameFirst: string, nameLast: string) => {
  const data = getData();
  const userArr = data.users;
  const userStats = data.userStats;
  const userToken = data.tokens;
  const hasha = require('hasha');
  if (!validator.isEmail(email)) { // checks if email is valid
    throw HTTPError(400, 'Invalid Email');
  }

  for (const user of userArr) { // checks if email already exists
    if (email === user.email) {
      throw HTTPError(400, 'Email already used');
    }
  }

  if (password.length < 6) { // checks if password is less than 6 characters
    throw HTTPError(400, 'Password too short');
  }

  if (nameFirst.length < 1 || nameFirst.length > 50) { // checks if name is between 1 and 50 characters
    throw HTTPError(400, 'First Name must be between 1 and 50 letters');
  }

  if (nameLast.length < 1 || nameLast.length > 50) { // checks if name is between 1 and 50 characters
    throw HTTPError(400, 'Last Name must be between 1 and 50 letters');
  }

  let handle = handleGenerator(nameFirst, nameLast); // generates handle
  let smallestNumber = -1; // smallest number to be added to handle incase it already exists
  for (const user of userArr) {
    if (user.handleStr.includes(handle)) { // checks how many handles contains the new handle substring
      smallestNumber++;
    }
  }

  if (smallestNumber > -1) {
    handle = handle + smallestNumber;
  }

  let authUserId = -1; // userID generation
  if (data.users.length === 0) { // checks if theres any users in arrar
    authUserId = -1;
  } else {
    for (const user of data.users) {
      if (user.authUserId >= authUserId) {
        authUserId = user.authUserId;
      }
    }
  }
  authUserId += 1;
  const token = uuidv4(); // creates token
  const registerToken = {
    token: hasha('sponge' + token + 'bob'),
    uId: authUserId,
  };
  let permId = 2;
  if (authUserId === 0) { // checks if globalowner
    permId = 1;
  }

  const time = Math.floor(Date.now() / 1000);
  const userStatsInfo: UserStats = {
    uId: authUserId,
    channelsJoined: [
      {
        numChannelsJoined: 0,
        timeStamp: time,
      }
    ],
    dmsJoined: [
      {
        numDmsJoined: 0,
        timeStamp: time
      }
    ],
    messagesSent: [
      {
        numMessagesSent: 0,
        timeStamp: time
      }
    ],
    involvementRate: 0
  };

  const user: User = {
    authUserId: authUserId,
    email: email,
    password: hasha(password),
    nameFirst: nameFirst,
    nameLast: nameLast,
    handleStr: handle,
    permissionId: permId,
    profileImgUrl: DefaultProfilePhotoFile,
    notifications: []
  }; // creates user object

  userStats.push(userStatsInfo);
  userArr.push(user);
  userToken.push(registerToken);
  setData(data);
  return {
    token: token,
    authUserId: authUserId,
  };
};

/**
  * Given an active token, invalidates the token to log the user out.
  *
  * @param {string} token - session id
  *
  * @returns {{error: string}} - invalid token
  * @returns {{}} - Unique userID
*/
const authLogoutV2 = (token: string) => {
  const data = getData();
  const hasha = require('hasha');

  const removedToken = data.tokens.filter(element => element.token !== hasha('sponge' + token + 'bob'));
  // if filtered array is the same size as the original array, given token did not exist

  if (removedToken.length === data.tokens.length) {
    throw HTTPError(403, 'invalid token');
  }

  data.tokens = removedToken;
  setData(data);

  return {};
};

/**
  * Given an email address, sends them an email containing a secret password reset code
  *
  * @param {string} email - user's email
  * ...
  *
  * @returns {{}} - empty object
*/

const authPasswordResetRequestV1 = (email: string) => {
  const data = getData();
  const userArr = data.users;
  const tokenArr = data.tokens;
  const reset = data.passwordReset;
  let uId: number;
  // Check if email is valid or not.
  if (userArr.find(user => user.email === email) === undefined) {
    return false;
  }

  for (const user of userArr) {
    if (user.email === email) {
      uId = user.authUserId;
    }
  }

  for (const token of tokenArr) {
    if (token.uId === uId) {
      removeToken(uId, token.token);
    }
  }

  const newResetCode = uuidv4();
  const passwordReset = data.passwordReset;
  let timeStampMax: number;
  let newTimeToSend: number;
  let timeToWait: number;
  if (passwordReset.length > 0) {
    timeStampMax = Math.max(...passwordReset.map(resetCodes => resetCodes.timeStamp));
    newTimeToSend = timeStampMax + 11;
    timeToWait = newTimeToSend - Math.floor((Date.now() / 1000));
  } else {
    timeToWait = 1;
  }

  const passwordreset: PasswordReset = {
    code: newResetCode,
    userEmail: email,
    timeToWait: timeToWait,
    timeStamp: Math.floor(Date.now() / 1000)
  };

  reset.push(passwordreset);
  setData(data);
  emailResetCode(email, newResetCode, timeToWait);
  return {};
};

/**
  * Given a reset code for a user, sets that user's new password to the password provided
  *
  * @param {string} resetCode - given code to reset password
  * @param {string} newPassword - user's new password
  * ...
  *
  * @returns {{}} - empty object
*/
const authPasswordResetResetV1 = (resetCode: string, newPassword: string) => {
  const data = getData();
  const reset = data.passwordReset;
  const users = data.users;
  const hasha = require('hasha');

  if (newPassword.length < 6) {
    throw HTTPError(400, 'New password is too short');
  }

  if (reset.find(passwordreset => passwordreset.code === resetCode) === undefined) {
    throw HTTPError(400, 'Reset code does not exist');
  }

  users.find(user => user.email === reset.find(passwordreset => passwordreset.code === resetCode).userEmail).password = hasha(newPassword);
  reset.splice(reset.findIndex(passwordreset => passwordreset.code === resetCode));
  setData(data);
  return {};
};

export { authLoginV3, authRegisterV3, authLogoutV2, authPasswordResetRequestV1, authPasswordResetResetV1 };
