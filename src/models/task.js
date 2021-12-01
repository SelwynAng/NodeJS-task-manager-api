const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true  
    },
    progress: {
        type: Boolean,
        default: false
    },
    owner: { //Creating a field to store the ID of its owner which is an ObjectId
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
        //Makes a reference to the User model, which is used in populating the owner field with information 
        //about the user
    }
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);


module.exports = Task;