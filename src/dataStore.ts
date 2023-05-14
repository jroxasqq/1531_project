import { Data } from './types';

let data: Data = {
  users: [],
  channels: [],
  tokens: [],
  dms: [],
  passwordReset: [],
  userStats: [],
  workspaceStats: {
    channelsExist: [],
    dmsExist: [],
    messagesExist: [],
    utilizationRate: 0
  }
};

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use get() to access the data
const getData = (): Data => {
  return data;
};

// Use set(newData) to pass in the entire data object, with modifications made
const setData = (newData: Data): void => {
  data = newData;
};

export { getData, setData };
