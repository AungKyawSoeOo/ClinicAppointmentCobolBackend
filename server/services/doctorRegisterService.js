const koffi = require("koffi");
const path = require("path");

// kps::Check if the platform is Windows 
const isWindows = process.platform === "win32";

// kps:: Set the appropriate file extension for the shared library based on the platform
const ext = isWindows ? ".dll" : ".so";

// For both windows and linux
const doctorRegisterLibPath = path.join(__dirname, "..", "..", "bin", `doctor-register${ext}`);

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
            // Notice: we only need to init once, but if running independently, this is required
            const initCobol = libcob.func("cob_init", "void", ["int", "void*"]);
            initCobol(0, null);

        } finally {
            process.chdir(originalDirectory);
        }
    } else {
        libcob = koffi.load("libcob.so");
    }

    const initCobol = libcob.func("cob_init", "void", ["int", "void*"]);
    initCobol(0, null);
    console.log("COBOL runtime initialized successfully.");

} catch (error) {
    console.error("Error loading the doctor-register library:", error);
    throw error;
}

const doctorRegisterLib = koffi.load(doctorRegisterLibPath);

// Define the C-style function signature for the COBOL program
const doctorRegisterFunc = doctorRegisterLib.func(
    "void DOCTOR_REGISTER(char *clinicId, char *doctorName, char *licenseNo, char *specialization, char *experience, char *phone, char *consultDuration, char *workingDays, char *startTime, char *endTime, int32* res)"
);

/**
 * Registers a doctor by calling the COBOL shared library
 * @param {number|string} clinicId 
 * @param {string} doctorName 
 * @param {string} licenseNo 
 * @param {string} specialization 
 * @param {string} experience 
 * @param {string} phone 
 * @param {number|string} consultDuration 
 * @param {number[]} workingDays - Array of days, e.g., [1, 2, 3, 4, 5]
 * @param {string} startTime - Format "HH:MM:SS"
 * @param {string} endTime - Format "HH:MM:SS"
 */
async function doctorRegister(clinicId, doctorName, licenseNo, specialization, experience, phone, consultDuration, workingDays, startTime, endTime) {
    
    // Allocate buffers matching COBOL PIC lengths. 
    // Buffer.alloc automatically fills with null bytes (LOW-VALUES), which our COBOL script handles safely.

    let clinicBuf = Buffer.alloc(5); // PIC 9(05)
    clinicBuf.write(String(clinicId).padStart(5, '0'), 'utf8');

    let nameBuf = Buffer.alloc(100); // PIC X(100)
    nameBuf.write(doctorName || "", 'utf8');

    let licenseBuf = Buffer.alloc(100); // PIC X(100)
    licenseBuf.write(licenseNo || "", 'utf8');

    let specBuf = Buffer.alloc(100); // PIC X(100)
    specBuf.write(specialization || "", 'utf8');

    let expBuf = Buffer.alloc(5); // PIC X(05)
    expBuf.write(String(experience || ""), 'utf8');

    let phoneBuf = Buffer.alloc(20); // PIC X(20)
    phoneBuf.write(phone || "", 'utf8');

    let durationBuf = Buffer.alloc(3); // PIC 9(03)
    durationBuf.write(String(consultDuration).padStart(3, '0'), 'utf8');

    // Convert array like [1, 2, 3] to a 7-character string like "1230000" for PIC 9(01) OCCURS 7
    let daysString = (workingDays || []).join('').padEnd(7, '0').substring(0, 7);
    let daysBuf = Buffer.alloc(7);
    daysBuf.write(daysString, 'utf8');

    let startBuf = Buffer.alloc(8); // PIC X(08)
    startBuf.write(startTime || "", 'utf8');

    let endBuf = Buffer.alloc(8); // PIC X(08)
    endBuf.write(endTime || "", 'utf8');

    // Buffer for the result (L-RESULT PIC S9(9) COMP-5 is a 32-bit int)
    let resBuf = Buffer.alloc(4);

    // Call the function
    doctorRegisterFunc(
        clinicBuf, 
        nameBuf, 
        licenseBuf, 
        specBuf, 
        expBuf, 
        phoneBuf, 
        durationBuf, 
        daysBuf, 
        startBuf, 
        endBuf, 
        resBuf
    );

    // Convert 1 to true, 0 to false
    const result = resBuf.readInt32LE();
    return result === 1;
}

module.exports = { doctorRegister };