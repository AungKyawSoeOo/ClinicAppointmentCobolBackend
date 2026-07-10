       IDENTIFICATION DIVISION.
       PROGRAM-ID. DOCTOR_REGISTER.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-IDX           PIC 9(02).
       01 WS-VALID-DAYS    PIC 9(02).

       LINKAGE SECTION.
       *> doctor_id is omitted as it is a SERIAL auto-incrementing key
       01 L-CLINIC-ID          PIC 9(05).
       01 L-DOCTOR-NAME        PIC X(100).
       01 L-LICENSE-NO         PIC X(100).
       01 L-SPECIALIZATION     PIC X(100).
       01 L-EXPERIENCE         PIC X(05).
       01 L-PHONE              PIC X(20).
       01 L-CONSULT-DURATION   PIC 9(03).
       *> Mapping PostgreSQL INT[] to COBOL table
       01 L-WORKING-DAYS.
          05 L-DAY             PIC 9(01) OCCURS 7 TIMES.
       01 L-START-TIME         PIC X(08).
       01 L-END-TIME           PIC X(08).
       01 L-RESULT             PIC S9(9) COMP-5.

       PROCEDURE DIVISION USING L-CLINIC-ID L-DOCTOR-NAME L-LICENSE-NO 
                                L-SPECIALIZATION L-EXPERIENCE L-PHONE 
                                L-CONSULT-DURATION L-WORKING-DAYS 
                                L-START-TIME L-END-TIME L-RESULT.

       MAIN-LOGIC.
           *> Default to VALID (1)
           MOVE 1 TO L-RESULT.

           *> 1. Clinic ID (Foreign Key)
           IF L-CLINIC-ID <= 0 THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 2. Doctor Name
           IF L-DOCTOR-NAME = SPACES OR L-DOCTOR-NAME = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 3. Medical License Number
           IF L-LICENSE-NO = SPACES OR L-LICENSE-NO = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 4. Specialization
           IF L-SPECIALIZATION = SPACES OR LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 5. Experience
           IF L-EXPERIENCE = SPACES OR LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 6. Phone Number
           IF L-PHONE = SPACES OR L-PHONE = LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 7. Consultation Duration
           IF L-CONSULT-DURATION <= 0 THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 8. Working Days (Check that at least 1 valid day exists)
           MOVE 0 TO WS-VALID-DAYS
           PERFORM VARYING WS-IDX FROM 1 BY 1 UNTIL WS-IDX > 7
               IF L-DAY(WS-IDX) >= 1 AND L-DAY(WS-IDX) <= 7 THEN
                   ADD 1 TO WS-VALID-DAYS
               END-IF
           END-PERFORM
           
           IF WS-VALID-DAYS = 0 THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 9. Start Time (e.g., '09:00:00')
           IF L-START-TIME = SPACES OR LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           *> 10. End Time (e.g., '17:00:00')
           IF L-END-TIME = SPACES OR LOW-VALUES THEN
               MOVE 0 TO L-RESULT
           END-IF.

           GOBACK.

       END PROGRAM DOCTOR_REGISTER.