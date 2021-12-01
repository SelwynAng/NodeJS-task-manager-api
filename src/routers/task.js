const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body);
    const task = new Task({
        ...req.body, //Using the spread operator to set the key-value pairs in req.body as the key-value pairs in task
        owner: req.user._id //Storing the authenticated user's id in the task's owner field
    })
    try {
        await task.save();
        res.status(201).send(task);
    } catch(e) {
        res.status(400).send(e);
    }
    //Callback method:
    // task.save((error, task) => {
    //     if (error) {
    //         return res.status(400).send(error);
    //     }
    //     res.status(201).send(task);
    // })
})

router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    if (req.query.progress) {
        match.progress = req.query.progress === 'true';
        //If a query for progress exists, check if it equals to the string 'true'. The resulting true/false
        //boolean value will be stored in the progress key of the match object
    }
    if (req.query.sort) {
        const parts = req.query.sort.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        //If query for sort exists, we split its value into 2 parts with the colon as the separator and store the
        //parts in an array
        //We store the 2 parts as a key-value pair in the sort object (Eg. 'createdAt' = desc)
        //We use the tenary operator to determine what the value will be. If parts[1] === 'desc' is true, the value
        //will be -1, if parts[1] === 'desc' is false, the value will be 1
    }
    try {
        await req.user.populate({
            path: 'tasks', //Determines which field of the document to populate
            match, 
            //Shorthand for match : match
            //Match property is an object consisting of criterias to determine which tasks to populate 
            //(Similar to the criterias in the object for findMany(), etc.)
            options: {
                limit: parseInt(req.query.limit), //Parsing the string value from limit query into an integer
                //Limit determines how many documents will be fetched at a time to the requester
                skip: parseInt(req.query.skip), //Parsing the string value from skip query into an integer
                //Skip determines how many documents to skip in the database to display the subsequent documents
                //Limit and skip helps to paginate the search results for our tasks
                sort
                //Shorthand for sort: sort
                //Sort determines how the documents will be sorted and displayed, typically in an ascending (1) or
                //descending (-1) order
            }
        });
        res.send(req.user.tasks);
    } catch(e) {
        res.status(500).send();
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({_id, owner: req.user._id}) 
        //Finding a task based on its id value and the id of its owner
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch(e) {
        res.status(500).send();
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'progress'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    })
    if (!isValidOperation) {
        res.status(400).send({error: 'Invalid updates!'}); 
    }
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        if (!task) {
            return res.status(404).send();
        }
        updates.forEach((update) => {
            task[update] = req.body[update];
        })
        await task.save();
        res.send(task);
    } catch(e) {
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch(e) {
        res.status(500).send();
    }
})

module.exports = router;