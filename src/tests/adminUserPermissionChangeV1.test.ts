import { adminUserPermissionChange, clear, authRegister, userProfile } from './helper';

beforeEach(() => {
  clear();
});

describe('Tests for changing user permissions', () => {
  test('Successful permission change', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    const token2 = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');

    const change = adminUserPermissionChange(token2.body.authUserId, 1, token1.body.token);
    expect(change.statusCode).toBe(200);
    expect(change.body).toStrictEqual({});
    const result = userProfile(token2.body.authUserId, token2.body.token);
    expect(result.body.user.permissionId).toStrictEqual(1);
  });
  test('Invalid uId', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');

    const change = adminUserPermissionChange(5, 1, token1.body.token);
    expect(change.statusCode).toBe(400);
    expect(change.body).toStrictEqual({ error: 'Invalid uId' });
  });
  test('Only global owner being demoted', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    const change = adminUserPermissionChange(token1.body.authUserId, 2, token1.body.token);
    expect(change.statusCode).toBe(400);
    expect(change.body).toStrictEqual({ error: 'Global owner being demoted' });
  });
  test('Invalid permission Id', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    const change = adminUserPermissionChange(token1.body.authUserId, 7, token1.body.token);
    expect(change.statusCode).toBe(400);
    expect(change.body).toStrictEqual({ error: 'Invalid permissionId' });
  });
  test('Already has permission level', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    const change = adminUserPermissionChange(token1.body.authUserId, 1, token1.body.token);
    expect(change.statusCode).toBe(400);
    expect(change.body).toStrictEqual({ error: 'Already at permission level' });
  });
  test('Unauthorised User', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    const token2 = authRegister('example2@gmail.com', '123456', 'isaac', 'chang');

    const change = adminUserPermissionChange(token2.body.authUserId, 1, token2.body.token);
    adminUserPermissionChange(token2.body.authUserId, 1, token1.body.token);
    expect(change.statusCode).toBe(403);
    expect(change.body).toStrictEqual({ error: 'Unauthorised user' });
  });
  test('Invalid token', () => {
    const token1 = authRegister('example@gmail.com', '123456', 'jerald', 'jose');
    const change = adminUserPermissionChange(token1.body.authUserId, 1, 'faketoken');
    expect(change.statusCode).toBe(403);
    expect(change.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
