namespace ManagementProject.Services
{
    public interface IAzureBlobService
    {
        Task<string> UploadFileAsync(byte[] fileContent, string fileName, string? folder = null, CancellationToken ct = default);
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string? folder = null, CancellationToken ct = default);
        Task<bool> DeleteFileAsync(string fileName, string? folder = null, CancellationToken ct = default);
        Task<string> GetFileUrlAsync(string fileName, string? folder = null);
        Task<byte[]?> DownloadFileAsync(string fileName, string? folder = null, CancellationToken ct = default);
    }
}
