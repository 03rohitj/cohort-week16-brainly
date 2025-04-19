//To install TS version of express, make sure to : npm i @types/express. Same with 'jsonwebtoken' library.

import express from "express";
import mongoose, { ObjectId } from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ContentModel, LinkModel, UserModel } from "./db";
import { genSalt, hash, compare } from "bcrypt-ts";
const saltRounds = genSalt(10);
import { loginAuth } from "./middlewares/login_auth";
import {JWT_SECRET} from "./config";
import { random } from "./utils";

const app = express();
//If we are parsing the body i.e. req.body.username, then we need to use express.json() middleware
app.use(express.json());

const usernameValidation = z.string()
    .min(3, "Username must be atleast 3 characters long")
    .max(10, "Username cannot exceed 10 characters");

const passwordValidation = z.string()
    .min(8, "Password should be atleast 8 characters")
    .max(20, "Password cannot exceed 20 characters")
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,
  "Password must contain at least one uppercase, one lowercase, one number, and one special character");

  //An async function is like a special room where pausing (via await) is allowed
app.post("/api/v1/signup", async (req, res) => {
    const {username, password} = req.body;

    if( !username || !password){
        console.error("Error 411 : Username/Password field cannot be empty");
        res.status(411).json("Error : Username or Password field cannot be empty");
    }
    
    try{
        const validatedUsername = usernameValidation.parse(username);
        const validatedPassword = passwordValidation.parse(password);

        const foundUser = await UserModel.findOne({username});
        if(foundUser){
            console.error("Error 403 : User already exsists with this username : ", username);
            res.status(403).json({"Error" : "User already exsists with this username"});
            return;
        }

        //encrypt the password
        const hashedPassword = await hash(password, await saltRounds);

        const newUser = await UserModel.create({
            username: username,
            password: hashedPassword
        });
        console.log("New User Created : ", username);
        res.status(200).json({"message" : "Signup Successful with user : "+username});

    }catch( error ){
        let errorMessages:string[] = [];
        if( error instanceof z.ZodError){
            errorMessages = error.issues.map( issue => issue.message);    
        }
        else{
            errorMessages.push(error+"");
        }
        console.error("SignUp Error : ", errorMessages);
        res.status(500).json({"Error" : errorMessages});
    }

});

//Signin route
app.post("/api/v1/signin", async (req, res) => {
    const {username, password} = req.body;
    if( !username || !password){
        console.error("Error 411 : Username/Password field cannot be empty");
        res.status(411).json("Error : Username or Password field cannot be empty");
    }
    
    try{
        const validatedUsername = usernameValidation.parse(username);
        const validatedPassword = passwordValidation.parse(password);

        const foundUser = await UserModel.findOne({
            username : username
        });

        //If username is invalid
        if(!foundUser){
            console.error("Error 403 : Invalid Username : ", username);
            res.status(403).json({"Error" : "Invalid Username : "+ username});
            return;
        }

        console.log("Found User Password : ", foundUser.password);
        
        //If password is not matching
        const passwordVerified = await compare(password, foundUser.password);
        console.log("InputPassword : ", password);
        console.log("VerifiedPassword : ", passwordVerified);
        if(passwordVerified){
            //Get a token
            const token = jwt.sign({userId: foundUser._id.toString()}, JWT_SECRET);
            res.status(200).json({
                "message":"SignIn Successful",
                "token":token
            });
            return;
        }
        else{
            console.error("Error 403 : Invalid Password");
            res.status(403).json({"Error" : "Invalid Password"});
            return;
        }

    }catch( error ){
        let errorMessages:string[] = [];
        if( error instanceof z.ZodError){
            errorMessages = error.issues.map( issue => issue.message);    
        }
        else{
            errorMessages.push(error+"");
        }
        console.error("SignIn Error : ", errorMessages);
        res.status(500).json({"Error" : errorMessages});
    }

});

//Add new Content
app.post("/api/v1/content", loginAuth ,async (req, res) => {
    const { type, link, title, tags } = req.body;
    //@ts-ignore
    console.log("Req.UserId : ", req.userId);

    try
    {
        const newContent = await ContentModel.create({
            link: link,
            type: type,
            title: title,
            tags: [],
            //@ts-ignore
            userId: req.userId
        })
        res.status(200).json({ "message" : "Add Content hit"});
    }catch( error ){
        console.error("Add Content Error:  ", error);
        res.status(500).json({"Error" : error});
    }
});

//Fetching all existing documents
app.get("/api/v1/content", loginAuth, async(req, res) => {
    //@ts-ignore
    const userId = req.userId;
    try{
        const allContents = await ContentModel.find({
            userId: userId
        }).populate("userId", "username");

        console.log("All Content : ", allContents);
        res.status(200).json({ 
            "message" : "Fetching all existing documents hit",
            "Content" : allContents
        });
    }catch( error ){
        console.error("Get All Contents, Error : ", error);
        res.status(500).json({"Error" : error});
    }
});

//Delete a document(content)
app.delete("/api/v1/content", loginAuth, async(req, res) => {
    //@ts-ignore
    const userId = req.userId;

    try{
        const contentId = mongoose.Types.ObjectId.createFromHexString(req.body.contentId);
        const deletedContent = await ContentModel.deleteOne({
            _id : contentId,
            userId : userId
        });

        console.error("Delted Content : ", deletedContent);

        if( deletedContent.deletedCount == 0 ){
            console.error("Delete a Doc, Error 401 : Doc not found");
            res.status(403).json({
                "Error" : "Document not found"
            }); 
            return;   
        }
        res.status(200).json({ "message" : "Document deleted successfully"});
    }catch( error ){
        console.error("Delete a Doc, Error 500 : ", error);
        res.status(500).json({
            "Error" : error
        });
    }
});

//Create a shareable link for your second brain
app.post("/api/v1/brain/share", loginAuth, async(req, res) => {
    const share:boolean = req.body.share === true || req.body.share === 'True' || req.body.share === 'true';

    try{
        //@ts-ignore
        const userId = req.userId;
        if(share){
            const existingLink = await LinkModel.findOne({ userId: userId});
            if(existingLink){
                res.status(200).json({
                    message: "Link is already set to shareable",
                    hash: existingLink.hash
                });
                return;
            }

            //Create a shareable link
            const newLink = await LinkModel.create({
                userId: userId,
                hash: random(10)
            });

            res.status(200).json({
                message : "Shareable is set true ",
                hash : newLink.hash
            })
        }else{
            await LinkModel.deleteOne({
                userId: userId
            });

            res.status(200).json({
                message : "Shareable Link is disabled "
            })
        }

        
    }catch( error ){
        console.error("Shareable link error : ", error);
        res.status(500).json({
            "Error" : error
        });
    }
});

//Fetch another user's shared brain content
app.get("/api/v1/brain/:shareLink", async(req, res) => {
    const hash = req.params.shareLink;

    try {
        //verify that shared hash is valid or not
        const validLink = await LinkModel.findOne({
            hash: hash
        });

        if(!validLink){
            res.status(411).json({
                message: "Error : Incorrect Input"
            });
            return;
        }

        //Link is valid, so fetch user details and it's contents
        const content = await ContentModel.find({
            userId: validLink.userId        
        });

        //Get user also
        const user = await UserModel.findOne({
            _id : validLink.userId
        });

        if(!user){
            res.status(411).json({
                message: "User does not exist, error ideally should not happen"
            });

            return;
        }

        res.status(200).json({
            username: user.username,
            content: content
        });

    } catch (error) {
        res.status(404).json({
            error: error
        });
    }


});

app.listen(3000);

