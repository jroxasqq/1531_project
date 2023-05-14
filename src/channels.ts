import { getData, setData } from './dataStore';
import { Message } from './types';
import { isTokenValid } from './valid';
import HTTPError from 'http-errors';

/**
 * Given a user's token, will return an array with all the channels with
 * the user inside.
 *
 * @param {string} token - User unique session Id
 * ...
 *
 * @returns {{ channels: array of objects, where each object contains types {channelId, name} }}
*/
const channelsListV3 = (token: string) => {
  const data = getData();

  const channelArr = data.channels;
  const userchannelArr = [];

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  for (const channel of channelArr) {
    const memberArr = channel.allMembers;
    for (const member of memberArr) {
      if (authUserId === member) {
        const channelList = {
          channelId: channel.channelId,
          name: channel.name
        };
        userchannelArr.push(channelList);
      }
    }
  }

  return {
    channels: userchannelArr
  };
};

/**
 * Given a user's authUserId, name for the channel and boolean value for public
 * settings, function will create a channel with inputted name which will be
 * public or private based on boolean value and adds the user into the channel
 * automatically. Returns channelId.
 *
 * @param {integer} authUserId - user Id of person using the function
 * @param {string} name - channel name
 * @param {boolean} isPublic - setting for public or private.
 * ...
 *
 * @returns {{ channelId: integer }}
 */
const channelsCreateV3 = (name: string, isPublic: boolean, token: string) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);
  const authUserId = tokenObj.uId;

  if (name.length < 1 || name.length > 20) { // Checks if name length is valid.
    throw HTTPError(400, 'Invalid channel name');
  }

  const channelArr = data.channels;

  const allMembers = [];
  const ownerMembers = [];

  allMembers.push(tokenObj.uId);
  ownerMembers.push(tokenObj.uId);

  const standupObj = {
    isActive: false,
    timeFinish: null as number,
    creator: -1,
    handles: [] as string[],
    messages: [] as string[]
  };

  const channelId = channelArr.length; // ChannelId based off number of users in array.s
  const channel = {
    channelId: channelId,
    name: name,
    isPublic: isPublic,
    ownerMembers: ownerMembers,
    allMembers: allMembers,
    messages: [] as Message[],
    standup: standupObj
  }; // Creates channel object.

  channelArr.push(channel);

  const time = Math.floor(Date.now() / 1000);
  const userStats = data.userStats.find(u => u.uId === authUserId);
  const numChannelsJoined = userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined + 1;
  userStats.channelsJoined.push({ numChannelsJoined: numChannelsJoined, timeStamp: time });
  data.userStats.push(userStats);

  setData(data);
  return {
    channelId: channelId
  };
};

/**
 * Given a user's token, this function will return an object called channels which
 * will provide an array of all channels (and their respective details) that the authorised
 * user is part of, including private channels too. In case of an invalid authUserId,
 * the function will print an error message clarifying this case.
 *
 * @param {string} token - session Id of user calling function.
 * ...
 * @returns {{ error: string }} - Token is invalid.
 * @returns {{ channels: array of objects, where each object contains { channelId, name } }} - If all arguments are valid.
 */
const channelsListAllV3 = (token: string) => {
  const data = getData();

  const channelArr = data.channels;
  const userchannelArr = [];

  // Throw error if token is invalid.
  isTokenValid(token);

  for (const channel of channelArr) {
    const channelList = {
      channelId: channel.channelId,
      name: channel.name
    };
    userchannelArr.push(channelList);
  }

  setData(data);
  return {
    channels: userchannelArr
  };
};

export { channelsListV3, channelsCreateV3, channelsListAllV3 };
