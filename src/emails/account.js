const mailgun = require("mailgun-js");
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});

const sendWelcomeEmail = async (email, name) => {
    const data = {
        from: 'Selwyn Ang <selwynang@samples.mailgun.org>',
        to: email,
        subject: 'Hello ' + name,
        text: 'Welcome to the task manager application, ' + name + '!'
    };
    // mg.messages().send(data, function (error, body) {
    //     console.log(body);
    // });
    try {
        await mg.messages().send(data);
    } catch(e) {
        console.log(e);
    }
}

const sendCancellationEmail = async (email, name) => {
    const data = {
        from: 'Selwyn Ang <selwynang@samples.mailgun.org>',
        to: email,
        subject: 'Acknowledgement of Account Cancellation',
        text: name + ', we are sorry to see you go. Please send an email back to selwyang@samples.mailgun.org to give us feedback on the task manager application.'
    }
    try {
        await mg.messages().send(data)
    } catch(e) {
        console.log(e);
    }
}

module.exports = {
    sendWelcomeEmail: sendWelcomeEmail,
    sendCancellationEmail: sendCancellationEmail
}