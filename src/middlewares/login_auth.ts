import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "../config";


export function loginAuth(req: Request, res: Response, next: NextFunction){
    const token = req.headers['authorization'];
    try{
        if( token == null)
            throw new Error("Token not found");
            
        const decodedData = jwt.verify(token, JWT_SECRET);
    
        if( decodedData ){
            //@ts-ignore
            req.userId = decodedData.userId;
            next();
        }
        else{
            console.error("Verification Failed");
            res.status(403).json({
                "message" : "Please SignIn to access"
            });
        }
    }catch( error ){
        console.error("Auth Error : ", error);
        res.status(401).json({
            "message" : "Un-Authorized!"
        });
    }
}

module.exports = { loginAuth };