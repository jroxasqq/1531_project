import { authRegister, userProfileSetName } from './helper';
import { deleteRequest } from './requests';

const OK = 200;

beforeEach(() => {
  deleteRequest('/clear/v1', {});
});

describe('Tests for user/profile/setname/v1', () => {
  test('Valid request', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');

    const res = userProfileSetName('new', 'name', user.body.token);

    expect(res.statusCode).toBe(OK);
    expect(res.body).toStrictEqual({});
  });

  test('Invalid nameFirst - not between 1 to 50 characters inclusive', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');

    const res = userProfileSetName('', 'lastname', user.body.token);

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({ error: 'First name must be 1 to 50 characters inclusive.' });
  });

  test('Invalid nameLast - not between 1 to 50 characters inclusive', () => {
    const user = authRegister('user@gmail.com', 'userpassword', 'user', 'one');

    const res = userProfileSetName('firstname', '', user.body.token);

    expect(res.statusCode).toBe(400);
    expect(res.body).toStrictEqual({ error: 'Last name must be 1 to 50 characters inclusive.' });
  });

  test('Invalid token', () => {
    const res = userProfileSetName('firstname', 'lastname', 'faketoken');

    expect(res.statusCode).toBe(403);
    expect(res.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
