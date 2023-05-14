import request from 'sync-request';
import config from '../config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;

const bodyStrToObj = (res: any) => JSON.parse(String(res.getBody()));
const errorStrToObj = (res: any) => JSON.parse(String(res.body)).error.message;

const getRequest = (route: string, data: any, headerData: any = {}) => {
  const res = request(
    'GET',
    SERVER_URL + route,
    {
      qs: data,
      headers: headerData,
    }
  );

  if (res.statusCode !== 200) {
    return {
      body: { error: errorStrToObj(res) },
      statusCode: res.statusCode
    };
  }

  return {
    body: bodyStrToObj(res),
    statusCode: res.statusCode,
  };
};

const deleteRequest = (route: string, data: any, headerData: any = {}) => {
  const res = request(
    'DELETE',
    SERVER_URL + route,
    {
      qs: data,
      headers: headerData,
    }
  );

  if (res.statusCode !== 200) {
    return {
      body: { error: errorStrToObj(res) },
      statusCode: res.statusCode
    };
  }

  return {
    body: bodyStrToObj(res),
    statusCode: res.statusCode,
  };
};

const postRequest = (route: string, data: any, headerData: any = {}) => {
  const res = request(
    'POST',
    SERVER_URL + route,
    {
      json: data,
      headers: headerData,
    }
  );

  if (res.statusCode !== 200) {
    return {
      body: { error: errorStrToObj(res) },
      statusCode: res.statusCode
    };
  }

  return {
    body: bodyStrToObj(res),
    statusCode: res.statusCode,
  };
};

const putRequest = (route: string, data: any, headerData: any = {}) => {
  const res = request(
    'PUT',
    SERVER_URL + route,
    {
      json: data,
      headers: headerData,
    }
  );

  if (res.statusCode !== 200) {
    return {
      body: { error: errorStrToObj(res) },
      statusCode: res.statusCode
    };
  }

  return {
    body: bodyStrToObj(res),
    statusCode: res.statusCode,
  };
};

export { getRequest, deleteRequest, postRequest, putRequest };
