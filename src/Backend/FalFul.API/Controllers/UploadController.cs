using FalFul.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/upload")]
[Authorize]
public class UploadController(IWebHostEnvironment env, IFileService fileSvc) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "File size exceeds the 10 MB limit." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = "Only image or PDF files are allowed (jpg, png, webp, gif, pdf)." });

        var webRoot    = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using var stream = System.IO.File.Create(fullPath);
        await file.CopyToAsync(stream);

        return Ok(new { url = $"uploads/{fileName}" });
    }

    /// <summary>
    /// Deletes a previously uploaded file. Called by the frontend to clean up
    /// orphaned uploads (e.g. when product creation fails, user cancels the form,
    /// or an image is replaced without saving).
    /// </summary>
    [HttpDelete("{filename}")]
    public IActionResult DeleteFile(string filename)
    {
        // Reject any path-traversal attempts at the controller level.
        if (string.IsNullOrWhiteSpace(filename) ||
            filename.Contains('/') || filename.Contains('\\') || filename.Contains(".."))
            return BadRequest(new { message = "Invalid filename." });

        fileSvc.DeleteLocalUpload($"uploads/{filename}");
        return Ok();
    }
}
