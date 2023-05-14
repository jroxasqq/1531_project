import { getData, setData } from './dataStore';
import { Data, Message } from './types';
import { isTokenValid } from './valid';
import HTTPError from 'http-errors';
import fs from 'fs';
import { ProfilePhotoFile } from './types';

/**
  * Resets the internal data of the application to its initial state
  *
  * @param {}
  * ...
  *
  * @returns {}
*/
const clearV1 = () => {
  const initData: Data = {
    users: [],
    channels: [],
    tokens: [],
    dms: [],
    passwordReset: [],
    userStats: [],
    workspaceStats: {
      channelsExist: [],
      dmsExist: [],
      messagesExist: [],
      utilizationRate: 0
    }
  };

  const path = require('path');

  fs.readdir(ProfilePhotoFile, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(ProfilePhotoFile, file), (err) => {
        if (err) throw err;
      });
    }
  });

  // set data to be empty users and channels arrays
  setData(initData);

  return {};
};

/**
  * Given a query substring, returns a collection of messages in
  * all of the channels/DMs that the user has joined that contain
  * the query (case-insensitive). There is no expected order for
  * these messages.
  *
  * @param {string} token - user temporary token
  * @param {string} queryStr - the string being matched
  * ...
  *
  * @returns { messages: Message[]} - array of matched messages
*/
const searchV1 = (token: string, queryStr: string) => {
  const data = getData();

  // find object with corresponding token string
  isTokenValid(token);

  if (queryStr.length < 1 || queryStr.length > 1000) {
    throw HTTPError(400, 'invalid queryStr length');
  }

  let matches: Message[] = [];

  for (const channel of data.channels) {
    const channelMatches = channel.messages.filter(message => message.message.toLowerCase().includes(queryStr.toLowerCase()));
    matches = matches.concat(channelMatches);
  }

  for (const dm of data.dms) {
    const dmMatches = dm.messages.filter(message => message.message.toLowerCase().includes(queryStr.toLowerCase()));
    matches = matches.concat(dmMatches);
  }

  return { messages: matches };
};

/**
  * Returns the user's most recent 20 notifications, ordered from
  * most recent to least recent.
  *
  * @param {string} token - user temporary token
  * ...
  *
  * @returns { notifications: Notification[]} - array of recent notifications
*/
const notificationsGetV1 = (token: string) => {
  const data = getData();

  // find object with corresponding token string
  const tokenObj = isTokenValid(token);
  const userObj = data.users.find(user => user.authUserId === tokenObj.uId);
  const notifications = Array.from(userObj.notifications);
  return { notifications: notifications.slice(0, 20) };
};

export { clearV1, searchV1, notificationsGetV1 };
