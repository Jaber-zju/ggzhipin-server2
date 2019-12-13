module.exports = function (server) {
  const ChatModel = require('../db/modal').ChatModel
  const io = require('socket.io')(server)

  io.on('connection',(socket) => {
    console.log('有客户端连接上了服务器')

    socket.on('sendMsg',({from,to,content}) => {
      console.log('服务器接收到客户端的消息：',{from,to,content})

      const chat_id = [from,to].sort().join('_')
      const create_time = Date.now()
      const chatModel = new ChatModel({chat_id,from,to,create_time,content})

      chatModel.save((err,chatMsg) => {
        if (err){
          console.log(err);
        }
        io.emit('recieveMsg', chatMsg)
        console.log('服务器向所有已经连接的客户端发送消息：',chatMsg)
      })


    })

  })

}