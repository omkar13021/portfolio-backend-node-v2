function logsHandler() {
    return (req, _, next) => {
        console.log(`Requested API: ${req.method} ${req.originalUrl}`);
        next();
    };
}

export default logsHandler;