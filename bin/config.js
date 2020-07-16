let config = {
    directory: {
        option: "-d, --directory <val>",
        description: "please set your server directory",
        usage: "wen-server --directory C://public",
        default: process.cwd()
    },
    port: {
        option: "-p, --port <val>",
        description: "please set your server port",
        usage: "wen-server --port 3000",
        default: 3000
    },
    host: {
        option: "-s, --host <val>",
        description: "please set your server host",
        usage: "wen-server --host 127.0.0.1",
        default: "localhost"
    }
}

module.exports = config;