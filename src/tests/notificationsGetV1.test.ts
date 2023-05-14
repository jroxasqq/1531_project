import { clear, authRegister, channelsCreate, messageSendDm, messageShare, messageEdit, messageSend, notificationsGet, messageReact, channelInvite, dmCreate, messageUnreact, messageRemove, channelLeave, channelJoin } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

describe('Test success', () => {
  test('successful case - unreact, edit or delete message', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', true, user1.body.token);
    const channel2 = channelsCreate('My Channel', true, user2.body.token);
    channelJoin(channel.body.channelId, user2.body.token);
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    const message2 = messageSend(channel.body.channelId, 'hi @benboy! how are you?', user2.body.token);
    messageReact(message.body.messageId, 1, user2.body.token);
    const notifications = notificationsGet(user1.body.token);
    expect(notifications.statusCode).toBe(OK);
    expect(notifications.body).toStrictEqual({
      notifications: [
        {
          channelId: channel.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy0 reacted to your message in Cartoon Network'
        },
        {
          channelId: channel.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy0 tagged you in Cartoon Network: hi @benboy! how are '
        }
      ]
    });

    messageRemove(message2.body.messageId, user1.body.token);
    messageUnreact(message.body.messageId, 1, user2.body.token);

    const notifications4 = notificationsGet(user1.body.token);
    expect(notifications4.statusCode).toBe(OK);
    expect(notifications4.body).toStrictEqual({
      notifications: [
        {
          channelId: channel.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy0 reacted to your message in Cartoon Network'
        },
        {
          channelId: channel.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy0 tagged you in Cartoon Network: hi @benboy! how are '
        }
      ]
    });

    messageShare(message.body.messageId, '@benboy0', channel2.body.channelId, -1, user2.body.token);

    const message3 = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    messageEdit(message3.body.messageId, 'hi@benboy0! how are you?', user1.body.token);
    const notifications3 = notificationsGet(user2.body.token);
    expect(notifications3.statusCode).toBe(OK);
    expect(notifications3.body).toStrictEqual({
      notifications: [
        {
          channelId: channel.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy tagged you in Cartoon Network: hi@benboy0! how are '
        },
        {
          channelId: channel2.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy0 tagged you in My Channel: hi! how are you? @be',
        }
      ]
    });
  });

  test('successful case - dm tests', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const dm = dmCreate([user2.body.authUserId], user1.body.token);
    const message = messageSendDm(dm.body.dmId, 'hi@benboy0! how are you?', user1.body.token);
    const notifications1 = notificationsGet(user2.body.token);
    expect(notifications1.statusCode).toBe(OK);
    expect(notifications1.body).toStrictEqual({
      notifications: [
        {
          channelId: -1,
          dmId: dm.body.dmId,
          notificationMessage: 'benboy tagged you in benboy, benboy0: hi@benboy0! how are '
        },
        {
          channelId: -1,
          dmId: dm.body.dmId,
          notificationMessage: 'benboy added you to benboy, benboy0'
        }
      ]
    });

    messageReact(message.body.messageId, 1, user2.body.token);
    messageEdit(message.body.messageId, 'hi@benboy! how are you?', user1.body.token);
    const notifications2 = notificationsGet(user1.body.token);
    expect(notifications2.statusCode).toBe(OK);
    expect(notifications2.body).toStrictEqual({
      notifications: [
        {
          channelId: -1,
          dmId: dm.body.dmId,
          notificationMessage: 'benboy tagged you in benboy, benboy0: hi@benboy! how are y'
        },
        {
          channelId: -1,
          dmId: dm.body.dmId,
          notificationMessage: 'benboy0 reacted to your message in benboy, benboy0'
        }
      ]
    });
  });

  test('successful case - >20 notifications', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    let notifArray = [];
    for (let i = 0; i < 20; i++) {
      messageSend(channel.body.channelId, 'hi@benboy! how are you?', user1.body.token);
      notifArray.unshift({
        channelId: channel.body.channelId,
        dmId: -1,
        notificationMessage: 'benboy tagged you in Cartoon Network: hi@benboy! how are y'
      });
    }
    messageSend(channel.body.channelId, 'hi@benboy!', user1.body.token);
    notifArray.unshift({
      channelId: channel.body.channelId,
      dmId: -1,
      notificationMessage: 'benboy tagged you in Cartoon Network: hi@benboy!'
    });
    notifArray = notifArray.slice(0, 20);

    const notifications = notificationsGet(user1.body.token);
    expect(notifications.statusCode).toBe(OK);
    expect(notifications.body).toStrictEqual({
      notifications: notifArray
    });
    expect(notifications.body.notifications.length).toBe(20);
  });

  test('successful case - user leaves channel + user is added to channel', () => {
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const user2 = authRegister('ben0@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user1.body.token);
    channelInvite(channel.body.channelId, user2.body.authUserId, user1.body.token);
    const notifications1 = notificationsGet(user2.body.token);
    expect(notifications1.statusCode).toBe(OK);
    expect(notifications1.body).toStrictEqual({
      notifications: [
        {
          channelId: channel.body.channelId,
          dmId: -1,
          notificationMessage: 'benboy added you to Cartoon Network'
        }
      ]
    });
    const message = messageSend(channel.body.channelId, 'hi! how are you?', user1.body.token);
    channelLeave(channel.body.channelId, user1.body.token);
    messageReact(message.body.messageId, 1, user2.body.token);
    const notifications = notificationsGet(user1.body.token);
    expect(notifications.statusCode).toBe(OK);
    expect(notifications.body).toStrictEqual({
      notifications: []
    });
  });
});
