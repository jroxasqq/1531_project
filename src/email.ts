const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  pool: true,
  host: 'smtp-mail.outlook.com',
  secureConnection: false,
  port: 587,
  tls: {
    ciphers: 'SSLv3'
  },
  auth: {
    user: 't11baeroboost.testpasswordreset@outlook.com',
    pass: 'TestingPasswordResetForAero'
  }
});

const emailResetCode = (email: string, newResetCode: string, timeToWait: number) => {
  // define the message to be sent
  const message = {
    from: 't11baeroboost.testpasswordreset@outlook.com',
    to: email,
    subject: 'UNSW Beans Password Reset Requested',
    text: `Dear User,

  Here is your reset code: ${newResetCode}

  Have a lovely day.

  Kind regards,
  AEROBOOST`
  };

  transporter.sendMail(message, function(error: any, info: any) {
    console.log('message sent: ' + info.response);
    transporter.close();
  });
};

export { emailResetCode };
