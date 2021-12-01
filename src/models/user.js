const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

//Creating a schema for users. Schemas not only define the structure of your document and casting of properties, 
//they also define document instance methods, static Model methods, compound indexes, and document lifecycle 
//hooks called middleware.
//Takes in 1st argument: An object consisting of the definition the fields of each document
//Takes in 2nd argument: An object consisting of options to customise our document
const userSchema = new mongoose.Schema({
    name: {
        type: String, //Each field's type can be specified to be a String, Boolean, Number, etc..
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positve number!')
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true, //Set unqiue to true, so that duplicate emails cannot be used
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Please provide a valid email address!');
            }
            // const isEmailPresent = User.findOne({
            //     email: value
            // })
            // if (isEmailPresent) {
            //     throw new Error('Email has been taken!');
            // }
            //The method above can be used to validate if there is a duplicate email 
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (validator.matches(value.toLowerCase(), 'password')) {
                throw new Error('Please do ensure password does not contain "password"!')
            }
            if (value.length <= 6) {
                throw new Error('Password length is too short. Please ensure that it is greater than 6 characters!');
            }
        }
    }, 
    tokens: [{ //Creating a token field for the user to store the JWTs generated for the user in an array
        token: {
            type: String,
            required: true,
        } 
    }],
    avatar: {
        type: Buffer
        //Creating an avatar field which only accepts binaray buffer data (for files like images)
    }
}, {
    timestamps: true //Setting timestamps option to true to enable timestamps for creation and update
});

//Virtual Field: A field which does not exist in the MongoDB database but it is crucial in defining relationships
//between 2 or more models
userSchema.virtual('tasks', { //1st argument is the name of the virtual field to set up on the user
    ref: 'Task', //ref value is the name of the other model to link to
    localField: '_id', //localField refers to the field of the user model which we want to link
    foreignField: 'owner'//forignField refers to the field of the other model which we want to link
    //In this case we are linking user._id & task.owner which are the same thing (the unique ID of the user)
    //so that user.tasks can only be populated with tasks associated with its user ID
})

//Middleware (also called pre and post hooks) are functions which are passed control during execution of async 
//functions. Middleware is defined on the schema level
userSchema.pre('save', async function(next) { 
    //2nd argument must be a standard function and not arrow function because arrow function does not support
    //this-binding
    const user = this; //Initialising this to a 'user' variable for better clarity
    if (user.isModified('password')) { //Returns true if the password path has been modified, else false.
        user.password = await bcrypt.hash(user.password, 8);
        //Hashing the user input for password before saving it
    }

    next(); 
    //Defining next in the function's argument and calling next is very important to tell the entire function to
    //stop running and go on to the next thing to execute (which is saving the user in this case) or else the 
    //function is going to hang and the pre-hook is not going to end and user will never be saved
})

userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({owner: user._id});
    next();
})

//Use methods followed by our own defined function to set up our own instance method (for user)
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id}, process.env.JWT_KEY);
    user.tokens = user.tokens.concat({token}); //Storing the newly generated JWT into the token field
    await user.save(); //Rememeber to save the user to register the newly generated JWT into the database
    
    return token;
}

userSchema.methods.getPublicProfile = function() {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
}

//Use statics followed by our own defined function to set up our own model method (for User)
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if (!user) {
        throw new Error('Unable to login!'); //If no user with the email is found, return an error
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login!'); 
        //If user password does not match with the hased one in database, return an error
    }
    return user; //If all matches, return the user
}

//Creating a model which we can work with from the defined schema for users, where 1st argument is the name of
//the model and the 2nd argument is the schema
const User = mongoose.model('User', userSchema);
User.createIndexes(); //For the unique property of email in user schema to work properly (but idk why exactly KIV)

//IMPORTANT: You may see that only documents are generated in the database but there is no explicit code to 
//create the collection containing the document. Mongoose does it for us automatically and name the collection as
//the pluralised version of the document (Eg. 'users' collection based on 'Uask' document)

module.exports = User;