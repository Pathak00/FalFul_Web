using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace FalFul.Persistence.Context;

public class DapperContext
{
    private readonly string _connectionString;

    public DapperContext(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("FalFulDb")
            ?? throw new InvalidOperationException("Connection string 'FalFulDb' not found.");
    }

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
