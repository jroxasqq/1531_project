import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';
import { isTokenValid } from './valid';

/**
  *Given a user by their uID, sets their permissions to new permissions described by permissionId
  *
  * @param {number} uId - user authorised id
  * @param {number} permissionId - user's permissions identifier
  * @param {string} token - user temporary token
  * ...
  *
  * @returns {{}} - empty object
*/
const adminUserPermissionChangeV1 = (uId: number, permissionId: number, token: string) => {
  const data = getData();
  const global = 1;
  const member = 2;
  const userArr = data.users;
  const tokenArr = data.tokens;
  const hasha = require('hasha');
  isTokenValid(token);

  if (userArr.find(u => u.authUserId === uId) === undefined) {
    throw HTTPError(400, 'Invalid uId');
  }
  if (permissionId !== global && permissionId !== member) {
    throw HTTPError(400, 'Invalid permissionId');
  }
  let uID = -1;
  for (const tokens of tokenArr) {
    if (hasha('sponge' + token + 'bob') === tokens.token) {
      uID = tokens.uId;
    }
  }
  for (const user of userArr) {
    if (user.authUserId === uID) {
      if (user.permissionId !== global) {
        throw HTTPError(403, 'Unauthorised user');
      }
    }
  }
  let count = 0;
  for (const check of userArr) {
    if (check.authUserId === uId) {
      if (check.permissionId === permissionId) {
        throw HTTPError(400, 'Already at permission level');
      }
      if (check.permissionId === global) {
        count += 1;
      }
    }
  }
  for (const i of userArr) {
    if (count === 1 && uId === i.authUserId && i.permissionId === global) {
      throw HTTPError(400, 'Global owner being demoted');
    }
  }
  for (const change of userArr) {
    if (change.authUserId === uId) {
      change.permissionId = permissionId;
    }
  }
  setData(data);
  return {};
};

/**
  *Given a user by their uID, removes them from Beans
  *
  * @param {number} uId - user authorised id
  * @param {string} token - user temporary token
  * ...
  *
  * @returns {{}} - empty object
*/
const adminUserRemoveV1 = (uId: number, token: string) => {
  const data = getData();
  isTokenValid(token);
  const userArr = data.users;
  const tokenArr = data.tokens;
  const channelArr = data.channels;
  const dmArr = data.dms;
  const hasha = require('hasha');
  let count = 0;
  let uID = -1;

  if (userArr.find(u => u.authUserId === uId) === undefined) {
    throw HTTPError(400, 'Invalid uId');
  }
  for (const check of userArr) {
    if (check.permissionId === 1) {
      count += 1;
    }
  }
  console.log(count);
  for (const i of userArr) {
    if (count === 1 && uId === i.authUserId && i.permissionId === 1) {
      throw HTTPError(400, 'uId is only global owner');
    }
  }

  for (const tokens of tokenArr) {
    if (hasha('sponge' + token + 'bob') === tokens.token) {
      uID = tokens.uId;
    }
  }

  for (const user of userArr) {
    if (user.authUserId === uID) {
      if (user.permissionId !== 1) {
        throw HTTPError(403, 'Unauthorised user');
      }
    }
  }
  for (const remove of userArr) {
    if (remove.authUserId === uId) {
      remove.nameFirst = 'Removed';
      remove.nameLast = 'user';
      remove.email = '';
      remove.handleStr = '';
    }
  }
  for (const channel of channelArr) {
    const messageArr = channel.messages;
    const memberArr = channel.allMembers;
    const ownerArr = channel.ownerMembers;

    for (const owner in ownerArr) {
      const ownerIndex = parseInt(owner);
      if (channel.ownerMembers[ownerIndex] === uId) {
        ownerArr.splice(ownerIndex, 1);
      }
    }
    for (const member in memberArr) {
      const memberIndex = parseInt(member);
      if (channel.allMembers[memberIndex] === uId) {
        memberArr.splice(memberIndex, 1);
      }
    }
    for (const message of messageArr) {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    }
  }
  for (const dm of dmArr) {
    const dmMessage = dm.messages;
    const memberArr = dm.allMembers;
    const ownerArr = dm.ownerMembers;

    for (const owner in ownerArr) {
      const ownerIndex = parseInt(owner);
      if (dm.ownerMembers[ownerIndex] === uId) {
        ownerArr.splice(ownerIndex, 1);
      }
    }
    for (const member in memberArr) {
      const memberIndex = parseInt(member);
      if (dm.allMembers[memberIndex] === uId) {
        memberArr.splice(memberIndex, 1);
      }
    }
    for (const message of dmMessage) {
      if (message.uId === uId) {
        message.message = 'Removed user';
      }
    }
  }
  for (const removedToken of tokenArr) {
    if (removedToken.uId === uId) {
      const removedTokenArr = tokenArr.filter(element => element.token !== removedToken.token);
      // if filtered array is the same size as the original array, given token did not exist
      data.tokens = removedTokenArr;
    }
  }

  setData(data);

  return {};
};

export { adminUserPermissionChangeV1, adminUserRemoveV1 };
