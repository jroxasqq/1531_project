import { getRequest, deleteRequest, postRequest, putRequest } from './requests';

// Iteration 1 Functions
/**
 * Wrapper to make a request to the 'auth/login/v3' route.
 */
const authLogin = (email: string, password: string) => {
  return postRequest('/auth/login/v3', { email, password });
};

/**
 * Wrapper to make a request to the 'auth/register/v3' route.
 */
const authRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  return postRequest('/auth/register/v3', { email, password, nameFirst, nameLast });
};

/**
 * Wrapper to make a request to the 'channels/create/v3' route.
 */
const channelsCreate = (name: string, isPublic: boolean, token: string) => {
  return postRequest('/channels/create/v3', { name, isPublic }, { token });
};

/**
 * Wrapper to make a request to the 'channels/list/v3' route.
 */
const channelsList = (token: string) => {
  return getRequest('/channels/list/v3', {}, { token });
};

/**
 * Wrapper to make a request to the 'channels/listAll/v3' route.
 */
const channelsListAll = (token: string) => {
  return getRequest('/channels/listall/v3', {}, { token });
};

/**
 * Wrapper to make a request to the 'channel/details/v3' route.
 */
const channelDetails = (channelId: number, token: string) => {
  return getRequest('/channel/details/v3', { channelId }, { token });
};

/**
 * Wrapper to make a request to the 'channel/join/v3' route.
 */
const channelJoin = (channelId: number, token: string) => {
  return postRequest('/channel/join/v3', { channelId }, { token });
};

/**
 * Wrapper to make a request to the 'channel/invite/v3' route.
 */
const channelInvite = (channelId: number, uId: number, token: string) => {
  return postRequest('/channel/invite/v3', { channelId, uId }, { token });
};

/**
 * Wrapper to make a request to the 'channel/messages/v3' route.
 */
const channelMessages = (channelId: number, start: number, token: string) => {
  return getRequest('/channel/messages/v3', { channelId, start }, { token });
};

/**
 * Wrapper to make a request to the 'user/profile/v3' route.
 */
const userProfile = (uId: number, token: string) => {
  return getRequest('/user/profile/v3', { uId }, { token });
};

/**
 * Wrapper to make a request to the 'clear/v1' route.
 */
const clear = () => {
  return deleteRequest('/clear/v1', {});
};

// Iteration 2 Functions
/**
 * Wrapper to make a request to the 'auth/logout/v2' route.
 */
const authLogout = (token: string) => {
  return postRequest('/auth/logout/v2', {}, { token });
};

/**
 * Wrapper to make a request to the 'channel/leave/v2' route.
 */
const channelLeave = (channelId: number, token: string) => {
  return postRequest('/channel/leave/v2', { channelId }, { token });
};

/**
 * Wrapper to make a request to the 'channel/addowner/v2' route.
 */
const channelAddOwner = (channelId: number, uId: number, token: string) => {
  return postRequest('/channel/addowner/v2', { channelId, uId }, { token });
};

/**
 * Wrapper to make a request to the 'channel/removeowner/v2' route.
 */
const channelRemoveOwner = (channelId: number, uId: number, token: string) => {
  return postRequest('/channel/removeowner/v2', { channelId, uId }, { token });
};

/**
 * Wrapper to make a request to the 'message/send/v2' route.
 */
const messageSend = (channelId: number, message: string, token: string) => {
  return postRequest('/message/send/v2', { channelId, message }, { token });
};

/**
 * Wrapper to make a request to the 'message/edit/v2' route.
 */
const messageEdit = (messageId: number, message: string, token: string) => {
  return putRequest('/message/edit/v2', { messageId, message }, { token });
};

/**
 * Wrapper to make a request to the 'message/remove/v2' route.
 */
const messageRemove = (messageId: number, token: string) => {
  return deleteRequest('/message/remove/v2', { messageId }, { token });
};

/**
 * Wrapper to make a request to the 'dm/create/v2' route.
 */
const dmCreate = (uIds: number[], token: string) => {
  return postRequest('/dm/create/v2', { uIds }, { token });
};

/**
 * Wrapper to make a request to the 'dm/list/v2' route.
 */
const dmList = (token: string) => {
  return getRequest('/dm/list/v2', {}, { token });
};

/**
 * Wrapper to make a request to the 'dm/remove/v2' route.
 */
const dmRemove = (dmId: number, token: string) => {
  return deleteRequest('/dm/remove/v2', { dmId }, { token });
};

/**
 * Wrapper to make a request to the 'dm/details/v2' route.
 */
const dmDetails = (dmId: number, token: string) => {
  return getRequest('/dm/details/v2', { dmId }, { token });
};

/**
 * Wrapper to make a request to the 'dm/leave/v2' route.
 */
const dmLeave = (dmId: number, token: string) => {
  return postRequest('/dm/leave/v2', { dmId }, { token });
};

/**
 * Wrapper to make a request to the 'dm/messages/v2' route.
 */
const dmMessages = (dmId: number, start: number, token: string) => {
  return getRequest('/dm/messages/v2', { dmId, start }, { token });
};

/**
 * Wrapper to make a request to the 'message/senddm/v2' route.
 */
const messageSendDm = (dmId: number, message: string, token: string) => {
  return postRequest('/message/senddm/v2', { dmId, message }, { token });
};

/**
 * Wrapper to make a request to the 'users/all/v2' route.
 */
const usersAll = (token: string) => {
  return getRequest('/users/all/v2', {}, { token });
};

/**
 * Wrapper to make a request to the 'user/logout/v2' route.
 */
const userProfileSetName = (nameFirst: string, nameLast: string, token: string) => {
  return putRequest('/user/profile/setname/v2', { nameFirst, nameLast }, { token });
};

/**
 * Wrapper to make a request to the 'user/profile/setemail/v2' route.
 */
const userProfileSetEmail = (email: string, token: string) => {
  return putRequest('/user/profile/setemail/v2', { email }, { token });
};

/**
 * Wrapper to make a request to the 'user/profile/sethandle/v2' route.
 */
const userProfileSetHandle = (handleStr: string, token: string) => {
  return putRequest('/user/profile/sethandle/v2', { handleStr }, { token });
};

// Iteration 3 functions
/**
 * Wrapper to make a request to the 'notifications/get/v1' route.
 */
const notificationsGet = (token: string) => {
  return getRequest('/notifications/get/v1', {}, { token });
};

/**
 * Wrapper to make a request to the 'search/v1' route.
 */
const search = (queryStr: string, token: string) => {
  return getRequest('/search/v1', { queryStr }, { token });
};

/**
 * Wrapper to make a request to the 'message/share/v1' route.
 */
const messageShare = (ogMessageId: number, message: string, channelId: number, dmId: number, token: string) => {
  return postRequest('/message/share/v1', { ogMessageId, message, channelId, dmId }, { token });
};

/**
 * Wrapper to make a request to the 'message/react/v1' route.
 */
const messageReact = (messageId: number, reactId: number, token: string) => {
  return postRequest('/message/react/v1', { messageId, reactId }, { token });
};

/**
 * Wrapper to make a request to the 'message/unreact/v1' route.
 */
const messageUnreact = (messageId: number, reactId: number, token: string) => {
  return postRequest('/message/unreact/v1', { messageId, reactId }, { token });
};

/**
 * Wrapper to make a request to the 'message/pin/v1' route.
 */
const messagePin = (messageId: number, token: string) => {
  return postRequest('/message/pin/v1', { messageId }, { token });
};

/**
 * Wrapper to make a request to the 'message/unpin/v1' route.
 */
const messageUnpin = (messageId: number, token: string) => {
  return postRequest('/message/unpin/v1', { messageId }, { token });
};

/**
 * Wrapper to make a request to the 'message/sendlater/v1' route.
 */
const messageSendLater = (channelId: number, message: string, timeSent: number, token: string) => {
  return postRequest('/message/sendlater/v1', { message, channelId, timeSent }, { token });
};

/**
 * Wrapper to make a request to the 'message/sendlaterdm/v1' route.
 */
const messageSendLaterDm = (dmId: number, message: string, timeSent: number, token: string) => {
  return postRequest('/message/sendlaterdm/v1', { message, dmId, timeSent }, { token });
};

/**
 * Wrapper to make a request to the 'standup/start/v1' route.
 */
const standupStart = (channelId: number, length: number, token: string) => {
  return postRequest('/standup/start/v1', { channelId, length }, { token });
};

/**
 * Wrapper to make a request to the 'standup/active/v1' route.
 */
const standupActive = (channelId: number, token: string) => {
  return getRequest('/standup/active/v1', { channelId }, { token });
};

/**
 * Wrapper to make a request to the 'standup/send/v1' route.
 */
const standupSend = (channelId: number, message: string, token: string) => {
  return postRequest('/standup/send/v1', { channelId, message }, { token });
};

/**
 * Wrapper to make a request to the 'auth/passwordreset/request/v1' route.
 */
const authPasswordResetRequest = (email: string) => {
  return postRequest('/auth/passwordreset/request/v1', { email });
};

/**
 * Wrapper to make a request to the 'auth/passwordreset/reset/v1' route.
 */
const authPasswordResetReset = (resetCode: string, newPassword: string) => {
  return postRequest('/auth/passwordreset/reset/v1', { resetCode, newPassword });
};

/**
 * Wrapper to make a request to the 'user/profile/uploadphoto/v1' route.
 */
const userProfileUploadPhoto = (imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number, token: string) => {
  return postRequest('/user/profile/uploadphoto/v1', { imgUrl, xStart, yStart, xEnd, yEnd }, { token });
};

/**
 * Wrapper to make a request to the 'user/stats/v1' route.
 */
const userStats = (token: string) => {
  return getRequest('/user/stats/v1', {}, { token });
};

/**
 * Wrapper to make a request to the 'users/stats/v1' route.
 */
const usersStats = (token: string) => {
  return getRequest('/users/stats/v1', {}, { token });
};

/**
 * Wrapper to make a request to the 'admin/user/remove/v1' route.
 */
const adminUserRemove = (uId: number, token: string) => {
  return deleteRequest('/admin/user/remove/v1', { uId }, { token });
};

/**
 * Wrapper to make a request to the 'admin/userpermission/change/v1' route.
 */
const adminUserPermissionChange = (uId: number, permissionId: number, token: string) => {
  return postRequest('/admin/userpermission/change/v1', { uId, permissionId }, { token });
};

export {
  authLogin,
  authRegister,
  channelsCreate,
  channelsList,
  channelsListAll,
  channelDetails,
  channelJoin,
  channelInvite,
  channelMessages,
  userProfile,
  clear,
  authLogout,
  channelLeave,
  channelAddOwner,
  channelRemoveOwner,
  messageSend,
  messageEdit,
  messageRemove,
  dmCreate,
  dmList,
  dmRemove,
  dmDetails,
  dmLeave,
  dmMessages,
  messageSendDm,
  usersAll,
  userProfileSetName,
  userProfileSetEmail,
  userProfileSetHandle,
  notificationsGet,
  search,
  messageShare,
  messageReact,
  messageUnreact,
  messagePin,
  messageUnpin,
  messageSendLater,
  messageSendLaterDm,
  standupStart,
  standupActive,
  standupSend,
  authPasswordResetRequest,
  authPasswordResetReset,
  userProfileUploadPhoto,
  userStats,
  usersStats,
  adminUserRemove,
  adminUserPermissionChange
};
