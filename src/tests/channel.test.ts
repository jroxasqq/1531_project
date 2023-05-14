import { deleteRequest } from './requests';
import { authRegister, channelsCreate, channelJoin, channelInvite, channelDetails, channelAddOwner, channelRemoveOwner, channelLeave, standupStart, channelsList, channelsListAll } from './helper';

const OK = 200;

const sleep = (milliseconds: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

beforeEach(() => {
  deleteRequest('/clear/v1', {});
});

test('Testing valid channel creation and use', () => {
  const user1 = authRegister('ben@gmail.com', '123456', 'Ben', 'Davies');
  const user2 = authRegister('sam@gmail.com', 'samJ1oes', 'Sam', 'Joes');
  const user3 = authRegister('sam0@gmail.com', 'samJ1oes', 'Sam', 'Joes');
  const channel = channelsCreate('Cartoon Network', true, user1.body.token);
  expect(channel.statusCode).toBe(OK);
  expect(channel.body).toStrictEqual({ channelId: expect.any(Number) });

  const join = channelJoin(channel.body.channelId, user2.body.token);
  expect(join.statusCode).toBe(OK);
  expect(join.body).toStrictEqual({});

  const channel2 = channelsCreate('GMA', false, user2.body.token);

  const invite3 = channelInvite(channel2.body.channelId, user3.body.authUserId, user1.body.token);
  expect(invite3.statusCode).toEqual(403);
  expect(invite3.body).toStrictEqual({ error: expect.any(String) });

  const join2 = channelJoin(channel2.body.channelId, user1.body.token);
  expect(join2.statusCode).toBe(OK);
  expect(join2.body).toStrictEqual({});

  const invite = channelInvite(channel.body.channelId, user3.body.authUserId, user1.body.token);
  expect(invite.statusCode).toBe(OK);
  expect(invite.body).toStrictEqual({});

  const invite2 = channelInvite(channel2.body.channelId, user3.body.authUserId, user1.body.token);
  expect(invite2.statusCode).toBe(OK);
  expect(invite2.body).toStrictEqual({});

  const invite4 = channelInvite(channel2.body.channelId, user3.body.authUserId, user2.body.token);
  expect(invite4.statusCode).toEqual(400);
  expect(invite4.body).toStrictEqual({ error: expect.any(String) });

  const addOwner = channelAddOwner(channel.body.channelId, user2.body.authUserId, user1.body.token);
  expect(addOwner.statusCode).toBe(OK);
  expect(addOwner.body).toStrictEqual({});

  const removeOwner = channelRemoveOwner(channel.body.channelId, user2.body.authUserId, user1.body.token);
  expect(removeOwner.statusCode).toBe(OK);
  expect(removeOwner.body).toStrictEqual({});

  const leave = channelLeave(channel.body.channelId, user1.body.token);
  expect(leave.statusCode).toBe(OK);
  expect(leave.body).toStrictEqual({});

  const channels = channelsList(user1.body.token);
  expect(channels.body).toStrictEqual({ channels: [{ channelId: 1, name: 'GMA' }] });

  const channelsAll = channelsListAll(user3.body.token);
  expect(channelsAll.statusCode).toBe(OK);
  const channelsArray = [
    { channelId: 0, name: 'Cartoon Network' },
    { channelId: 1, name: 'GMA' },
  ];

  expect(channelsAll.body).toStrictEqual({ channels: channelsArray });
});

test('Create + Join + Invite Errors', () => {
  const user1 = authRegister('ben@gmail.com', '123456', 'Ben', 'Davies');
  const user2 = authRegister('sam@gmail.com', 'samJ1oes', 'Sam', 'Joes');

  const channel1 = channelsCreate('channel1', true, 'faketoken');
  expect(channel1.statusCode).toStrictEqual(403);
  expect(channel1.body).toStrictEqual({ error: 'Token is invalid.' });

  const channel2 = channelsCreate('', true, user1.body.token);
  expect(channel2.statusCode).toStrictEqual(400);
  expect(channel2.body).toStrictEqual({ error: 'Invalid channel name' });

  const channel3 = channelsCreate('really long channel name', true, user1.body.token);
  expect(channel3.statusCode).toStrictEqual(400);
  expect(channel3.body).toStrictEqual({ error: 'Invalid channel name' });

  const channel = channelsCreate('channel1', false, user1.body.token);

  const join = channelJoin(channel.body.channelId + 1, user2.body.token);
  expect(join.statusCode).toEqual(400);
  expect(join.body).toStrictEqual({ error: expect.any(String) });

  const join1 = channelJoin(channel.body.channelId, user2.body.token);
  expect(join1.statusCode).toEqual(403);
  expect(join1.body).toStrictEqual({ error: expect.any(String) });

  const join2 = channelJoin(channel.body.channelId, user1.body.token);
  expect(join2.statusCode).toEqual(400);
  expect(join2.body).toStrictEqual({ error: expect.any(String) });

  const join3 = channelJoin(channel.body.channelId, user2.body.token + 'lol');
  expect(join3.statusCode).toEqual(403);
  expect(join3.body).toStrictEqual({ error: expect.any(String) });

  const invite = channelInvite(channel.body.channelId + 1, user2.body.authUserId, user1.body.token);
  expect(invite.statusCode).toEqual(400);
  expect(invite.body).toStrictEqual({ error: expect.any(String) });

  const invite2 = channelInvite(channel.body.channelId, 99, user1.body.token);
  expect(invite2.statusCode).toEqual(400);
  expect(invite2.body).toStrictEqual({ error: expect.any(String) });

  const invite3 = channelInvite(channel.body.channelId, user2.body.authUserId, user1.body.token + 'lol');
  expect(invite3.statusCode).toEqual(403);
  expect(invite3.body).toStrictEqual({ error: expect.any(String) });

  const addOwner2 = channelAddOwner(channel.body.channelId, user2.body.authUserId, user1.body.token);
  expect(addOwner2.statusCode).toStrictEqual(400);

  channelInvite(channel.body.channelId, user2.body.authUserId, user1.body.token);

  const addOwner = channelAddOwner(channel.body.channelId + 1, user2.body.authUserId, user1.body.token);
  expect(addOwner.statusCode).toStrictEqual(400);

  const addOwner1 = channelAddOwner(channel.body.channelId, user2.body.authUserId + 100, user1.body.token);
  expect(addOwner1.statusCode).toStrictEqual(400);

  const addOwnerAgain = channelAddOwner(channel.body.channelId, user1.body.authUserId, user1.body.token);
  expect(addOwnerAgain.statusCode).toStrictEqual(400);

  const addOwner3 = channelAddOwner(channel.body.channelId, user2.body.authUserId, user2.body.token);
  expect(addOwner3.statusCode).toStrictEqual(403);

  const addOwner4 = channelAddOwner(channel.body.channelId, user2.body.authUserId, user1.body.token + 'lol');
  expect(addOwner4.statusCode).toStrictEqual(403);
});

test('Testing if the authUserId is a member of the channel, and the channelId is valid, then returns successfully', () => {
  const user = authRegister('ben@gmail.com', '123456', 'Ben', 'Davies');
  const user2 = authRegister('justin@gmail.com', '987654', 'Justin', 'Roxas');

  const channel = channelsCreate('channel1', true, user.body.token);

  const details = channelDetails(channel.body.channelId, user.body.token);

  const profile = {
    uId: user.body.authUserId,
    email: 'ben@gmail.com',
    nameFirst: 'Ben',
    nameLast: 'Davies',
    handleStr: 'bendavies',
    permissionId: expect.any(Number),
    profileImgUrl: expect.any(String),
    userStats: expect.any(Number)
  };

  expect(details.statusCode).toBe(OK);
  expect(details.body).toStrictEqual(

    {
      name: 'channel1',
      isPublic: true,
      ownerMembers: [profile],
      allMembers: [profile]
    });

  const details1 = channelDetails(channel.body.channelId, 'lol');
  expect(details1.statusCode).toBe(403);
  expect(details1.body).toStrictEqual({ error: 'Token is invalid.' });

  const details2 = channelDetails(20, user.body.token);
  expect(details2.statusCode).toBe(400);
  expect(details2.body).toStrictEqual({ error: 'ChannelId is not valid' });

  const details3 = channelDetails(channel.body.channelId, user2.body.token);
  expect(details3.statusCode).toBe(403);
  expect(details3.body).toStrictEqual({ error: 'User is not a member of this channel' });
});

test('remove owner errors', () => {
  const user = authRegister('jerald@gmail.com', 'inshallah23', 'Jerald', 'Jose');
  const user2 = authRegister('isaac@gmail.com', 'lisa12345', 'Isaac', 'Chang');
  const user3 = authRegister('akhil@gmail.com', 'akhil1', 'Akhil', 'Govan');
  const channel = channelsCreate('channel1', true, user.body.token);

  const removeOwner3 = channelRemoveOwner(channel.body.channelId, user.body.authUserId, user.body.token);
  expect(removeOwner3.statusCode).toBe(400);
  expect(removeOwner3.body).toStrictEqual({ error: 'uId is the only owner' });

  channelJoin(channel.body.channelId, user2.body.token);

  const leave1 = channelLeave(channel.body.channelId, user3.body.token);
  expect(leave1.statusCode).toStrictEqual(403);

  const removeOwner6 = channelRemoveOwner(channel.body.channelId, user3.body.authUserId, user.body.token);
  expect(removeOwner6.statusCode).toBe(400);
  expect(removeOwner6.body).toStrictEqual({ error: 'user not a member of channel' });

  channelJoin(channel.body.channelId, user3.body.token);
  channelAddOwner(channel.body.channelId, user2.body.authUserId, user.body.token);
  const removeOwner = channelRemoveOwner(channel.body.channelId + 10, user2.body.authUserId, user.body.token);
  expect(removeOwner.statusCode).toBe(400);
  expect(removeOwner.body).toStrictEqual({ error: 'Invalid channelId' });

  const removeOwner1 = channelRemoveOwner(channel.body.channelId, user2.body.authUserId + 10, user.body.token);
  expect(removeOwner1.statusCode).toBe(400);
  expect(removeOwner1.body).toStrictEqual({ error: 'uId does not exist' });

  const removeOwner2 = channelRemoveOwner(channel.body.channelId, user3.body.authUserId, user.body.token);
  expect(removeOwner2.statusCode).toBe(400);
  expect(removeOwner2.body).toStrictEqual({ error: 'uId is not owner' });

  const removeOwner4 = channelRemoveOwner(channel.body.channelId, user.body.authUserId, user3.body.token);
  expect(removeOwner4.statusCode).toBe(403);
  expect(removeOwner4.body).toStrictEqual({ error: 'User is not authorised' });

  const removeOwner5 = channelRemoveOwner(channel.body.channelId, user2.body.authUserId, 'faketoken');
  expect(removeOwner5.statusCode).toBe(403);
  expect(removeOwner5.body).toStrictEqual({ error: 'Token is invalid.' });

  const leave = channelLeave(50, user.body.token);
  expect(leave.statusCode).toStrictEqual(400);

  const leave2 = channelLeave(channel.body.channelId, 'lol');
  expect(leave2.statusCode).toStrictEqual(403);

  const channels = channelsList('lol');
  expect(channels.statusCode).toStrictEqual(403);
  expect(channels.body).toStrictEqual({ error: 'Token is invalid.' });

  const channelsAll = channelsListAll('lol');
  expect(channelsAll.statusCode).toBe(403);
  expect(channelsAll.body).toStrictEqual({ error: 'Token is invalid.' });
});

test('Test global owner non-member cannot remove owner', () => {
  const user = authRegister('jerald@gmail.com', 'inshallah23', 'Jerald', 'Jose');
  const user2 = authRegister('isaac@gmail.com', 'lisa12345', 'Isaac', 'Chang');
  const channel = channelsCreate('channel1', true, user2.body.token);
  const user3 = authRegister('someone@gmail.com', 'idsfdsfds', 'Joe', 'Griffin');
  channelInvite(channel.body.channelId, user3.body.authUserId, user2.body.token);
  channelAddOwner(channel.body.channelId, user3.body.authUserId, user2.body.token);
  const removeOwner = channelRemoveOwner(channel.body.channelId, user3.body.authUserId, user.body.token);
  expect(removeOwner.statusCode).toBe(403);
  expect(removeOwner.body).toStrictEqual({ error: 'Global owner is not a member of the channel' });
});

test('User started a standup and tries to leave.', () => {
  const user = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
  const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');

  const channel = channelsCreate('Cartoon Network', true, user.body.token);
  channelJoin(channel.body.channelId, user2.body.token);

  const standup = standupStart(channel.body.channelId, 1, user.body.token);

  expect(standup.statusCode).toBe(OK);
  expect(standup.body).toStrictEqual({ timeFinish: expect.any(Number) });

  const leave = channelLeave(channel.body.channelId, user.body.token);
  const leave1 = channelLeave(channel.body.channelId, user2.body.token);

  sleep(1000);

  expect(leave1.statusCode).toBe(OK);
  expect(leave1.body).toStrictEqual({});
  expect(leave.statusCode).toStrictEqual(400);
});
