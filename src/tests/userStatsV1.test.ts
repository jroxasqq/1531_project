import { authRegister, clear, userStats, channelsCreate, dmCreate, messageSendDm, messageSend, dmRemove, channelJoin, channelLeave, channelInvite, dmLeave } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

describe('Tests for user/stats/v1', () => {
  test('Test correct return type', () => {
    const user1 = authRegister('isaac@gmail.com', '123456', 'Isaac', 'Chang');
    const user2 = authRegister('jai@gmail.com', '1234567', 'Jai', 'Dhawan');
    const user3 = authRegister('jerald@gmail.com', '1234568', 'Jerald', 'Jose');

    const stats = userStats(user2.body.token);
    expect(stats.statusCode).toBe(OK);
    expect(stats.body.userStats.involvementRate).toStrictEqual(0);

    const channel1 = channelsCreate('channel1', true, user1.body.token);
    messageSend(channel1.body.channelId, 'I am a little boy', user1.body.token);
    messageSend(channel1.body.channelId, 'I am a little boy', user1.body.token);
    messageSend(channel1.body.channelId, 'I am a little boy', user1.body.token);

    const channel2 = channelsCreate('channel2', true, user1.body.token);
    messageSend(channel2.body.channelId, 'I am a little boy', user1.body.token);
    messageSend(channel2.body.channelId, 'I am a little boy', user1.body.token);
    messageSend(channel2.body.channelId, 'I am a little boy', user1.body.token);

    channelJoin(channel1.body.channelId, user2.body.token);
    channelInvite(channel2.body.channelId, user3.body.authUserId, user1.body.token);
    channelLeave(channel1.body.channelId, user1.body.token);

    messageSend(channel1.body.channelId, 'You are ', user2.body.token);
    messageSend(channel1.body.channelId, 'You are ', user2.body.token);

    let output1 = userStats(user1.body.token);
    let output2 = userStats(user2.body.token);
    let output3 = userStats(user3.body.token);

    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.channelsJoined.length).toStrictEqual(4);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.dmsJoined.length).toStrictEqual(1);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.messagesSent.length).toStrictEqual(7);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.involvementRate).toStrictEqual(1);

    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.channelsJoined.length).toStrictEqual(2);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.dmsJoined.length).toStrictEqual(1);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.messagesSent.length).toStrictEqual(3);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.involvementRate).toStrictEqual(0.6);

    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.channelsJoined.length).toStrictEqual(2);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.dmsJoined.length).toStrictEqual(1);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.messagesSent.length).toStrictEqual(1);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.involvementRate).toStrictEqual(0.2);

    const dm1 = dmCreate([user2.body.authUserId], user1.body.token);

    messageSendDm(dm1.body.dmId, 'You dirty dog', user1.body.token);
    messageSendDm(dm1.body.dmId, 'You dirty dog', user1.body.token);
    messageSendDm(dm1.body.dmId, 'You dirty dog', user1.body.token);
    messageSendDm(dm1.body.dmId, 'You dirty dog', user2.body.token);
    messageSendDm(dm1.body.dmId, 'You dirty dog', user2.body.token);
    messageSendDm(dm1.body.dmId, 'You dirty dog', user2.body.token);

    const dm2 = dmCreate([user2.body.authUserId, user3.body.authUserId], user1.body.token);

    messageSendDm(dm2.body.dmId, 'Hello there', user1.body.token);
    messageSendDm(dm2.body.dmId, 'Hello there', user1.body.token);
    messageSendDm(dm2.body.dmId, 'Hello there', user1.body.token);

    messageSendDm(dm2.body.dmId, 'Hello there', user2.body.token);
    messageSendDm(dm2.body.dmId, 'Hello there', user2.body.token);
    messageSendDm(dm2.body.dmId, 'Hello there', user2.body.token);

    messageSendDm(dm2.body.dmId, 'Hello there', user3.body.token);
    messageSendDm(dm2.body.dmId, 'Hello there', user3.body.token);
    messageSendDm(dm2.body.dmId, 'Hello there', user3.body.token);

    output1 = userStats(user1.body.token);
    output2 = userStats(user2.body.token);
    output3 = userStats(user3.body.token);

    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.channelsJoined.length).toStrictEqual(4);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.dmsJoined.length).toStrictEqual(3);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.messagesSent.length).toStrictEqual(13);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.involvementRate).toStrictEqual(1);

    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.channelsJoined.length).toStrictEqual(2);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.dmsJoined.length).toStrictEqual(3);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.messagesSent.length).toStrictEqual(9);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.involvementRate).toStrictEqual(0.8461538461538461);

    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.channelsJoined.length).toStrictEqual(2);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.dmsJoined.length).toStrictEqual(2);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.messagesSent.length).toStrictEqual(4);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.involvementRate).toStrictEqual(0.38461538461538464);

    dmRemove(dm1.body.dmId, user1.body.token);
    dmRemove(dm2.body.dmId, user1.body.token);

    const dm3 = dmCreate([user1.body.authUserId], user3.body.token);
    channelLeave(channel1.body.channelId, user2.body.token);
    dmLeave(dm3.body.dmId, user1.body.token);

    output1 = userStats(user1.body.token);
    output2 = userStats(user2.body.token);
    output3 = userStats(user3.body.token);

    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.channelsJoined.length).toStrictEqual(4);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.dmsJoined.length).toStrictEqual(7);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.messagesSent.length).toStrictEqual(13);
    expect(output1.statusCode).toBe(OK);
    expect(output1.body.userStats.involvementRate).toStrictEqual(1);

    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.channelsJoined.length).toStrictEqual(3);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.dmsJoined.length).toStrictEqual(5);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.messagesSent.length).toStrictEqual(9);
    expect(output2.statusCode).toBe(OK);
    expect(output2.body.userStats.involvementRate).toStrictEqual(1);

    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.channelsJoined.length).toStrictEqual(2);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.dmsJoined.length).toStrictEqual(4);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.messagesSent.length).toStrictEqual(4);
    expect(output3.statusCode).toBe(OK);
    expect(output3.body.userStats.involvementRate).toStrictEqual(1);
  });
  test('Invalid token', () => {
    const stat = userStats('dogshit');
    expect(stat.statusCode).toBe(403);
    expect(stat.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
