       IDENTIFICATION DIVISION.
       PROGRAM-ID. USER_REGISTER.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-IDX          PIC 9(02).
       01 WS-AT-POS       PIC 9(02).
       01 WS-DOT-POS      PIC 9(02).

       LINKAGE SECTION.
       01 L-USERNAME      PIC X(50).
       01 L-EMAIL         PIC X(50).
       01 L-PASSWORD      PIC X(50).
       01 L-RESULT        PIC S9(9) COMP-5.

       PROCEDURE DIVISION USING L-USERNAME L-EMAIL L-PASSWORD L-RESULT.

       MAIN-LOGIC.
           *> Default to VALID (1)
           MOVE 1 TO L-RESULT.

           *> Check for empty OR null-padded username
           IF L-USERNAME = SPACES OR L-USERNAME = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           ELSE
               *> Perform robust email format check
               MOVE 0 TO WS-AT-POS
               MOVE 0 TO WS-DOT-POS

               PERFORM VARYING WS-IDX FROM 1 BY 1 UNTIL WS-IDX > 50
                   IF L-EMAIL(WS-IDX:1) = "@"
                       MOVE WS-IDX TO WS-AT-POS
                   END-IF
                   IF L-EMAIL(WS-IDX:1) = "."
                       MOVE WS-IDX TO WS-DOT-POS
                   END-IF
               END-PERFORM

               *> Must have '@', '.', and '@' must be before '.'
               IF WS-AT-POS = 0 OR WS-DOT-POS = 0 OR WS-AT-POS >
                WS-DOT-POS
                   MOVE 0 TO L-RESULT
               END-IF
           END-IF.

           GOBACK.

       END PROGRAM USER_REGISTER.