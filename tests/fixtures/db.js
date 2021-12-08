//Creating a JS file to setup the database for the test suites to run on. Hence, our users and tasks test suites
//are able to use these without needing to define these in each test suite

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId();

const userOne = { //Creating the "req.body" for a test user
    _id: userOneId,
    name: 'Mike Test',
    email: 'mike@example.com',
    password: 'miketest!!',
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_KEY)
    }]
}

const userTwoId = new mongoose.Types.ObjectId();

const userTwo = { //Creating the "req.body" for a test user
    _id: userTwoId,
    name: 'Norman Test',
    email: 'norman@example.com',
    password: 'normantest!!',
    tokens: [{
        token: jwt.sign({_id: userTwoId}, process.env.JWT_KEY)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'First Task',
    progress: 'false',
    owner: userOne._id
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Second Task',
    progress: 'true',
    owner: userOne._id
}
const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Third Task',
    progress: 'true',
    owner: userTwo._id
}



const setUpDatabase = async () => {
    await User.deleteMany(); //Datbase is wiped of all of the users before the start of each Jest test
    await new User(userOne).save(); //Test user is created and saved before the start of each Jest test
    await new User(userTwo).save();
    await Task.deleteMany();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
}

module.exports = {
    userOne,
    userOneId,
    userTwo,
    userTwoId,
    taskOne,
    taskTwo,
    taskThree,
    setUpDatabase,
}