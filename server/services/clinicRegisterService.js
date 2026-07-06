const koffi = require("koffi");
const path = require("path");

const clinicRegisterLibPath = path.join(__dirname, "..", "..", "bin", "clinic-register.dll");

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
