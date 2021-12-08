//This file contains the routes to the user HTTP methods which is then used by app in index.js
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
//Requiring the Mongoose models for our user
const auth = require('../middleware/auth');
//Requring the Authentication middleware
const email = require('../emails/account');

const router = express.Router(); 
//Creating new instance from a router class and saving it into a router variable
//Use the express.Router class to create modular, mountable route handlers. A Router instance is a complete 
//middleware and routing system; for this reason, it is often referred to as a “mini-app”.


// app.post('/users', (req, res) => { //For CREATING new users with the POST http method
//     const user = new User(req.body);
//     //Creating an instance of a User based on the JSON object sent from the HTTP request
//     user.save().then(() => { //Mongoose will help us save our instance into the MongoDB database
//         res.status(201).send(user); 
//         //If successful, the response will send back the newly created user in the database. Good practice to
//         //set the status code to 201 to signify a successful CREATE request
//     }).catch((e) => {
//         res.status(400).send(e);
//         //If there are any errors(Eg. failure of the validation in the model) related to the instance, 
//         //an error will be sent back. Take note to set the status code to 400 before sending the error to signify
//         //that it is a bad request!
//     })
// })


//Remember to change from app to route to call upon the HTTP methods
router.post('/users', async (req, res) => { //Define the callback function as an async function
    const user = new User(req.body);
    try { 
    //Run a try-catch block, if any errors occur along the way in the try block, the try block stops running and 
    //the catch block immediately runs instead
        const token = await user.generateAuthToken(); //Generating a login JWT for the user
        await user.save(); //Awaiting this asychronous function from Mongoose
        email.sendWelcomeEmail(user.email, user.name);
        res.status(201).send({user: user.getPublicProfile(), token});
    } catch(e) {
        res.status(400).send(e);
    }
})

router.post('/users/login', async (req, res) => { //For logging in users
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        //Using our own defined model method which is created in the user schema
        const token = await user.generateAuthToken(); //Generating a login JWT for the user
        res.send({user: user.getPublicProfile(), token});
    } catch(e) {
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async(req, res) => { //For logging out the user from one device only (1 token)
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return req.token !== token.token //Filtering out the token which currently authenticating the user
        })
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();

    } catch(e) {
        res.status(500).send();
    }
})

// app.get('/users', (req, res) => { //For READING all users in the database with the GET http method
//     User.find({}).then((users) => { //Finding based on the User mongoose model
//         res.send(users);
//     }).catch((e) => {
//         res.status(500).send(); 
//         //Alert the client that an internal server error had occured (500), for example loss of connection to
//         //the datbase. No need to send the error message back
//     })
// })

router.get('/users', auth, async (req, res) => { 
    //If we want to use a middleware for a route, set it as the 2nd argument
    try {
        const users = await User.find({});
        res.send(users);
    } catch(e) {
        res.status(500).send();
    }
})

router.get('/users/me', auth, (req, res) => {
    res.send(req.user.getPublicProfile()) //For sending back the specific profile of a user
})

const upload = multer({ //Creating an instance of multer and setting an object of properties
    // dest: 'avatars', 
    //Setting the destination folder to be 'avatars'. If that folder does not exist, multer helps to create 
    //one for us
    //Commenting out the dest property as we do not want to store the uploaded file buffer data in a directory
    //but on the avatar field of the document in the database 
    limits: {
        fileSize: 1000000
    },
    //Creating a limits object option allows us to customize certain file limits such as maximum file size where 
    //1000000 is equivalent to 1 million bytes (aka 1MB) 
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload a .jpg, .jpeg or a .png file'));
        }
        callback(undefined, true);
    }
    //fileFilter is a function which consists of 3 arguments, one of which is a callback
    //Helps to sieve out which files are suitable for uploading. In this case we have chosen to see if the file's
    //original name matches the regex representing strings which ends with jpg, jpeg or png
    //If there is no match, we return a callback consisting of an error as its only argument. 
    //If it matches, we return a callback where its first argument for error is undefined and its second argument
    //is true for a positive match
})
router.post('/users/me/avatar', auth ,upload.single('avatar'), async (req, res) => {
    //Includes a 2nd (middleware) which is calling a method on the multer instance called 'single' 
    //for uploading 1 file. The argument for the method is the name of the key which we pass through Postman
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    //Since there is no dest property in upload middleware, it will pass on the file data to req to process. 
    //In this case, we access the buffer data of the file and store it in the authenticated user's avatar field
    //But before storing, we will modify the image first through the Sharp NPM module by passing the buffer data
    //to sharp first and calling on methods such as resize and png to convert the image to a png and resize it
    //to a certain resolution. Finally, call toBuffer() to convert it back to buffer data to be stored in user's
    //avatar field
    await req.user.save();    
    res.send();
}, (error, req, res, next) => { 
    //Set up an Express Error handling Middleware which is a function with 4 compulsory arguments: error, req,
    //res and next
    //NOTE: For this case, do not use the try-catch method in the (req, res) function block, as try-catch 
    //only catch errors thrown within the try block. In this case, errors are thrown by the middleware and 
    //an error handling middleware needs to be implemented to handle such external errors
    res.status(400).send({error: error.message});
    //If an error occurs, an error JSON message will be sent back instead of the default HTML error message
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(400).send();
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new error(); 
             //If user or user's avatar picture does not exist, throw an error for catch block to run
        }
        res.set('Content-Type', 'image/jpg');
        //Default Express response will have a 'Content-Type' header value of 'application/json' to send back JSON
        //data. By setting the content type to 'image/jpg', we are telling Express to help us send back an image's
        //binary data
        res.send(user.avatar);
    } catch(e) {
        res.status(404).send();
    }
})

// app.get('/users/:id', (req, res) => { //For READING a user via its specific objectID with the GET http method
//     //Route handler has :id to signify that the request now has a parameter of 'id'
//     const _id =  req.params.id; //Saving the 'id' parameter into a variable
//     User.findById(_id).then((user) => {
//         if (!user) { //If there are no matching users (which is not an error), return a response of 404 (Not found)
//             return res.status(404).send();
//         } 
//         res.send(user); 
//         //No need to set status code of 200 for successful reading as Express default setting for successes is 200
//     }).catch((e) => {
//         res.status(500).send(); //For internal sever errors (500)
//     })
// })

//Commenting this route handler out as it is no longer needed, because we should not allow users to fetch
//data about themselves or other users via their IDs
// router.get('/users/:id', async (req,res) => {
//     const _id = req.params.id;
//     try {
//         const user = await User.findById(_id);
//         if (!user) {
//             return res.status(404).send();
//         }
//         res.send(user);
//     } catch(e) {
//         res.status(500).send();
//     }
// })

//Commenting out this route handler because we do not want people to randomly update other user data via their IDs
// router.patch('/users/:id', async (req, res) => { //For UPDATING a specific user via the PATCH http method
//     const updates = Object.keys(req.body); //Returns an array of keys from the req.body object
//     const allowedUpdates = ['name', 'age', 'email' , 'password']; 
//     //An array of key values which are allowed to be updated (values from the fields in the database)
//     const isValidOperation = updates.every((update) => {
//         return allowedUpdates.includes(update);
//     })
//     //Returns a false value which is stored in isValidOperation if any of the element in the updates array 
//     //returns false for not being included in the allowedUpdates array
//     if (!isValidOperation) {
//         return res.status(400).send({error: 'Invalid updates!'});
//     }
//     try {
//         // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
//         //findByIdAndUpdate() takes in 3 arugments, the 1st being the targeted _id, the 2nd being new things to 
//         //be updated which can be found in the body of the HTTP request, the 3rd argument being an object of various
//         //options: new set to true for a new user to be returned & runValidators set to true for the new data to be
//         //validated with our Mongoose model validators

//         //However, instead of using the fast method of findByIdAndUpdate, we are going to do the manual way to
//         //find the specific id, apply the specific updates and then save so that our defined pre-hook middleware 
//         //in User schema can run as it acts on the 'save' method
//         const user = await User.findById(req.params.id);
//         updates.forEach((update) => {
//             user[update] = req.body[update];
//         })
//         await user.save(); //Now the pre-hook for save as defined in the User Schema can run

//         if (!user) {
//             return res.status(404).send() //If no user with the stated id is found, return 404 not found
//         }
//         res.send(user);
//     } catch(e) {
//         res.status(400).send(e); //To catch any validation errors!
//     }
// })

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email' , 'password']; 
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    })
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'});
    }
    try {
        const user = req.user;
        updates.forEach((update) => {
            user[update] = req.body[update];
        })
        await user.save();
        res.send(user.getPublicProfile());
    } catch(e) {
        res.status(400).send(e);
    }
})

//Commenting this route handler out because we do not want people to randomly delete users via their IDs
// router.delete('/users/:id', async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id);
//         if (!user) {
//             return res.status(404).send();
//         }
//         res.send(user);
//     } catch(e) {
//         res.status(500).send();
//     }
// })

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove() //Using the Mongoose remove method on an instance to delete the document
        //A middleware has been set on remove() to automatically delete all tasks related to this user
        email.sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user.getPublicProfile());
    } catch(e) {
        res.status(500).send();
    }
})

module.exports = router;