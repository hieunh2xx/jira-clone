# Scripts Tự Động Cấu Hình IIS

## ConfigureIISAfterPublish.ps1

Script này tự động cấu hình IIS sau mỗi lần publish để đảm bảo Background Service chạy liên tục.

### Cách Hoạt Động

Script sẽ tự động chạy sau khi publish thành công và thực hiện:

1. **Cấu hình Application Pool:**
   - `Start Mode = AlwaysRunning` - Luôn chạy, không idle
   - `Idle Timeout = 0` - Vô hiệu hóa idle timeout
   - Đảm bảo Application Pool đang chạy

2. **Cấu hình Website:**
   - Kiểm tra và cập nhật Physical Path
   - Đảm bảo Application Pool được gán đúng
   - Đảm bảo Website đang chạy

3. **Cập nhật web.config:**
   - Thêm `applicationInitialization` nếu chưa có
   - Đảm bảo ứng dụng tự động khởi động sau khi publish

### Tùy Chỉnh

Nếu bạn muốn thay đổi tên Site hoặc App Pool, bạn có thể:

#### Cách 1: Sửa trong Publish Profile

Mở file `Properties/PublishProfiles/IISProfile.pubxml` và thay đổi:

```xml
<IISSiteName>YourSiteName</IISSiteName>
<IISAppPoolName>YourAppPoolName</IISAppPoolName>
```

#### Cách 2: Chạy Script Thủ Công

```powershell
.\scripts\ConfigureIISAfterPublish.ps1 -SiteName "YourSite" -AppPoolName "YourAppPool" -PublishPath "C:\inetpub\wwwroot\YourPath"
```

### Yêu Cầu

- PowerShell với quyền Administrator (để cấu hình IIS)
- IIS Management Console đã được cài đặt
- Module WebAdministration có sẵn

### Lưu Ý

- Script sẽ tự động chạy sau mỗi lần publish
- Nếu không có quyền Administrator, một số cấu hình có thể không được áp dụng
- Script sẽ hiển thị cảnh báo nếu có vấn đề

### Troubleshooting

Nếu script không chạy tự động:

1. Kiểm tra file script có tồn tại tại: `scripts/ConfigureIISAfterPublish.ps1`
2. Kiểm tra MSBuild output để xem có lỗi không
3. Chạy script thủ công để xem lỗi chi tiết
