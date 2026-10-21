IF DB_ID(N'ProjetoMobile') IS NULL
BEGIN
    CREATE DATABASE [ProjetoMobile];
END;
GO

USE [ProjetoMobile];
GO

IF OBJECT_ID(N'dbo.ShoppingItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ShoppingItems (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        family_id INT NULL,
        name NVARCHAR(120) NOT NULL,
        completed BIT NOT NULL CONSTRAINT DF_ShoppingItems_completed DEFAULT (0)
    );
END;
GO

IF COL_LENGTH(N'dbo.ShoppingItems', N'family_id') IS NULL
BEGIN
    ALTER TABLE dbo.ShoppingItems ADD family_id INT NULL;
END;
GO

IF OBJECT_ID(N'dbo.Families', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Families (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        name NVARCHAR(80) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_Families_created_at DEFAULT (SYSUTCDATETIME())
    );
END;
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        family_id INT NOT NULL,
        name NVARCHAR(80) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        password_hash NVARCHAR(256) NOT NULL,
        role NVARCHAR(10) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_Users_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_Users_email UNIQUE (email),
        CONSTRAINT FK_Users_Families FOREIGN KEY (family_id) REFERENCES dbo.Families(id),
        CONSTRAINT CK_Users_role CHECK (role IN (N'owner', N'member'))
    );
END;
GO

IF OBJECT_ID(N'dbo.FamilyInvitations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FamilyInvitations (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        family_id INT NOT NULL,
        code_hash NVARCHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_FamilyInvitations_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_FamilyInvitations_Families FOREIGN KEY (family_id) REFERENCES dbo.Families(id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_ShoppingItems_Families'
      AND parent_object_id = OBJECT_ID(N'dbo.ShoppingItems')
)
BEGIN
    ALTER TABLE dbo.ShoppingItems
    ADD CONSTRAINT FK_ShoppingItems_Families
        FOREIGN KEY (family_id) REFERENCES dbo.Families(id);
END;
GO
