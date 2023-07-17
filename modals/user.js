const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    userId: {
        type: String,
    },
    email: {
        type: String,
        default: "none",
    },
    password: {
        type: String,
    },
    userName: {
        type: String,
    },
    socialCredits: {
        type: Number,
        default: 0,
    },
    avatar: {
        type: String,
        default: "none",
    },
    ownedItems: {
        type: Array,
        default: [],
    }
},
{
    timestamps: true,
});

module.exports = model("users", userSchema);