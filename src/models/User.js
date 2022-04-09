const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/Task')

//Schemat usera
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password : {
        type: String,
        minlength: 7,
        required: true,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error(`Password cant include 'password' `)
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0 || value >= 150) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

//Generowanie tokenu logowania dla uzytkownika
userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id:user._id.toString() },process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })

    await user.save()

    return token
}

//Połączenie kolekcji Usera i Tasków chuj wie jak to działa
userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function() {
    const user = this

    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

//Znalezienie usera po emailu i haśle
userSchema.statics.findUserByCredentials = async (email,password) => {
    const user = await User.findOne({email})

    if (!user) throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password,user.password)

    if(!isMatch) throw new Error('Unable to login')


    return user
}

//hash the plain password before saving
userSchema.pre('save', async function(next) {
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    
    next()
})

// usun wszystkie taski kiedy user jest kasowany
userSchema.pre('remove', async function(next){
    const user = this

    await Task.deleteMany({ owner: user._id})

    next()
})

const User = mongoose.model('User',userSchema)


module.exports = User
