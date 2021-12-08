const app = require('../src/app'); 
const request = require('supertest');
const Task = require('../src/models/task');
const {
    userOne, 
    userOneId, 
    userTwo, 
    userTwoId, 
    taskOne,
    taskTwo,
    taskThree,
    setUpDatabase
} = require('./fixtures/db');
const User = require('../src/models/user');

beforeEach(() => {
    return setUpDatabase(); 
    
});

test('Should create task for user', async ()=> {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            description: 'Testing a task!'
        })
        .expect(201)

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull; //Checking if the newly created task is not null
    expect(task.progress).toEqual(false); //Checking if the default value for completed field of the task is false
})

test('Should get all tasks for user', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send()
        .expect(200)

    expect(response.body.length).toEqual(2); 
    //Checks if the length of response.body is 2 to check if 2 tasks are correctly associated with User One
})

test('User should not delete task of another user', async () => {
    await request(app)
        .delete('/tasks/' + taskOne._id)
        .set('Authorization', 'Bearer ' + userTwo.tokens[0].token)
        .send()
        .expect(404)

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull()
    //Checking if the task has not been deleted from the database
})

// Task Test Ideas
//
// Should not create task with invalid description/completed
test('Should not create task with invalid description', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            description: '',
            progress: true
        })
        .expect(400)
})
// Should not update task with invalid description/completed
test('Should not update task with invalid progress ', async () => {
    await request(app)
        .patch('/tasks/' + taskOne._id)
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send({
            description: 'Hello world!',
            progress: 1234
        })
        .expect(400)
})
// Should delete user task
test('Should delete user task', async () => {
    await request(app)
        .delete('/tasks/' + taskOne._id)
        .set('Authorization', 'Bearer ' + userOne.tokens[0].token)
        .send()
        .expect(200)
    
    const task = await Task.findById(taskOne._id);
    expect(task).toBeNull();
})
// Should not delete task if unauthenticated
test('Should not delete task if unathenticated', async () => {
    await request(app)
        .delete('/tasks/' + taskOne._id)
        .send()
        .expect(401)
    
    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})
// Should not update other users task
test('Should not update other users task', async () => {
    await request(app)
        .patch('/tasks/' + taskOne._id)
        .set('Authorization', 'Bearer ' + userTwo.tokens[0].token)
        .send({
            description: 'Faulty task'
        })
        .expect(404)
})