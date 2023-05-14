import { authRegister, authLogin, userProfile, clear } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

describe('Test user profile', () => {
  test('Succesful user profile', () => {
    const user = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const profile = userProfile(user.body.authUserId, user.body.token);
    expect(profile.statusCode).toBe(OK);
    expect(profile.body).toStrictEqual({
      user: {
        uId: user.body.authUserId,
        email: 'ben@gmail.com',
        nameFirst: 'Ben',
        nameLast: 'Boy',
        handleStr: expect.any(String),
        permissionId: expect.any(Number),
        profileImgUrl: expect.any(String),
        userStats: expect.any(Number)
      }
    });
  });

  test('invalid uId', () => {
    const user = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const profile = userProfile(user.body.authUserId + 1, user.body.token);
    expect(profile.statusCode).toBe(400);
  });

  test('invalid token', () => {
    const user = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const profile = userProfile(user.body.authUserId, user.body.token + 'lol');
    expect(profile.statusCode).toBe(403);
  });

  test('Success with multiple tokens from same user', () => {
    const user = authRegister('ben@gmail.com', 'bennyboy', 'Ben', 'Boy');
    const login = authLogin('ben@gmail.com', 'bennyboy');
    const profile1 = userProfile(user.body.authUserId, user.body.token);
    expect(profile1.statusCode).toBe(OK);
    expect(profile1.body).toStrictEqual({
      user: {
        uId: user.body.authUserId,
        email: 'ben@gmail.com',
        nameFirst: 'Ben',
        nameLast: 'Boy',
        handleStr: expect.any(String),
        permissionId: expect.any(Number),
        profileImgUrl: expect.any(String),
        userStats: expect.any(Number)
      }
    });

    const profile2 = userProfile(user.body.authUserId, login.body.token);
    expect(profile2.statusCode).toBe(OK);
    expect(profile2.body).toStrictEqual({
      user: {
        uId: user.body.authUserId,
        email: 'ben@gmail.com',
        nameFirst: 'Ben',
        nameLast: 'Boy',
        handleStr: expect.any(String),
        permissionId: expect.any(Number),
        profileImgUrl: expect.any(String),
        userStats: expect.any(Number)
      }
    });
  });
});
