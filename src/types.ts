import config from './config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;

export type Error = { error: string };

export type AuthUserId = { authUserId: number };

export type ChannelId = { channelId: number };

export type ChannelsListItem = {
  channelId: number,
  name: string
};

export type ChannelsList = { channels: ChannelsListItem[] };

export type React = {
  reactId: number,
  uIds: number[],
  isThisUserReacted: boolean
};

export type Message = {
  messageId: number,
  uId: number,
  message: string,
  timeSent: number,
  reacts: React[],
  isPinned: boolean,
};

export type ChannelMessages = { messages: Message[], start: number, end: number };

export type Member = {
  uId: number,
  email: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string
};

export type ChannelDetails = {
  name: string,
  isPublic: boolean,
  ownerMembers: Member[],
  allMembers: Member[]
};

export type ChannelsJoined = {
  numChannelsJoined: number,
  timeStamp: number
};

export type DmJoined = {
  numDmsJoined: number,
  timeStamp: number
};

export type MessagesSent = {
  numMessagesSent: number,
  timeStamp: number
};

export type UserStats = {
  uId: number,
  channelsJoined: ChannelsJoined[],
  dmsJoined: DmJoined[],
  messagesSent: MessagesSent[],
  involvementRate: number
};

export type USERSTATS = {
  channelsJoined: ChannelsJoined[],
  dmsJoined: DmJoined[],
  messagesSent: MessagesSent[],
  involvementRate: number
};

export type ChannelsExist = {
  numChannelsExist: number,
  timeStamp: number
};

export type dmsExist = {
  numDmsExist: number,
  timeStamp: number
};

export type messagesExist = {
  numMessagesExist: number,
  timeStamp: number
};

export type WorkspaceStats = {
  channelsExist: ChannelsExist[],
  dmsExist: dmsExist[],
  messagesExist: messagesExist[],
  utilizationRate: number
};

export type Notification = {
  channelId: number,
  dmId: number,
  notificationMessage: string
};

export const ProfilePhotoFile = 'profilePhoto/userProfilePictures/';

export const TemporaryProfilePhoto = 'profilePhoto/tempPhotoStorage/';

export const DefaultProfilePhotoFile = `${SERVER_URL}/profilePhoto/default-profilePhoto.jpg`;

export type User = {
  authUserId: number,
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string,
  permissionId: number,
  profileImgUrl: string,
  notifications: Notification[]
};

export type Standup = {
  isActive: boolean,
  timeFinish: number,
  creator: number,
  handles: string[],
  messages: string[]
}

export type Channel = {
  channelId: number,
  name: string,
  isPublic: boolean,
  ownerMembers: number[],
  allMembers: number[],
  messages: Message[],
  standup: Standup
};

export type Dm = {
  dmId: number,
  name: string,
  ownerMembers: number[],
  allMembers: number[],
  messages: Message[]
};

export type Token = {
  uId: number,
  token: string
};

export type PasswordReset = {
  code: string,
  userEmail: string,
  timeToWait: number,
  timeStamp: number,
}

export type Data = {
  users: User[],
  channels: Channel[],
  tokens: Token[],
  dms: Dm[],
  passwordReset: PasswordReset[],
  userStats: UserStats[],
  workspaceStats: WorkspaceStats
};

export type UserProfile = {
  user: {
    uId: number,
    email: string,
    nameFirst: string,
    nameLast: string,
    handleStr: string
  }
};
