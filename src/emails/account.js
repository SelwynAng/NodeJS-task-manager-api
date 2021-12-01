const mailgun = require("mailgun-js");
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});

const sendWelcomeEmail = (email, name) => {
    const data = {
        from: 'Selwyn Ang <selwynang@samples.mailgun.org>',
        to: email,
        subject: 'Hello ' + name,
        text: 'This is a test email from Selwyn Ang for the Node JS course. Welcome to the task manager application!'
    };
    // mg.messages().send(data, function (error, body) {
    //     console.log(body);
    // });
    mg.messages().send(data).then((body) => {
        console.log(body);
    }).catch((error) => {
        console.log(error);
    })
}

const sendCancellationEmail = (email, name) => {
    const data = {
        from: 'Selwyn Ang <selwynang@samples.mailgun.org>',
        to: email,
        subject: 'Acknowledgement of Account Cancellation',
        text: name + ', we are sorry to see you go. Please send an email back to selwyang@samples.mailgun.org to give us feedback on the task manager application.'
    }
    mg.messages().send(data).then((body) => {
        console.log(body);
    }).catch((error) => {
        console.log(error);
    })
}

module.exports = {
    sendWelcomeEmail: sendWelcomeEmail,
    sendCancellationEmail: sendCancellationEmail
}