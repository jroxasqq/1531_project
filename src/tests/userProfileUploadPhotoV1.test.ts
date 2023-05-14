import { authRegister, clear, userProfileUploadPhoto, userProfile } from './helper';
import { DefaultProfilePhotoFile, ProfilePhotoFile } from '../types';
import config from '../config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;

const OK = 200;

beforeEach(() => {
  clear();
});

const validImgUrl = 'http://www.digitaltrends.com/wp-content/uploads/2022/09/Le-Sserafim-Group.jpg?p=1';
const notJpgImgUrl = 'http://i.ytimg.com/vi/axWexY2zIyk/maxresdefault';
const invalidImgUrl = 'http://.do-mi.cc/wp-content/uploads/2022/11/1667463653-e405b0924e7aa6c.jpg';
const hasha = require('hasha');

describe('Tests for user/profile/uploadphoto/v1', () => {
  test('Default profile picture exists', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const profile = userProfile(user.body.authUserId, user.body.token);
    expect(profile.statusCode).toBe(OK);
    expect(profile.body.user.profileImgUrl).toStrictEqual(DefaultProfilePhotoFile);
  });
  test('Updates the profile picture with crop for jpg', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    userProfileUploadPhoto(validImgUrl, 10, 10, 15, 15, user.body.token);
    const profilePhotoDirectory = `${hasha('sponge' + 'a@gmail.com' + 'bob')}-profilePhoto`;
    const profilePhotoLocation = `${ProfilePhotoFile}${profilePhotoDirectory}.jpg`;
    const profile = userProfile(user.body.authUserId, user.body.token);
    expect(profile.statusCode).toBe(OK);
    expect(profile.body.user.profileImgUrl).toStrictEqual(`${SERVER_URL}/${profilePhotoLocation}`);
  });
  test('xEnd <= xStart', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalidxEnd = userProfileUploadPhoto(validImgUrl, 10, 10, 10, 25, user.body.token);
    expect(invalidxEnd.statusCode).toBe(400);
    expect(invalidxEnd.body).toStrictEqual({ error: 'xEnd is less than or equal to xStart' });
  });
  test('yEnd <= yStart', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalidyEnd = userProfileUploadPhoto(validImgUrl, 10, 10, 25, 10, user.body.token);
    expect(invalidyEnd.statusCode).toBe(400);
    expect(invalidyEnd.body).toStrictEqual({ error: 'yEnd is less than or equal to yStart' });
  });
  test('xStart is not within the dimensions of the image', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalidxStart = userProfileUploadPhoto(validImgUrl, -1, 10, 15, 25, user.body.token);
    expect(invalidxStart.statusCode).toBe(400);
    expect(invalidxStart.body).toStrictEqual({ error: 'xStart is out of bounds' });
  });
  test('yStart is not within the dimensions of the image', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalidyStart = userProfileUploadPhoto(validImgUrl, 10, -1, 15, 25, user.body.token);
    expect(invalidyStart.statusCode).toBe(400);
    expect(invalidyStart.body).toStrictEqual({ error: 'yStart is out of bounds' });
  });
  test('xEnd is not within the dimensions of the image', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalidxEnd = userProfileUploadPhoto(validImgUrl, 10, 10, 1501, 25, user.body.token);
    expect(invalidxEnd.statusCode).toBe(400);
    expect(invalidxEnd.body).toStrictEqual({ error: 'xEnd is out of bounds' });
  });
  test('yEnd is not within the dimensions of the image', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalidyEnd = userProfileUploadPhoto(validImgUrl, 10, 10, 15, 1001, user.body.token);
    expect(invalidyEnd.statusCode).toBe(400);
    expect(invalidyEnd.body).toStrictEqual({ error: 'yEnd is out of bounds' });
  });
  test('Image uploaded is not a JPG', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalid = userProfileUploadPhoto(notJpgImgUrl, 10, 10, 15, 15, user.body.token);
    expect(invalid.statusCode).toBe(400);
    expect(invalid.body).toStrictEqual({ error: 'Image uploaded is not a JPG' });
  });
  test('Image is invalid', () => {
    const user = authRegister('a@gmail.com', '123123123', 'a', 'A');
    const invalid = userProfileUploadPhoto(invalidImgUrl, 10, 10, 15, 15, user.body.token);
    expect(invalid.statusCode).toBe(400);
    expect(invalid.body).toStrictEqual({ error: 'Invalid image URL' });
  });
  test('Invalid token', () => {
    const invalid = userProfileUploadPhoto(validImgUrl, 0, 0, 10, 12, 'faketoken');
    expect(invalid.statusCode).toBe(403);
    expect(invalid.body).toStrictEqual({ error: 'Token is invalid.' });
  });
});
