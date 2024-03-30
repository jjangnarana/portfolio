const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const { promisify } = require('util');
const { zip } = require('zip-a-folder');
const path = require('path');
const zipfile = promisify(zip);
const directoryPath = path.join(__dirname, 'converted');
const upload = multer({ dest: 'uploads/' });
const app = express();
const port = 3002;
const session = require('express-session');
const cors = require('cors');

if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(
  session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
    },
  })
);

app.post('/convert', upload.array('files'), async (request, response) => {
  const files = request.files;

  try {
    await Promise.all(
      files.map(async (file) => {
        const outputPath = `converted/${file.originalname.split('.')[0]}.jpg`;
        await sharp(file.path).jpeg().toFile(outputPath);
      })
    );

    await zipfile('converted', 'converted/convertedFiles.zip');
    response.download(
      'converted/convertedFiles.zip',
      'convertedFiles.zip',
      (err) => {
        if (err) {
          console.error(err);
          response.status(500).send('Error downloading file.');
        }

        files.forEach((file) => fs.unlinkSync(file.path));
        fs.unlinkSync('converted/convertedFiles.zip');
      }
    );
  } catch (error) {
    console.error('Error converting files: ', error);
    response.status(500).send('Error converting files.');
  }
});

app.post('/auth/google/token', async (request, response) => {
  const { access_token } = request.body;
  try {
    console.log(access_token);
    response.json({ message: 'Authentication successful' });
  } catch (error) {
    console.log('Authentication error : ', error);
    response.status(500).json({ message: 'Authentication failed' });
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

/*
./server/server.js test = ./server/Router/test.js
app.use()
./server/Router/test.js
*/
