require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Multer config
const upload = multer({ dest: 'upload/' });
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No image provided" });

        const imageData = await fs.readFile(req.file.path, { encoding: 'base64' });
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            "Analyze this plant's health. Provide species name and health status in plain text.",
            { inlineData: { mimeType: req.file.mimetype, data: imageData } }
        ]);

        const response = await result.response;
        const text = response.text();

        await fs.unlink(req.file.path); // Delete temp file
        res.json({ results: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "AI Analysis failed" });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));