using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using ManagementProject.DTO;
using Microsoft.Extensions.Configuration;

namespace ManagementProject.Services
{
    public class AzureBlobService : IAzureBlobService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureBlobSettings _settings;

        public AzureBlobService(IConfiguration configuration)
        {
            _settings = configuration.GetSection("AzureBlobSettings").Get<AzureBlobSettings>()
                ?? throw new InvalidOperationException("AzureBlobSettings is missing in appsettings.json");

            if (string.IsNullOrEmpty(_settings.ConnectionString))
                throw new InvalidOperationException("Azure Blob Storage ConnectionString is missing");

            _blobServiceClient = new BlobServiceClient(_settings.ConnectionString);
        }

        public async Task<string> UploadFileAsync(byte[] fileContent, string fileName, string? folder = null, CancellationToken ct = default)
        {
            using var stream = new MemoryStream(fileContent);
            return await UploadFileAsync(stream, fileName, folder, ct);
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string? folder = null, CancellationToken ct = default)
        {
            // Ensure container exists
            var containerClient = _blobServiceClient.GetBlobContainerClient(_settings.ContainerName);
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);

            // Build blob path
            var blobName = string.IsNullOrEmpty(folder) 
                ? fileName 
                : $"{folder.TrimEnd('/')}/{fileName}";

            // Upload file
            var blobClient = containerClient.GetBlobClient(blobName);
            
            // Set content type
            var uploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = GetContentType(fileName)
                }
            };

            await blobClient.UploadAsync(fileStream, uploadOptions, ct);

            // Return URL
            return GetFileUrlAsync(blobName).Result;
        }

        public async Task<bool> DeleteFileAsync(string fileName, string? folder = null, CancellationToken ct = default)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_settings.ContainerName);
                var blobName = string.IsNullOrEmpty(folder) 
                    ? fileName 
                    : $"{folder.TrimEnd('/')}/{fileName}";
                
                var blobClient = containerClient.GetBlobClient(blobName);
                return await blobClient.DeleteIfExistsAsync(cancellationToken: ct);
            }
            catch
            {
                return false;
            }
        }

        public Task<string> GetFileUrlAsync(string fileName, string? folder = null)
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_settings.ContainerName);
            var blobName = string.IsNullOrEmpty(folder) 
                ? fileName 
                : $"{folder.TrimEnd('/')}/{fileName}";
            
            var blobClient = containerClient.GetBlobClient(blobName);
            var url = blobClient.Uri.ToString();

            // If BaseUrl is configured, use it instead
            if (!string.IsNullOrEmpty(_settings.BaseUrl))
            {
                var baseUrl = _settings.BaseUrl.TrimEnd('/');
                url = $"{baseUrl}/{_settings.ContainerName}/{blobName}";
            }

            return Task.FromResult(url);
        }

        public async Task<byte[]?> DownloadFileAsync(string fileName, string? folder = null, CancellationToken ct = default)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_settings.ContainerName);
                var blobName = string.IsNullOrEmpty(folder) 
                    ? fileName 
                    : $"{folder.TrimEnd('/')}/{fileName}";
                
                var blobClient = containerClient.GetBlobClient(blobName);
                
                if (!await blobClient.ExistsAsync(ct))
                    return null;

                using var memoryStream = new MemoryStream();
                await blobClient.DownloadToAsync(memoryStream, ct);
                return memoryStream.ToArray();
            }
            catch
            {
                return null;
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".csv" => "text/csv; charset=utf-8",
                ".json" => "application/json; charset=utf-8",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".xls" => "application/vnd.ms-excel",
                ".pdf" => "application/pdf",
                ".txt" => "text/plain; charset=utf-8",
                _ => "application/octet-stream"
            };
        }
    }
}
