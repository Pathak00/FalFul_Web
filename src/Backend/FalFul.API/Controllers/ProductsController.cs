using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(IProductService productService) : ControllerBase
{
    // â”€â”€ Public endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic(
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        [FromQuery] bool featured = false)
    {
        var list = await productService.GetPublicProductsAsync(categoryId, search, featured);
        return Ok(list);
    }

    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeatured() =>
        Ok(await productService.GetFeaturedProductsAsync());

    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var product = await productService.GetProductBySlugAsync(slug);
        return product is null ? NotFound() : Ok(product);
    }

    // â”€â”€ Admin endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [HttpGet("all")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? categoryId,
        [FromQuery] string? search)
    {
        var list = await productService.GetAllProductsAsync(categoryId, search);
        return Ok(list);
    }

    [HttpGet("admin/{id:int}")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await productService.GetProductByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var result = await productService.CreateProductAsync(dto);
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        var result = await productService.UpdateProductAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await productService.DeleteProductAsync(id);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPost("{id:int}/availability")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> SetAvailability(int id, [FromBody] SetProductAvailabilityDto dto)
    {
        var result = await productService.SetProductAvailabilityAsync(id, dto.IsAvailable);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
