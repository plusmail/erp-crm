const express = require('express');
const multer = require('multer');
const path = require('path');
const setFilePathToBody = require('@/middlewares/setFilePathToBody');
const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();

const adminController = require('@/controllers/erpControllers/adminController');
const roleController = require('@/controllers/erpControllers/roleController');

const employeeController = require('@/controllers/erpControllers/employeeController');
const paymentModeController = require('@/controllers/erpControllers/paymentModeController');
const clientController = require('@/controllers/erpControllers/clientController');
const invoiceController = require('@/controllers/erpControllers/invoiceController');
const itemController = require('@/controllers/erpControllers/itemController');
const quoteController = require('@/controllers/erpControllers/quoteController');
const supplierController = require('@/controllers/erpControllers/supplierController');
const orderFormController = require('@/controllers/erpControllers/orderFormController');
const expenseController = require('@/controllers/erpControllers/expenseController');
const expenseCategoryController = require('@/controllers/erpControllers/expenseCategoryController');
const paymentInvoiceController = require('@/controllers/erpControllers/paymentInvoiceController');

const settingCommercialController = require('@/controllers/erpControllers/settingCommercialController');
const settingGlobalController = require('@/controllers/erpControllers/settingGlobalController');
const mongoose = require("mongoose");

// //_______________________________ Admin management_______________________________

var adminPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/admin');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const adminPhotoUpload = multer({ storage: adminPhotoStorage });

router
  .route('/admin/create')
  .post([adminPhotoUpload.single('photo'), setFilePathToBody], catchErrors(async (req, res) => {
    try {
      let { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({
          success: false,
          result: null,
          message: "Email or password fields they don't have been entered.",
        });

      const existingAdmin = await Admin.findOne({ email: email });

      if (existingAdmin)
        return res.status(400).json({
          success: false,
          result: null,
          message: 'An account with this email already exists.',
        });

      if (password.length < 8)
        return res.status(400).json({
          success: false,
          result: null,
          message: 'The password needs to be at least 8 characters long.',
        });

      var newAdmin = new Admin();
      const passwordHash = newAdmin.generateHash(password);
      req.body.password = passwordHash;

      const result = await new Admin(req.body).save();
      if (!result) {
        return res.status(403).json({
          success: false,
          result: null,
          message: "document couldn't save correctly",
        });
      }
      return res.status(200).send({
        success: true,
        result: {
          _id: result._id,
          enabled: result.enabled,
          email: result.email,
          name: result.name,
          surname: result.surname,
          photo: result.photo,
          role: result.role,
          employee: result.employee,
        },
        message: 'Admin document save correctly',
      });
    } catch {
      return res.status(500).json({ success: false, message: 'there is error' });
    }
  }));
router.route('/admin/read/:id').get(catchErrors(async (req, res) => {
  try {
    // Find document by id
    const tmpResult = await Admin.findOne({
      _id: req.params.id,
      removed: false,
    });
    // If no results found, return document not found
    if (!tmpResult) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found by this id: ' + req.params.id,
      });
    } else {
      // Return success resposne
      let result = {
        _id: tmpResult._id,
        enabled: tmpResult.enabled,
        email: tmpResult.email,
        name: tmpResult.name,
        surname: tmpResult.surname,
        photo: tmpResult.photo,
        role: tmpResult.role,
        employee: tmpResult.employee,
      };

      return res.status(200).json({
        success: true,
        result,
        message: 'we found this document by this id: ' + req.params.id,
      });
    }
  } catch {
    // Server Error
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
    });
  }
}));
router.route("/admin/update/:id").patch(catchErrors(async (req, res) => {
  try {
    let { email } = req.body;

    if (email) {
      const existingAdmin = await Admin.findOne({ email: email });

      if (existingAdmin._id != req.params.id)
        return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    let updates = {
      role: req.body.role,
      email: req.body.email,
      employee: req.body.employee,
      name: req.body.name,
      surname: req.body.surname,
    };

    // Find document by id and updates with the required fields
    const result = await Admin.findOneAndUpdate(
        { _id: req.params.id, removed: false },
        { $set: updates },
        {
          new: true, // return the new result instead of the old one
        }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found by this id: ' + req.params.id,
      });
    }
    return res.status(200).json({
      success: true,
      result: {
        _id: result._id,
        enabled: result.enabled,
        email: result.email,
        name: result.name,
        surname: result.surname,
        photo: result.photo,
        role: result.role,
        employee: result.employee,
      },
      message: 'we update this document by this id: ' + req.params.id,
    });
  } catch {
    // Server Error
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
    });
  }
}));
router.route("/admin/delete/:id").delete(catchErrors(async (req, res) => {
  try {
    let updates = {
      removed: true,
    };
    // Find the document by id and delete it
    const result = await Admin.findOneAndUpdate(
        { _id: req.params.id, removed: false },
        { $set: updates },
        {
          new: true, // return the new result instead of the old one
        }
    ).exec();
    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found by this id: ' + req.params.id,
      });
    } else {
      return res.status(200).json({
        success: true,
        result,
        message: 'Successfully Deleted the document by id: ' + req.params.id,
      });
    }
  } catch {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
    });
  }
}));
router.route('/admin/search').get(catchErrors(async (req, res) => {
  // console.log(req.query.fields)

  // console.log(fields)
  try {
    if (req.query.q === undefined || req.query.q === '' || req.query.q === ' ') {
      return res
          .status(202)
          .json({
            success: false,
            result: [],
            message: 'No document found by this request',
          })
          .end();
    }

    const fieldsArray = req.query.fields
        ? req.query.fields.split(',')
        : ['name', 'surname', 'email'];

    const fields = { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }
    let result = await Admin.find(fields).where('removed', false).sort({ name: 'asc' }).limit(10);

    if (result.length >= 1) {
      return res.status(200).json({
        success: true,
        result,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(202).json({
        success: false,
        result: [],
        message: 'No document found by this request',
      });
    }
  } catch {
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Oops there is an Error',
    });
  }
}));
router.route('/admin/list').get(catchErrors(async (req, res) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;
  try {
    //  Query the database for a list of all results
    const resultsPromise = Admin.find({ removed: false })
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' })
        .populate();
    // Counting the total documents
    const countPromise = Admin.count({ removed: false });
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculating total pages
    const pages = Math.ceil(count / limit);

    // Getting Pagination Object
    const pagination = { page, pages, count };
    if (count > 0) {
      for (let admin of result) {
        admin.password = undefined;
        admin.customMenu = undefined;
        admin.permissions = undefined;
      }
      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        pagination,
        message: 'Collection is Empty',
      });
    }
  } catch {
    return res.status(500).json({ success: false, result: [], message: 'Oops there is an Error' });
  }
}));
router.route('/admin/profile').get(catchErrors(async (req, res) => {
  try {
    //  Query the database for a list of all results
    if (!req.admin) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "couldn't found  admin Profile ",
      });
    }
    let result = {
      _id: req.admin._id,
      enabled: req.admin.enabled,
      email: req.admin.email,
      name: req.admin.name,
      surname: req.admin.surname,
      photo: req.admin.photo,

      role: req.admin.role,

      employee: req.admin.employee,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found Profile',
    });
  } catch {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
    });
  }
}));
router.route('/admin/status/:id').patch(catchErrors(async (req, res) => {
  try {
    if (req.query.enabled === true || req.query.enabled === false) {
      let updates = {
        enabled: req.query.enabled,
      };
      // Find the document by id and delete it
      const result = await Admin.findOneAndUpdate(
          { _id: req.params.id, removed: false },
          { $set: updates },
          {
            new: true, // return the new result instead of the old one
          }
      ).exec();
      // If no results found, return document not found
      if (!result) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'No document found by this id: ' + req.params.id,
        });
      } else {
        return res.status(200).json({
          success: true,
          result,
          message: 'Successfully update status of this document by id: ' + req.params.id,
        });
      }
    } else {
      return res
          .status(202)
          .json({
            success: false,
            result: [],
            message: "couldn't change admin status by this request",
          })
          .end();
    }
  } catch {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
    });
  }
}));
// router
//   .route("/admin/photo")
//   .post(
//     [adminPhotoUpload.single("photo"), setFilePathToBody],
//     catchErrors(adminController.photo)
//   );
// router
//   .route("/admin/password-update/:id")
//   .patch(catchErrors(adminController.updatePassword));

// //____________________________ Role management_______________________________

router.route('/role/create').post(catchErrors(async (Model, req, res) => {
  try {
    // Creating a new document in the collection

    const result = await new Model(req.body).save();
    console.log(result);
    // Returning successfull response
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully Created the document in Model ',
    });
  } catch (err) {
    // If err is thrown by Mongoose due to required validations
    if (err.name == 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Required fields are not supplied',
        error: err,
      });
    } else {
      // Server Error
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Oops there is an Error',
        error: err,
      });
    }
  }
}));
router.route('/role/read/:id').get(catchErrors(roleController.read));
router.route('/role/update/:id').patch(catchErrors(roleController.update));
router.route('/role/delete/:id').delete(catchErrors(roleController.delete));
router.route('/role/search').get(catchErrors(roleController.search));
router.route('/role/list').get(catchErrors(roleController.list));
router.route('/role/filter').get(catchErrors(roleController.filter));

// //_________________________________ API for employees_____________________
router.route('/employee/create').post(catchErrors(employeeController.create));
router.route('/employee/read/:id').get(catchErrors(employeeController.read));
router.route('/employee/update/:id').patch(catchErrors(employeeController.update));
router.route('/employee/delete/:id').delete(catchErrors(employeeController.delete));
router.route('/employee/search').get(catchErrors(employeeController.search));
router.route('/employee/list').get(catchErrors(employeeController.list));
router.route('/employee/filter').get(catchErrors(employeeController.filter));

// //_____________________________________ API for payment mode_____________________
router.route('/paymentMode/create').post(catchErrors(paymentModeController.create));
router.route('/paymentMode/read/:id').get(catchErrors(paymentModeController.read));
router.route('/paymentMode/update/:id').patch(catchErrors(paymentModeController.update));
router.route('/paymentMode/delete/:id').delete(catchErrors(paymentModeController.delete));
router.route('/paymentMode/search').get(catchErrors(paymentModeController.search));
router.route('/paymentMode/list').get(catchErrors(paymentModeController.list));
router.route('/paymentMode/filter').get(catchErrors(paymentModeController.filter));

// //_____________________________________ API for clients __________________________________________________
router.route('/client/create').post(catchErrors(clientController.create));
router.route('/client/read/:id').get(catchErrors(clientController.read));
router.route('/client/update/:id').patch(catchErrors(clientController.update));
router.route('/client/delete/:id').delete(catchErrors(clientController.delete));
router.route('/client/search').get(catchErrors(clientController.search));
router.route('/client/list').get(catchErrors(clientController.list));
router.route('/client/filter').get(catchErrors(clientController.filter));

// //_________________________________________________________________API for invoices_____________________
router.route('/invoice/create').post(catchErrors(invoiceController.create));
router.route('/invoice/read/:id').get(catchErrors(invoiceController.read));
router.route('/invoice/update/:id').patch(catchErrors(invoiceController.update));
router.route('/invoice/delete/:id').delete(catchErrors(invoiceController.delete));
router.route('/invoice/search').get(catchErrors(invoiceController.search));
router.route('/invoice/list').get(catchErrors(invoiceController.list));
router.route('/invoice/filter').get(catchErrors(invoiceController.filter));

router.route('/invoice/pdf/:id').get(catchErrors(invoiceController.generatePDF));

// //_________________________________________________________________API for items_____________________
router.route('/item/create').post(catchErrors(itemController.create));
router.route('/item/read/:id').get(catchErrors(itemController.read));
router.route('/item/update/:id').patch(catchErrors(itemController.update));
router.route('/item/delete/:id').delete(catchErrors(itemController.delete));
router.route('/item/search').get(catchErrors(itemController.search));
router.route('/item/list').get(catchErrors(itemController.list));
router.route('/item/filter').get(catchErrors(itemController.filter));

// //_________________________________________________________________API for Quotes_____________________

router.route('/quote/create').post(catchErrors(quoteController.create));
router.route('/quote/read/:id').get(catchErrors(quoteController.read));
router.route('/quote/update/:id').patch(catchErrors(quoteController.update));
router.route('/quote/delete/:id').delete(catchErrors(quoteController.delete));
router.route('/quote/search').get(catchErrors(quoteController.search));
router.route('/quote/list').get(catchErrors(quoteController.list));
router.route('/quote/filter').get(catchErrors(quoteController.filter));
router.route('/quote/pdf/:id').get(catchErrors(quoteController.generatePDF));

// //___________________________________________ API for suppliers _____________________
router.route('/supplier/create').post(catchErrors(supplierController.create));
router.route('/supplier/read/:id').get(catchErrors(supplierController.read));
router.route('/supplier/update/:id').patch(catchErrors(supplierController.update));
router.route('/supplier/delete/:id').delete(catchErrors(supplierController.delete));
router.route('/supplier/search').get(catchErrors(supplierController.search));
router.route('/supplier/list').get(catchErrors(supplierController.list));
router.route('/supplier/filter').get(catchErrors(supplierController.filter));

// //_________________________________________ API for order Forms _____________________

router.route('/orderForm/create').post(catchErrors(orderFormController.create));
router.route('/orderForm/read/:id').get(catchErrors(orderFormController.read));
router.route('/orderForm/update/:id').patch(catchErrors(orderFormController.update));
router.route('/orderForm/delete/:id').delete(catchErrors(orderFormController.delete));
router.route('/orderForm/search').get(catchErrors(orderFormController.search));
router.route('/orderForm/list').get(catchErrors(orderFormController.list));
router.route('/orderForm/filter').get(catchErrors(orderFormController.filter));

router.route('/orderForm/pdf/:id').get(catchErrors(orderFormController.generatePDF));

// //_________________________________________________________________API for expenses_____________________

router.route('/expense/create').post(catchErrors(expenseController.create));
router.route('/expense/read/:id').get(catchErrors(expenseController.read));
router.route('/expense/update/:id').patch(catchErrors(expenseController.update));
router.route('/expense/delete/:id').delete(catchErrors(expenseController.delete));
router.route('/expense/search').get(catchErrors(expenseController.search));
router.route('/expense/list').get(catchErrors(expenseController.list));
router.route('/expense/filter').get(catchErrors(expenseController.filter));

// //_________________________________________________________________API for expense categories________________

router.route('/expenseCategory/create').post(catchErrors(expenseCategoryController.create));
router.route('/expenseCategory/read/:id').get(catchErrors(expenseCategoryController.read));
router.route('/expenseCategory/update/:id').patch(catchErrors(expenseCategoryController.update));
router.route('/expenseCategory/delete/:id').delete(catchErrors(expenseCategoryController.delete));
router.route('/expenseCategory/search').get(catchErrors(expenseCategoryController.search));
router.route('/expenseCategory/list').get(catchErrors(expenseCategoryController.list));
router.route('/expenseCategory/filter').get(catchErrors(expenseCategoryController.filter));

// //_____________________________________________ API for client payments_________________

router.route('/paymentInvoice/create').post(catchErrors(async (req, res) => {
  try {
    // Creating a new document in the collection
    if (req.body.amount === 0) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Minimum Amount couldn't be 0`,
      });
    }

    const currentInvoice = await Invoice.findOne({
      _id: req.body.invoice,
      removed: false,
    });

    const {
      total: previousTotal,
      discount: previousDiscount,
      credit: previousCredit,
    } = currentInvoice;

    const maxAmount = previousTotal - previousDiscount - previousCredit;

    if (req.body.amount > maxAmount) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Max Amount you can add is ${maxAmount}`,
      });
    }

    const result = await Model.create(req.body);

    const fileId = 'payment-invoice-report-' + result._id + '.pdf';
    const updatePath = Model.findOneAndUpdate(
        { _id: result._id.toString(), removed: false },
        { pdfPath: fileId },
        {
          new: true,
        }
    ).exec();
    // Returning successfull response

    const { _id: paymentInvoiceId, amount } = result;
    const { id: invoiceId, total, discount, credit } = result.invoice;
    console.log(
        '🚀 ~ file: paymentInvoiceController.js ~ line 63 ~ methods.create= ~ total',
        total
    );

    let paymentStatus =
        total - discount === credit + amount ? 'paid' : credit + amount > 0 ? 'partially' : 'unpaid';

    const invoiceUpdate = Invoice.findOneAndUpdate(
        { _id: req.body.invoice },
        {
          $push: { paymentInvoice: paymentInvoiceId },
          $inc: { credit: amount },
          $set: { paymentStatus: paymentStatus },
        },
        {
          new: true, // return the new result instead of the old one
          runValidators: true,
        }
    ).exec();

    // custom.generatePdf(
    //   "PaymentInvoice",
    //   { filename: "payment-invoice-report", format: "A5" },
    //   result
    // );

    const [updatedResult, invoiceUpdated] = await Promise.all([updatePath, invoiceUpdate]);
    res.status(200).json({
      success: true,
      result: updatedResult,
      message: 'Successfully Created the document in Model ',
    });
  } catch (err) {
    // If err is thrown by Mongoose due to required validations
    if (err.name == 'ValidationError') {
      res.status(400).json({
        success: false,
        result: null,
        message: 'Required fields are not supplied',
        error: err,
      });
    } else {
      // Server Error
      res.status(500).json({
        success: false,
        result: null,
        message: 'Oops there is an Error',
        error: err,
      });
    }
  }
}));
router.route('/paymentInvoice/read/:id').get(catchErrors(async (Model, req, res) => {
  try {
    // Find document by id
    const result = await Model.findOne({ _id: req.params.id, removed: false });
    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found by this id: ' + req.params.id,
      });
    } else {
      // Return success resposne
      return res.status(200).json({
        success: true,
        result,
        message: 'we found this document by this id: ' + req.params.id,
      });
    }
  } catch (err) {
    // Server Error
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));
router.route('/paymentInvoice/update/:id').patch(catchErrors(async (req, res) => {
  try {
    if (req.body.amount === 0) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Minimum Amount couldn't be 0`,
      });
    }
    // Find document by id and updates with the required fields
    const previousPayment = await Model.findOne({
      _id: req.params.id,
      removed: false,
    });

    const { amount: previousAmount } = previousPayment;
    const { id: invoiceId, total, discount, credit: previousCredit } = previousPayment.invoice;

    const { amount: currentAmount } = req.body;

    const changedAmount = currentAmount - previousAmount;
    const maxAmount = total - discount - previousCredit;

    if (changedAmount > maxAmount) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Max Amount you can add is ${maxAmount + previousAmount}`,
        error: `The Max Amount you can add is ${maxAmount + previousAmount}`,
      });
    }

    let paymentStatus =
        total - discount === previousCredit + changedAmount
            ? 'paid'
            : previousCredit + changedAmount > 0
                ? 'partially'
                : 'unpaid';

    const updatedDate = new Date();
    const updates = {
      number: req.body.number,
      date: req.body.date,
      amount: req.body.amount,
      paymentMode: req.body.paymentMode,
      ref: req.body.ref,
      description: req.body.description,
      updated: updatedDate,
    };

    const result = await Model.findOneAndUpdate(
        { _id: req.params.id, removed: false },
        { $set: updates },
        {
          new: true, // return the new result instead of the old one
        }
    ).exec();

    const updateInvoice = await Invoice.findOneAndUpdate(
        { _id: req.body.invoice },
        {
          $inc: { credit: changedAmount },
          $set: {
            paymentStatus: paymentStatus,
          },
        },
        {
          new: true, // return the new result instead of the old one
        }
    ).exec();

    // custom.generatePdf(
    //   "PaymentInvoice",
    //   { filename: "payment-invoice-report", format: "A5" },
    //   result
    // );

    res.status(200).json({
      success: true,
      result,
      message: 'Successfully updated the Payment ',
    });
  } catch (err) {
    console.log(err);
    // If err is thrown by Mongoose due to required validations
    if (err.name == 'ValidationError') {
      res.status(400).json({
        success: false,
        result: null,
        message: 'Required fields are not supplied',
        error: err,
      });
    } else {
      // Server Error
      res.status(500).json({
        success: false,
        result: null,
        message: 'Oops there is an Error',
        error: err,
      });
    }
  }
}));
router.route('/paymentInvoice/delete/:id').delete(catchErrors(async (req, res) => {
  try {
    // Find document by id and updates with the required fields
    const previousPayment = await Model.findOne({
      _id: req.params.id,
      removed: false,
    });

    if (!previousPayment) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found by this id: ' + req.params.id,
      });
    }

    const { _id: paymentInvoiceId, amount: previousAmount } = previousPayment;
    const { id: invoiceId, total, discount, credit: previousCredit } = previousPayment.invoice;

    // Find the document by id and delete it
    let updates = {
      removed: true,
    };
    // Find the document by id and delete it
    const result = await Model.findOneAndUpdate(
        { _id: req.params.id, removed: false },
        { $set: updates },
        {
          new: true, // return the new result instead of the old one
        }
    ).exec();
    // If no results found, return document not found

    let paymentStatus =
        total - discount === previousCredit - previousAmount
            ? 'paid'
            : previousCredit - previousAmount > 0
                ? 'partially'
                : 'unpaid';

    const updateInvoice = await Invoice.findOneAndUpdate(
        { _id: invoiceId },
        {
          $pull: {
            paymentInvoice: paymentInvoiceId,
          },
          $inc: { credit: -previousAmount },
          $set: {
            paymentStatus: paymentStatus,
          },
        },
        {
          new: true, // return the new result instead of the old one
        }
    ).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully Deleted the document by id: ' + req.params.id,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));
router.route('/paymentInvoice/search').get(catchErrors(async (req, res) => {
  const Model = mongoose.model("PaymentInvoice");
  let crudMethods = {};
  // console.log(req.query.fields)
  if (req.query.q === undefined || req.query.q.trim() === '') {
    return res
        .status(202)
        .json({
          success: false,
          result: [],
          message: 'No document found by this request',
        })
        .end();
  }
  const fieldsArray = req.query.fields
      ? req.query.fields.split(',')
      : ['name', 'surname', 'birthday'];

  const fields = { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }
  // console.log(fields)
  try {
    let results = await Model.find(fields).where('removed', false).limit(10);

    if (results.length >= 1) {
      return res.status(200).json({
        success: true,
        result: results,
        message: 'Successfully found all documents',
      });
    } else {
      return res
          .status(202)
          .json({
            success: false,
            result: [],
            message: 'No document found by this request',
          })
          .end();
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));
router.route('/paymentInvoice/list').get(catchErrors(async (req, res) => {

  const Model = mongoose.model("PaymentInvoice");
  let crudMethods = {};
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;
  try {
    //  Query the database for a list of all results
    const resultsPromise = Model.find({ removed: false })
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' })
        .populate();
    // Counting the total documents
    const countPromise = Model.count({ removed: false });
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculating total pages
    const pages = Math.ceil(count / limit);

    // Getting Pagination Object
    const pagination = { page, pages, count };
    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        pagination,
        message: 'Collection is Empty',
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));
router.route('/paymentInvoice/filter').get(catchErrors(async (req, res) => {
  const Model = mongoose.model("PaymentMode");
  let crudMethods = {};
  try {
    if (req.query.filter === undefined || req.query.equal === undefined) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'filter not provided correctly',
      });
    }
    const result = await Model.find({ removed: false })
        .where(req.query.filter)
        .equals(req.query.equal);
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all documents where equal to : ' + req.params.equal,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));
router.route('/paymentInvoice/pdf/:id').get(catchErrors(paymentInvoiceController.generatePDF));

// //____________________________________________ API for Global Setting _________________

router.route('/settingGlobal/create').post(catchErrors(settingGlobalController.create));
router.route('/settingGlobal/read/:id').get(catchErrors(settingGlobalController.read));
router.route('/settingGlobal/update/:id').patch(catchErrors(settingGlobalController.update));
router.route('/settingGlobal/delete/:id').delete(catchErrors(settingGlobalController.delete));
router.route('/settingGlobal/search').get(catchErrors(settingGlobalController.search));
router.route('/settingGlobal/list').get(catchErrors(settingGlobalController.list));
router.route('/settingGlobal/filter').get(catchErrors(settingGlobalController.filter));

// //______________________________________________ API for Commercial Setting _________________

router.route('/settingCommercial/create').post(catchErrors(settingCommercialController.create));
router.route('/settingCommercial/read/:id').get(catchErrors(settingCommercialController.read));
router
  .route('/settingCommercial/update/:id')
  .patch(catchErrors(settingCommercialController.update));
router
  .route('/settingCommercial/delete/:id')
  .delete(catchErrors(settingCommercialController.delete));

router.route('/settingCommercial/search').get(catchErrors(async (req, res) => {
  const Model = mongoose.model("SettingCommercial");
  let crudMethods = {};
  // console.log(req.query.fields)
  if (req.query.q === undefined || req.query.q.trim() === '') {
    return res
        .status(202)
        .json({
          success: false,
          result: [],
          message: 'No document found by this request',
        })
        .end();
  }
  const fieldsArray = req.query.fields
      ? req.query.fields.split(',')
      : ['name', 'surname', 'birthday'];

  const fields = { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }
  // console.log(fields)
  try {
    let results = await Model.find(fields).where('removed', false).limit(10);

    if (results.length >= 1) {
      return res.status(200).json({
        success: true,
        result: results,
        message: 'Successfully found all documents',
      });
    } else {
      return res
          .status(202)
          .json({
            success: false,
            result: [],
            message: 'No document found by this request',
          })
          .end();
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));
router.route('/settingCommercial/list').get(catchErrors(async (req, res) => {
  const Model = mongoose.model("SettingCommercial");
  let crudMethods = {};
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;
  try {
    //  Query the database for a list of all results
    const resultsPromise = Model.find({ removed: false })
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' })
        .populate();
    // Counting the total documents
    const countPromise = Model.count({ removed: false });
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculating total pages
    const pages = Math.ceil(count / limit);

    // Getting Pagination Object
    const pagination = { page, pages, count };
    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        pagination,
        message: 'Collection is Empty',
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));

router.route('/settingCommercial/filter').get(catchErrors(async (req, res) => {
  const Model = mongoose.model("SettingCommercial");
  let crudMethods = {};
  try {
    if (req.query.filter === undefined || req.query.equal === undefined) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'filter not provided correctly',
      });
    }
    const result = await Model.find({ removed: false })
        .where(req.query.filter)
        .equals(req.query.equal);
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all documents where equal to : ' + req.params.equal,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Oops there is an Error',
      error: err,
    });
  }
}));

module.exports = router;
