SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_User_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.FullName, u.Email, u.PhoneNumber,
           CASE u.UserType WHEN 1 THEN 'Individual' WHEN 2 THEN 'Organization' WHEN 3 THEN 'Admin' ELSE 'Individual' END AS UserType,
           r.Name AS RoleName,
           u.IsActive, u.CreatedAt, u.LastLoginAt,
           -- Portal the user lands on after login (mirrors frontend HomeRouteService logic):
           --   'admin'    = has at least one permission that is not 'deliveries' or 'shop'
           --   'rider'    = has permissions and ALL are 'deliveries' (pure rider)
           --   'customer' = has only 'shop' permission, or no permissions at all
           CASE
               WHEN EXISTS (
                   SELECT 1 FROM RolePermissions rp
                   JOIN Permissions p ON p.Id = rp.PermissionId
                   WHERE rp.RoleId = ur.RoleId AND p.Name NOT IN ('deliveries', 'shop')
                   UNION ALL
                   SELECT 1 FROM UserPermissions up
                   JOIN Permissions p ON p.Id = up.PermissionId
                   WHERE up.UserId = u.Id AND up.Granted = 1 AND p.Name NOT IN ('deliveries', 'shop')
               ) THEN 'admin'
               WHEN EXISTS (
                   SELECT 1 FROM RolePermissions rp
                   JOIN Permissions p ON p.Id = rp.PermissionId
                   WHERE rp.RoleId = ur.RoleId AND p.Name = 'deliveries'
                   UNION ALL
                   SELECT 1 FROM UserPermissions up
                   JOIN Permissions p ON p.Id = up.PermissionId
                   WHERE up.UserId = u.Id AND up.Granted = 1 AND p.Name = 'deliveries'
               ) THEN 'rider'
               ELSE 'customer'
           END AS PortalType
    FROM   Users u
    LEFT  JOIN UserRoles ur ON ur.UserId = u.Id
    LEFT  JOIN Roles     r  ON r.Id      = ur.RoleId
    WHERE  u.IsDeleted = 0
    ORDER  BY u.CreatedAt DESC;
END
GO
