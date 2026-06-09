namespace FalFul.API.Services;

public interface IFileService
{
    /// <summary>
    /// Deletes a file from wwwroot/uploads. Silently ignores external URLs,
    /// missing files, and invalid paths. Never throws.
    /// </summary>
    void DeleteLocalUpload(string? relativeUrl);
}

public class FileService(IWebHostEnvironment env) : IFileService
{
    public void DeleteLocalUpload(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;

        // Only handle files that live in our uploads folder; ignore CDN / external URLs.
        if (!relativeUrl.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase)) return;

        var webRoot  = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var relative = relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(webRoot, relative));

        // Path-traversal guard: resolved path must stay inside wwwroot.
        var uploadsDir = Path.GetFullPath(Path.Combine(webRoot, "uploads"));
        if (!fullPath.StartsWith(uploadsDir, StringComparison.OrdinalIgnoreCase)) return;

        try { if (File.Exists(fullPath)) File.Delete(fullPath); }
        catch { /* best-effort — log in a real system */ }
    }
}
