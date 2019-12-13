var express = require('express');
var router = express.Router();
const md5 = require('blueimp-md5')
const UserModel = require('../db/modal').UserModel
const ChatModel = require('../db/modal').ChatModel
const filter = {password:0,__v:0}

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/


//注册用户路由
router.post('/register', (req, res) => {
  const {username, password,type} = req.body
  UserModel.findOne({username},(err,user) => {
    if (user){
      res.send({code: 1, msg: '此用户已存在'})
    }
    // 2.2. 如果不存在, 将提交的user 保存到数据库
    new UserModel({username,type,password:md5(md5(password))}).save((err,user) => {
      if (err){
        res.send({code: 1, msg: '注册失败'})
      }
      // 生成一个cookie(userid: user._id), 并交给浏览器保存
      res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7}) // 持久化cookie, 浏览器会保存在本地文件
      res.send({code: 0, data: {_id:user._id, username,type}})
    })
  })
})


//用户登录路由
router.post('/login', (req, res) => {
  const {username, password,type} = req.body
  UserModel.findOne({username,password:md5(md5(password))},type,filter,(err,user) => {
    if (!user) {
      res.send({code: 1, msg: '用户名或密码错误'})
    } else {
      // 生成一个cookie(userid: user._id), 并交给浏览器保存
      res.cookie('userid', user._id, {maxAge: 1000 * 60 * 60 * 24 * 7}) // 持久化cookie, 浏览器会保存在本地文件
      res.send({code: 0, data: {user}})
    }
  })
})


//更新用户信息路由
router.post('/update', (req, res) => {
  const userid = req.cookies.userid
  if (!userid){
    res.send({code: 1, msg: '请先登录'})
  }

  const user = req.body
  UserModel.findByIdAndUpdate({_id:userid},user,(err,oldUser) => {
    if (!oldUser) {
      res.clearCookie('userid')
      res.send({code: 1, msg: '此用户不存在'})
    } else {
      const {_id,username,type} = oldUser
      const data = Object.assign(user,{_id,username,type})
      res.send({code: 0, data})
    }
  })
})


//获取用户信息路由
router.get('/user', (req, res) => {
  const userid = req.cookies.userid
  if (!userid){
    res.send({code: 1, msg: '请先登录'})
  }
  UserModel.findOne({_id:userid},filter,(err,user) => {
    if (!user) {
      res.send({code: 1, msg: '此用户不存在'})
    } else {
      res.send({code: 0, data:user})
    }
  })
})


//获取用户列表
router.get('/userlist', (req, res) => {
  const type = req.query.type
  if (!type){
    res.send({code: 1, msg: '请检查账号'})
  }
  UserModel.find({type:type},(err,user) => {
    if (!user) {
      res.send({code: 1, msg: '未找到匹配用户'})
    } else {
      res.send({code: 0, data:user})
    }
  })
})


//6、获取当前用户的聊天消息列表
router.get('/msglist',(req,res) => {
  // 获取cookie 中的userid
  const userid = req.cookies.userid

  UserModel.find(function (err, userDocs) {
    const users = {} // 对象容器
    userDocs.forEach(doc => {
      users[doc._id] = {username: doc.username, header: doc.header}
    })

    ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, (err, chatMsgs) => {
      // 返回包含所有用户和当前用户相关的所有聊天消息的数据
      res.send({code: 0, data: {users, chatMsgs}})
    })
  })
})

/*
修改指定消息为已读
*/
router.post('/readmsg', function (req, res) {
// 得到请求中的from 和to
  const from = req.body.from
  const to = req.cookies.userid
  ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err, doc) {
    console.log('/readmsg', doc)
    res.send({code: 0, data: doc.nModified}) // 更新的数量
  })
})

module.exports = router;
