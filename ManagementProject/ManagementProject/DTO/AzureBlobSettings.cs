namespace ManagementProject.DTO
{
    public class AzureBlobSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string ContainerName { get; set; } = "powerbi-exports";
        public string? BaseUrl { get; set; }
    }
}
