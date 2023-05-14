import { authRegister, authPasswordResetRequest, authPasswordResetReset, clear } from './helper';

// const OK = 200;

beforeEach(() => {
  clear();
});

describe('/auth/passwordreset/reset/v1', () => {
  // test('Successfully logins after requesting for a new password', () => {
  //   authRegister('z5421286@ad.unsw.edu.au', '123456', 'Ben', 'Davies');
  //   authPasswordResetRequest('z5421286@ad.unsw.edu.au');
  //   authPasswordResetReset(expect.any(String), 'jaidonkeyjeraldlove');
  //   const login = authLogin('z5421286@ad.unsw.edu.au', 'jaidonkeyjeraldlove');
  //   expect(login.statusCode).toBe(OK);
  //   expect(login.body).toStrictEqual({
  //     authUserId: login.body.authUserId,
  //     token: login.body.token
  //   });
  // });
  test('Resetcode is not valid', () => {
    authRegister('jeffree101@outlook.com', '123456', 'Ben', 'Davies');
    authPasswordResetRequest('jeffree101@outlook.com');
    const badResetCode = authPasswordResetReset('BADRESETCODE', 'jaidonkeyjeraldlove');
    expect(badResetCode.statusCode).toBe(400);
    expect(badResetCode.body).toStrictEqual({ error: 'Reset code does not exist' });
  });
  test('New password is less than 6 characters', () => {
    authRegister('z5421286@ad.unsw.edu.au', '123456', 'Ben', 'Davies');
    authPasswordResetRequest('z5421286@ad.unsw.edu.au');
    const shortNewPassword = authPasswordResetReset('VALIDCODE', '12345');
    expect(shortNewPassword.statusCode).toBe(400);
    expect(shortNewPassword.body).toStrictEqual({ error: 'New password is too short' });
  });
});
