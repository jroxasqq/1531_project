import { adminUserRemove, clear, authRegister, userProfile, channelsCreate, messageSend, messageSendDm, channelJoin, channelMessages, dmCreate, dmMessages, channelDetails, dmDetails, adminUserPermissionChange } from './helper';

beforeEach(() => {
  clear();
});

describe('Tests for removing a user', () => {
  test('Succesful Removal User', () => {
    const user = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removedUser = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');
    channelsCreate('TVN', true, removedUser.body.token);
    dmCreate([user.body.authUserId], removedUser.body.token);
    const removed = adminUserRemove(removedUser.body.authUserId, user.body.token);
    expect(removed.statusCode).toBe(200);
    const profile = userProfile(removedUser.body.authUserId, user.body.token);
    expect(profile.body.user.nameFirst).toStrictEqual('Removed');
    expect(profile.body.user.nameLast).toStrictEqual('user');
  });
  test('Sucessful Removal - Message: channel', () => {
    const user = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removedUser = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');
    channelsCreate('channel1', true, user.body.token);
    channelJoin(0, removedUser.body.token);
    messageSend(0, 'hello', removedUser.body.token);
    const removed = adminUserRemove(removedUser.body.authUserId, user.body.token);
    expect(removed.statusCode).toBe(200);
    const message = channelMessages(0, 0, user.body.token);
    const details = channelDetails(0, user.body.token);
    expect(message.body.messages[0].message).toStrictEqual('Removed user');
    expect(details.body.allMembers).toEqual(expect.not.arrayContaining([1]));
  });
  test('Sucessful Removal - Message: dm', () => {
    const user = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removedUser = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');
    const dm = dmCreate([1], user.body.token);
    messageSendDm(dm.body.dmId, 'hello', removedUser.body.token);
    const removed = adminUserRemove(removedUser.body.authUserId, user.body.token);
    expect(removed.statusCode).toBe(200);
    const message = dmMessages(dm.body.dmId, 0, user.body.token);
    const details = dmDetails(0, user.body.token);
    expect(message.body.messages[0].message).toStrictEqual('Removed user');
    expect(details.body.allMembers).toEqual(expect.not.arrayContaining([1]));
  });
  test('Removal of channel owner in channel', () => {
    const user = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removedUser = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');
    channelsCreate('channel1', true, user.body.token);
    channelJoin(0, removedUser.body.token);
    adminUserPermissionChange(removedUser.body.authUserId, 1, user.body.token);
    messageSend(0, 'hello', removedUser.body.token);
    const removed = adminUserRemove(removedUser.body.authUserId, user.body.token);
    expect(removed.statusCode).toBe(200);
    const message = channelMessages(0, 0, user.body.token);
    const details = channelDetails(0, user.body.token);
    expect(message.body.messages[0].message).toStrictEqual('Removed user');
    expect(details.body.ownerMembers).toEqual(expect.not.arrayContaining([1]));
  });
  test('Removal of channel owner in dm', () => {
    const user = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removedUser = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');
    const dm = dmCreate([1], user.body.token);
    adminUserPermissionChange(removedUser.body.authUserId, 1, user.body.token);
    messageSendDm(dm.body.dmId, 'hello', removedUser.body.token);
    const removed = adminUserRemove(removedUser.body.authUserId, user.body.token);
    expect(removed.statusCode).toBe(200);
    const message = dmMessages(dm.body.dmId, 0, user.body.token);
    const details = dmDetails(0, user.body.token);
    expect(message.body.messages[0].message).toStrictEqual('Removed user');
    expect(details.body.allMembers).toEqual(expect.not.arrayContaining([1]));
    expect(details.body.ownerMembers).toEqual(expect.not.arrayContaining([1]));
  });
  test('Invalid uId', () => {
    const user = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removed = adminUserRemove(7, user.body.token);
    expect(removed.statusCode).toBe(400);
    expect(removed.body).toStrictEqual({ error: 'Invalid uId' });
  });
  test('uId is only global owner', () => {
    const token1 = authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removed = adminUserRemove(token1.body.authUserId, token1.body.token);
    expect(removed.statusCode).toBe(400);
    expect(removed.body).toStrictEqual({ error: 'uId is only global owner' });
  });
  test('Unauthorised user is not global owner', () => {
    authRegister('example@gmail.com', '12331222', 'jerald', 'jose');
    const removeUser = authRegister('example233@gmail.com', '123312212212', 'jeraldi', 'josey');
    const memberUser = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');
    const removed = adminUserRemove(removeUser.body.authUserId, memberUser.body.token);
    expect(removed.statusCode).toBe(403);
    expect(removed.body).toStrictEqual({ error: 'Unauthorised user' });
  });
  test('invalid token', () => {
    const removed = adminUserRemove(0, 'faketoken');
    expect(removed.statusCode).toBe(403);
    expect(removed.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
