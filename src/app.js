const express = require('express')
if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
require('./db/mongoose')


const app = express()
const PORT = process.env.PORT
const userRouter = require('./routes/userRouter')
const taskRouter = require('./routes/taskRouter')

app.use(express.json())
app.use('/users',userRouter)
app.use('/tasks',taskRouter)


app.listen(PORT,()=> console.log(`Starting server on port ${PORT}`))






