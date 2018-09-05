import sourceMapSupport from "source-map-support";
import express from "express";
import proxy from "express-http-proxy";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import AppContainer from "../universal/react-components/container/AppContainer";
import { StaticRouter as Router } from "react-router-dom";

sourceMapSupport.install();

const server = express();

const staticPath = path.resolve(__dirname); // Webpack will store the bundled server.js
                                            // file into dist, where the other static stuff ends up, too
console.info("Will serve static files from " + staticPath);
server.use(express.static(staticPath));

console.info("Will proxy requests to /api to http://127.0.0.1:8001/api");
server.use(
    "/api",
    proxy(
        "127.0.0.1:8001",
        {
            // The (mock) API server expects requests at /api/...
            proxyReqPathResolver: (req) => {
                const resolvedPath = "/api" + require("url").parse(req.url).path;
                console.info("Proxying to " + resolvedPath);
                return "http://127.0.0.1:8001" + resolvedPath;
            }
        }
    )
);

server.get("/*", (req, res) => {
    const context = {};
    const jsx = (
        <Router context={context} location={req.url}>
            <AppContainer />
        </Router>
    );
    const reactDom = renderToString(jsx);

    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(htmlTemplate(reactDom));
});

console.info("SSR server listening on http://127.0.0.1:8000");
server.listen(8000);

const htmlTemplate = (reactDom) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Playground SSR</title>
        </head>
        
        <body>
            <div id="app">${ reactDom }</div>
            <script src="./client.js"></script>
        </body>
        </html>
    `;
};
