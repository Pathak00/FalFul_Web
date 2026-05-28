SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_User_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.FullName, u.Email, u.PhoneNumber,
           CASE u.UserType WHEN 1 THEN 'Individual' WHEN 2 THEN 'Organization' WHEN 3 THEN 'Admin' ELSE 'Individual' END AS UserType,
           r.Name AS RoleName,
           u.IsActive, u.CreatedAt, u.LastLoginAt
    FROM   Users u
    LEFT  JOIN UserRoles ur ON ur.UserId = u.Id
    LEFT  JOIN Roles     r  ON r.Id      = ur.RoleId
    WHERE  u.IsDeleted = 0
    ORDER  BY u.CreatedAt DESC;
END
GO
