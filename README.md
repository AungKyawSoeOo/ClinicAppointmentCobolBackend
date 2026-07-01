## PROJECT SETUP
1. Initialize Node.js project ** (if not already initialized , no need for now) **
> npm init -y

2. Install required dependencies
> npm i

3.Compile COBOL program into executable sample
Note : (now no need to compile since , I don't add in gitignore but later this will add in gitignore)
> cobc -m cobol/add.cbl -o bin/add.dll

4. RUN APPLICATION
Start Node.js server:
> node server/app.js

5. RUN APPLICATION (Auto loading)
> npx nodemon server/app.js