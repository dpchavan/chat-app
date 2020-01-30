const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const http = require('http')
const Filter = require('bad-words')
const {addUser, getUser, getUsersInRoom, removeUser} = require('./util/user')
const {generateMessage, generateLocationMessage} = require('./util/message')
const publicDirPath = path.join(__dirname, '../public')
const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
    console.log('New WebSocket Connection')
    
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        var filter = new Filter()
        if(filter.isProfane(msg)){
            return callback('Profanity not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg))   // emit to every user 
        callback()
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('join' , ({username, room}, callback) => {
        const { error, user } = addUser({
            id : socket.id,
            username,
            room
        })
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', "Welcome"))  // emits to current user
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`)) //broadcast to every user except current one
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        callback()
        // io.to.emit -> emit message to current room
        // io.broadcast.to.emit -> emit message to current room except current one 
    })

    socket.on('disconnect', () => {      // biult in event
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Server running on port '+port)
})