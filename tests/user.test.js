/*This file is used to test the user routes of our app by utilising Jest & Super Test*/

const app = require('../src/app'); 
//Requiring our app without the app.listen functionality as SuperTest will help us with that
const request = require('supertest');
//Requring SuperTest and storing in 'request' variable as a convention
const User = require('../src/models/user');
//Requring the User Mongoose model to perform our CRUD operations in the database
const {userOne, userOneId, setUpDatabase} = require('./fixtures/db');
//Requring the data required for setting up our test database

//Before every test runs, we can choose to call upon the beforeEach function to perform various functions
//In this case, we want to setup our test database before every test starts
beforeEach(() => {
    return setUpDatabase(); 
    //If setUpDatabase() returned a promise that resolved when the database was initialized, we would want 
    //to return that promise (Jest Documentation)
});

test('Signing up users correctly', async () => {
    const response = await request(app).post('/users').send({ 
        //Awaiting the promise from SuperTest which calls on various methods
        //1. post: The HTTP method (can be get, post, patch, delete) containing the route's URL
        //2. send: Data to be sent to the stated route
        name: 'Selwyn Ang',
        email: 'selwynang.01@gmail.com',
        password: 'dank865!'
    }).expect(201) //Expects 201 status code to be returned. If any other status code is returned, this test fails

    //Asserting that the database was changed correcty with Jest (Not SuperTest at this point)
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull(); //toBeNull will return success if user is null, hence we add not to reverse it
    //Assertions about the response with Jest (Not SuperTest at this point)
    expect(response.body).toMatchObject({
        user: { 
            //toMatchObject checks if the listed nested objects and key-value pairs match up with what is in
            //the response
            name: 'Selwyn Ang',
            email: 'selwynang.01@gmail.com'
        },
        token: user.tokens[0].token
    });
})

test('Logging in a user correctly', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOneId);
    expect(response.body.token).toBe(user.tokens[1].token);
})

test('Logging in a non-existent user', async () => {
    await request(app).post('/users/login').send({
        email: 'botcheduser@example.com',
        password: 'fakey!!!'
    }).expect(400);
})

test('Should read profile of an existing user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        //Setting the Authorization header in the request for authentication to take place
        .send() //Send is empty as the body of our request is not needed
        .expect(200);
})

test('Should not read profile of an unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
        //Without any authentication provided through the set method, a 401 status should be expected
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send()
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user).toBeNull();
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        //Instead of using a send method, we use attach for sending files
        //1st argument is the name of the file we want to send, 2nd argument is the file path starting from 
        //the test folder as the root
        .expect(200)

    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
    //Checking if the data stored in the avatar field of the user in the database is of a buffer type
    //We use toEqual instead of toBe in this case as toBe tests for strict equality
    //toBe will fail in this case
    //Use toBe only for primitives like strings, numbers, booleans. For everything else use toEqual
    //expect.any(constructor) can accept types like Number, String, Buffer, etc. to create a random combination
    //of the listed type
})

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            name: 'Walter Test'
        })
        .expect(200)

    const user = await User.findById(userOneId);
    expect(user.name).toBe('Walter Test');
})

test('Should not update invalid user fields', async() => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            location: 'Prague'
        })
        .expect(400);
})

// User Test Ideas
//
// Should not signup user with invalid name/email/password
test('Should not signup user with invalid password', async () => {
    await request(app)
        .post('/users')
        .send({
            name: 'Jess',
            email: 'jess@example.com',
            password: 'password!!!'
        })
        .expect(400)
})
// Should not update user if unauthenticated
test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: 'Jess'
        })
        .expect(401)
})
// Should not update user with invalid name/email/password
test('Should not update user with invalid email', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            email: 'jess.example.com'
        })
        .expect(400)
})
// Should not delete user if unauthenticated
test('Should not delete user if unauthenticated', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})