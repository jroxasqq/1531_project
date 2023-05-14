import { authRegister, authPasswordResetRequest, authLogin, usersAll, clear } from './helper';

const OK = 200;

beforeEach(() => {
  clear();
});

describe('/auth/passwordreset/request/v1', () => {
  test('Successfully requested a reset for outlook', () => {
    authRegister('z5421286@ad.unsw.edu.au', '123456', 'Ben', 'Davies');
    const request = authPasswordResetRequest('z5421286@ad.unsw.edu.au');
    expect(request.statusCode).toBe(OK);
    expect(request.body).toStrictEqual({});

    authRegister('xakithericeman225@gmail.com', '123456', 'Ben', 'Davies');
    const request1 = authPasswordResetRequest('xakithericeman225@gmail.com');
    expect(request1.statusCode).toBe(OK);
    expect(request1.body).toStrictEqual({});
  });
  test('Test that valid user is logged out in multiple sessions', () => {
    const user = authRegister('z5417138@ad.unsw.edu.au', '123456', 'Ben', 'Davies');
    authLogin('z5417138@ad.unsw.edu.au', '123456');
    authPasswordResetRequest('z5417138@ad.unsw.edu.au');
    const invalid = usersAll(user.body.token);
    expect(invalid.statusCode).toBe(403);
    expect(invalid.body).toStrictEqual({ error: 'Token is invalid.' });
  });
  test('Invalid email', () => {
    authRegister('z5417138@ad.unsw.edu.au', '123456', 'Ben', 'Davies');
    const request = authPasswordResetRequest('iwanttodietoday');
    expect(request.body).toStrictEqual(false);
  });
});
