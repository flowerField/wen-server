/* 1、导入模块 */
const url = require("url");
const http = require("http");
const path = require("path");
const fs = require("fs").promises;
const { createReadStream, createWriteStream, readFileSync } = require('fs');

const chalk = require("chalk");
const ejs = require("ejs");
const mime = require("mime");

/* 2、实现Server类 */
class Server {
    constructor(config) {
        this.pathname = null;
        this.port = config.port;
        this.host = config.host;
        this.directory = config.directory;
        this.httpRequestHandler = this.httpRequestHandler.bind(this); /* 绑定this */
        this.template = readFileSync(path.resolve(__dirname, "./template.ejs"), "utf-8");
        console.log("this.template", this.template);
    }
    start() {
        const httpServer = http.createServer(this.httpRequestHandler);
        httpServer.listen(this.port, this.host, () => {
            console.log(chalk.red("  -----------------"));
            console.log(chalk.yellow(`  启动 http-server 服务\r\n  目录 ${this.directory}\r\n`));
            console.log(chalk.green(`  访问 http://${this.host}:${this.port}`));
        })
    }
    async httpRequestHandler(req, res) {
        /* 实现策略：先检查当前路径是否存在，存在 | 不存在 */
        let { pathname } = url.parse(req.url);
        this.pathname = decodeURIComponent(pathname);

        /* 获取http请求的
        完整文件路径 */
        let filePath = path.join(this.directory, this.pathname);
        console.log("filePath", filePath, this.directory);
        try {
            /* 检查文件是否存在 */
            let statusFile = await fs.stat(filePath);
            if (statusFile.isFile()) {
                this.sendFileResponse(req, res, filePath);
            } else {
                /* 文件不存在先自动拼接index.html后缀继续查找 */
                // let fullFilePath = path.join(filePath, "index.html");
                /* 如果拼接好的文件不存在，那么会直接抛出异常 */
                // statusFile = await fs.stat(fullFilePath);
                // console.log("000");
                // if (statusFile.isFile()) {
                //     console.log("1");
                //     /* 01-如果存在该页面那么就直接返回 */
                //     this.sendFileResponse(req, res, fullFilePath);
                // } else {
                //     console.log("2");
                //     /* 02-如果不存在那么就展示根目录列表页面 */
                //     this.sendRootListResponse(req, res, filePath);
                // }
                try {
                    /* 01-如果存在该页面那么就直接返回 */
                    let fullFilePath = path.join(filePath, "index.html");
                    statusFile = await fs.stat(fullFilePath);
                    this.sendFileResponse(req, res, fullFilePath);
                } catch (e) {
                    /* 02-如果不存在那么就展示根目录列表页面 */
                    this.sendRootListResponse(req, res, filePath);
                }
            }
        } catch (e) {
            this.sendErrorMessage(req, res, e);
        }
    }
    gzip(req, res, filePath) {
        /* 检查当前浏览器环境是否支持gzip格式压缩 */
        if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
            res.setHeader('Content-Encoding', 'gzip') /* 设置响应头：告诉浏览器使用了gzip压缩 */
            return require('zlib').createGzip(); /* 创建压缩转换流 */
        } else {
            return false;
        }
    }
    sendFileResponse(req, res, filePath) {
        let gzip = this.gzip();
        res.setHeader("Content-Type", mime.getType(filePath) + ";charset=utf-8");
        if (gzip) {
            createReadStream(filePath).pipe(gzip).pipe(res); /* 先压缩然后再交给响应对象 */
        } else {
            createReadStream(filePath).pipe(res);
        }
    }
    sendErrorMessage(req, res, e) {
        console.log("错误信息:", e);
        res.statusCode = 404;
        res.end("not found");
    }
    async sendRootListResponse(req, res, filePath) {

        /* 先通过ejs和template文件来渲染html页面，然后把该页面返回 */
        try {
            let dirs = await fs.readdir(filePath);
            // console.log("dirs", dirs);
            dirs = dirs.map(ele => ({ "dir": ele, "href": path.join(this.pathname, ele) }));
            // console.log("dirs", dirs);

            /* 渲染最终的文件 */
            let templateHtml = await ejs.render(this.template, { dirs }, { async: true });
            console.log("templateHtml", templateHtml);
            res.setHeader("Content-Type", "text/html;charset=utf-8");
            console.log("templateHtml", typeof templateHtml, templateHtml);
            res.end(templateHtml);

        } catch (e) {
            this.sendErrorMessage(req, res, e);
        }
    }
}

/* 3、导出Class */
module.exports = Server;