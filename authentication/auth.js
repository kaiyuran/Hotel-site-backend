const sdk = require("node-appwrite");

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        const jwt = authHeader.split(" ")[1];

        const client = new sdk.Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setJWT(jwt);

        const account = new sdk.Account(client);

        const user = await account.get();

        req.user = user;

        next();

    } catch (error) {
        console.error("Authentication error:", error);

        return res.status(401).json({
            error: "Invalid or expired authentication token"
        });
    }
};

module.exports = authenticate;