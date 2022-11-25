const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const {
  isValidAdminToken,
  login,
  logout,
} = require('@/controllers/erpControllers/authJwtController ');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = mongoose.model('Admin');

router.route('/login').post(catchErrors(async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate
    if (!email || !password)
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Not all fields have been entered.',
      });

    const admin = await Admin.findOne({ email: email, removed: false });
    // console.log(admin);
    if (!admin)
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No account with this email has been registered.',
      });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid credentials.',
      });

    const token = jwt.sign(
      {
        id: admin._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '72h' }
    );

    const result = await Admin.findOneAndUpdate(
      { _id: admin._id },
      { isLoggedIn: true },
      {
        new: true,
      }
    ).exec();

    res.cookie('token', token, {
      maxAge: req.body.remember ? 72 * 60 * 60 * 1000 : 60 * 60 * 1000, // Cookie expires after 30 days
      sameSite: 'none',
      httpOnly: true,
      secure: true,
    });

    res.json({
      success: true,
      result: {
        token,
        admin: {
          id: result._id,
          name: result.name,
          isLoggedIn: result.isLoggedIn,
        },
      },
      message: 'Successfully login admin',
    });
  } catch (err) {
    res.status(500).json({ success: false, result: null, message: err.message, error: err });
  }
}));
router.route('/logout').post(isValidAdminToken, catchErrors(async (req, res) => {
  const result = await Admin.findOneAndUpdate(
    { _id: req.admin._id },
    { isLoggedIn: false },
    {
      new: true,
    }
  ).exec();

  res.clearCookie('token');
  res.json({ isLoggedOut: true });
}));

module.exports = router;
