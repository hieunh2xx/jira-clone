using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using ManagementProject.DTO;
public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;
    public CloudinaryService(IConfiguration configuration)
    {
        var settings = configuration.GetSection("CloudinarySettings").Get<CloudinarySettings>();
        var account = new Account(
            settings.CloudName,
            settings.ApiKey,
            settings.ApiSecret
        );
        _cloudinary = new Cloudinary(account);
    }
    public ImageUploadResult UploadImage(string filePath, string publicId = null)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(filePath),
            PublicId = publicId
        };
        return _cloudinary.Upload(uploadParams);
    }
    public DeletionResult DeleteImage(string imageUrl)
    {
        var publicId = Path.GetFileNameWithoutExtension(imageUrl);
        return _cloudinary.Destroy(new DeletionParams(publicId));
    }
    public ImageUploadResult UploadImage(Stream fileStream, string fileName, string publicId = null)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            PublicId = publicId
        };
        return _cloudinary.Upload(uploadParams);
    }
    public RawUploadResult UploadFile(Stream fileStream, string fileName, string publicId = null)
    {
        var uploadParams = new RawUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            PublicId = publicId
        };
        return _cloudinary.Upload(uploadParams);
    }
    public DeletionResult DeleteFile(string fileUrl)
    {
        var publicId = Path.GetFileNameWithoutExtension(fileUrl);
        return _cloudinary.Destroy(new DeletionParams(publicId));
    }
}