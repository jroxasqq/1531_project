import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import { isTokenValid } from './valid';
import { Channel, Dm, Message } from './types';
import { messageSendDmV2 } from './dm';
import { standupActiveV1, standupSendV1 } from './standup';

/**
  * Send a message from the authorised user to the channel specified by channelId
  *
  * @param {string} token - user temporary token
  * @param {number} channelId - channels' id
  * @param {string} message - message
  * ...
  *
  * @returns {{}} - Added to standup messages instead.
  * @returns {{ messageId: number }} - unique messageID
*/
const messageSendV2 = (token: string, channelId: number, message: string) => {
  // If a standup active(ongoing) in the channel, instead call standupSendV1().
  if (standupActiveV1(token, channelId).isActive) {
    standupSendV1(token, channelId, message);

    // By early returning your prevent adding this message to channel.messages
    // and also prevent adding notifications if message contains tags.
    return {};
  }

  const data = getData();

  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  if (message.length < 1 || message.length > 1000) {
    // if message is within length
    throw HTTPError(400, 'Message is less than 1 or more than 1000 characters');
  }

  const tokenUId = tokenObj.uId;

  const timeStamp = Math.floor(Date.now() / 1000);
  let messageId = -1;
  for (const channeL of data.channels) { // create messageId by finding highest messageId and adding 1
    for (const messagE of channeL.messages) {
      if (messagE.messageId > messageId) {
        messageId = messagE.messageId;
      }
    }
  }
  for (const dM of data.dms) { // checks the message ids in dms
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
      if (data.channels[channelId].allMembers.includes(user.authUserId)) {
        const storedUser = data.users.find(u => u.authUserId === user.authUserId);
        storedUser.notifications.unshift({
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${userObj.handleStr} tagged you in ${data.channels[channelId].name}: ${message.slice(0, 20)}`
        });
      }
    }
  }

  const react = {
    reactId: 1,
    uIds: [] as number[],
    isThisUserReacted: false
  };

  for (const channel of data.channels) { // adds message to channel
    if (channel.channelId === channelId) {
      channel.messages.push({
        messageId: messageId,
        uId: tokenUId,
        message: message,
        timeSent: timeStamp,
        reacts: [react],
        isPinned: false,
      });
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
  * Given a message, update its text with new text.
  *
  * @param {string} token - user temporary token
  * @param {number} messageId - message id
  * @param {string} message - message
  * ...
  *
  * @returns {{}}
*/
const messageEditV2 = (token: string, messageId: number, message: string) => {
  const data = getData();

  const tokenObj = isTokenValid(token);

  if (message.length > 1000) {
    // if message is within length
    throw HTTPError(400, 'Message length over 1000');
  }
  const tokenUId = tokenObj.uId; // get token uId
  let messageObj = null;
  let dmObj = null;
  let targetDm = null;
  let targetChannel = null;
  for (const channel of data.channels) { // checks for valid message id in channels
    for (const message of channel.messages) {
      if (message.messageId === messageId) {
        messageObj = message;
        targetChannel = channel;
      }
    }
  }
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (message.messageId === messageId) {
        dmObj = message; // checks for valid message id in channels
        targetDm = dm;
      }
    }
  }
  if (dmObj === null && messageObj === null) {
    throw HTTPError(400, 'Invalid messageId');
  }

  let hasPermissions = false;

  if (messageObj !== null) { // checks if token belongs to user who created the message
    if (targetChannel.ownerMembers.includes(tokenUId) || messageObj.uId === tokenObj.uId) {
      hasPermissions = true; // checks for authorised member in dm
    }
  } else if (dmObj !== null) {
    if (targetDm.ownerMembers.includes(tokenUId) || dmObj.uId === tokenObj.uId) {
      hasPermissions = true; // checks for authorised member in dm
    }
  }

  if (!hasPermissions) {
    throw HTTPError(403, 'User not authorised');
  }

  if (message.length === 0) { // if message is empty, calls remove function to delete message
    messageRemoveV2(token, messageId);
  }

  if (message.length > 0) {
    if (messageObj !== null) {
      for (const channeL of data.channels) { // finds the message and replaces it in channels
        for (const messagE of channeL.messages) {
          if (messagE.messageId === messageId) {
            messagE.message = message;
          }
        }
      }
    }
    if (dmObj !== null) { // finds the message and replaces it in dms
      for (const dm of data.dms) {
        for (const messagE of dm.messages) {
          if (messagE.messageId === messageId) {
            messagE.message = message;
          }
        }
      }
    }
  }

  const userObj = data.users.find(u => u.authUserId === tokenObj.uId);

  const tag = /@[a-z0-9]+/g;
  let tags = message.match(tag) as string[];
  let tagged = Array.from(data.users);

  if (tags !== null) {
    tags = tags.map(handle => handle.slice(1));
    tagged = tagged.filter(user => tags.includes(user.handleStr));
    for (const user of tagged) {
      if (targetChannel !== null) {
        if (targetChannel.allMembers.includes(user.authUserId)) {
          const storedUser = data.users.find(u => u.authUserId === user.authUserId);
          storedUser.notifications.unshift({
            channelId: targetChannel.channelId,
            dmId: -1,
            notificationMessage: `${userObj.handleStr} tagged you in ${targetChannel.name}: ${message.slice(0, 20)}`
          });
        }
      } else {
        if (targetDm.allMembers.includes(user.authUserId)) {
          const storedUser = data.users.find(u => u.authUserId === user.authUserId);
          storedUser.notifications.unshift({
            channelId: -1,
            dmId: targetDm.dmId,
            notificationMessage: `${userObj.handleStr} tagged you in ${targetDm.name}: ${message.slice(0, 20)}`
          });
        }
      }
    }
  }

  setData(data);
  return {};
};

/**
  * Given a messageId for a message, this message is removed from the channel/DM
  *
  * @param {string} token - user temporary token
  * @param {number} messageId - message id
  * ...
  *
  * @returns {{}}
*/
const messageRemoveV2 = (token: string, messageId: number) => {
  const data = getData();

  const tokenObj = isTokenValid(token);
  const tokenUId = tokenObj.uId; // get token uId

  let messageObj = null;
  let dmObj = null;
  let targetDm = null;
  let targetChannel = null;
  for (const channel of data.channels) { // checks for valid message id in channels
    for (const message of channel.messages) {
      if (message.messageId === messageId) {
        messageObj = message;
        targetChannel = channel;
      }
    }
  }
  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (message.messageId === messageId) {
        dmObj = message; // checks for valid message id in channels
        targetDm = dm;
      }
    }
  }
  if (dmObj === null && messageObj === null) {
    throw HTTPError(400, 'Invalid messageId');
  }

  let hasPermissions = false;

  if (messageObj !== null) { // checks if token belongs to user who created the message
    if (targetChannel.ownerMembers.includes(tokenUId) || messageObj.uId === tokenObj.uId) {
      hasPermissions = true; // checks for authorised member in dm
    }
  } else if (dmObj !== null) {
    if (targetDm.ownerMembers.includes(tokenUId) || dmObj.uId === tokenObj.uId) {
      hasPermissions = true; // checks for authorised member in dm
    }
  }

  if (!hasPermissions) {
    throw HTTPError(403, 'User not authorised');
  }

  if (messageObj !== null) {
    for (const channeL of data.channels) { // finds the message and removes it from a channel
      for (const messageIndex in channeL.messages) {
        const messageIndexInt = parseInt(messageIndex);
        if (channeL.messages[messageIndexInt].messageId === messageId) {
          channeL.messages.splice(messageIndexInt, 1);
        }
      }
    }
  }

  if (dmObj !== null) {
    for (const dm of data.dms) { // finds the message and removes it from a dm
      for (const messageIndex in dm.messages) {
        const messageIndexInt = parseInt(messageIndex);
        if (dm.messages[messageIndex].messageId === messageId) {
          dm.messages.splice(messageIndexInt, 1);
        }
      }
    }
  }

  setData(data);
  return {};
};

/**
  * Given a message within a channel or DM the authorised
  * user is part of, adds a "react" to that particular message.
  *
  * @param {string} token - user temporary token
  * @param {number} messageId - id of message to be reacted to
  * @param {number} reactId - id of react type
  * ...
  *
  * @returns {{}}
*/
const messageReactV1 = (token: string, messageId: number, reactId: number) => {
  const data = getData();
  const tokenObj = isTokenValid(token);
  let targetChannel = null;
  let targetDm = null;
  let targetMembers: number[] = [];
  let messageObj: Message | undefined;
  for (const channel of data.channels) {
    if (messageObj === undefined) {
      messageObj = channel.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetChannel = channel;
        targetMembers = channel.allMembers;
      }
    }
  }

  for (const dm of data.dms) {
    if (messageObj === undefined) {
      messageObj = dm.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetDm = dm;
        targetMembers = dm.allMembers;
      }
    }
  }

  if (messageObj === undefined) {
    throw HTTPError(400, 'invalid messageId');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'invalid reactId');
  }

  if (!targetMembers.includes(tokenObj.uId)) {
    throw HTTPError(400, 'user not member of channel/dm');
  }

  const reactObj = messageObj.reacts.find(react => react.reactId === reactId);

  if (reactObj.uIds.includes(tokenObj.uId)) {
    throw HTTPError(400, 'duplicate react');
  }
  reactObj.uIds.push(tokenObj.uId);
  reactObj.isThisUserReacted = true;

  if (targetMembers.includes(messageObj.uId)) {
    const sender = data.users.find(u => u.authUserId === messageObj.uId);
    const reactor = data.users.find(u => u.authUserId === tokenObj.uId);
    if (targetChannel !== null) {
      sender.notifications.unshift({
        channelId: targetChannel.channelId,
        dmId: -1,
        notificationMessage: `${reactor.handleStr} reacted to your message in ${targetChannel.name}`
      });
    } else {
      sender.notifications.unshift({
        channelId: -1,
        dmId: targetDm.dmId,
        notificationMessage: `${reactor.handleStr} reacted to your message in ${targetDm.name}`
      });
    }
  }

  setData(data);

  return {};
};

/**
  * Given a message within a channel or DM the authorised
  * user is part of, removes a "react" to that particular message.
  *
  * @param {string} token - user temporary token
  * @param {number} messageId - id of message to be reacted to
  * @param {number} reactId - id of react type
  * ...
  *
  * @returns {{}}
*/
const messageUnreactV1 = (token: string, messageId: number, reactId: number) => {
  const data = getData();
  const tokenObj = isTokenValid(token);
  let targetMembers: number[] = [];
  let messageObj: Message | undefined;
  for (const channel of data.channels) { // finds the message in the channel
    if (messageObj === undefined) {
      messageObj = channel.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetMembers = channel.allMembers; // adds all the members of channel
      }
    }
  }

  for (const dm of data.dms) { // finds the message in the dm
    if (messageObj === undefined) {
      messageObj = dm.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetMembers = dm.allMembers;
      }
    }
  }

  if (messageObj === undefined) {
    throw HTTPError(400, 'invalid messageId');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'invalid reactId');
  }

  if (!targetMembers.includes(tokenObj.uId)) {
    throw HTTPError(400, 'user not member of channel/dm');
  }

  const reactObj = messageObj.reacts.find(react => react.reactId === reactId); // finds the react with react Id 1
  if (!reactObj.uIds.includes(tokenObj.uId)) {
    throw HTTPError(400, 'user has not reacted');
  }
  const isReacted = reactObj.uIds.includes(tokenObj.uId); // checks if user has reacted
  if (isReacted) {
    const index = reactObj.uIds.findIndex(id => id === tokenObj.uId); // finds index of uId
    reactObj.uIds.splice(index, 1); // removes uId from array
  }

  reactObj.isThisUserReacted = false; // sets is user reacted to false

  setData(data);
  return {};
};

/**
  * A new message containing the contents of both the original message and the optional message
  * will be sent to the channel/DM identified by the channelId/dmId.
  *
  * @param {string} token - user temporary token
  * @param {number} ogMessageId - id of message to be shared
  * @param {string} message - optional message
  * @param {string} channelId - id of channel to be shared to
  * @param {number} dmId - id of dm to be shared to
  * ...
  *
  * @returns {{ sharedMessageId: number }} - unique messageID of shared message
*/
const messageShareV1 = (token: string, ogMessageId: number, message: string, channelId: number, dmId: number) => {
  const data = getData();
  const tokenObj = isTokenValid(token);

  if (channelId !== -1 && dmId !== -1) {
    throw HTTPError(400, 'neither channelId nor dmId are -1');
  }

  let target;
  if (dmId === -1) {
    target = data.channels.find(channel => channel.channelId === channelId);
  } else {
    target = data.dms.find(dm => dm.dmId === dmId);
  }

  if (target === undefined) {
    throw HTTPError(400, 'both channelId and dmId are invalid');
  }

  if (!target?.allMembers.includes(tokenObj.uId)) {
    throw HTTPError(403, 'user not member of target channel/dm');
  }

  let source: Channel | Dm | undefined;
  let messageObj: Message | undefined;
  for (const channel of data.channels) {
    if (messageObj === undefined) {
      messageObj = channel.messages.find(message => message.messageId === ogMessageId);
      if (messageObj !== undefined) {
        source = channel;
      }
    }
  }

  for (const dm of data.dms) {
    if (messageObj === undefined) {
      messageObj = dm.messages.find(message => message.messageId === ogMessageId);
      if (messageObj !== undefined) {
        source = dm;
      }
    }
  }

  if (messageObj === undefined) {
    throw HTTPError(400, 'invalid messageId');
  }

  if (!source?.allMembers.includes(tokenObj.uId)) {
    throw HTTPError(400, 'user not member of source channel/dm');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message too long');
  }

  let sharedMessageId = 0;
  if (dmId === -1) {
    sharedMessageId = messageSendV2(token, channelId, messageObj.message + ' ' + message).messageId;
  } else {
    sharedMessageId = messageSendDmV2(dmId, messageObj.message + ' ' + message, token).messageId;
  }

  return { sharedMessageId: sharedMessageId };
};

/**
  * Given a message within a channel or DM, marks it as "pinned".
  *
  * @param {string} token - user temporary token
  * @param {number} messageId - id of message to be reacted to
  * ...
  *
  * @returns {{}}
  * @return {}
*/
const messagePinV1 = (token: string, messageId: number) => {
  const data = getData();
  const tokenObj = isTokenValid(token);
  let targetMembers: number[] = [];
  let messageObj: Message | undefined;
  let targetOwners: number[] = [];
  let isChannel = false; // needed when checking for owner permissions
  for (const channel of data.channels) { // finds the message in the channel
    if (messageObj === undefined) {
      messageObj = channel.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetMembers = channel.allMembers; // adds all the members of channel
        isChannel = true;
        targetOwners = channel.ownerMembers;
      }
    }
  }

  for (const dm of data.dms) { // finds the message in the dm
    if (messageObj === undefined) {
      messageObj = dm.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetMembers = dm.allMembers;
        targetOwners = dm.ownerMembers;
      }
    }
  }
  if (messageObj === undefined) {
    throw HTTPError(400, 'invalid messageId');
  }
  if (!targetMembers.includes(tokenObj.uId)) {
    throw HTTPError(400, 'user not member of channel/dm');
  }
  if (messageObj.isPinned) {
    throw HTTPError(400, 'message already pinned');
  }
  const user = data.users.filter(user => user.authUserId === tokenObj.uId)[0]; // finds user object using uId
  let globalCheck = false;
  if (isChannel) { // checks for global owner
    globalCheck = user.permissionId === 1;
  }
  if (!targetOwners.includes(tokenObj.uId)) { // checks if user has owner perms
    if (!globalCheck) {
      throw HTTPError(403, 'user not authorised');
    }
  }

  messageObj.isPinned = true;

  setData(data);
  return {};
};
/**
  * Given a message within a channel or DM, removes its mark as "pinned".
  *
  * @param {string} token - user temporary token
  * @param {number} messageId - id of message to be reacted to
  * ...
  * @returns {{}}
  *
*/
const messageUnpinV1 = (token: string, messageId: number) => {
  const data = getData();
  const tokenObj = isTokenValid(token);
  let targetMembers: number[] = [];
  let messageObj: Message | undefined;
  let targetOwners: number[] = [];
  let isChannel = false; // needed when checking for owner permissions
  for (const channel of data.channels) { // finds the message in the channel
    if (messageObj === undefined) {
      messageObj = channel.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetMembers = channel.allMembers; // adds all the members of channel
        isChannel = true;
        targetOwners = channel.ownerMembers;
      }
    }
  }

  for (const dm of data.dms) { // finds the message in the dm
    if (messageObj === undefined) {
      messageObj = dm.messages.find(message => message.messageId === messageId);
      if (messageObj !== undefined) {
        targetMembers = dm.allMembers;
        targetOwners = dm.ownerMembers;
      }
    }
  }
  if (messageObj === undefined) {
    throw HTTPError(400, 'invalid messageId');
  }
  if (!targetMembers.includes(tokenObj.uId)) {
    throw HTTPError(400, 'user not member of channel/dm');
  }
  if (!messageObj.isPinned) {
    throw HTTPError(400, 'message already unpinned');
  }
  const user = data.users.filter(user => user.authUserId === tokenObj.uId)[0]; // finds user object using uId
  let globalCheck = false;
  if (isChannel) { // checks for global owner
    globalCheck = user.permissionId === 1;
  }
  if (!targetOwners.includes(tokenObj.uId)) { // checks if user has owner perms
    if (!globalCheck) {
      throw HTTPError(403, 'user not authorised');
    }
  }

  messageObj.isPinned = false;

  setData(data);
  return {};
};

/**
  * Sends a message from the authorised user to the channel
  * specified by channelId automatically at a specified time in the future.
  *
  * @param {string} token - user temporary token
  * @param {number} channelId - id of the channel that the message must be sent to
  * @param {string} message - message that user wants to send
  * @param {number} timeSent - time that the message shoould be sent
  * ...
  * @returns {{ messageId: number }} - unique messageID (since messageSend is called)
*/
const messageSendLaterV1 = (token: string, channelId: number, message: string, timeSent: number) => {
  const data = getData();
  const timeStamp = Math.floor(Date.now() / 1000);
  if (timeStamp > timeSent) {
    throw HTTPError(400, 'Time in the past');
  }
  const tokenObj = isTokenValid(token);
  if (channelId < 0 || channelId >= data.channels.length) {
    // If channelId is out of possible range.
    throw HTTPError(400, 'Invalid channelId');
  }

  if (message.length < 1 || message.length > 1000) {
    // if message is within length
    throw HTTPError(400, 'Message is less than 1 or more than 1000 characters');
  }
  const tokenUId = tokenObj.uId;
  if (!data.channels[channelId].allMembers.includes(tokenUId)) { // check if authorised user is not a member of the channel
    throw HTTPError(403, 'Not a member of the channel');
  }

  // Send message on once specified delay time reached.
  const timeDelay = (timeSent - timeStamp) * 1000; // * 1000 to convert to milliseconds.
  setTimeout(() => {
    messageSendV2(token, channelId, message);
  }, timeDelay);

  // Generate the unique messageId.
  let maxChannelMessageId = -1;
  for (const channeL of data.channels) { // Create messageId by finding highest messageId and adding 1
    const channelMessageIds = channeL.messages.map(messageObj => messageObj.messageId);

    // Update maxChannelMessageId if this channel contains a higher messageId.
    maxChannelMessageId = Math.max(maxChannelMessageId, Math.max(...channelMessageIds));
  }

  let maxDmMessageId = -1;
  for (const dM of data.dms) { // Checks the message ids in dms
    const dmMessageIds = dM.messages.map(messageObj => messageObj.messageId);

    // Update maxDmMessageId if this dm contains a higher messageId.
    maxDmMessageId = Math.max(maxDmMessageId, Math.max(...dmMessageIds));
  }

  const messageId = Math.max(maxChannelMessageId, maxDmMessageId) + 1;

  return { messageId: messageId };
};

/**
  * Sends a message from the authorised user to the channel
  * specified by channelId automatically at a specified time in the future.
  *
  * @param {string} token - user temporary token
  * @param {number} dmId - id of the dm that the message must be sent to
  * @param {string} message - message that user wants to send
  * @param {number} timeSent - time that the message shoould be sent
  * ...
  * @returns {{ messageId: number }} - unique messageID (since messageSendDm is called)
*/
const messageSendLaterDmV1 = (dmId: number, message: string, timeSent: number, token: string) => {
  const data = getData();
  const timeRemain = Math.ceil(timeSent - Math.floor(Date.now() / 1000)) * 1000;
  const dmArr = data.dms;
  const tokenObj = isTokenValid(token);

  if (message.length > 1000 || message.length < 1) {
    throw HTTPError(400, 'Invalid message length');
  }
  if (timeRemain < 0) {
    throw HTTPError(400, 'Past timesent');
  }
  if (dmArr.find(dm => dm.dmId === dmId) === undefined) {
    throw HTTPError(400, 'Invalid dmId');
  }
  if (dmArr[dmId].allMembers.find(uId => uId === tokenObj.uId) === undefined) {
    throw HTTPError(400, 'Unauthorised user');
  }

  // Send message on once specified delay time reached.
  const timeDelay = timeRemain; // * 1000 to convert to milliseconds.
  setTimeout(() => {
    messageSendDmV2(dmId, message, token);
  }, timeDelay);

  // Generate the unique messageId.
  let maxChannelMessageId = -1;
  for (const channeL of data.channels) { // Create messageId by finding highest messageId and adding 1
    const channelMessageIds = channeL.messages.map(messageObj => messageObj.messageId);

    // Update maxChannelMessageId if this channel contains a higher messageId.
    maxChannelMessageId = Math.max(maxChannelMessageId, Math.max(...channelMessageIds));
  }

  let maxDmMessageId = -1;
  for (const dM of data.dms) { // Checks the message ids in dms
    const dmMessageIds = dM.messages.map(messageObj => messageObj.messageId);

    // Update maxDmMessageId if this dm contains a higher messageId.
    maxDmMessageId = Math.max(maxDmMessageId, Math.max(...dmMessageIds));
  }

  const messageId = Math.max(maxChannelMessageId, maxDmMessageId) + 1;

  return { messageId: messageId };
};

export { messageSendV2, messageEditV2, messageRemoveV2, messageReactV1, messageShareV1, messageUnreactV1, messagePinV1, messageUnpinV1, messageSendLaterV1, messageSendLaterDmV1 };
