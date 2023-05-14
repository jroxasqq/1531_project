import { authRegister, channelsCreate, channelJoin, messageSend, dmCreate, messageSendDm, channelMessages, standupStart, standupSend, standupActive, clear } from './helper';
import { React } from '../types';

const OK = 200;
const BAD_REQUEST = 400;
const FORBIDDEN = 403;

beforeEach(() => {
  clear();
});

const sleep = (milliseconds: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

describe('Standup route tests', () => {
  test('Valid input, all messages sent during time window', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup = standupStart(channel.body.channelId, 2, user2.body.token);

    const active = standupActive(channel.body.channelId, user1.body.token);

    expect(active.statusCode).toBe(OK);
    expect(active.body).toStrictEqual({
      isActive: true,
      timeFinish: standup.body.timeFinish
    });

    // Test both messageSend and standupSend.
    messageSend(channel.body.channelId, 'Jerald is awesome', user1.body.token);
    messageSend(channel.body.channelId, 'Akhil is cool', user3.body.token);
    standupSend(channel.body.channelId, 'random message', user2.body.token);

    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    const sentDm = messageSendDm(dm.body.dmId, 'Hi how are you?', user1.body.token);

    sleep(4000);

    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);

    const messageStr = `userone: Jerald is awesome
userthree: Akhil is cool
usertwo: random message
`;

    const messagesArray = [
      {
        messageId: sentDm.body.messageId + 1,
        uId: user2.body.authUserId,
        message: messageStr,
        timeSent: expect.any(Number),
        reacts: [] as React[],
        isPinned: false,
      }
    ];

    expect(messages.body).toStrictEqual({
      messages: messagesArray,
      start: 0,
      end: -1
    });

    expect(standup.statusCode).toBe(OK);
    expect(standup.body).toStrictEqual({ timeFinish: expect.any(Number) });
  });

  test('Valid input, some messages sent during time window', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup = standupStart(channel.body.channelId, 2, user2.body.token);

    messageSend(channel.body.channelId, 'Jerald is awesome', user1.body.token);
    messageSend(channel.body.channelId, 'Akhil is cool', user3.body.token);

    sleep(5000);

    messageSend(channel.body.channelId, 'random message', user2.body.token);
    messageSend(channel.body.channelId, 'another random message', user1.body.token);

    dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);

    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);

    const messageStr = `userone: Jerald is awesome
userthree: Akhil is cool
`;

    const messagesArray = [
      {
        messageId: expect.any(Number),
        uId: user1.body.authUserId,
        message: 'another random message',
        timeSent: expect.any(Number),
        reacts: expect.any(Array),
        isPinned: false,
      },
      {
        messageId: expect.any(Number),
        uId: user2.body.authUserId,
        message: 'random message',
        timeSent: expect.any(Number),
        reacts: expect.any(Array),
        isPinned: false,
      },
      {
        messageId: expect.any(Number),
        uId: user2.body.authUserId,
        message: messageStr,
        timeSent: expect.any(Number),
        reacts: expect.any(Array) as React[],
        isPinned: false,
      }
    ];

    expect(messages.body).toStrictEqual({
      messages: messagesArray,
      start: 0,
      end: -1
    });

    expect(standup.statusCode).toBe(OK);
    expect(standup.body).toStrictEqual({ timeFinish: expect.any(Number) });
  });

  test('Valid input, no messages sent during time window', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup = standupStart(channel.body.channelId, 2, user2.body.token);

    sleep(5000);

    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);
    expect(messages.body).toStrictEqual({
      messages: [],
      start: 0,
      end: -1
    });

    expect(standup.statusCode).toBe(OK);
    expect(standup.body).toStrictEqual({ timeFinish: expect.any(Number) });
  });

  test('StandupStart Invalid input, invalid channelId', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup = standupStart(channel.body.channelId + 1, 1, user2.body.token);

    const active = standupActive(channel.body.channelId, user1.body.token);

    expect(active.statusCode).toBe(OK);
    expect(active.body).toStrictEqual({
      isActive: false,
      timeFinish: null
    });

    expect(standup.statusCode).toBe(BAD_REQUEST);
    expect(standup.body).toStrictEqual({ error: 'ChannelId is invalid.' });
  });

  test('StandupSend + StandupActive invalid input, invalid channelId', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    standupStart(channel.body.channelId, 1, user2.body.token);

    const send = standupSend(channel.body.channelId + 1, 'random message', user1.body.token);

    const active = standupActive(channel.body.channelId + 1, user1.body.token);

    expect(active.statusCode).toBe(BAD_REQUEST);
    expect(active.body).toStrictEqual({ error: 'ChannelId is invalid.' });

    sleep(5000);

    expect(send.statusCode).toBe(BAD_REQUEST);
    expect(send.body).toStrictEqual({ error: 'ChannelId is invalid.' });
  });

  test('Standup Start invalid input, invalid standup length (length < 0)', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup = standupStart(channel.body.channelId, -2, user2.body.token);

    expect(standup.statusCode).toBe(BAD_REQUEST);
    expect(standup.body).toStrictEqual({ error: 'Standup length can not be negative.' });
  });

  test('Standup Start invalid input, another standup ongoing in the channel just before', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup1 = standupStart(channel.body.channelId, 2, user2.body.token);
    const standup2 = standupStart(channel.body.channelId, 1, user2.body.token);

    expect(standup1.statusCode).toBe(OK);
    expect(standup1.body).toStrictEqual({ timeFinish: expect.any(Number) });

    expect(standup2.statusCode).toBe(BAD_REQUEST);
    expect(standup2.body).toStrictEqual({ error: 'Another standup ongoing in the channel.' });
  });

  test('StandupStart invalid input, another standup ongoing in the channel, 2 secs before', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const standup1 = standupStart(channel.body.channelId, 3, user2.body.token);

    expect(standup1.statusCode).toBe(OK);
    expect(standup1.body).toStrictEqual({ timeFinish: expect.any(Number) });

    // Add a delay for 1 seconds before continuing.
    sleep(1000);

    const standup2 = standupStart(channel.body.channelId, 3, user2.body.token);

    sleep(2000);

    expect(standup2.statusCode).toBe(BAD_REQUEST);
    expect(standup2.body).toStrictEqual({ error: 'Another standup ongoing in the channel.' });
  });

  test('StandupStart invalid input, valid channelId but token refers to non-member of channel', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);

    const standup = standupStart(channel.body.channelId, 1, user3.body.token);

    expect(standup.statusCode).toBe(FORBIDDEN);
    expect(standup.body).toStrictEqual({ error: 'User is not a member of the channel.' });
  });

  test('StandupSend Invalid input, no active standup at all in the channel.', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    const send = standupSend(channel.body.channelId, 'random message', user1.body.token);

    expect(send.statusCode).toBe(BAD_REQUEST);
    expect(send.body).toStrictEqual({ error: 'No ongoing standup in the channel.' });
  });

  test('StandupSend invalid input, message exceeds 1000 characters', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);

    standupStart(channel.body.channelId, 1, user2.body.token);

    const send = standupSend(channel.body.channelId, 'a'.repeat(1001), user1.body.token);

    sleep(2000);

    expect(send.statusCode).toBe(BAD_REQUEST);
    expect(send.body).toStrictEqual({ error: 'Message exceeds 1000 character limit.' });
  });

  test('StandupSend + StandupActive Invalid input, valid channelId but token refers to non-member of channel', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);

    standupStart(channel.body.channelId, 1, user2.body.token);

    const send = standupSend(channel.body.channelId, 'random message', user3.body.token);

    const active = standupActive(channel.body.channelId, user3.body.token);

    expect(active.statusCode).toBe(FORBIDDEN);
    expect(active.body).toStrictEqual({ error: 'User is not a member of the channel.' });

    sleep(2000);

    expect(send.statusCode).toBe(FORBIDDEN);
    expect(send.body).toStrictEqual({ error: 'User is not a member of the channel.' });
  });

  test('StandupStart invalid input, invalid token', () => {
    const user = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const channel = channelsCreate('Cartoon Network', true, user.body.token);

    const standup = standupStart(channel.body.channelId, 1, 'random token');

    expect(standup.statusCode).toBe(FORBIDDEN);
    expect(standup.body).toStrictEqual({ error: 'Token is invalid.' });

    sleep(2000);
  });

  test('StandupSend + StandupActive invalid input, invalid token', () => {
    const user = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const channel = channelsCreate('Cartoon Network', true, user.body.token);

    standupStart(channel.body.channelId, 1, user.body.token);

    const send = standupSend(channel.body.channelId, 'random message', 'random token');

    const active = standupActive(channel.body.channelId, 'random token');

    expect(active.statusCode).toBe(FORBIDDEN);
    expect(active.body).toStrictEqual({ error: 'Token is invalid.' });

    sleep(2000);

    expect(send.statusCode).toBe(FORBIDDEN);
    expect(send.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
