using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class OrganizationRepository : IOrganizationRepository
{
    private readonly DapperContext _context;

    public OrganizationRepository(DapperContext context) => _context = context;

    public async Task<Organization?> GetByIdAsync(int id)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Organization>(
            "sp_Organization_GetById",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<Organization?> GetByOwnerIdAsync(int ownerId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Organization>(
            "sp_Organization_GetByOwnerId",
            new { OwnerId = ownerId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(Organization organization)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Organization_Register",
            new
            {
                organization.Name,
                organization.OrganizationType,
                organization.Description,
                organization.ContactEmail,
                organization.ContactPhone,
                organization.Address,
                organization.OwnerId
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Organization organization)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Organization_Update",
            new
            {
                organization.Id,
                organization.Name,
                organization.Description,
                organization.ContactEmail,
                organization.ContactPhone,
                organization.Address,
                organization.IsActive,
                organization.UpdatedBy
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<bool> ExistsByNameAsync(string name)
    {
        using var conn = _context.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(
            "sp_Organization_ExistsByName",
            new { Name = name },
            commandType: System.Data.CommandType.StoredProcedure);
        return count > 0;
    }
}
