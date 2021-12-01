const jwt = require('jsonwebtoken');
const User = require('../models/user');

//Defining our authentication middleware in this file

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        //To store the value of the token provided by the client which is stored in the 'Authorization' header 
        //of request. Since the value of the token has a syntax of 'Bearer (token)', we need to get rid of 
        //'Bearer' to get the actual token
        const decoded = jwt.verify(token, process.env.JWT_KEY); 
        //If the token's signature matches with our private key, it will return its decoded payload, 
        //otherwise it will throw an error and the catch block will run instead
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token});
        //Finding the specific user which has matching _id value in the decoded object and has a matching token
        //in its token array
        
        if (!user) {
            throw new Error(); 
            //If there are no matching users, throw an error which does not require any arguments and the 
            //catch block will run instead
        }
        req.user = user; //Store the user data in the request for easy access in other parts of the application 
        req.token = token;
        next(); //If no issues are encountered, the subsequent middleware or route will run successfully
    } catch(e) {
        res.status(401).send({error: 'Unable to authenticate!'});
    }
}

module.exports = auth;