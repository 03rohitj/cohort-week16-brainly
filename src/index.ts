//To install TS version of express, make sure to : npm i @types/express. Same with 'jsonwebtoken' library.

import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserModel } from "./db";

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
    console.log("Req : ", req.body);
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

        const newUser = await UserModel.create({
            username: username,
            password: password
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

app.post("/api/v1/signin", (req, res) => {

});

app.post("/api/v1/content", (req, res) => {

});

app.get("/api/v1/content", (req, res) => {

});

app.delete("/api/v1/content", (req, res) => {

});

app.post("/api/v1/brain/share", (req, res) => {

});

app.get("/api/v1/brain/:shareLink", (req, res) => {

});

app.listen(3000);

