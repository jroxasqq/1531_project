import { getData, setData } from './dataStore';
import { userProfileV3 } from './users';
import { isTokenValid } from './valid';
import HTTPError from 'http-errors';
import { Message } from './types';
import { standupActiveV1 } from './standup';

/**
  *
  * Given a channel with ID channelId that the authorised user
  * is a member of, returns up to 50 messages between index
  * "start" and "start + 50".
  *
  * @param {string} token - session unique indentifier
  * @param {number} channelId - Channel unique indentifier
  * @param {number} start - start index for returned messages
  * ...
  *
  * @returns {{error: string}} - channelId does not refer to a valid channel
  * @returns {{error: string}} - start is greater than the total number of
  *                              messages in the channel
  * @returns {{error: string}} - channelId is valid and the authorised user
  *                              is not a member of the channel
  * @returns {{error: string}} - authUserId is invalid
  * @returns {{
 *   message: array of objects, where each object contains {
 *     messageId: integer,
 *     uId: integer,
 *     message: string,
 *     timeSent: integer
 *   },
 *   start: integer,
 *   end: integer,
 * }} - input is valid
*/
const channelMessagesV3 = (token: string, channelId: number, start: number) => {
  const data = getData();

  // get corresponding token object to given token string
  const tokenObj = isTokenValid(token);

  // check if channelId is within possible range
  const channelObj = data.channels.find(channel => channel.channelId === channelId);
  if (channelObj === undefined) {
    throw HTTPError(400, 'invalid channel id');
  }

  // check if user is a member of the channel
  if (!data.channels[channelId].allMembers.includes(tokenObj.uId)) {
    throw HTTPError(403, 'User not a member of channel');
  }

  // check for no messages case
  if (data.channels[channelId].messages.length === 0 && start === 0) {
    return {
      messages: data.channels[channelId].messages,
      start: 0,
      end: -1,
    };
  }

  // check if start is within possible range
  if (start >= data.channels[channelId].messages.length || start < 0) {
    throw HTTPError(400, 'start value invalid');
  }

  const copy = Array.from(data.channels[channelId].messages);
  const reversedMessages = copy.reverse();
  let messages: Message[] = [];
  let end = -1;
  // if there are at most 50 messages in the channel
  if (data.channels[channelId].messages[start + 50] === undefined) {
    messages = reversedMessages.slice(start);

    // if there are more than 50 messages in the channel
  } else {
    messages = reversedMessages.slice(start, start + 50);
    end = start + 50;
  }

  for (const message of messages) {
    for (const react of message.reacts) {
      if (react.uIds.includes(tokenObj.uId)) {
        react.isThisUserReacted = true;
      } else {
        react.isThisUserReacted = false;
      }
    }
  }
  return {
    messages: messages,
    start: start,
    end: end
  };
};

/**
  * Given a users unique identifier (authUserId), they'll be added
  * as a member to the channel specified by the channels unique
  * identifer (channelId) only under cases specified below.
  *
  *
  * @param {string} token - Session unique indentifier
  * @param {number} channelId - Channel unique indentifier
  * ...
  *
  * @returns {{ error: string }} - If authUserId is invalid.
  * @returns {{ error: string }} - If channelId is invalid.
  * @returns {{ error: string }} - If user is already a member of the channel.
  * @returns {{ error: string }} - If channel is private and user is not the global owner.
  * @returns {{}} - If all arguments are valid.
  *
*/
const channelJoinV3 = (token: string, channelId: number) => {
  const data = getData();

  // Return errors for invalid inputs.

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  const channel = data.channels.filter((channel) => channel.channelId === channelId)[0];
  if (channel === undefined) {
    // If channelId is invalid.
    throw HTTPError(400, 'Channel does not exist.');
  }

  // Return error if user is already a member of the channel.
  const isMember = data.channels[channelId].allMembers.includes(authUserId);
  if (isMember) {
    throw HTTPError(400, 'User is already a member of the channel.');
  }

  // Return error for user trying to join private channel
  // and their not the global owner.
  const user = data.users.filter((user) => user.authUserId === authUserId)[0];
  const isGlobalOwner = (user.permissionId === 1);
  const isPrivate = (channel.isPublic === false);
  if (isPrivate && !isGlobalOwner) {
    throw HTTPError(403, 'Channel is private, invite required.');
  }

  // Add user's id to channels users array.
  data.channels[channelId].allMembers.push(authUserId);

  const time = Math.floor(Date.now() / 1000);
  const userStats = data.userStats.find(u => u.uId === authUserId);
  data.userStats = data.userStats.filter(u => u.uId !== authUserId);
  const numChannelsJoined = userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined + 1;
  userStats.channelsJoined.push({ numChannelsJoined: numChannelsJoined, timeStamp: time });
  data.userStats.push(userStats);

  setData(data);

  return {};
};

/**
  * Given a inviter's unique identifier (authUserId), an
  * invitee's unique indentifer (uId) and a channels unique
  * indentifier (channelId), the invitee will be added as
  * a member to the specified channel, only under conditions
  * specified below.
  *
  *
  * @param {string} token - Session unique indentifier
  * @param {number} channelId - Channel unique indentifier
  * @param {number} uId - Invitee unique indentifier
  * ...
  *
  * @returns {{ error: string }} - If authUserId is invalid.
  * @returns {{ error: string }} - If channelId is invalid.
  * @returns {{ error: string }} - If uId is invalid.
  * @returns {{ error: string }} - If Inviter is not a member of the channel.
  * @returns {{ error: string }} - If Invitee is already a member of the channel.
  * @returns {{}} - If all arguments are valid.
  *
*/
const channelInviteV3 = (token: string, channelId: number, uId: number) => {
  const data = getData();

  // Return errors for invalid inputs.

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  const channel = data.channels.filter((channel) => channel.channelId === channelId)[0];
  const invitee = data.users.find((user) => user.authUserId === uId);
  if (channel === undefined) {
    // If channelId is invalid.
    throw HTTPError(400, 'Channel does not exist.');
  } else if (invitee === undefined) {
    // If invitee's uId is invalid.
    throw HTTPError(400, 'Invitee does not exist.');
  }

  // Return errors related to membership.
  const inviterIsMember = channel.allMembers.includes(authUserId);
  const inviteeIsMember = channel.allMembers.includes(uId);
  if (!(inviterIsMember)) {
    // If inviter themselves aren't a member of the channel.
    throw HTTPError(403, 'Inviter is not a member of the channel.');
  } else if (inviteeIsMember) {
    // If invitee is already a member of the channel.
    throw HTTPError(400, 'Invitee is already a member of the channel.');
  }

  // Add invitee's id to channels users array.
  channel.allMembers.push(uId);

  const inviter = data.users.find(u => u.authUserId === tokenObj.uId);
  invitee.notifications.unshift({
    channelId: channelId,
    dmId: -1,
    notificationMessage: `${inviter.handleStr} added you to ${channel.name}`
  });

  const time = Math.floor(Date.now() / 1000);
  const userStats = data.userStats.find(u => u.uId === uId);
  data.userStats = data.userStats.filter(u => u.uId !== uId);
  const numChannelsJoined = userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined + 1;
  userStats.channelsJoined.push({ numChannelsJoined: numChannelsJoined, timeStamp: time });
  data.userStats.push(userStats);

  setData(data);

  return {};
};

/**
 * Given a user's token and channelId, the function will firstly
 * check that the token being parsed in is valid and belongs to
 * a register or valid user, and if so, it will output the basic
 * details of that channel including channel name, whether it is
 * public or private, the owner members, and all members in the
 * channel.
 *
 * @param {string} token - session Id of registered account
 * @param {integer} channelId - Id of the channel created
 * ...
 *
 * @returns {{ error: string }} - If token is invalid.
 * @returns {{ error: string }} - If channelId does not refer to valid channel.
 * @returns {{ error: string }} - If user is not a member of the channel.
 * @returns {{ name, isPublic, ownerMembers, allMembers }} - If all arguments valid
 */
const channelDetailsV3 = (channelId: number, token: string) => {
  const data = getData();

  let channelIdCheck = false;
  let authUserInChannel = false;
  const channelArr = data.channels;

  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  // Loops through channels data and all members array. If channelId matches
  // with the channelId in dataStore, set channel to be foundChannel. Likewise,
  // if the user Id in all members array is found, set checker to be true.
  let foundChannel = null;
  for (const channel of channelArr) { // Loops through channels data.
    if (channelId === channel.channelId) {
      channelIdCheck = true;
      foundChannel = channel;
      for (const member of channel.allMembers) {
        if (authUserId === member) {
          authUserInChannel = true;
        }
      }
    }
  }

  if (channelIdCheck === false) { // If channelId not found, return error.
    throw HTTPError(400, 'ChannelId is not valid');
  }

  if (authUserInChannel === false) { // If user is not a member, return error.
    throw HTTPError(403, 'User is not a member of this channel');
  }

  // Pushing object user into ownerMembers and allMembers which was
  // made in userProfileV1.
  const ownerMembersArray = [];
  const allMembersArray = [];

  for (const id of data.channels[channelId].ownerMembers) {
    ownerMembersArray.push(userProfileV3(token, id).user);
  }

  for (const id of data.channels[channelId].allMembers) {
    allMembersArray.push(userProfileV3(token, id).user);
  }

  return {
    name: foundChannel.name,
    isPublic: foundChannel.isPublic,
    ownerMembers: ownerMembersArray,
    allMembers: allMembersArray
  };
};

/**
  * Make user with user id uId an owner of the channel.
  *
  * @param {string} token - user temporary token
  * @param {number} channelId - channel id
  * @param {number} uId - uId of user to be added as owner
  *
  *
  * @returns {{error: string}} - invalid channel id
  * @returns {{error: string}} - invalid user id
  * @returns {{error: string}} - user already an owner
  * @returns {{error: string}} - invalid token
  * @returns {{error: string}} - authuser doesn't have permissions
  * @returns {{}} - user successfully added as owner
*/
const channelAddOwnerV2 = (token: string, channelId: number, uId: number) => {
  const data = getData();

  const channelObj = data.channels.find(channel => channel.channelId === channelId);
  if (channelObj === undefined) {
    throw HTTPError(400, 'invalid channel id');
  }

  const userObj = data.users.find(user => user.authUserId === uId);
  if (userObj === undefined) {
    throw HTTPError(400, 'Invalid User ID');
  }

  if (!data.channels[channelId].allMembers.includes(uId)) {
    throw HTTPError(400, 'user not a member of channel');
  }

  if (data.channels[channelId].ownerMembers.includes(uId)) {
    throw HTTPError(400, 'user already an owner of channel');
  }

  const tokenObj = isTokenValid(token);

  if (tokenObj.uId !== 0 && !data.channels[channelId].ownerMembers.includes(tokenObj.uId)) {
    throw HTTPError(403, 'authorised user does not have owner permissions');
  }

  data.channels[channelId].ownerMembers.push(uId);

  setData(data);

  return {};
};

/**
  * Given a channel with ID channelId that the authorised user
  * is a member of, remove them as a member of the channel.
  * Their messages should remain in the channel. If the only
  * channel owner leaves, the channel will remain.
  *
  * @param {string} token - user temporary token
  * @param {number} channelId - channel id
  *
  *
  * @returns {{error: string}} - invalid channel id
  * @returns {{error: string}} - user not a channel member
  * @returns {{error: string}} - invalid token
  * @returns {{}} - user successfully removed from channel
*/
const channelLeaveV2 = (token: string, channelId: number) => {
  const data = getData();

  // check if channelId is within possible range
  const channelObj = data.channels.find(channel => channel.channelId === channelId);
  if (channelObj === undefined) {
    throw HTTPError(400, 'invalid channel id');
  }

  // find object with corresponding token string
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  // check if user is a member of the channel
  if (!channelObj.allMembers.includes(tokenObj.uId)) {
    throw HTTPError(403, 'user not a member of channel');
  }

  // check if user started a standup
  const isStandupCreator = (channelObj.standup.creator === tokenObj.uId);
  if (standupActiveV1(token, channelId).isActive && isStandupCreator) {
    throw HTTPError(400, 'user started a standup');
  }

  // remove user from all members array
  data.channels[channelId].allMembers = data.channels[channelId].allMembers.filter(id => id !== tokenObj.uId);

  // remove user from owners array
  data.channels[channelId].ownerMembers = data.channels[channelId].ownerMembers.filter(id => id !== tokenObj.uId);

  const time = Math.floor(Date.now() / 1000);
  const userStats = data.userStats.find(u => u.uId === authUserId);
  data.userStats = data.userStats.filter(u => u.uId !== authUserId);
  const numChannelsJoined = userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined - 1;
  userStats.channelsJoined.push({ numChannelsJoined: numChannelsJoined, timeStamp: time });
  data.userStats.push(userStats);

  setData(data);

  return {};
};

/**
  * Remove user with user id uId as an owner of the channel.
  *
  * @param {string} token - user temporary token
  * @param {number} channelId - channel id
  * @param {number} uId - uId of owner to be removed
  *
  *
  * @returns {{error: string}} - invalid channel id
  * @returns {{error: string}} - invalid uId
  * @returns {{error: string}} - user not an owner
  * @returns {{error: string}} - invalid token
  * @returns {{error: string}} - authuser doesn't have permissions
  * @returns {{}} - user successfully removed as owner
*/
const channelRemoveOwnerV2 = (token: string, channelId: number, uId: number) => {
  const data = getData();

  if (channelId < 0 || channelId >= data.channels.length) {
    throw HTTPError(400, 'Invalid channelId');
  }
  let validUId = false;
  for (const User of data.users) { // check if uId exists
    if (User.authUserId === uId) {
      validUId = true;
    }
  }
  if (!validUId) {
    throw HTTPError(400, 'uId does not exist');
  }

  if (!data.channels[channelId].allMembers.includes(uId)) {
    throw HTTPError(400, 'user not a member of channel');
  }

  if (!data.channels[channelId].ownerMembers.includes(uId)) {
    throw HTTPError(400, 'uId is not owner');
  }

  if (data.channels[channelId].ownerMembers.length === 1) {
    throw HTTPError(400, 'uId is the only owner');
  }

  const tokenObj = isTokenValid(token);

  if (tokenObj.uId === 0 && !data.channels[channelId].ownerMembers.includes(tokenObj.uId)) {
    throw HTTPError(403, 'Global owner is not a member of the channel');
  }

  if (tokenObj.uId !== 0 && !data.channels[channelId].ownerMembers.includes(tokenObj.uId)) {
    throw HTTPError(403, 'User is not authorised');
  }

  data.channels[channelId].ownerMembers = data.channels[channelId].ownerMembers.filter(ownerId => ownerId !== uId);

  setData(data);

  return {};
};

export { channelMessagesV3, channelJoinV3, channelInviteV3, channelDetailsV3, channelAddOwnerV2, channelLeaveV2, channelRemoveOwnerV2 };
