import { getData, setData } from './dataStore';
import validator from 'validator';
import HTTPError from 'http-errors';
import { isTokenValid } from './valid';
import { USERSTATS, ProfilePhotoFile, TemporaryProfilePhoto } from './types';
import fs from 'fs';
import request from 'sync-request';
import Jimp from 'jimp';
import config from './config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;

/**
  * For a valid user, returns information about their user ID, email, first name, last name, and handle
  *
  * @param {string} token - id of user getting the profile
  * @param {integer} uId - id of user whose profile details are given
  * ...
  *
  * @returns {{
 * uId: integer,
 * email: string,
 * nameFirst: string,
 * nameLast: string,
 * handleStr: string,
 * }} - if both authUserId and uId are valid
 * @returns {{error: string}} - if authUserId or uId are invalid
*/
const userProfileV3 = (token: string, uId: number) => {
  const data = getData();

  // get corresponding token object to given token string
  isTokenValid(token);

  // check if uId is valid
  const userObj = data.users.find(user => user.authUserId === uId);
  if (userObj === undefined) {
    throw HTTPError(400, 'Invalid User ID');
  }

  // create user object to be returned
  const user = {
    uId: uId,
    email: userObj.email,
    nameFirst: userObj.nameFirst,
    nameLast: userObj.nameLast,
    handleStr: userObj.handleStr,
    permissionId: userObj.permissionId,
    profileImgUrl: userObj.profileImgUrl,
    userStats: userObj.permissionId
  };

  return {
    user: user
  };
};

/**
 * Update the authorised user's first and last name
 *
 * @param {string} token - session id
 * @param {string} nameFirst - new first name
 * @param {string} nameLast - new last name
 *
 *
 * @returns {{error: string}} - length of nameFirst is not between 1 and 50
 * @returns {{error: string}} - length of nameLast is not between 1 and 50
 * @returns {{error: string}} - token is invalid
 * @returns {} - if name successfully changed
*/
const userSetNameV2 = (token: string, nameFirst: string, nameLast: string) => {
  const data = getData();
  const userArr = data.users;

  const authUserId = 0;

  // Throw error if token is invalid.
  isTokenValid(token);

  if (nameFirst.length > 50 || nameFirst.length < 1) {
    throw HTTPError(400, 'First name must be 1 to 50 characters inclusive.');
  }
  if (nameLast.length > 50 || nameLast.length < 1) {
    throw HTTPError(400, 'Last name must be 1 to 50 characters inclusive.');
  }

  for (const user of userArr) {
    if (authUserId === user.authUserId) {
      user.nameFirst = nameFirst;
      user.nameLast = nameLast;
    }
  }
  setData(data);
  return {};
};

/**
 * Update the authorised user's email address
 *
 * @param {string} token - session id
 * @param {string} email - new email address
 *
 *
 * @returns {{error: string}} - email entered is not a valid email
 * @returns {{error: string}} - email entered is already in use
 * @returns {{error: string}} - token is invalid
 * @returns {} - if email successfully changed
*/
const userSetEmailV2 = (token: string, email: string) => {
  const data = getData();

  const userArr = data.users;

  const authUserId = 0;

  // Throw error if token is invalid.
  isTokenValid(token);

  if (!validator.isEmail(email)) {
    throw HTTPError(400, 'Email is in an invalid format.');
  }
  for (const check of userArr) {
    if (email === check.email) {
      throw HTTPError(400, 'Email is already taken.');
    }
  }

  for (const user of userArr) {
    if (authUserId === user.authUserId) {
      user.email = email;
    }
  }
  setData(data);
  return {};
};

/**
 * Update the authorised user's handle (i.e. display name)
 *
 * @param {string} token - session id
 * @param {string} handleStr - new handle
 *
 *
 * @returns {{error: string}} - handle length is not between 3 and 20
 * @returns {{error: string}} - handle contains non-alphanumeric characters
 * @returns {{error: string}} - handle entered is already in use
 * @returns {{error: string}} - token is invalid
 * @returns {} - if handle successfully changed
*/
const userSetHandleV2 = (token: string, handleStr: string) => {
  const data = getData();
  const userArr = data.users;

  // Throw error if token is invalid.
  isTokenValid(token);

  const authUserId = 0;

  if (handleStr.length < 3 || handleStr.length > 20) {
    throw HTTPError(400, 'Handle must be between 3 to 50 characters inclusive.');
  }
  if (!handleStr.match(/^[A-Za-z0-9]+$/)) {
    throw HTTPError(400, 'Handle must only contain letters and numbers.');
  }

  for (const strCheck of userArr) {
    if (handleStr === strCheck.handleStr) {
      throw HTTPError(400, 'Handle is already taken.');
    }
  }

  for (const user of userArr) {
    if (authUserId === user.authUserId) {
      user.handleStr = handleStr;
    }
  }
  setData(data);
  return {};
};

/**
  * Returns a list of all users and their associated details.
  *
  * @param {string} token - Logged-in user unique identifier.
  * ...
  *
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{
  *   users: array of objects, where each object contains {
  *     uId: integer,
  *     email: string,
  *     nameFirst: string,
  *     nameLast: string,
  *     handleStr: string
  *   },
  * }} - If all arguments are valid.
*/
const usersAllV2 = (token: string) => {
  const data = getData();
  const newArray = [];

  isTokenValid(token);

  // Push user into array, then return the array.
  for (const user of data.users) {
    const userList = {
      uId: user.authUserId,
      email: user.email,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr
    };
    newArray.push(userList);
  }
  setData(data);

  return {
    users: newArray
  };
};

/**
 * Fetches the required statistics about this user's use of UNSW Beans.
 *
 * @param {string} token - session id
 *
 *
 * @returns {{userStats}}  - statisics of the user
*/
const userStatsV1 = (token: string) => {
  const data = getData();
  const channelsArr = data.channels;
  const dmsArr = data.dms;
  const userStatArr = data.userStats;
  const tokenObj = isTokenValid(token);

  const uId = tokenObj.uId;
  const userStats = userStatArr.find(element => element.uId === uId);

  const numberOfChannels: number = userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined;
  const numberOfDms: number = userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined;
  const numberOfMessages: number = userStats.messagesSent[userStats.messagesSent.length - 1].numMessagesSent;
  const numerator: number = numberOfChannels + numberOfDms + numberOfMessages;

  let totalMessages = 0;
  const totalChannels: number = channelsArr.length;
  const totalDms: number = dmsArr.length;
  for (const channel of channelsArr) {
    totalMessages = channel.messages.length;
  }
  for (const dm of dmsArr) {
    totalMessages = dm.messages.length;
  }
  const denominator: number = totalMessages + totalChannels + totalDms;

  let involvementRate: number;
  if (denominator === 0) {
    involvementRate = 0;
  } else {
    involvementRate = numerator / denominator;
  }
  if (involvementRate > 1) {
    involvementRate = 1;
  }

  userStats.involvementRate = involvementRate;

  const userStatsInfo: USERSTATS = {
    channelsJoined: userStats.channelsJoined,
    dmsJoined: userStats.dmsJoined,
    messagesSent: userStats.messagesSent,
    involvementRate: userStats.involvementRate
  };

  setData(data);
  return {
    userStats: userStatsInfo
  };
};

/**
 * Fetches the required statistics about the workspace's use of UNSW Beans.
 *
 * @param {string} token - session id
 *
 *
 * @returns {{workspaceStats}}  - statisics of the workspace
*/

const usersStatsV1 = (token: string) => {
  const data = getData();
  const channelArr = data.channels;
  const dmArr = data.dms;
  const userArr = data.users;
  isTokenValid(token);

  const channelsExistArr = data.workspaceStats.channelsExist;
  const dmsExistArr = data.workspaceStats.dmsExist;
  const messagesExistArr = data.workspaceStats.messagesExist;
  const channelExist = {
    numChannelsExist: channelArr.length,
    timeStamp: Math.floor(Date.now() / 1000)
  };
  channelsExistArr.push(channelExist);

  const dmExist = {
    numDmsExist: dmArr.length,
    timeStamp: Math.floor(Date.now() / 1000)
  };
  dmsExistArr.push(dmExist);

  let count1 = 0;
  for (const channel of channelArr) {
    count1 += channel.messages.length;
  }
  let count2 = 0;
  for (const dm of dmArr) {
    count2 += dm.messages.length;
  }

  const msgExist = count1 + count2;
  const messageExist = {
    numMessagesExist: msgExist,
    timeStamp: Math.floor(Date.now() / 1000)
  };
  messagesExistArr.push(messageExist);
  let count3 = 0;
  let uId = -1;
  let count4 = 0;
  for (const i of userArr) {
    for (const channel of channelArr) {
      for (const member of channel.allMembers) {
        if (i.authUserId === member) {
          count3 += 1;
          uId = member;
        }
      }
    }
  }
  for (const j of userArr) {
    for (const dm of dmArr) {
      for (const member of dm.allMembers) {
        if (j.authUserId === member) {
          if (j.authUserId !== uId) {
            count4 += 1;
          }
        }
      }
    }
  }
  const utilJoined = count3 + count4;
  let utilizationRate = 0;
  utilizationRate = utilJoined / userArr.length;

  data.workspaceStats = {
    channelsExist: channelsExistArr,
    dmsExist: dmsExistArr,
    messagesExist: messagesExistArr,
    utilizationRate: utilizationRate
  };
  setData(data);
  return { workspaceStats: data.workspaceStats };
};

/**
 * Given a URL of an image on the internet, crops the image within bounds
 *
 * @param {string} token - session id
 * @param {string} imgUrl - URl of the image
 * @param {number} xStart - x start bound of image
 * @param {number} yStart - y start bound of image
 * @param {number} xEnd - x end bound of image
 * @param {number} yEnd - y end bound of image
 *
 * @returns {{workspaceStats}}  - statisics of the workspace
*/
const userProfileUploadPhotoV1 = (token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) => {
  const data = getData();
  const sizeOf = require('image-size');
  const userArr = data.users;
  const hasha = require('hasha');
  const tokenObj = isTokenValid(token);
  const uId = tokenObj.uId;

  // If image is not a jpg image, throw error.
  if (!(imgUrl.includes('.jpg'))) {
    throw HTTPError(400, 'Image uploaded is not a JPG');
  }
  if (xEnd <= xStart) {
    throw HTTPError(400, 'xEnd is less than or equal to xStart');
  }
  if (yEnd <= yStart) {
    throw HTTPError(400, 'yEnd is less than or equal to yStart');
  }
  if (xStart < 0) {
    throw HTTPError(400, 'xStart is out of bounds');
  }
  if (yStart < 0) {
    throw HTTPError(400, 'yStart is out of bounds');
  }

  // Generate unique url.
  const profilePhotoDirectory = `${hasha('sponge' + userArr.find(u => u.authUserId === uId).email + 'bob')}-profilePhoto`;
  // Files for storing images.
  const profilePhotoLocation = `${ProfilePhotoFile}${profilePhotoDirectory}.jpg`;
  // File for storing cropped image.
  const temporaryLocation = `${TemporaryProfilePhoto}${profilePhotoDirectory}.jpg`;
  let res;

  try {
    res = request('GET', imgUrl);
  } catch (err) {
    throw HTTPError(400, 'Invalid image URL');
  }
  const body = res.getBody();
  fs.writeFileSync(temporaryLocation, body, { flag: 'w' });

  const dimensions = sizeOf(temporaryLocation);

  fs.rmSync(temporaryLocation);
  if (xEnd > dimensions.width) {
    throw HTTPError(400, 'xEnd is out of bounds');
  }

  if (yEnd > dimensions.height) {
    throw HTTPError(400, 'yEnd is out of bounds');
  }

  fs.writeFileSync(profilePhotoLocation, body, { flag: 'w' });

  Jimp.read(imgUrl)
    .then(image => {
      return image
        .crop(xStart, yStart, xEnd - xStart, yEnd - yStart)
        .write(profilePhotoLocation); // save
    })
    .catch(err => {
      return { code: 400, message: err.message };
    });

  userArr[uId].profileImgUrl = `${SERVER_URL}/${profilePhotoLocation}`;
  setData(data);
  return {};
};

export { userProfileV3, userSetNameV2, userSetEmailV2, userSetHandleV2, usersAllV2, userStatsV1, usersStatsV1, userProfileUploadPhotoV1 };
