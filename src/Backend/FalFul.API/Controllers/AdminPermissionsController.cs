using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminPermissionsController(IPermissionService permService) : ControllerBase
{
    // Read-only: lists all available permissions for use in role-management UI.
    // Any authenticated admin can read this; permission assignment is at the role level.
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions() =>
        Ok(await permService.GetAllAsync());
}
