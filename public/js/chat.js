var socket = io()
//Elements
var $messageForm = document.querySelector('#message-form');
var $messageFormInput = $messageForm.querySelector('input')
var $messageFormButton = $messageForm.querySelector('button')
var $messageFormLocationButton = document.querySelector('#send-location')
var $message = document.querySelector('#message')

//Templates
var $messageTemplate = document.querySelector('#message-template').innerHTML
var $locationTemplate = document.querySelector('#location-template').innerHTML
var $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML
//Options
const {username, room} =  Qs.parse(location.search, { ignoreQueryPrefix : true })

const autoScroll = () => {
    //New message element
    const $newMessage = $message.lastElementChild
    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMarin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offSetHeight + newMessageMarin
    //visible height
    const visibleHeight = $message.offSetHeight

    //height of message container
    const containerHeight = $message.scrollHeight

    //how far i scrolled
    const scrolledOffset = $message.scrollTop + visibleHeight

    if( ( containerHeight - newMessageHeight ) <= scrolledOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render($messageTemplate, {
        username : msg.username,
        message : msg.text,
        createdAt : moment(msg.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})
socket.on('locationMessage', (locationMsg) => {
    console.log(locationMsg.url)
    const html = Mustache.render($locationTemplate, {
        username : locationMsg.username,
        urlLocation : locationMsg.url,
        createdAt : moment(locationMsg.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    var msg = e.target.elements.message.value
    $messageFormButton.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', msg, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered')
    })
})
debugger

document.querySelector('#send-location').addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation deos not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        $messageFormLocationButton.setAttribute('disabled', 'disabled')
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            $messageFormLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})
