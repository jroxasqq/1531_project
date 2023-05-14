```javascript
let data = {
  users: [
    {
      authUserId: 1,
      nameFirst: 'Hayden',
      nameLast: 'Jacobs',
      handleStr: 'haydenjacobs',
      email: 'z1234567@unsw.edu.au',
      password: 'hasha(password)'
      permissionId: 1,
      profileImgUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpBmsVUcq2RV1ANFJWpYzrJj07GVMqe24fHA&usqp=CAU',
      userStats: {
        channelsJoined: [{numChannelsJoined, timeStamp}],
        dmsJoined: [{numDmsJoined, timeStamp}], 
        messagesSent: [{numMessagesSent, timeStamp}],
        involvementRate: 1
      }
      workspaceStats: {
        channelsExist: [{numChannelsExist, timeStamp}], 
        dmsExist: [{numDmsExist, timeStamp}], 
        messagesExist: [{numMessagesExist, timeStamp}], 
        utilizationRate: 1
      }
    },
  ],

  channels: [
    {
      channelId: 1,
      name: 'My Channel',
      ownerMembers: [1],
      allMembers: [1, 2, 3],
      isPublic: true,
      messages: [
        {
          messageId: 1,
          authUserId: 1,
          message: 'Hello world',
          timeSent: 1582426789,
          reacts: {[
            reactId: 1,
            uIds: [1, 2, 3],
            isThisUserReacted: true
          ]},
          isPinned: true
        }
      ],
      standup: {
        isActive: false,
        timeFinish: 1582426789,
        creator: 2,
        handles: ['userone', 'usertwo'],
        messages: ['Hi', 'bye']
      }
    },
  ],

  tokens: [
    {
      uId: 1,
      token: 'hasha(token)'
    }
  ],

  dms: [
    {
      dmId: 1,
      name: 'Bob'
      ownerMembers: [1]
      allMembers: [1, 2, 3],
      messages: [
        {
          messageId: 1,
          authUserId: 1,
          message: 'Hello world',
          timeSent: 1582426789,
          reacts: {[
            reactId: 1,
            uIds: [1, 2, 3],
            isThisUserReacted: true
          ]},
          isPinned: true
        }
      ],
    }
  ]
}
```

[Optional] Short Description:
Data consists of two arrays: users and channels. Arrays were used as they are
able to store multiple objects of the same type (users, messages and channels). The 
object keys for each object element correspond to the parameters of the written stub functions.

Apart from variables that are parameters to the stub functions, the channel members array
and a user's channels array are also in data, which will be used for quick access to
functions such as channelDetailsV1 and channelsListV1.

In addition to this, having data as a singular structure to store both the user's and channel members
arrays makes it so that for future iterations, everyone in our group will be able to export and import 
it into multiple different files for usage as per needed.