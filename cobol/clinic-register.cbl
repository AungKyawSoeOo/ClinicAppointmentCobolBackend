       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLINIC_REGISTER.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-IDX          PIC 9(02).
       01 WS-AT-POS       PIC 9(02).
       01 WS-DOT-POS      PIC 9(02).

       LINKAGE SECTION.
       01 L-CLINIC-NAME   PIC X(50).
       01 L-EMAIL         PIC X(50).
       01 L-PASSWORD      PIC X(50).
       01 L-LICENSE       PIC X(50).
       01 L-PHONE         PIC X(50).
       01 L-RESULT        PIC S9(9) COMP-5.

       PROCEDURE DIVISION USING L-CLINIC-NAME L-EMAIL L-PASSWORD
                                L-LICENSE L-PHONE L-RESULT.

       MAIN-LOGIC.
           *> Default to VALID (1)
           MOVE 1 TO L-RESULT.

           *> Check for empty OR null-padded clinic name
           IF L-CLINIC-NAME = SPACES OR L-CLINIC-NAME = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> Check for empty license
           IF L-LICENSE = SPACES OR L-LICENSE = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> Check for empty phone
           IF L-PHONE = SPACES OR L-PHONE = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           IF L-RESULT = 1 THEN
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
               IF WS-AT-POS = 0 OR WS-DOT-POS = 0 OR
                  WS-AT-POS > WS-DOT-POS
                   MOVE 0 TO L-RESULT
               END-IF
           END-IF.

           GOBACK.

       END PROGRAM CLINIC_REGISTER.
