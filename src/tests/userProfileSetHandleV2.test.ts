import { authRegister, userProfileSetHandle } from './helper';
import { deleteRequest } from './requests';

const OK = 200;

beforeEach(() => {
  deleteRequest('/clear/v1', {});
});

describe('Tests for user/profile/sethandle/v1', () => {
  test('Valid request', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');
    const res = userProfileSetHandle('usertwo', user.body.token);
    expect(res.statusCode).toBe(OK);
    expect(res.body).toStrictEqual({});
  });

  test('Invalid handleStr - not between 3 and 20 characters inclusive', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');
    const res = userProfileSetHandle('a', user.body.token);
    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({ error: 'Handle must be between 3 to 50 characters inclusive.' });
  });

  test('Invalid handleStr - contains characters that are non-alphanumeric', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');

    const res = userProfileSetHandle('user!*@*(#@(*one', user.body.token);
    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({ error: 'Handle must only contain letters and numbers.' });
  });

  test('Invalid handle - already taken by another user', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');
    const user2 = authRegister('usertwo@gmail.com', 'userpassword1', 'user', 'two');

    userProfileSetHandle('us3r0n3', user.body.token);

    const res = userProfileSetHandle('us3r0n3', user2.body.token);
    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({ error: 'Handle is already taken.' });
  });

  test('Invalid token', () => {
    const res = userProfileSetHandle('usrone', 'faketoken');
    expect(res.statusCode).toBe(403);
    expect(res.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
