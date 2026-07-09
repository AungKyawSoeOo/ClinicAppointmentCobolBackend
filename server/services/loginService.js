const koffi = require("koffi");
const path = require("path");

// kps::Check if the platform is Windows 
const isWindows = process.platform === "win32";

// kps:: Set the appropriate file extension for the shared library based on the platform
const ext = isWindows ? ".dll" : ".so";

// const userRegisterLibPath = path.join(__dirname, "..", "..", "bin", "user-register.dll");

// For botn windows and linux
const userLoginLibPath = path.join(__dirname, "..", "..", "bin", `login${ext}`);

try {
    let libcob;

    if(isWindows){

        // Initialize the COBOL runtime
        const libsFolder = path.join(__dirname, "..", "libs");
        const libcobPath = path.join(libsFolder, "libcob-4.dll");

        const originalDirectory = process.cwd();
        try {
            process.chdir(libsFolder);
            libcob = koffi.load(libcobPath);
            const initCobol = libcob.func("cob_init", "void", ["int", "void*"]);
            initCobol(0, null);

        } finally {
            process.chdir(originalDirectory);
        }
    }else{
        libcob = koffi.load("libcob.so");
    }

    const initCobol = libcob.func("cob_init", "void", ["int", "void*"]);
    initCobol(0, null);
    console.log("COBOL runtime initialized successfully.");

}catch (error) {
    console.error("Error loading the user-register library:", error);
    throw error;
}

const userLoginLib = koffi.load(userLoginLibPath);

const userLoginFunc = userLoginLib.func("void LOGIN(char *email, char *password, int32* res)");

async function userLogin(email, password) {
    let emailBuf = Buffer.alloc(50);
    emailBuf.write(email, 'utf8');

    let passBuf = Buffer.alloc(50);
    passBuf.write(password, 'utf8');

    // Buffer for the result (L-RESULT)
    let resBuf = Buffer.alloc(4);

    // Call the function
    userLoginFunc(emailBuf, passBuf, resBuf);

    /// Convert 1 to true, 0 to false
    const result = resBuf.readInt32LE();
    return result === 1;
}

module.exports = { userLogin };