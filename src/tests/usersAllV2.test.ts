import { authRegister, clear, authLogout, usersAll } from './helper';

const OK = 200;

const FORBIDDEN = 403;

beforeEach(() => {
  clear();
});

describe('Tests for users/all/v1', () => {
  test('Valid request', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');

    authRegister('usertwo@gmail.com', 'usertwopassword', 'user', 'two');

    authRegister('userthree@gmail.com', 'userthreepassword', 'user', 'three');

    const user = usersAll(user1.body.token);

    const usersObj = {

      users: [

        {

          uId: 0,

          email: 'userone@gmail.com',

          nameFirst: 'user',

          nameLast: 'one',

          handleStr: 'userone',

        },

        {

          uId: 1,

          email: 'usertwo@gmail.com',

          nameFirst: 'user',

          nameLast: 'two',

          handleStr: 'usertwo',

        },

        {

          uId: 2,

          email: 'userthree@gmail.com',

          nameFirst: 'user',

          nameLast: 'three',

          handleStr: 'userthree',

        },

      ]

    };

    expect(user.statusCode).toBe(OK);

    expect(user.body).toStrictEqual(usersObj);
  });

  test('Invalid token', () => {
    const user1 = authRegister('userone@gmail.com', 'useronepassword', 'user', 'one');

    authLogout(user1.body.token);

    const user = usersAll(user1.body.token);

    expect(user.statusCode).toBe(FORBIDDEN);

    expect(user.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
