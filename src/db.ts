import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

mongoose.connect("mongodb+srv://03rohitjangid:OhdO4q80rtlLlQDN@cluster0.lnpbz.mongodb.net/brainly")
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

const Link = new Schema({
    hash:{type: String, required: true},
    userId: {type: ObjectId, ref: "User", required: true}
});
export const LinkModel = mongoose.model('link', Link);

const contentTypes = ['image', 'video', 'article', 'audio'];

const Content = new Schema({
    link: {type:String, required: true},
    type: {type:String, enum: contentTypes, required: true},
    title: {type: String, required: true},
    tags: {type: ObjectId, ref: "Tags", required: true},
    userId: {type: ObjectId, ref: "User", required: true}
});
export const ContentModel = mongoose.model('content', Content);

const Tags = new Schema({
    title: String
});
export const TagModel = mongoose.model('tags', Tags);

