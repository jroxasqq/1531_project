import { authRegister, userProfileSetEmail } from './helper';
import { deleteRequest } from './requests';

const OK = 200;

beforeEach(() => {
  deleteRequest('/clear/v1', {});
});

describe('Tests for user/profile/setemail/v1', () => {
  test('Valid request', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');

    const setEmail = userProfileSetEmail('user1@gmail.com', user.body.token);
    expect(setEmail.statusCode).toBe(OK);
    expect(setEmail.body).toStrictEqual({});
  });

  test('Invalid email - returns false for "isEmail" function of "validator" package ', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');

    const setEmail = userProfileSetEmail('user', user.body.token);
    expect(setEmail.statusCode).toBe(400);
    expect(setEmail.body).toStrictEqual({ error: 'Email is in an invalid format.' });
  });

  test('Invalid email - taken by another user', () => {
    const user1 = authRegister('user@gmail.com', 'userpassword', 'user', 'one');
    authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');

    const setEmail = userProfileSetEmail('usertwo@gmail.com', user1.body.token);
    expect(setEmail.statusCode).toBe(400);
    expect(setEmail.body).toStrictEqual({ error: 'Email is already taken.' });
  });

  test('Invalid token', () => {
    const setEmail = userProfileSetEmail('usertwo@gmail.com', 'faketoken');
    expect(setEmail.statusCode).toBe(403);
    expect(setEmail.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
