const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入用户模型
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    测试用户路由
// @access  Public
router.get('/test', (req, res) => res.json({ msg: '用户路由工作正常' }));

// @route   POST api/users/register
// @desc    注册用户
// @access  Public
router.post('/register', (req, res) => {
    // 查找数据库中是否已存在该邮箱
    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).json({ email: '邮箱已被注册' });
        } else {
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                role: req.body.role
            });

            // 加密密码
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                });
            });
        }
    });
});

// @route   POST api/users/login
// @desc    登录用户 / 返回 JWT Token
// @access  Public
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // 在数据库中查找用户
    User.findOne({ email }).then(user => {
        // 检查用户是否存在
        if (!user) {
            return res.status(404).json({ emailnotfound: '未找到用户' });
        }

        // 检查密码是否匹配
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                // 用户匹配成功，创建 JWT Payload
                const payload = { id: user.id, name: user.name, role: user.role };

                // 签发 Token
                jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    { expiresIn: 3600 }, // 1小时后过期
                    (err, token) => {
                        res.json({
                            success: true,
                            token: 'Bearer ' + token
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({ passwordincorrect: '密码不正确' });
            }
        });
    });
});

module.exports = router;
