using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;

namespace FalFul.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IOrganizationRepository _orgRepo;
    private readonly IRefreshTokenRepository _tokenRepo;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IGoogleAuthService _googleAuth;
    private readonly IRoleRepository _roleRepo;
    private readonly IPermissionRepository _permRepo;

    public AuthService(
        IUserRepository userRepo,
        IOrganizationRepository orgRepo,
        IRefreshTokenRepository tokenRepo,
        IJwtService jwtService,
        IPasswordHasher passwordHasher,
        IGoogleAuthService googleAuth,
        IRoleRepository roleRepo,
        IPermissionRepository permRepo)
    {
        _userRepo = userRepo;
        _orgRepo = orgRepo;
        _tokenRepo = tokenRepo;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _googleAuth = googleAuth;
        _roleRepo = roleRepo;
        _permRepo = permRepo;
    }

    public async Task<Result<AuthResponseDto>> RegisterUserAsync(RegisterUserDto dto)
    {
        if (!string.IsNullOrEmpty(dto.Email) && await _userRepo.ExistsByEmailAsync(dto.Email))
            return Result<AuthResponseDto>.Failure("Email is already registered.");

        if (!string.IsNullOrEmpty(dto.PhoneNumber) && await _userRepo.ExistsByPhoneAsync(dto.PhoneNumber))
            return Result<AuthResponseDto>.Failure("Phone number is already registered.");

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            UserType = UserType.Individual,
            PasswordHash = dto.Password != null ? _passwordHasher.Hash(dto.Password) : null
        };

        user.Id = await _userRepo.CreateAsync(user);
        await AssignCustomerRoleAsync(user.Id);
        return Result<AuthResponseDto>.Success(await BuildAuthResponseAsync(user));
    }

    public async Task<Result<AuthResponseDto>> RegisterOrganizationAsync(RegisterOrganizationDto dto)
    {
        if (await _userRepo.ExistsByEmailAsync(dto.OwnerEmail))
            return Result<AuthResponseDto>.Failure("Email is already registered.");

        if (await _orgRepo.ExistsByNameAsync(dto.OrganizationName))
            return Result<AuthResponseDto>.Failure("Organization name is already taken.");

        var owner = new User
        {
            FullName = dto.OwnerFullName,
            Email = dto.OwnerEmail,
            PhoneNumber = dto.OwnerPhone,
            UserType = UserType.Organization,
            PasswordHash = _passwordHasher.Hash(dto.Password)
        };

        owner.Id = await _userRepo.CreateAsync(owner);

        var org = new Organization
        {
            Name = dto.OrganizationName,
            OrganizationType = dto.OrganizationType,
            Description = dto.OrganizationDescription,
            ContactEmail = dto.OwnerEmail,
            ContactPhone = dto.OwnerPhone,
            Address = dto.Address,
            OwnerId = owner.Id
        };

        await _orgRepo.CreateAsync(org);
        await AssignCustomerRoleAsync(owner.Id);
        return Result<AuthResponseDto>.Success(await BuildAuthResponseAsync(owner));
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Identifier)
                   ?? await _userRepo.GetByPhoneAsync(dto.Identifier);

        if (user == null || user.PasswordHash == null)
            return Result<AuthResponseDto>.Failure("Invalid credentials.");

        if (!_passwordHasher.Verify(dto.Password, user.PasswordHash))
            return Result<AuthResponseDto>.Failure("Invalid credentials.");

        if (!user.IsActive)
            return Result<AuthResponseDto>.Failure("Account is deactivated.");

        return Result<AuthResponseDto>.Success(await BuildAuthResponseAsync(user));
    }

    public async Task<Result<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
    {
        var token = await _tokenRepo.GetByTokenAsync(refreshToken);

        if (token == null || token.IsRevoked || token.ExpiresAt < NepalTime.Now)
            return Result<AuthResponseDto>.Failure("Invalid or expired refresh token.");

        var user = await _userRepo.GetByIdAsync(token.UserId);
        if (user == null || !user.IsActive)
            return Result<AuthResponseDto>.Failure("User not found.");

        await _tokenRepo.RevokeAsync(refreshToken);
        return Result<AuthResponseDto>.Success(await BuildAuthResponseAsync(user));
    }

    public async Task<Result<AuthResponseDto>> GoogleLoginAsync(string idToken)
    {
        try
        {
            var googleUser = await _googleAuth.ValidateIdTokenAsync(idToken);

            var userId = await _userRepo.GetOrCreateByGoogleAsync(
                googleUser.GoogleId, googleUser.Email, googleUser.FullName, googleUser.ProfileImageUrl);

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null || !user.IsActive)
                return Result<AuthResponseDto>.Failure("Account is not active.");

            // New Google users have no role yet — assign the default registration role.
            var existingRole = await _roleRepo.GetUserRoleAsync(userId);
            if (existingRole == null)
                await AssignCustomerRoleAsync(userId);

            return Result<AuthResponseDto>.Success(await BuildAuthResponseAsync(user));
        }
        catch (Exception ex)
        {
            return Result<AuthResponseDto>.Failure(ex.Message);
        }
    }

    public async Task<Result> LogoutAsync(string refreshToken)
    {
        await _tokenRepo.RevokeAsync(refreshToken);
        return Result.Success();
    }

    private async Task AssignCustomerRoleAsync(int userId)
    {
        var defaultRole = await _roleRepo.GetDefaultAsync();
        if (defaultRole != null)
            await _roleRepo.AssignRoleAsync(userId, defaultRole.Id);
    }

    private async Task<AuthResponseDto> BuildAuthResponseAsync(User user)
    {
        var role = await _roleRepo.GetUserRoleAsync(user.Id);
        var roleName = role?.Name ?? user.UserType.ToString();
        var permissions = (await _permRepo.GetEffectivePermissionsAsync(user.Id)).ToList();

        var accessToken = _jwtService.GenerateAccessToken(user, roleName, permissions);
        var refreshToken = _jwtService.GenerateRefreshToken();

        await _tokenRepo.SaveAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = NepalTime.Now.AddDays(30)
        });

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = NepalTime.Now.AddMinutes(60),
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                UserType = user.UserType.ToString(),
                ProfileImageUrl = user.ProfileImageUrl,
                Role = roleName,
                Permissions = permissions,
                PortalType = role?.PortalType ?? "customer"
            }
        };
    }
}
