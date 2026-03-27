import handler from "./auth-worker.js";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    const request = new Request(`http://localhost:${PORT}${req.url}`, {
        method: req.method,
        headers: Object.fromEntries(Object.entries(req.headers)),
    });

    const response = await handler(request);

    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
});

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});