import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import { Token } from './types';

/**
  *Given a user's token, check if it is valid or not and returns the token hashed
  *
  * @param {string} token - user temporary token
  * ...
  *
  * @returns {{tokenHash}} - token string that has been hashed
*/
const isTokenValid = (token: string): Token => {
  const data = getData();

  // Hashing function.
  const hasha = require('hasha');

  // isValid is set to true if there exists a match.
  const isValid = data.tokens.some((tokenObj) => {
    return hasha('sponge' + token + 'bob') === tokenObj.token;
  });

  // Throw error if token is invalid.
  if (!isValid) {
    throw HTTPError(403, 'Token is invalid.');
  }

  // Otherwise return the token object.
  const hashedToken = hasha('sponge' + token + 'bob');
  return data.tokens.filter((item) => item.token === hashedToken)[0];
};
/**
  *Given a user's uId and token, removes their token
  *
  * @param {string} token - user temporary token
  * @param {number} authUserId - user's authorisation Id
  * ...
  *
  * @returns -nothing
*/
const removeToken = (authUserId: number, token: string) => {
  const data = getData();
  const removedToken = data.tokens.filter(tokenObj => tokenObj.token !== token);
  data.tokens = removedToken;
  setData(data);
};

export { isTokenValid, removeToken };
