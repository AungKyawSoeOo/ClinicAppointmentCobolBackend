       IDENTIFICATION DIVISION.
       PROGRAM-ID. DOCTOR_REGISTER.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
       LINKAGE SECTION.
       01 L-DOCTOR-NAME    PIC X(100).
       01 L-LICENSE-NO     PIC X(100).
       01 L-CONSULT-DUR    PIC 9(04).
       01 L-START-TIME     PIC X(08).
       01 L-END-TIME       PIC X(08).
       01 L-RESULT         PIC S9(9) COMP-5.

       PROCEDURE DIVISION USING L-DOCTOR-NAME L-LICENSE-NO 
                               L-CONSULT-DUR L-START-TIME 
                               L-END-TIME L-RESULT.

       MAIN-LOGIC.
           *> Default to VALID (1)
           MOVE 1 TO L-RESULT.

           *> Check for empty or null-padded fields
           IF L-DOCTOR-NAME = SPACES OR L-DOCTOR-NAME = LOW-VALUES OR
              L-LICENSE-NO = SPACES OR L-LICENSE-NO = LOW-VALUES OR
              L-CONSULT-DUR = 0 OR
              L-START-TIME = SPACES OR L-START-TIME = LOW-VALUES OR
              L-END-TIME = SPACES OR L-END-TIME = LOW-VALUES THEN
                MOVE 0 TO L-RESULT
           END-IF.

           GOBACK.

       END PROGRAM DOCTOR_REGISTER.