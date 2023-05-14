import { getData, setData } from './dataStore';
import { isTokenValid } from './valid';
import HTTPError from 'http-errors';
import { React } from './types';

/**
 * Start a standup in a channel, wherein all messages made within the
 * given time interval (the given length in seconds) are merged into
 * a single message in the channel.
 *
 * @param {string} token - Logged-in user unique identifier.
 * @param {number} channelId - Channel unique identifier.
 * @param {number} length - Time interval of standup in seconds.
 *
 * @returns {{ error: string }} - If token is invalid.
 * @returns {{ error: string }} - If channelId is invalid.
 * @returns {{ error: string }} - If length is negative.
 * @returns {{ error: string }} - If another standup is ongoing in the channel.
 * @returns {{ error: string }} - If channelId valid, but user specified by the
 *                                token is not a member of the channel.
 * @returns {{ timeFinish: number }} - If all arguements valid and no other standup
 *                                     ongoing in the channel.
 *
*/
const standupStartV1 = (token: string, channelId: number, length: number) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  // Throw error if channelId is invalid.
  const channel = data.channels.find(channel => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'ChannelId is invalid.');
  }

  // Throw error if length is negative.
  if (length < 0) {
    throw HTTPError(400, 'Standup length can not be negative.');
  }

  // Throw error if another standup already ongoing in the channel.
  if (channel.standup.isActive) {
    throw HTTPError(400, 'Another standup ongoing in the channel.');
  }

  // Throw error if channelId is valid but user is not a member of the channel.
  // * At this point, channelId has been validated *
  const userIsMember = channel.allMembers.includes(tokenObj.uId);
  if (!userIsMember) {
    throw HTTPError(403, 'User is not a member of the channel.');
  }

  // Otherwise all conditions valid, start the standup.

  // Update active status, timeFinish and creator of the standup in the dataStore.
  channel.standup.isActive = true;
  const finish = Math.floor(Date.now() / 1000) + length;
  channel.standup.timeFinish = finish;
  channel.standup.creator = tokenObj.uId;
  setData(data);

  // Function to be called once standup length finished.
  const standupFinished = () => {
    // Get standup messages by calling getData again, since standupSend
    // adds standup objects messages array in the dataStore.
    const data = getData();
    const channel = data.channels.find(channel => channel.channelId === channelId);

    // If no messages made during the standup length, don't create
    // a standup message.
    if (channel.standup.messages.length === 0) {
      // Reset standup object back to default.
      const defaultStandup = {
        isActive: false,
        timeFinish: null as number,
        creator: -1,
        handles: [] as string[],
        messages: [] as string[]
      };
      channel.standup = defaultStandup;
      setData(data);
      return;
    }

    // Otherwise create a new standup message, then add standup message
    // to the channel.messages array
    let standupMessage = '';
    const messages = channel.standup.messages;
    const handles = channel.standup.handles;
    messages.forEach((message, index) => {
      standupMessage += (handles[index] + ': ' + message + '\n');
    });

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

    const newMessage = {
      messageId: messageId,
      uId: channel.standup.creator,
      message: standupMessage,
      timeSent: channel.standup.timeFinish,
      reacts: [] as React[],
      isPinned: false,
    };
    channel.messages.push(newMessage);

    // Reset standup object back to default.
    const defaultStandup = {
      isActive: false,
      timeFinish: null as number,
      creator: -1,
      handles: [] as string[],
      messages: [] as string[]
    };
    channel.standup = defaultStandup;
    setData(data);
  };

  // Call standupFinished after specified standup length reached.
  setTimeout(standupFinished, length * 1000);

  // Return is ran even before standup is finished.
  return { timeFinish: finish };
};

/**
 * For a given channel, return whether a standup currently active(ongoing)
 * in it and what time the standup finishes.
 *
 * @param {string} token - Logged-in user unique identifier.
 * @param {number} channelId - Channel unique identifier.
 *
 * @returns {{ error: string }} - If token is invalid.
 * @returns {{ error: string }} - If channelId is invalid.
 * @returns {{ error: string }} - If channelId valid, but user specified by the
 *                                token is not a member of the channel.
 * @returns {{ isActive: boolean, timeFinish: number }} - IF all arguements valid
 *
*/
const standupActiveV1 = (token: string, channelId: number) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  // Throw error if channelId is invalid.
  const channel = data.channels.find(channel => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'ChannelId is invalid.');
  }

  // Throw error if channelId is valid but user is not a member of the channel.
  // * At this point, channelId has been validated *
  const userIsMember = channel.allMembers.includes(tokenObj.uId);
  if (!userIsMember) {
    throw HTTPError(403, 'User is not a member of the channel.');
  }

  // Otherwise all conditons are valid.
  return {
    isActive: channel.standup.isActive,
    timeFinish: channel.standup.timeFinish
  };
};

/**
 * For a given channel, if a standup is currently active in the channel,
 * sends a message to get buffered(added to an array) in the standup queue.
 *
 * @param {string} token - Logged-in user unique identifier.
 * @param {number} channelId - Channel unique identifier.
 * @param {string} message - Message to be buffered in the standup queue.
 *
 * @returns {{ error: string }} - If token is invalid.
 * @returns {{ error: string }} - If channelId is invalid.
 * @returns {{ error: string }} - If length of message exceeds 1000 characters.
 * @returns {{ error: string }} - If no active standup in the channel.
 * @returns {{ error: string }} - If channelId valid, but user specified by the
 *                                token is not a member of the channel.
 * @returns {{}} - If all arguements are valid and there's an active standup in the channel.
 *
*/
const standupSendV1 = (token: string, channelId: number, message: string) => {
  const data = getData();

  // Throw error if token is invalid.
  const tokenObj = isTokenValid(token);

  // Throw error if channelId is invalid.
  const channel = data.channels.find(channel => channel.channelId === channelId);
  if (channel === undefined) {
    throw HTTPError(400, 'ChannelId is invalid.');
  }

  // Throw error if message exceeds 1000 characters.
  if (message.length > 1000) {
    throw HTTPError(400, 'Message exceeds 1000 character limit.');
  }

  // Throw error if standupSend called in a channel with no active standup.
  const isStandupActive = channel.standup.isActive;
  if (!isStandupActive) {
    throw HTTPError(400, 'No ongoing standup in the channel.');
  }

  // Throw error if channelId is valid but user is not a member of the channel.
  // * At this point, channelId has been validated *
  const userIsMember = channel.allMembers.includes(tokenObj.uId);
  if (!userIsMember) {
    throw HTTPError(403, 'User is not a member of the channel.');
  }

  // Otherwise all conditions are valid.

  // Add user handle and new message to the standup object of channel.
  const user = data.users.find(user => user.authUserId === tokenObj.uId);
  channel.standup.handles.push(user.handleStr);
  channel.standup.messages.push(message);
  setData(data);

  return {};
};

export { standupStartV1, standupActiveV1, standupSendV1 };
