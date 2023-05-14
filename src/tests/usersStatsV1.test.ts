import { clear, usersStats, authRegister, channelsCreate, dmCreate, messageSend, messageSendDm } from './helper';

clear();
const user = authRegister('example@gmail.com', '123145423', 'jerald', 'jose');

describe('Tests for workspaceStats', () => {
  test('Empty channels and dm', () => {
    const stats = usersStats(user.body.token);
    expect(stats.statusCode).toBe(200);
  });
  test('One channel', () => {
    authRegister('example1@gmail.com', '12314542223', 'jeraldi', 'josey');
    authRegister('example12@gmail.com', '12314542223', 'jeraldhuuui', 'josekhany');
    channelsCreate('channel1', true, user.body.token);
    dmCreate([1], user.body.token);
    messageSend(0, 'hello', user.body.token);
    messageSendDm(0, 'hi', user.body.token);

    const stats = usersStats(user.body.token);
    expect(stats.statusCode).toBe(200);
  });
});
