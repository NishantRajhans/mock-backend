const express = require("express");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = 3000;
app.use(bodyParser.json());

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint for uploading PDF files
app.post("/upload-pdf", upload.single("pdf"), (req, res) => {
  const file = req.body;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const pdfPath = `./uploads/${req.file.filename}`;
  // Check if PDF file exists
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: "PDF file not found" });
  }

  // Dynamically import pdfreader module
  import("pdfreader")
    .then((pdfreader) => {
      // Read PDF file
      const rows = [];
      new pdfreader.PdfReader().parseFileItems(pdfPath, (err, item) => {
        if (err) {
          return res.status(500).json({ error: "Error reading PDF file" });
        }
        if (!item) {
          // End of file
          let pdfText = '';
          rows.forEach(row => {
              pdfText += row.join('') + '\n';
          });
          res.send(pdfText);
      } else if (item.text) {
          // Accumulate text content
          const row = item.text.split(/\r?\n/);
          rows.push(row);
      }
      });
    })
    .catch((error) => {
      console.error("Error importing pdfreader:", error);
      return res
        .status(500)
        .json({ error: "Error importing pdfreader module" });
    });
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
