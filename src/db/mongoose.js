//This file handles Mongoose which will help us communicate with our MongoDB database. The user and task models
//have shifted to their own files for organisation of the code

const mongoose = require('mongoose');

//mongoose connects to a newly self-created mongoDB database which in this case is called task-manager-api
mongoose.connect(process.env.MONGODB_URL, {
    useNewURLParser: true
})