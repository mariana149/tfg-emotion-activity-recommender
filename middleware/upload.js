const multer = require('multer');
const path   = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename:    (req, file, cb) => {
        const ext      = path.extname(file.originalname).toLowerCase();
        const filename = `user_${req.session.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext     = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB máximo
});

module.exports = upload;