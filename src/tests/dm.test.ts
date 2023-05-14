import { authRegister, channelJoin, channelsCreate, dmCreate, dmDetails, dmMessages, dmRemove, dmList, dmLeave, messageSend, messageSendDm, messageEdit, messageReact, messageUnreact, messagePin, messageUnpin, messageShare, messageSendLaterDm, clear } from './helper';

const OK = 200;
const BAD_REQUEST = 400;
const FORBIDDEN = 403;

beforeEach(() => {
  clear();
});

const sleep = (milliseconds: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

describe('dm function tests', () => {
  test('Valid input, dm created with all uIds as members', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const dm1 = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    const dm2 = dmCreate([user1.body.authUserId], user3.body.token);

    const details = dmDetails(dm1.body.dmId, user1.body.token);
    const list = dmList(user1.body.token);

    expect(dm1.statusCode).toBe(OK);
    expect(dm1.body).toStrictEqual({ dmId: 0 });

    expect(details.statusCode).toBe(OK);

    const dmName = 'userone, userthree, usertwo';
    const dmMembers = [
      {
        uId: user1.body.authUserId,
        email: 'userone@gmail.com',
        nameFirst: 'user',
        nameLast: 'one',
        handleStr: 'userone',
        permissionId: expect.any(Number),
        profileImgUrl: expect.any(String),
        userStats: expect.any(Number)
      },
      {
        uId: user2.body.authUserId,
        email: 'usertwo@gmail.com',
        nameFirst: 'user',
        nameLast: 'two',
        handleStr: 'usertwo',
        permissionId: expect.any(Number),
        profileImgUrl: expect.any(String),
        userStats: expect.any(Number)
      },
      {
        uId: user3.body.authUserId,
        email: 'userthree@gmail.com',
        nameFirst: 'user',
        nameLast: 'three',
        handleStr: 'userthree',
        permissionId: expect.any(Number),
        profileImgUrl: expect.any(String),
        userStats: expect.any(Number)
      },
    ];

    expect(details.body).toStrictEqual({
      name: dmName,
      members: dmMembers,
    });

    expect(list.statusCode).toBe(OK);
    expect(list.body.dms).toStrictEqual(
      [
        {
          dmId: dm1.body.dmId,
          name: 'userone, userthree, usertwo',
        },
        {
          dmId: dm2.body.dmId,
          name: 'userone, userthree',
        }
      ]
    );

    const remove = dmRemove(dm1.body.dmId, user1.body.token);
    expect(remove.statusCode).toBe(OK);
    expect(remove.body).toStrictEqual({});
  });

  test('dm created empty uIds, invalid dmIds', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');

    const dm = dmCreate([], user1.body.token);

    const details = dmDetails(dm.body.dmId + 1, user1.body.token);
    const messages = dmMessages(dm.body.dmId + 1, 0, user1.body.token);
    const leave = dmLeave(dm.body.dmId + 1, user1.body.token);
    const remove = dmRemove(dm.body.dmId + 1, user1.body.token);

    expect(details.statusCode).toEqual(BAD_REQUEST);
    expect(details.body).toStrictEqual({ error: expect.any(String) });

    expect(messages.statusCode).toBe(BAD_REQUEST);
    expect(messages.body).toStrictEqual({ error: 'dmId does not refer to a valid DM.' });

    expect(leave.statusCode).toBe(BAD_REQUEST);
    expect(leave.body).toStrictEqual({ error: 'dmId does not refer to a valid DM' });

    expect(remove.statusCode).toEqual(BAD_REQUEST);
    expect(remove.body).toStrictEqual({ error: 'dmId is invalid.' });
  });

  test('dmRemove, valid dmId but token refers to non-creator/owner of dm', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    const remove = dmRemove(dm.body.dmId, user2.body.token);
    expect(remove.statusCode).toEqual(FORBIDDEN);
    expect(remove.body).toStrictEqual({ error: 'authorised user is not the original DM creator' });
  });

  test('uIds contains an invalid uId and duplicate uId', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const dm1 = dmCreate([user2.body.authUserId, user3.body.authUserId + 1], user1.body.token);

    expect(dm1.statusCode).toEqual(BAD_REQUEST);
    expect(dm1.body).toStrictEqual({ error: expect.any(String) });

    const dm2 = dmCreate([user2.body.authUserId, user2.body.authUserId, user3.body.authUserId], user1.body.token);

    expect(dm2.statusCode).toEqual(BAD_REQUEST);
    expect(dm2.body).toStrictEqual({ error: expect.any(String) });
  });

  test('Invalid input, dmLeave success + non-member errors', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const user4 = authRegister('userfour@gmail.com', 'userfourpassword', 'user', 'four');

    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);

    const leave1 = dmLeave(dm.body.dmId, user1.body.token);

    expect(leave1.statusCode).toBe(OK);
    expect(leave1.body).toStrictEqual({});

    const details = dmDetails(dm.body.dmId, user1.body.token);
    const messages = dmMessages(dm.body.dmId, 0, user1.body.token);
    const leave2 = dmLeave(dm.body.dmId, user4.body.token);
    const remove = dmRemove(dm.body.dmId, user1.body.token);

    expect(details.statusCode).toEqual(FORBIDDEN);
    expect(details.body).toStrictEqual({ error: expect.any(String) });

    expect(messages.statusCode).toBe(FORBIDDEN);
    expect(messages.body).toStrictEqual({ error: 'User is not part of the DM.' });

    expect(leave2.statusCode).toBe(FORBIDDEN);
    expect(leave2.body).toStrictEqual({ error: 'authorised user is not a member of the DM' });

    expect(remove.statusCode).toEqual(FORBIDDEN);
    expect(remove.body).toStrictEqual({ error: 'authorised user is no longer in the DM' });
  });

  test('dmCreate invalid input, invalid token', () => {
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], 'GOOFY');

    expect(dm.statusCode).toEqual(FORBIDDEN);
    expect(dm.body).toStrictEqual({ error: expect.any(String) });
  });

  test('Other dm functions invalid input, invalid token', () => {
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const dm = dmCreate([user2.body.authUserId], user3.body.authUserId);

    const details = dmDetails(dm.body.dmId, 'POPPY');
    const messages = dmMessages(dm.body.dmId, 0, 'random');
    const list = dmList('POPPY');
    const leave = dmLeave(dm.body.dmId, 'random');
    const remove = dmRemove(dm.body.dmId, 'random');

    expect(details.statusCode).toEqual(FORBIDDEN);
    expect(details.body).toStrictEqual({ error: expect.any(String) });

    expect(messages.statusCode).toBe(FORBIDDEN);
    expect(messages.body).toStrictEqual({ error: expect.any(String) });

    expect(list.statusCode).toEqual(FORBIDDEN);
    expect(list.body).toStrictEqual({ error: expect.any(String) });

    expect(leave.statusCode).toBe(FORBIDDEN);
    expect(leave.body).toStrictEqual({ error: 'Token is invalid.' });

    expect(remove.statusCode).toEqual(FORBIDDEN);
    expect(remove.body).toStrictEqual({ error: 'Token is invalid.' });
  });

  test('dmMessages, start is greater than the total number of messages in the channel', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');

    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);

    const dm = dmCreate([], user1.body.token);

    messageSendDm(dm.body.dmId, 'Hello it is me.', user1.body.token);
    messageSendDm(dm.body.dmId, 'My name is Ronaldo.', user1.body.token);
    messageSendDm(dm.body.dmId, 'Your name is Messi.', user1.body.token);

    const messages = dmMessages(dm.body.dmId, 5, user1.body.token);

    expect(messages.statusCode).toBe(BAD_REQUEST);
    expect(messages.body).toStrictEqual({ error: 'Start is greater than the total number of messages in the channel.' });
  });

  test('Test if more than 50 messages are sent', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');

    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');

    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);

    for (let i = 0; i < 64; i++) {
      messageSendDm(dm.body.dmId, `Message ${i}`, user1.body.token);
    }

    const messages = dmMessages(dm.body.dmId, 0, user1.body.token);

    expect(messages.statusCode).toBe(OK);
  });
});

describe('message/edit for dm', () => {
  test('Successful Edit for Dm', () => {
    const userBuzz = authRegister('buzz.lightyear@starcommand.com', 'qazwsx@@', 'buzz', 'lightyear');
    const userWoody = authRegister('sheriff.woody@andysroom.com', 'qazwsx!!', 'sheriff', 'woody');

    const dm = dmCreate([userBuzz.body.authUserId], userWoody.body.token);
    const message1 = messageSendDm(dm.body.dmId, 'hi', userWoody.body.token);

    const edit1 = messageEdit(message1.body.messageId, 'jerald is hot', userWoody.body.token);
    expect(edit1.statusCode).toBe(OK);
    expect(edit1.body).toStrictEqual({});
  });

  test('Invalid dmId + editing by non-sender of dm + invalid token', () => {
    const userBuzz = authRegister('buzz.lightyear@starcommand.com', 'qazwsx@@', 'buzz', 'lightyear');
    const userWoody = authRegister('sheriff.woody@andysroom.com', 'qazwsx!!', 'sheriff', 'woody');

    const dm = dmCreate([userBuzz.body.authUserId], userWoody.body.token);
    const message1 = messageSendDm(dm.body.dmId, 'hi', userWoody.body.token);

    const edit2 = messageEdit(message1.body.messageId + 1, 'jerald is hot', userWoody.body.token);
    expect(edit2.statusCode).toBe(400);
    expect(edit2.body).toStrictEqual({ error: 'Invalid messageId' });

    const edit3 = messageEdit(message1.body.messageId, 'jerald is hot', userBuzz.body.token);
    expect(edit3.statusCode).toBe(403);
    expect(edit3.body).toStrictEqual({ error: 'User not authorised' });

    const edit4 = messageEdit(message1.body.messageId, 'jerald is hot', userWoody.body.token + 1);
    expect(edit4.statusCode).toBe(403);
    expect(edit4.body).toStrictEqual({ error: 'Token is invalid.' });
  });

  test('Test if message edit length is 0, removes the message for Dms', () => {
    const userBuzz = authRegister('buzz.lightyear@starcommand.com', 'qazwsx@@', 'buzz', 'lightyear');
    const userWoody = authRegister('sheriff.woody@andysroom.com', 'qazwsx!!', 'sheriff', 'woody');
    const dm = dmCreate([userWoody.body.authUserId], userBuzz.body.token);
    const message1 = messageSendDm(dm.body.dmId, 'hi', userWoody.body.token);
    expect(message1.statusCode).toBe(OK);
    expect(message1.body).toStrictEqual({ messageId: 0 });
    const edit = messageEdit(message1.body.messageId, '', userWoody.body.token);
    expect(edit.statusCode).toBe(OK);
    expect(edit.body).toStrictEqual({});
    const messages = dmMessages(dm.body.dmId, 0, userBuzz.body.token);
    expect(messages.statusCode).toBe(OK);
    expect(messages.body).toStrictEqual({
      messages: [],
      start: 0,
      end: -1
    });
  });

  test('Message over 1000 characters for Dm', () => {
    const userBuzz = authRegister('buzz.lightyear@starcommand.com', 'qazwsx@@', 'buzz', 'lightyear');
    const userWoody = authRegister('sheriff.woody@andysroom.com', 'qazwsx!!', 'sheriff', 'woody');
    const dm = dmCreate([userBuzz.body.authUserId], userWoody.body.token);
    const message1 = messageSendDm(dm.body.dmId, 'jerald is awesome', userWoody.body.token);
    const edit = messageEdit(message1.body.messageId, 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aeneadn commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N', userWoody.body.token);
    expect(edit.statusCode).toBe(400);
    expect(edit.body).toStrictEqual({ error: 'Message length over 1000' });
  });

  test('Global owner cant edit creator message Dm', () => {
    const userBuzz = authRegister('buzz.lightyear@starcommand.com', 'qazwsx@@', 'buzz', 'lightyear');
    const userWoody = authRegister('sheriff.woody@andysroom.com', 'qazwsx!!', 'sheriff', 'woody');
    const dm = dmCreate([userBuzz.body.authUserId], userWoody.body.token);
    const message1 = messageSendDm(dm.body.dmId, 'hi', userWoody.body.token);
    const edit = messageEdit(message1.body.messageId, 'jerald is hot', userBuzz.body.token);
    expect(edit.statusCode).toBe(403);
    expect(edit.body).toStrictEqual({ error: 'User not authorised' });
  });
});

describe('message/react and message/unreact for dm', () => {
  test('Successful react and unreact', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    const messageSend = messageSendDm(dm.body.dmId, 'Hi how are you?', user1.body.token);
    messageReact(messageSend.body.messageId, 1, user2.body.token);
    messageReact(messageSend.body.messageId, 1, user3.body.token);
    messageUnreact(messageSend.body.messageId, 1, user2.body.token);
    const messages = dmMessages(dm.body.dmId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);
  });

  test('incorrect react id', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);

    const react = messageReact(message.body.messageId, 2, user2.body.token);
    expect(react.statusCode).toStrictEqual(400);

    const unreact = messageUnreact(message.body.messageId, 2, user2.body.token);
    expect(unreact.statusCode).toStrictEqual(400);
  });

  test('invalid message id', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');

    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);

    const react = messageReact(message.body.messageId + 1, 2, user2.body.token);
    expect(react.statusCode).toStrictEqual(400);

    const unreact = messageUnreact(message.body.messageId + 1, 1, user2.body.token);
    expect(unreact.statusCode).toStrictEqual(400);
  });

  test('user not member', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    const react = messageReact(message.body.messageId, 1, user2.body.token);
    expect(react.statusCode).toBe(400);

    messageReact(message.body.messageId, 1, user1.body.token);
    const unreact = messageUnreact(message.body.messageId, 1, user2.body.token);
    expect(unreact.statusCode).toBe(400);
  });
});

describe('message/pin and message/unpin for dm', () => {
  test('successful pin and unpin', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    const messageSend = messageSendDm(dm.body.dmId, 'Hi how are you?', user1.body.token);

    messagePin(messageSend.body.messageId, user1.body.token);
    const messages1 = dmMessages(dm.body.dmId, 0, user1.body.token);

    expect(messages1.statusCode).toBe(OK);

    messageUnpin(messageSend.body.messageId, user1.body.token);
    const messages2 = dmMessages(dm.body.dmId, 0, user1.body.token);
    expect(messages2.statusCode).toBe(OK);
  });
});

describe('message/share for dm', () => {
  test('share to dm', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const dm = dmCreate([user2.body.authUserId], user1.body.token);
    const message1 = messageSendDm(dm.body.dmId, 'Hi! how are you?', user1.body.token);
    const share = messageShare(message1.body.messageId, 'hello', -1, dm.body.dmId, user1.body.token);
    expect(share.statusCode).toBe(OK);
    expect(share.body).toStrictEqual({
      sharedMessageId: expect.any(Number)
    });
  });
});

describe('message/sendlaterdm for dm', () => {
  test('Succesful dm sent later', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    authRegister('example3@gmail.com', '12344566', 'Ben', 'Davies');

    const channel = channelsCreate('Cartoon Network', true, token1.body.token);
    messageSend(channel.body.channelId, 'jerald is awesome', token1.body.token);

    const timeSent = Math.floor(Date.now() / 1000) + 2;
    const dm1 = dmCreate([0, 1], token1.body.token);
    const success = messageSendLaterDm(dm1.body.dmId, 'Hello', timeSent, token1.body.token);

    // Test that messageSendLater returns immediately.
    expect(success.statusCode).toBe(200);
    expect(success.body).toStrictEqual({ messageId: expect.any(Number) });

    // Since we send message 2 seconds later, we delay for 3 seconds.
    sleep(3000);
    expect(dmMessages(0, 0, token1.body.token).body.messages[0].timeSent).toStrictEqual(timeSent);
  });
  test('Invalid dmId test', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');

    const timeSent = Math.floor(Date.now() / 1000) + 2;
    const laterDm = messageSendLaterDm(7, 'Hello', timeSent, token1.body.token);
    expect(laterDm.statusCode).toBe(400);
    expect(laterDm.body).toStrictEqual({ error: 'Invalid dmId' });
  });
  test('Testing invalid length of message > 1000 characters', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');

    const timeSent = Math.floor(Date.now() / 1000) + 2;
    const dm1 = dmCreate([1], token1.body.token);
    const message = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Na';
    const laterDm = messageSendLaterDm(dm1.body.dmId, message, timeSent, token1.body.token);
    expect(laterDm.statusCode).toBe(400);
    expect(laterDm.body).toStrictEqual({ error: 'Invalid message length' });
  });
  test('Testing invalid length of message > 1000 characters', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');

    const timeSent = Math.floor(Date.now() / 1000) + 2;
    const dm1 = dmCreate([1], token1.body.token);
    const message = '';
    const laterDm = messageSendLaterDm(dm1.body.dmId, message, timeSent, token1.body.token);
    expect(laterDm.statusCode).toBe(400);
    expect(laterDm.body).toStrictEqual({ error: 'Invalid message length' });
  });
  test('Past timeSent', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    authRegister('example3@gmail.com', '12344566', 'Ben', 'Davies');
    authRegister('example2@gmail.com', '1231231', 'Isaac', 'Chang');

    const timeSent = Math.floor(Date.now() / 1000) - 20;
    const dm1 = dmCreate([1], token1.body.token);
    const laterDm = messageSendLaterDm(dm1.body.dmId, 'Hello', timeSent, token1.body.token);
    expect(laterDm.statusCode).toBe(400);
    expect(laterDm.body).toStrictEqual({ error: 'Past timesent' });
  });
  test('User is not a member of dm', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    authRegister('example2@gmail.com', '1231231', 'Isaac', 'Chang');
    const token3 = authRegister('example3@gmail.com', '12344566', 'Ben', 'Davies');

    const timeSent = Math.floor(Date.now() / 1000) + 20;
    const dm1 = dmCreate([1], token1.body.token);

    const laterDm = messageSendLaterDm(dm1.body.dmId, 'Hello', timeSent, token3.body.token);
    expect(laterDm.statusCode).toBe(400);
    expect(laterDm.body).toStrictEqual({ error: 'Unauthorised user' });
  });
  test('Invalid token', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    authRegister('example3@gmail.com', '12344566', 'Ben', 'Davies');

    const timeSent = Math.floor(Date.now() / 1000) + 20;
    const dm1 = dmCreate([1], token1.body.token);

    const laterDm = messageSendLaterDm(dm1.body.dmId, 'Hello', timeSent, 'faketoken');
    expect(laterDm.statusCode).toBe(403);
    expect(laterDm.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});

describe('message/sendDm errors', () => {
  test('succesful send', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    expect(dm.statusCode).toBe(OK);
    expect(dm.body).toStrictEqual({ dmId: expect.any(Number) });
  });

  test('Invalid dmId + invalid message length + non-member sending + invalid token', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const user4 = authRegister('userfour@gmail.com', 'userfourpassword', 'user', 'four');

    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);

    const message1 = messageSendDm(dm.body.dmId, 'Hi how are you?', user1.body.token);
    expect(message1.statusCode).toBe(OK);
    expect(message1.body).toStrictEqual({ messageId: 0 });

    const message2 = messageSendDm(dm.body.dmId + 1, 'Hi how are you?', user1.body.token);
    expect(message2.statusCode).toBe(BAD_REQUEST);
    expect(message2.body).toStrictEqual({ error: 'DmId is invalid.' });

    const message3 = messageSendDm(dm.body.dmId, '', user1.body.token);
    expect(message3.statusCode).toBe(BAD_REQUEST);
    expect(message3.body).toStrictEqual({ error: 'Message must at least be 1 character.' });

    const message4 = messageSendDm(dm.body.dmId, 'a'.repeat(1001), user1.body.token);
    expect(message4.statusCode).toBe(BAD_REQUEST);
    expect(message4.body).toStrictEqual({ error: 'Message must be less than 1000 characters.' });

    const message5 = messageSendDm(dm.body.dmId, 'Hi how are you?', user4.body.token);
    expect(message5.statusCode).toBe(FORBIDDEN);
    expect(message5.body).toStrictEqual({ error: 'User is not part of the DM.' });

    const message6 = messageSendDm(dm.body.dmId, 'Hi how are you?', 'random');
    expect(message6.statusCode).toBe(FORBIDDEN);
    expect(message6.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
