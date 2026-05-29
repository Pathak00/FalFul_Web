using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class AddressRepository(DapperContext context) : IAddressRepository
{
    public async Task<IEnumerable<Address>> GetByUserAsync(int userId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Address>(
            "sp_Address_GetByUser",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Address?> GetByIdAsync(int id)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Address>(
            "sp_Address_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(Address address)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Address_Create",
            new
            {
                address.UserId,
                address.Label,
                address.FullAddress,
                address.City,
                address.Landmark,
                address.PhoneNumber,
                address.IsDefault
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Address address)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Address_Update",
            new
            {
                address.Id,
                address.UserId,
                address.Label,
                address.FullAddress,
                address.City,
                address.Landmark,
                address.PhoneNumber,
                address.IsDefault
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Address_Delete",
            new { Id = id, UserId = userId },
            commandType: CommandType.StoredProcedure);
    }
}
