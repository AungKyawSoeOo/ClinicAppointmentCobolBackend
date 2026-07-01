const koffi = require("koffi");
const path = require("path");

const userRegisterLibPath = path.join(__dirname, "..", "..", "bin", "user-register.dll");

// Initialize the COBOL runtime
const libsFolder = path.join(__dirname, "..", "libs");
const libcobPath = path.join(libsFolder, "libcob-4.dll");

const originalDirectory = process.cwd();
try {
    process.chdir(libsFolder);
    const libcob = koffi.load(libcobPath);
    const initCobol = libcob.func("cob_init", "void", ["int", "void*"]);
    initCobol(0, null);

} finally {
    process.chdir(originalDirectory);
}

const userRegisterLib = koffi.load(userRegisterLibPath);

const userRegisterFunc = userRegisterLib.func("void USER_REGISTER(char *username, char *email, char *password, int32* res)");

async function userRegister(username, email, password) {
    // Allocate buffers matching COBOL PIC X(50) lengths
    let userBuf = Buffer.alloc(50);
    userBuf.write(username, 'utf8');

    let emailBuf = Buffer.alloc(50);
    emailBuf.write(email, 'utf8');

    let passBuf = Buffer.alloc(50);
    passBuf.write(password, 'utf8');

    // Buffer for the result (L-RESULT)
    let resBuf = Buffer.alloc(4);

    // Call the function
    userRegisterFunc(userBuf, emailBuf, passBuf, resBuf);

    /// Convert 1 to true, 0 to false
    const result = resBuf.readInt32LE();
    return result === 1;
}

module.exports = { userRegister };