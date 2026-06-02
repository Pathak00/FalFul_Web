USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_PasswordResetOtp_IncrementAttempt
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE PasswordResetOtps
    SET AttemptCount = AttemptCount + 1
    WHERE Id = @Id;
END
GO
