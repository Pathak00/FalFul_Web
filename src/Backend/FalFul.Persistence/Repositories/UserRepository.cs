using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly DapperContext _context;

    public UserRepository(DapperContext context) => _context = context;

    public async Task<User?> GetByIdAsync(int id)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "sp_User_GetById",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "sp_User_GetByEmail",
            new { Email = email },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<User?> GetByPhoneAsync(string phone)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "sp_User_GetByPhone",
            new { PhoneNumber = phone },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<User?> GetByGoogleIdAsync(string googleId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "sp_User_GetByGoogleId",
            new { GoogleId = googleId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(User user)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_User_Register",
            new
            {
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.PasswordHash,
                UserType = (int)user.UserType
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(User user)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_User_Update",
            new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.ProfileImageUrl,
                user.IsActive,
                user.UpdatedBy
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        using var conn = _context.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(
            "sp_User_ExistsByEmail",
            new { Email = email },
            commandType: System.Data.CommandType.StoredProcedure);
        return count > 0;
    }

    public async Task<bool> ExistsByPhoneAsync(string phone)
    {
        using var conn = _context.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(
            "sp_User_ExistsByPhone",
            new { PhoneNumber = phone },
            commandType: System.Data.CommandType.StoredProcedure);
        return count > 0;
    }

    public async Task<int> GetOrCreateByGoogleAsync(string googleId, string email, string fullName, string? profileImageUrl)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_User_UpsertByGoogle",
            new { GoogleId = googleId, Email = email, FullName = fullName, ProfileImageUrl = profileImageUrl },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<User>(
            "sp_User_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SetActiveAsync(int userId, bool isActive, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Admin_SetUserActive",
            new { UserId = userId, IsActive = isActive, UpdatedBy = updatedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SetUserTypeAsync(int userId, int userType, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Admin_SetUserType",
            new { UserId = userId, UserType = userType, UpdatedBy = updatedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task ResetPasswordAsync(int userId, string passwordHash, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Admin_ResetPassword",
            new { UserId = userId, PasswordHash = passwordHash, UpdatedBy = updatedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdatePasswordAsync(int userId, string passwordHash)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_User_UpdatePassword",
            new { UserId = userId, PasswordHash = passwordHash },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SoftDeleteAsync(int userId, int? deletedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_User_SoftDelete",
            new { UserId = userId, DeletedBy = deletedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
