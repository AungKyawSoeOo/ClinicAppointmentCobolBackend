const koffi = require("koffi");
const path = require("path");

// kps::Check if the platform is Windows 
const isWindows = process.platform === "win32";

// kps:: Set the appropriate file extension for the shared library based on the platform
const ext = isWindows ? ".dll" : ".so";

// for windows
// const clinicRegisterLibPath = path.join(__dirname, "..", "..", "bin", "clinic-register.dll");

// For both windows and linux
const clinicRegisterLibPath = path.join(__dirname, "..", "..", "bin", `clinic-register${ext}`);

try{
    let libcob;

    if(isWindows){
        // Initialize the COBOL runtime
        const libsFolder = path.join(__dirname, "..", "libs");
        const libcobPath = path.join(libsFolder, "libcob-4.dll");

        const originalDirectory = process.cwd();
        try {
            process.chdir(libsFolder);
            const libcob = koffi.load(libcobPath);
            const initCobol = libcob.func("cob_init", "void", ["int", "void*"]);
            initCobol(0, null);

        } catch (e) {
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
    console.error("Error loading the clinic-register library:", error);
    throw error;
}

const clinicRegisterLib = koffi.load(clinicRegisterLibPath);

// The signature matches the COBOL LINKAGE SECTION
// L-CLINIC-NAME, L-EMAIL, L-PASSWORD, L-LICENSE, L-PHONE, L-RESULT
const clinicRegisterFunc = clinicRegisterLib.func(
    "void CLINIC_REGISTER(char *clinic_name, char *email, char *password, char *license, char *phone, int32* res)"
);

async function clinicRegister(clinic_name, email, password, license, phone) {
    let nameBuf = Buffer.alloc(50);
    nameBuf.write(clinic_name || '', 'utf8');

    let emailBuf = Buffer.alloc(50);
    emailBuf.write(email || '', 'utf8');

    let passBuf = Buffer.alloc(50);
    passBuf.write(password || '', 'utf8');

    let licenseBuf = Buffer.alloc(50);
    licenseBuf.write(license || '', 'utf8');

    let phoneBuf = Buffer.alloc(50);
    phoneBuf.write(phone || '', 'utf8');

    let resBuf = Buffer.alloc(4);


    clinicRegisterFunc(nameBuf, emailBuf, passBuf, licenseBuf, phoneBuf, resBuf);

    // Convert 1 to true, 0 to false
    const result = resBuf.readInt32LE();
    return result === 1;
}

module.exports = { clinicRegister };
