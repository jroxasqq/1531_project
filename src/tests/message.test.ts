import { authRegister, channelsCreate, messageSend, dmCreate, messageSendDm, clear, messageEdit, channelMessages, authLogout, channelJoin, messagePin, messageUnpin, messageReact, messageUnreact, messageRemove, messageShare, messageSendLater } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

const sleep = (milliseconds: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

describe('/message/send/V2', () => {
  test('Successful message sent, edit and remove', () => {
    const user = authRegister('jerald@gmail.com', 'inshallah23', 'Jerald', 'Jose');
    const channel = channelsCreate('channel1', true, user.body.token);
    const message1 = messageSend(channel.body.channelId, 'jerald is awesome', user.body.token);
    expect(message1.statusCode).toBe(OK);
    expect(message1.body).toStrictEqual({ messageId: expect.any(Number) });

    const edit = messageEdit(message1.body.messageId, 'jerald is hot', user.body.token);
    expect(edit.statusCode).toBe(OK);
    expect(edit.body).toStrictEqual({});

    const edit1 = messageEdit(message1.body.messageId + 1, 'jerald is hot', user.body.token);
    expect(edit1.statusCode).toBe(400);
    expect(edit1.body).toStrictEqual({ error: 'Invalid messageId' });

    authLogout(user.body.token);
    const edit2 = messageEdit(message1.body.messageId, 'jerald is hot', user.body.token);
    expect(edit2.statusCode).toBe(403);
    expect(edit2.body).toStrictEqual({ error: 'Token is invalid.' });
  });

  test('MessageId is unique between channels and Dms', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');
    const user3 = authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');
    const dm = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);
    const messageDm = messageSendDm(dm.body.dmId, 'Hi how are you?', user1.body.token);
    expect(messageDm.statusCode).toBe(OK);
    expect(messageDm.body).toStrictEqual({ messageId: 0 });
    const channel = channelsCreate('channel1', true, user1.body.token);
    const messageChannel = messageSend(channel.body.channelId, 'Hi how are you?', user1.body.token);
    expect(messageChannel.statusCode).toBe(OK);
    expect(messageChannel.body).toStrictEqual({ messageId: 1 });
  });

  test('check errors - Invalid token/channelId, User is not member of channel, Invalid message length', () => {
    const user = authRegister('jerald@gmail.com', 'inshallah23', 'Jerald', 'Jose');
    const channel = channelsCreate('channel1', true, user.body.token);
    const message1 = messageSend(channel.body.channelId, 'jerald is awesome', 'faketoken');
    expect(message1.statusCode).toBe(403);

    const user2 = authRegister('isaac@gmail.com', 'lisa1234', 'Isaac', 'Chang');
    const message2 = messageSend(channel.body.channelId, 'jerald is awesome', user2.body.token);
    expect(message2.statusCode).toBe(403);

    const message3 = messageSend(channel.body.channelId, '', user.body.token);
    expect(message3.statusCode).toBe(400);

    const message4 = messageSend(channel.body.channelId + 10, 'jerald is awesome', user.body.token);
    expect(message4.statusCode).toBe(400);

    const message = messageSend(channel.body.channelId, 'jerald is awesome', user.body.token);
    expect(message.statusCode).toBe(OK);

    const edit1 = messageEdit(message.body.messageId, 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aeneadn commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N', user.body.token);
    expect(edit1.statusCode).toBe(400);
    expect(edit1.body).toStrictEqual({ error: 'Message length over 1000' });

    const edit = messageEdit(message.body.messageId, '', user.body.token);
    expect(edit.statusCode).toBe(OK);
    expect(edit.body).toStrictEqual({});
    const messages = channelMessages(channel.body.channelId, 0, user.body.token);
    expect(messages.statusCode).toBe(OK);
    expect(messages.body).toStrictEqual({
      messages: [],
      start: 0,
      end: -1
    });
  });

  test('Not sent by user, user doesnt have permissions for channels', () => {
    const user = authRegister('jerald@gmail.com', 'inshallah23', 'Jerald', 'Jose');
    const user2 = authRegister('isaac@gmail.com', 'lisa1234', 'Isaac', 'Chang');
    const channel = channelsCreate('channel1', true, user.body.token);
    const message1 = messageSend(channel.body.channelId, 'jerald is awesome', user.body.token);
    const edit = messageEdit(message1.body.messageId, 'jerald is hot', user2.body.token);
    expect(edit.statusCode).toBe(403);
    expect(edit.body).toStrictEqual({ error: 'User not authorised' });
  });
});

describe('message pin/unpin', () => {
  test('successful pin', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);

    const pin = messagePin(0, user1.body.token);
    expect(pin.statusCode).toStrictEqual(400);

    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    messagePin(message.body.messageId, user1.body.token);
    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);

    const pin1 = messagePin(message.body.messageId, user1.body.token);
    expect(pin1.statusCode).toBe(400);

    messageUnpin(message.body.messageId, user1.body.token);
    const messages1 = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages1.statusCode).toBe(OK);

    const unpin = messageUnpin(message.body.messageId, user1.body.token);
    expect(unpin.statusCode).toBe(400);
  });

  test('user global owner', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user2.body.token);
    channelJoin(channel.body.channelId, user1.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    messagePin(message.body.messageId, user1.body.token);
    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);

    messageUnpin(message.body.messageId, user1.body.token);
    const messages1 = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages1.statusCode).toBe(OK);
  });

  test('pin errors', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user3 = authRegister('ben1@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    channelJoin(channel.body.channelId, user2.body.token);

    const pin1 = messagePin(message.body.messageId, user3.body.token);
    expect(pin1.statusCode).toBe(400);

    channelJoin(channel.body.channelId, user3.body.token);
    const pin = messagePin(message.body.messageId, user2.body.token);
    expect(pin.statusCode).toBe(403);
  });

  test('unpin errors', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    messagePin(message.body.messageId, user1.body.token);

    const unpin1 = messageUnpin(message.body.messageId, user2.body.token);
    expect(unpin1.statusCode).toBe(400);

    channelJoin(channel.body.channelId, user2.body.token);

    const unpin2 = messageUnpin(message.body.messageId, user2.body.token);
    expect(unpin2.statusCode).toBe(403);

    const unpin = messageUnpin(message.body.messageId + 1, user1.body.token);
    expect(unpin.statusCode).toStrictEqual(400);
  });
});

describe('message react/unreact', () => {
  test('successful react', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user3 = authRegister('ben1@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);

    const react4 = messageReact(message.body.messageId, 1, user2.body.token);
    expect(react4.statusCode).toBe(400);

    const unreact3 = messageUnreact(message.body.messageId, 1, user2.body.token);
    expect(unreact3.statusCode).toBe(400);

    channelJoin(channel.body.channelId, user2.body.token);
    channelJoin(channel.body.channelId, user3.body.token);
    messageReact(message.body.messageId, 1, user2.body.token);
    messageReact(message.body.messageId, 1, user3.body.token);
    const messages = channelMessages(channel.body.channelId, 0, user2.body.token);
    expect(messages.statusCode).toBe(OK);
    expect(messages.body).toStrictEqual({
      messages: [
        {
          messageId: expect.any(Number),
          uId: user1.body.authUserId,
          message: 'hi! how are you?',
          timeSent: expect.any(Number),
          reacts: expect.any(Array),
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });

    messageReact(message.body.messageId, 1, user2.body.token);
    const react2 = messageReact(message.body.messageId, 1, user2.body.token);
    expect(react2.statusCode).toStrictEqual(400);

    const react = messageReact(message.body.messageId, 2, user2.body.token);
    expect(react.statusCode).toStrictEqual(400);

    const react3 = messageReact(message.body.messageId + 1, 2, user2.body.token);
    expect(react3.statusCode).toStrictEqual(400);

    messageUnreact(message.body.messageId, 1, user3.body.token);
    channelMessages(channel.body.channelId, 0, user2.body.token);
    expect(messages.statusCode).toBe(OK);

    const unreact = messageUnreact(message.body.messageId, 2, user2.body.token);
    expect(unreact.statusCode).toStrictEqual(400);

    const unreact1 = messageUnreact(message.body.messageId + 1, 1, user2.body.token);
    expect(unreact1.statusCode).toStrictEqual(400);

    const unreact2 = messageUnreact(message.body.messageId, 1, user3.body.token);
    expect(unreact2.statusCode).toBe(400);
  });
});

describe('/message/remove/V2', () => {
  test('Successful removal of message for channels', () => {
    const user = authRegister('jerald@gmail.com', 'inshallah23', 'Jerald', 'Jose');
    const user2 = authRegister('isaac@gmail.com', 'lisa1234', 'Isaac', 'Chang');
    const channel = channelsCreate('channel1', true, user.body.token);
    const message1 = messageSend(channel.body.channelId, 'jerald is awesome', user.body.token);

    const remove2 = messageRemove(message1.body.messageId, user2.body.token);
    expect(remove2.statusCode).toBe(403);
    expect(remove2.body).toStrictEqual({ error: 'User not authorised' });

    channelJoin(channel.body.channelId, user2.body.token);

    const remove3 = messageRemove(message1.body.messageId, user2.body.token);
    expect(remove3.statusCode).toBe(403);
    expect(remove3.body).toStrictEqual({ error: 'User not authorised' });

    const remove4 = messageRemove(message1.body.messageId, 'hello');
    expect(remove4.statusCode).toBe(403);
    expect(remove4.body).toStrictEqual({ error: 'Token is invalid.' });

    const remove1 = messageRemove(message1.body.messageId + 1, user.body.token);
    expect(remove1.statusCode).toBe(400);
    expect(remove1.body).toStrictEqual({ error: 'Invalid messageId' });

    const remove = messageRemove(message1.body.messageId, user.body.token);
    expect(remove.statusCode).toBe(OK);
    expect(remove.body).toStrictEqual({});
  });
});

describe('/message/share', () => {
  test('share to channel', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    const channel2 = channelsCreate('General', true, user1.body.token);
    const message1 = messageSend(channel.body.channelId, 'Hi! how are you?', user1.body.token);

    const share1 = messageShare(message1.body.messageId, '', channel2.body.channelId + 10, -1, user1.body.token);
    expect(share1.statusCode).toStrictEqual(400);

    const share2 = messageShare(message1.body.messageId, '', channel.body.channelId, 1, user1.body.token);
    expect(share2.statusCode).toStrictEqual(400);

    const share3 = messageShare(message1.body.messageId + 1, '', channel2.body.channelId, -1, user1.body.token);
    expect(share3.statusCode).toStrictEqual(400);

    const share4 = messageShare(message1.body.messageId, 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Na', channel2.body.channelId, -1, user1.body.token);
    expect(share4.statusCode).toStrictEqual(400);

    const share5 = messageShare(message1.body.messageId, '', channel2.body.channelId, -1, user2.body.token);
    expect(share5.statusCode).toStrictEqual(403);

    channelJoin(channel2.body.channelId, user2.body.token);
    const share7 = messageShare(message1.body.messageId, '', channel2.body.channelId, -1, user2.body.token);
    expect(share7.statusCode).toStrictEqual(400);

    const share6 = messageShare(message1.body.messageId, '', channel2.body.channelId, -1, user1.body.token + 'hello');
    expect(share6.statusCode).toStrictEqual(403);

    const share = messageShare(message1.body.messageId, '', channel2.body.channelId, -1, user1.body.token);
    expect(share.statusCode).toBe(OK);
    expect(share.body).toStrictEqual({
      sharedMessageId: expect.any(Number)
    });
  });
});

describe('message/sendlater', () => {
  test('successful + errors send later', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);

    const dm = dmCreate([user1.body.authUserId], user2.body.token);
    messageSendDm(dm.body.dmId, 'hi', user2.body.token);

    const timeSent = Math.floor(Date.now() / 1000) + 2;

    // Error cases
    const message = messageSendLater(channel.body.channelId + 1, 'yo yo honey singh', timeSent, user1.body.token);
    expect(message.statusCode).toBe(400);

    const message1 = messageSendLater(channel.body.channelId, '', timeSent, user1.body.token);
    expect(message1.statusCode).toBe(400);

    const message2 = messageSendLater(channel.body.channelId, 'yo yo honey singh', 1, user1.body.token);
    expect(message2.statusCode).toBe(400);

    const message3 = messageSendLater(channel.body.channelId, 'yo yo honey singh', timeSent, user2.body.token);
    expect(message3.statusCode).toBe(403);

    // Success case
    const success = messageSendLater(channel.body.channelId, 'yo yo honey singh', timeSent, user1.body.token);

    // Test that messageSendLater returns immediately.
    expect(success.statusCode).toBe(200);
    expect(success.body).toStrictEqual({ messageId: expect.any(Number) });

    // Since we send message 2 seconds later, we delay for 3 seconds.
    sleep(3000);

    const messages = channelMessages(channel.body.channelId, 0, user1.body.token);
    expect(messages.statusCode).toBe(OK);
    expect(messages.body.messages[0].timeSent).toBeLessThanOrEqual(timeSent + 2);
  });
});
