-- Run this script as SA or a sysadmin user
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FalFulDb')
BEGIN
    CREATE DATABASE FalFulDb;
    PRINT 'FalFulDb database created.';
END
ELSE
    PRINT 'FalFulDb already exists.';
GO

USE FalFulDb;
GO
