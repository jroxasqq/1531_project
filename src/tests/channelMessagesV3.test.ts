import { clear, authRegister, channelsCreate, channelMessages, messageSend } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

describe('Test channel messages', () => {
  test('successful case - no messages', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);
    expect(messages.body).toStrictEqual({
      messages: [],
      start: 0,
      end: -1
    });

    const messagesArray = [];
    for (let i = 0; i < 1; i++) {
      messageSend(channel.body.channelId, i.toString(), user1.body.token);

      messagesArray.unshift({
        messageId: expect.any(Number),
        uId: user1.body.authUserId,
        message: i.toString(),
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      });
    }

    const messages1 = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages1.statusCode).toBe(OK);

    const messagesArray2 = [];
    for (let i = 1; i < 51; i++) {
      messageSend(channel.body.channelId, i.toString(), user1.body.token);

      messagesArray2.unshift({
        messageId: expect.any(Number),
        uId: user1.body.authUserId,
        message: i.toString(),
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      });
    }

    const messages2 = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages2.statusCode).toBe(OK);

    const messages3 = channelMessages(channel.body.channelId, 50, user1.body.token);
    expect(messages3.statusCode).toBe(OK);
  });

  test('errors', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('sawem@gmail.com', 'samJwe1oes', 'Sammy', 'Joeseph');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);

    const messages = channelMessages(channel.body.channelId + 1, 0, user1.body.token);
    expect(messages.statusCode).toBe(400);

    const messages2 = channelMessages(channel.body.channelId, 51, user1.body.token);
    expect(messages2.statusCode).toBe(400);

    const messages3 = channelMessages(channel.body.channelId, 0, user2.body.token);
    expect(messages3.statusCode).toBe(403);

    const messages4 = channelMessages(channel.body.channelId, 0, user1.body.token + 'lol');
    expect(messages4.statusCode).toBe(403);
  });
});
