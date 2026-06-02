using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByPhoneAsync(string phone);
    Task<User?> GetByGoogleIdAsync(string googleId);
    Task<int> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByPhoneAsync(string phone);
    Task<int> GetOrCreateByGoogleAsync(string googleId, string email, string fullName, string? profileImageUrl);

    /* Password reset (self-service) */
    Task UpdatePasswordAsync(int userId, string passwordHash);

    /* Admin operations */
    Task<IEnumerable<User>> GetAllAsync();
    Task SetActiveAsync(int userId, bool isActive, int? updatedBy);
    Task SetUserTypeAsync(int userId, int userType, int? updatedBy);
    Task ResetPasswordAsync(int userId, string passwordHash, int? updatedBy);
    Task SoftDeleteAsync(int userId, int? deletedBy);
}
