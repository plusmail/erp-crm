require('dotenv').config({ path: __dirname + '/../.variables.env' });

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises

async function createAdmin() {
  try {
    const Admin = require('../models/erpModels/Admin');
    var newAdmin = new Admin();
    const passwordHash = newAdmin.generateHash('admin123');

    await new Admin({
      email: 'plus4957@gmail.com',
      password: passwordHash,
      name: 'Salah Eddine',
      surname: 'Lalami',
    }).save();
    console.log('šššššššš Admin created : Done!');
    process.exit();
  } catch (e) {
    console.log('\nšššššššš Error! The Error info is below');
    console.log(e);
    process.exit();
  }
}
createAdmin();
