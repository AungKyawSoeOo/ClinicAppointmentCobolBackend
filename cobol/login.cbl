       IDENTIFICATION DIVISION.
       PROGRAM-ID. LOGIN.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       LINKAGE SECTION.
       01 L-EMAIL         PIC X(50).
       01 L-PASSWORD      PIC X(50).
       01 L-RESULT        PIC S9(9) COMP-5.

       PROCEDURE DIVISION USING  L-EMAIL L-PASSWORD L-RESULT.

       MAIN-LOGIC.
           *> Default to VALID (1)
           MOVE 1 TO L-RESULT.

           *> Check for empty OR null-padded
           IF L-EMAIL = SPACES OR L-EMAIL = LOW-VALUES OR
              L-PASSWORD = SPACES OR L-PASSWORD = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           GOBACK.

       END PROGRAM LOGIN.
