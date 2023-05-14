import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';

import errorHandler from 'middleware-http-errors';

import fs from 'fs';

import { getData, setData } from './dataStore';
import { clearV1, searchV1, notificationsGetV1 } from './other';
import { channelJoinV3, channelInviteV3, channelDetailsV3, channelAddOwnerV2, channelLeaveV2, channelMessagesV3, channelRemoveOwnerV2 } from './channel';
import { dmCreateV2, dmListV2, dmRemoveV2, dmDetailsV2, dmLeaveV2, messageSendDmV2, dmMessagesV2 } from './dm';
import { userProfileV3, userSetNameV2, userSetEmailV2, userSetHandleV2, usersAllV2, userStatsV1, usersStatsV1, userProfileUploadPhotoV1 } from './users';
import { authLoginV3, authRegisterV3, authLogoutV2, authPasswordResetRequestV1, authPasswordResetResetV1 } from './auth';
import { channelsCreateV3, channelsListV3, channelsListAllV3 } from './channels';
import { messageSendV2, messageEditV2, messageRemoveV2, messageReactV1, messageShareV1, messageUnreactV1, messagePinV1, messageUnpinV1, messageSendLaterV1, messageSendLaterDmV1 } from './message';
import { adminUserPermissionChangeV1, adminUserRemoveV1 } from './admin';
import { standupStartV1, standupActiveV1, standupSendV1 } from './standup';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());

// for logging errors (print to terminal)
app.use(morgan('dev'));

app.use('/profilePhoto', express.static('profilePhoto'));

const save = () => {
  const newData = getData();
  const jsonData = JSON.stringify(newData);
  fs.writeFileSync('./database.json', jsonData);
};

if (!fs.existsSync('./database.json')) {
  clearV1();
  save();
} else {
  const jsonStr = fs.readFileSync('./database.json');
  const data = JSON.parse(String(jsonStr));
  setData(data);
}

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

// authLogin
app.post('/auth/login/v3', (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;
    const result = authLoginV3(email, password);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// authRegister
app.post('/auth/register/v3', (req: Request, res: Response, next) => {
  try {
    const { email, password, nameFirst, nameLast } = req.body;
    const result = authRegisterV3(email, password, nameFirst, nameLast);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response, next) => {
  try {
    const { email } = req.body;
    const result = authPasswordResetRequestV1(email);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response, next) => {
  try {
    const { resetCode, newPassword } = req.body;
    const result = authPasswordResetResetV1(resetCode, newPassword);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/user/profile/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const uId = parseInt(req.query.uId as string);
    const result = userProfileV3(token, uId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/auth/logout/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const result = authLogoutV2(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channels/create/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { name, isPublic } = req.body;
    const result = channelsCreateV3(name, isPublic, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/channels/listAll/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const result = channelsListAllV3(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/join/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { channelId } = req.body;

    const result = channelJoinV3(token, channelId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/invite/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { channelId, uId } = req.body;

    const result = channelInviteV3(token, channelId, uId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/channel/messages/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.query.channelId as string) as number;
    const start = parseInt(req.query.start as string) as number;
    const result = channelMessagesV3(token, channelId, start);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/channel/details/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const channelId = parseInt(req.query.channelId as string) as number;
    const result = channelDetailsV3(channelId, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/leave/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { channelId } = req.body;
    const result = channelLeaveV2(token, channelId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/addowner/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.body.channelId as string);
    const uId = parseInt(req.body.uId as string);
    const result = channelAddOwnerV2(token, channelId, uId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/channels/list/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const result = channelsListV3(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/channel/removeowner/v2', (req: Request, res: Response, next) => {
  try {
    const { channelId, uId } = req.body;
    const token = req.header('token');
    const result = channelRemoveOwnerV2(token, channelId, uId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/dm/create/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { uIds } = req.body;
    const result = dmCreateV2(token, uIds);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/dm/list/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const result = dmListV2(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.delete('/dm/remove/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const dmId = parseInt(req.query.dmId as string);
    const result = dmRemoveV2(token, dmId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/dm/details/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const dmId = parseInt(req.query.dmId as string);
    const result = dmDetailsV2(token, dmId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/dm/leave/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { dmId } = req.body;
    const result = dmLeaveV2(dmId, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/send/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { channelId, message } = req.body;
    const result = messageSendV2(token, channelId, message);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.put('/message/edit/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const messageId = parseInt(req.body.messageId as string) as number;
    const message = req.body.message as string;
    const result = messageEditV2(token, messageId, message);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.delete('/message/remove/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const messageId = parseInt(req.query.messageId as string);
    const result = messageRemoveV2(token, messageId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/senddm/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { dmId, message } = req.body;
    const result = messageSendDmV2(dmId, message, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/react/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const messageId = parseInt(req.body.messageId as string);
    const reactId = parseInt(req.body.reactId as string);
    const result = messageReactV1(token, messageId, reactId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/unreact/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const messageId = parseInt(req.body.messageId as string);
    const reactId = parseInt(req.body.reactId as string);
    const result = messageUnreactV1(token, messageId, reactId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/pin/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const messageId = parseInt(req.body.messageId as string);
    const result = messagePinV1(token, messageId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/unpin/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const messageId = parseInt(req.body.messageId as string);
    const result = messageUnpinV1(token, messageId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/sendlater/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { channelId, message, timeSent } = req.body;
    const result = messageSendLaterV1(token, channelId, message, timeSent);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/message/share/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const ogMessageId = parseInt(req.body.ogMessageId as string);
    const message = req.body.message as string;
    const channelId = parseInt(req.body.channelId as string);
    const dmId = parseInt(req.body.dmId as string);
    const result = messageShareV1(token, ogMessageId, message, channelId, dmId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/dm/messages/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const dmId = parseInt(req.query.dmId as string);
    const start = parseInt(req.query.start as string);
    const result = dmMessagesV2(dmId, start, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setname/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { nameFirst, nameLast } = req.body;
    const result = userSetNameV2(token, nameFirst, nameLast);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { email } = req.body;
    const result = userSetEmailV2(token, email);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { handleStr } = req.body;
    const result = userSetHandleV2(token, handleStr);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/user/profile/uploadphoto/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;
    const result = userProfileUploadPhotoV1(token, imgUrl, xStart, yStart, xEnd, yEnd);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/users/all/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const result = usersAllV2(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/user/stats/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const result = userStatsV1(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/search/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const queryStr = req.query.queryStr as string;
    return res.json(searchV1(token, queryStr));
  } catch (err) {
    next(err);
  }
});

app.get('/notifications/get/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(notificationsGetV1(token));
  } catch (err) {
    next(err);
  }
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { dmId, message, timeSent } = req.body;
    const result = messageSendLaterDmV1(dmId, message, timeSent, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/standup/start/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { channelId, length } = req.body;
    const result = standupStartV1(token, channelId, length);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/standup/active/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.query.channelId as string);
    const result = standupActiveV1(token, channelId);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/standup/send/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token');
    const { channelId, message } = req.body;
    const result = standupSendV1(token, channelId, message);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { uId, permissionId } = req.body;
    const result = adminUserPermissionChangeV1(uId, permissionId, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/users/stats/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const result = usersStatsV1(token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.delete('/admin/user/remove/v1', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const uId = parseInt(req.query.uId as string);
    const result = adminUserRemoveV1(uId, token);
    save();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

app.delete('/clear/v1', (req: Request, res: Response, next) => {
  try {
    res.json(clearV1());
  } catch (err) {
    next(err);
  }
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
});

// handles errors nicely
app.use(errorHandler());

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
