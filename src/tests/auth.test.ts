import { authRegister, clear, authLogout, authLogin } from './helper';
const OK = 200;

beforeEach(() => {
  clear();
});

test('Test registration', () => {
  const user = authRegister('ben@gmail.com', '123456', 'Ben', 'Davies');

  expect(user.statusCode).toBe(OK);
  expect(user.body).toStrictEqual({
    token: expect.any(String),
    authUserId: expect.any(Number)
  });

  const logout = authLogout(user.body.token);
  expect(logout.statusCode).toBe(OK);
  expect(logout.body).toStrictEqual({});

  const login = authLogin('ben@gmail.com', '123456');
  expect(login.statusCode).toBe(OK);
  expect(login.body).toStrictEqual({
    token: expect.any(String),
    authUserId: user.body.authUserId,
  });

  const login1 = authLogin('ben@gmail.com', '123456');
  expect(login1.body.token).not.toBe(login.body.token);

  const logout2 = authLogout(login1.body.token);
  expect(logout2.statusCode).toStrictEqual(OK);
  expect(logout2.body).toStrictEqual({});

  const user2 = authRegister('ben1@gmail.com', '123456', 'Ben', 'Davies');
  expect(user2.statusCode).toBe(OK);
  expect(user2.body).toStrictEqual({
    token: expect.any(String),
    authUserId: expect.any(Number)
  });

  const user3 = authRegister('ben0@gmail.com', '123456', 'Bennnnnnnnnnnnnn', 'Daviessssssssssssss');
  expect(user3.statusCode).toBe(OK);
  expect(user3.body).toStrictEqual({
    token: expect.any(String),
    authUserId: expect.any(Number)
  });
});

test('Test email already used + logout errors', () => {
  authRegister('ben@gmail.com', '123456', 'Ben', 'Davies');
  const user2 = authRegister('ben@gmail.com', '123456', 'Benw', 'Daviesw');
  expect(user2.statusCode).toBe(400);

  const login = authLogin('ben@gmail.com', '12345678');
  expect(login.statusCode).toBe(400);

  const login1 = authLogin('ben1@gmail.com', '123456');
  expect(login1.statusCode).toBe(400);

  const badLogout = authLogout('12spongebob');
  expect(badLogout.statusCode).toBe(403);
  expect(badLogout.body).toStrictEqual({ error: expect.any(String) });
});

test('login errors', () => {
  const user = authRegister('ben@gmail.com', '12', 'Ben', 'Davies');
  expect(user.statusCode).toBe(400);

  const user1 = authRegister('ben@gmail.com', '123456', '', 'Davies');
  expect(user1.statusCode).toBe(400);

  const user2 = authRegister('ben@gmail.com', '123456', 'Bennnnnnnnnnnnnnnnnnnnnnnvfrjhuhdvguygduvgyfgdvuygfyuvgyufgvuyfgyuvguyfgvyufgvuyfgvyugfuy', 'Davies');
  expect(user2.statusCode).toBe(400);

  const user3 = authRegister('ben@gmail.com', '123456', 'Ben', '');
  expect(user3.statusCode).toBe(400);

  const user4 = authRegister('ben@gmail.com', '123456', 'Ben', 'Daviesfrkjvhijrfvhfrvhbfivirfehdjkfvcgrfvhfhjwdhkhvhjfvbhbf fb hbhf bhb');
  expect(user4.statusCode).toBe(400);

  const user5 = authRegister('goofy', '123456', 'Ben', 'Davies');
  expect(user5.statusCode).toBe(400);
});
