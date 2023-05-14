import { getData, setData } from './dataStore';
import { userProfileV3 } from './users';
import { Message } from './types';
import { isTokenValid } from './valid';
import HTTPError from 'http-errors';

/**
 * Given a users token and an array of uIds containing the user(s) that this
 * DM is directed to, create a DM with the creator of the DM being
 * the owner and a member of the DM.
 *
 * @param {string} token - Logged-in user unique identifier.
 * @param {number[]} uIds - Array of users to be members of the DM, excluding the creator.
 * ...
 *
 * @returns {{ error: string }} - If token is invalid.
 * @returns {{ error: string }} - If uId array has multiple equal userIds.
 * @returns {{ error: string }} - If uId array contains an invalid uId.
 * @returns {{ dmId: number }} - If all arguments are valid.
 *
*/
const dmCreateV2 = (token: string, uIds: number[]) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  const hasDuplicates = (uIds.length !== new Set(uIds).size);
  if (hasDuplicates) {
    // uIds array has duplicate values.
    throw HTTPError(400, 'Duplicate userIds found');
  }

  const hasInvalidUId = uIds.some((uId) => {
    const user = data.users.filter((user) => user.authUserId === uId)[0];
    return (user === undefined);
  });

  if (hasInvalidUId) {
    // If uId contains atleast one invalid uId.
    throw HTTPError(400, 'uId does not refer to a valid user');
  }

  let userHandles = uIds.map((uId) => {
    // Get the user from the data.users array, then return their handle.
    const user = data.users.filter((item) => item.authUserId === uId)[0];
    return user.handleStr;
  });

  // Add creators handle to userHandles.
  userHandles = [data.users[tokenObj.uId].handleStr].concat(userHandles);

  // Sort handles alphabetically.
  userHandles.sort((a, b) => a.localeCompare(b));

  // Dm name is an "alphabetically-sorted, comma-and-space-separated
  // list of user handles".
  // (Ex. array ['ghi', 'abc', 'def'] becomes string 'abc, def, ghi')
  const dmName = userHandles.join(', ');

  // Add creator to the members array.
  const allMembers = [tokenObj.uId].concat(uIds);

  // Add dm to data dms array.
  let dmId = 0;
  if (data.dms.length !== 0) {
    // In case you've removed dms, make new dmId one greater
    // than the last dm in the data.dms array. If no dms exist at all,
    // just keep dmId to 0. This method still keeps dmId unique.
    dmId = data.dms[data.dms.length - 1].dmId + 1;
  }

  const owner = data.users.find(u => u.authUserId === tokenObj.uId);
  for (const uId of uIds) {
    const member = data.users.find(u => u.authUserId === uId);
    member.notifications.unshift({
      channelId: -1,
      dmId: dmId,
      notificationMessage: `${owner.handleStr} added you to ${dmName}`
    });
  }

  data.dms.push(
    {
      dmId: dmId,
      name: dmName,
      ownerMembers: [tokenObj.uId],
      allMembers: allMembers,
      messages: [] as Message[]
    }
  );

  const time = Math.floor(Date.now() / 1000);
  for (const members of allMembers) {
    const userStats = data.userStats.find(u => u.uId === members);
    data.userStats = data.userStats.filter(u => u.uId !== members);
    const numDmsJoined = userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined + 1;
    userStats.dmsJoined.push({ numDmsJoined: numDmsJoined, timeStamp: time });
    data.userStats.push(userStats);
  }

  setData(data);

  return { dmId: dmId };
};

/**
  * Given a valid logged-in user, return a list of info on all DMs the
  * user is part of.
  *
  * @param {string} token - Logged-in user unique identifier.
  * ...
  *
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{ dmId: number, name: string }} - If all arguements valid.
*/
const dmListV2 = (token: string) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  // Get all dm objects that user is part of.
  const dmObjs = data.dms.filter((item) => {
    return item.allMembers.includes(tokenObj.uId);
  });

  // Get only keys (dmId and name) in the dm object.
  const dmObjsReturn = dmObjs.map((item) => {
    return {
      dmId: item.dmId,
      name: item.name,
    };
  });

  return { dms: dmObjsReturn };
};

/**
  * Deletes DM but only if token refers to the owner of the DM.
  *
  * @param {string} token - Logged-in user unique identifier.
  * @param {integer} dmId - DM unique identifier.
  * ...
  *
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{ error: string }} - If dmId is invalid.
  * @returns {{ error: string }} - If logged-in user is not a member of DM.
  * @returns {{ error: string }} - If logged-in user is a member of DM but not the owner.
  * @returns {{}} - If all arguements valid.
*/
const dmRemoveV2 = (token: string, dmId: number) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  const dmObj = data.dms.filter((item) => item.dmId === dmId)[0];
  if (dmObj === undefined) {
    // Dm does not exist in the data store.
    throw HTTPError(400, 'dmId is invalid.');
  }

  const isMember = dmObj.allMembers.includes(tokenObj.uId);
  if (!isMember) {
    // Dm remover is not a member of the dm anymore.
    throw HTTPError(403, 'authorised user is no longer in the DM');
  }

  const isOwner = dmObj.ownerMembers.includes(tokenObj.uId);
  if (!isOwner) {
    // Dm remover is not the creator/owner of the dm.
    throw HTTPError(403, 'authorised user is not the original DM creator');
  }

  // Considering dmId corresponds to the same index in data.dms array,
  // remove the dm from the data.dms array.
  const removeObjIndex = data.dms.findIndex((item) => item.dmId === dmId);
  data.dms.splice(removeObjIndex, 1);

  const time = Math.floor(Date.now() / 1000);
  for (const members of dmObj.allMembers) {
    const userStats = data.userStats.find(u => u.uId === members);
    data.userStats = data.userStats.filter(u => u.uId !== members);
    const numDmsJoined = userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined - 1;
    userStats.dmsJoined.push({ numDmsJoined: numDmsJoined, timeStamp: time });
    data.userStats.push(userStats);
  }

  setData(data);

  return {};
};

/**
  * Gives details of a DM specified by dmId but only if the token refers to a
  * member of the DM.
  *
  * @param {string} token - Logged-in user unique identifier.
  * @param {integer} dmId - DN unique identifier.
  * ...
  *
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{ error: string }} - If dmId is invalid.
  * @returns {{ error: string }} - If logged-in user is not a member of dm.
  * @returns {{}} - If all arguements valid.
*/
const dmDetailsV2 = (token: string, dmId: number) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  const dmObj = data.dms.filter((item) => item.dmId === dmId)[0];
  if (dmObj === undefined) {
    // Dm does not exist in the data store.
    throw HTTPError(400, 'dmId does not refer to a valid DM');
  }

  const isMember = dmObj.allMembers.includes(tokenObj.uId);
  if (!isMember) {
    // User is not a member of the dm.
    throw HTTPError(403, 'authorised user is not a member of the DM');
  }

  const membersArr = dmObj.allMembers.map((uId) => userProfileV3(token, uId).user);
  return {
    name: dmObj.name,
    members: membersArr,
  };
};

/**
  * Removes a user from a DMs members array, and owners array if necessary.
  *
  * @param {string} token - Logged-in user unique identifier.
  * @param {integer} dmId - DM unique identifier.
  * ...
  *
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{ error: string }} - If dmId is invalid.
  * @returns {{ error: string }} - If logged-in user is not a member of dm.
  * @returns {{}} - If all arguements valid.
*/
const dmLeaveV2 = (dmId: number, token: string) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  const dmObj = data.dms.filter((item) => item.dmId === dmId)[0];
  if (dmObj === undefined) {
    throw HTTPError(400, 'dmId does not refer to a valid DM');
  }

  const isMember = dmObj.allMembers.includes(tokenObj.uId);
  if (!isMember) {
    throw HTTPError(403, 'authorised user is not a member of the DM');
  }

  const hasha = require('hasha');
  const removeObj = data.tokens.find((item) => item.token === hasha('sponge' + token + 'bob'));
  for (const check of data.dms[dmId].ownerMembers) {
    if (removeObj.uId === check) {
      data.dms[dmId].ownerMembers.splice(dmObj.ownerMembers.indexOf(removeObj.uId), 1);
    }
  }

  for (const check of data.dms[dmId].allMembers) {
    if (removeObj.uId === check) {
      data.dms[dmId].allMembers.splice(dmObj.allMembers.indexOf(removeObj.uId), 1);
    }
  }

  const time = Math.floor(Date.now() / 1000);
  const userStats = data.userStats.find(u => u.uId === authUserId);
  data.userStats = data.userStats.filter(u => u.uId !== authUserId);
  const numDmsJoined = userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined - 1;
  userStats.dmsJoined.push({ numDmsJoined: numDmsJoined, timeStamp: time });
  data.userStats.push(userStats);

  setData(data);

  return {};
};

/**
  * Sends a message from authorised user to the DM specified by dmId.
  *
  * @param {string} token - Logged-in user unique identifier.
  * @param {integer} dmId - DM unique identifier.
  * @param {string} message - Message being sent.
  * ...
  *
  * @returns {{ error: string }} - If dmId is invalid.
  * @returns {{ error: string }} - If length of message is less than 1 or over 1000 characters.
  * @returns {{ error: string }} - If logged-in user is not a member of dm.
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{ messageId: integer }} - If all arguements valid.
*/
const messageSendDmV2 = (dmId: number, message: string, token: string) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  // dmId is not valid.
  const dmObj = data.dms.find((item) => item.dmId === dmId);
  if (dmObj === undefined) {
    throw HTTPError(400, 'DmId is invalid.');
  }

  // dmId is valid and the auth user is not a meber of the DM.
  const isMember = dmObj.allMembers.includes(tokenObj.uId);
  if (!isMember) {
    throw HTTPError(403, 'User is not part of the DM.');
  }

  // Length of messages is less than 1 or over 1000 characters.
  if (message.length < 1) {
    throw HTTPError(400, 'Message must at least be 1 character.');
  } else if (message.length > 1000) {
    throw HTTPError(400, 'Message must be less than 1000 characters.');
  }

  const timeStamp = Math.floor(Date.now() / 1000);
  let messageId = -1;
  for (const channeL of data.channels) { // Create messageId by finding highest messageId and adding 1
    for (const messagE of channeL.messages) {
      if (messagE.messageId > messageId) {
        messageId = messagE.messageId;
      }
    }
  }
  for (const dM of data.dms) { // Checks the message ids in dms
    for (const messagE of dM.messages) {
      if (messagE.messageId > messageId) {
        messageId = messagE.messageId;
      }
    }
  }
  messageId = messageId + 1;

  const userObj = data.users.find(u => u.authUserId === tokenObj.uId);

  const tag = /@[a-z0-9]+/g;
  let tags = message.match(tag) as string[];
  let tagged = Array.from(data.users);

  if (tags !== null) {
    tags = tags.map(handle => handle.slice(1));
    tagged = tagged.filter(user => tags.includes(user.handleStr));
    for (const user of tagged) {
      if (data.dms[dmId].allMembers.includes(user.authUserId)) {
        const storedUser = data.users.find(u => u.authUserId === user.authUserId);
        storedUser.notifications.unshift({
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${userObj.handleStr} tagged you in ${data.dms[dmId].name}: ${message.slice(0, 20)}`
        });
      }
    }
  }

  const react = {
    reactId: 1,
    uIds: [] as number[],
    isThisUserReacted: false
  };

  for (const dm of data.dms) {
    if (dmId === dm.dmId) {
      dm.messages.push(
        {
          messageId: messageId,
          uId: tokenObj.uId,
          message: message,
          timeSent: timeStamp,
          reacts: [react],
          isPinned: false
        }
      );
    }
  }

  const time = Math.floor(Date.now() / 1000);
  const userStats = data.userStats.find(i => i.uId === authUserId);
  data.userStats = data.userStats.filter(i => i.uId !== authUserId);
  const numMessagesSent = userStats.messagesSent[userStats.messagesSent.length - 1].numMessagesSent + 1;
  userStats.messagesSent.push({ numMessagesSent: numMessagesSent, timeStamp: time });
  data.userStats.push(userStats);

  setData(data);

  return { messageId: messageId };
};

/**
  * Given a DM with dmId that the authorised user is a member of, return
  * up to 50 messages between index "start" and "start + 50".
  *
  * @param {string} token - Logged-in user unique identifier.
  * @param {integer} dmId - DM unique identifier.
  * @param {integer} start - Starting index for messages.
  * ...
  *
  * @returns {{ error: string }} - If dmId is invalid.
  * @returns {{ error: string }} - IF start is greater than total number of messages.
  * @returns {{ error: string }} - If logged-in user is not a member of dm.
  * @returns {{ error: string }} - If token is invalid.
  * @returns {{
  *   message: array of objects, where each object contains {
 *     messageId: integer,
 *     uId: integer,
 *     message: string,
 *     timeSent: integer
 *   },
 *   start: integer,
 *   end: integer,
 * }} - If all arguments valid.
*/
const dmMessagesV2 = (dmId: number, start: number, token: string) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  // dmId is not valid.
  const dmObj = data.dms.find((item) => item.dmId === dmId);
  if (dmObj === undefined) {
    throw HTTPError(400, 'dmId does not refer to a valid DM.');
  }

  // dmId is valid and the auth user is not a meber of the DM.
  const isMember = dmObj.allMembers.includes(tokenObj.uId);
  if (!isMember) {
    throw HTTPError(403, 'User is not part of the DM.');
  }

  // Start is greater than messages in dm or start is less than 0.
  if (start > data.dms[dmId].messages.length || start < 0) {
    throw HTTPError(400, 'Start is greater than the total number of messages in the channel.');
  }

  let end: number;
  let ceiling: number;
  const numberOfMessages = data.dms[dmId].messages.length;
  if (numberOfMessages > start + 50) {
    end = start + 50;
    ceiling = end;
  } else if (numberOfMessages === 0 || numberOfMessages <= start + 50) {
    end = -1;
    ceiling = numberOfMessages;
  }

  const messagesArray = Array.from(data.dms[dmId].messages);
  const messages = messagesArray.reverse();
  const result = messages.filter((e, i) => (i >= start && i < ceiling));

  for (const message of result) {
    for (const react of message.reacts) {
      if (react.uIds.includes(tokenObj.uId)) {
        react.isThisUserReacted = true;
      } else {
        react.isThisUserReacted = false;
      }
    }
  }

  return { messages: result, start, end };
};

export { dmCreateV2, dmListV2, dmRemoveV2, dmDetailsV2, dmLeaveV2, messageSendDmV2, dmMessagesV2 };
