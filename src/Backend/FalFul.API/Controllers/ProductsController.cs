using FalFul.API.Services;
using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(IProductService productService, IFileService fileSvc) : ControllerBase
{
    // ── Public endpoints ──────────────────────────────────────────────────────

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


    [HttpGet("SubscriptionProduct")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubProduct() =>
       Ok(await productService.GetSubProduct());


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

    // ── Admin endpoints ───────────────────────────────────────────────────────

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
        // Capture the current image URL before the update so we can delete it
        // if the admin replaced the image with a new one.
        var existing    = await productService.GetProductByIdAsync(id);
        var oldImageUrl = existing?.ImageUrl;

        var result = await productService.UpdateProductAsync(id, dto);
        if (!result.IsSuccess) return BadRequest(new { message = result.Error });

        // Old image is now unreferenced — delete the physical file.
        if (!string.IsNullOrWhiteSpace(oldImageUrl) && oldImageUrl != dto.ImageUrl)
            fileSvc.DeleteLocalUpload(oldImageUrl);

        return Ok();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> Delete(int id)
    {
        // Grab the image URL before deleting the record so we can clean up the file.
        var existing = await productService.GetProductByIdAsync(id);
        var imageUrl = existing?.ImageUrl;

        var result = await productService.DeleteProductAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.Error });

        fileSvc.DeleteLocalUpload(imageUrl);
        return Ok();
    }

    [HttpPost("{id:int}/availability")]
    [Authorize(Policy = "Perm:products")]
    public async Task<IActionResult> SetAvailability(int id, [FromBody] SetProductAvailabilityDto dto)
    {
        var result = await productService.SetProductAvailabilityAsync(id, dto.IsAvailable);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
