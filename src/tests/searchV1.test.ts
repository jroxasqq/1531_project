import { clear, authRegister, channelsCreate, search, dmCreate, messageSend, messageSendDm } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

describe('Test success', () => {
  test('successful search - matches found', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const dm = dmCreate([user2.body.authUserId], user1.body.token);
    messageSend(channel.body.channelId, 'Hi! how are you?', user1.body.token);
    messageSend(channel.body.channelId, "hi! i'm good", user1.body.token);
    messageSendDm(dm.body.dmId, 'hHi!!', user2.body.token);
    messageSend(channel.body.channelId, "hi i'm okay", user1.body.token);
    const result = search('Hi!', user1.body.token);
    expect(result.statusCode).toBe(OK);
    expect(result.body.messages.length).toBe(3);
  });

  test('successful search - no matches found', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    messageSend(channel.body.channelId, 'Hii how are you?', user1.body.token);
    messageSend(channel.body.channelId, "hi. i'm good", user1.body.token);
    messageSend(channel.body.channelId, "hi i'm okay", user1.body.token);
    const result = search('Hi!', user1.body.token);
    expect(result.statusCode).toBe(OK);
    expect(result.body).toStrictEqual({
      messages: []
    });
  });
});

describe('Test error', () => {
  test('querystr too short', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    messageSend(channel.body.channelId, 'Hii how are you?', user1.body.token);
    messageSend(channel.body.channelId, "hi. i'm good", user1.body.token);
    messageSend(channel.body.channelId, "hi i'm okay", user1.body.token);
    const result = search('', user1.body.token);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('querystr too long', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    messageSend(channel.body.channelId, 'Hii how are you?', user1.body.token);
    messageSend(channel.body.channelId, "hi. i'm good", user1.body.token);
    messageSend(channel.body.channelId, "hi i'm okay", user1.body.token);
    let querystr = 'a';
    for (let i = 0; i < 100; i++) {
      querystr += 'aaaaaaaaaa';
    }
    const result = search(querystr, user1.body.token);
    expect(result.statusCode).toStrictEqual(400);
  });
});
