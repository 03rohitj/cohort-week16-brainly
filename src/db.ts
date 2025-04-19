import mongoose from "mongoose";
import { MONGO_URI } from "./config";
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

mongoose.connect(MONGO_URI)
    .then( () => {
        console.log("DB Connection Successful");
    })
    .catch( (err) => {
        console.error("Error Connecting DB : ", err);
});

const Users = new Schema({
    username: {type:String, unique: true, required: true},
    password: {type:String, required:true}
});
export const UserModel = mongoose.model('users', Users);

const Links = new Schema({
    hash:{type: String},
    userId: {type: ObjectId, ref: "users", required: true, unique: true}
});
export const LinkModel = mongoose.model('links', Links);

const contentTypes = ['image', 'video', 'article', 'audio'];

const Tags = new Schema({
    title: String
});
export const TagModel = mongoose.model('tags', Tags);

const Content = new Schema({
    link: {type:String, required: true},
    type: {type:String, enum: contentTypes, required: true},
    title: {type: String, required: true},
    tags: [{type: ObjectId, ref: "Tags"}],
    userId: {type: ObjectId, ref: "users", required: true}
});
export const ContentModel = mongoose.model('content', Content);


