import { authRegister, authLogin, channelsCreate, clear, channelDetails } from './helper';

beforeEach(() => {
  clear();
});

describe('test clear of users', () => {
  test('Succesful clear of users', () => {
    authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    clear();
    const userLogin = authLogin('ben@gmail.com', 'bennyboy');
    expect(userLogin.statusCode).toStrictEqual(400);
  });

  test('Succesful clear of channels', () => {
    const user = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const channel = channelsCreate('Cartoon Network', false, user.body.token);
    clear();
    const user1 = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const details = channelDetails(channel.body.channelId, user1.body.token);
    expect(details.statusCode).toStrictEqual(400);
  });
});
